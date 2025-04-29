import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createRequire } from 'module';
import { readFile } from 'fs/promises';
import fetch from 'node-fetch';  // Adicionei a dependência para fazer chamadas HTTP
import Driver from './Driver.js'; 

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');
const serviceAccount = JSON.parse(
  await readFile(new URL('./firebase/serviceAccountKey.json', import.meta.url))
);

const app = express();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Lista de portas alternativas a serem tentadas
const ports = [3000, 3001, 3002, 3003, 3004];
let currentPortIndex = 0;
let currentPort; // Variável para armazenar a porta que está sendo usada

// Middleware para processar o corpo das requisições
app.use(express.json());

// Banco de dados em memória para armazenar os rastreamentos
const trackings = {};
const clients = new Set(); // Armazena todos os clientes WebSocket conectados

// Banco de dados em memória para armazenar os pedidos
const requests = {};

// Função para obter o timestamp atual
const getCurrentTimestamp = () => new Date().toISOString();

// Função para calcular o ângulo de rotação
const calculateRotationAngle = (lastPosition, currentPosition) => {
  const { latitude: lat1, longitude: lon1 } = lastPosition;
  const { latitude: lat2, longitude: lon2 } = currentPosition;

  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - 
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  const theta = Math.atan2(y, x);
  const angle = (theta * 180 / Math.PI + 360) % 360;

  return angle;
};

// Função para obter a rota (Polyline) entre dois pontos usando Google Maps e fallback para OSRM
const getPolylineBetweenPoints = async (origin, destination) => {
  const googleApiKey = 'YOUR_GOOGLE_MAPS_API_KEY';  // Substitua com sua API Key do Google Maps

  try {
    // Tentar obter a rota usando a API do Google Maps
    const googleResponse = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${googleApiKey}`);
    
    const googleData = await googleResponse.json();
    
    if (googleData.status === 'OK') {
      return googleData.routes[0].overview_polyline.points;
    } else {
      console.error('Google Maps API error:', googleData.status);
    }
  } catch (error) {
    console.error('Erro ao chamar a Google Maps API:', error);
  }

  // Fallback: Tentar obter a rota usando OSRM
  try {
    const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=polyline`;
    const osrmResponse = await fetch(osrmUrl);
    const osrmData = await osrmResponse.json();

    if (osrmData.code === 'Ok') {
      return osrmData.routes[0].geometry;
    } else {
      throw new Error('Não foi possível obter a rota entre os pontos usando OSRM');
    }
  } catch (error) {
    console.error('Erro ao chamar a OSRM API:', error);
    throw new Error('Falha ao obter a rota entre os pontos');
  }
};

// Função para remover veículos não atualizados em 5 minutos
const removeStaleVehicles = () => {
  const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutos em milissegundos
  const now = Date.now();
  let removedCount = 0;

  for (const id in trackings) {
    const tracking = trackings[id];
    const lastUpdateTime = new Date(tracking.timestamp).getTime();
    
    if ((now - lastUpdateTime) > FIVE_MINUTES) {
      delete trackings[id];
      removedCount++;
    }
  }

  if (removedCount > 0) {
    console.log(`${removedCount} veículos removidos por inatividade.`);
    broadcastUpdate();
  }
};

// Rota para criar ou atualizar um rastreamento
app.post('/trackings', (req, res) => {
  const { id, created, startTime, endTime, status, position, vehicle } = req.body;

  if (!created || !startTime || !status || !position || !vehicle) {
    return res.status(400).json({ error: 'created, startTime, status, position, and vehicle are required' });
  }

  const timestamp = getCurrentTimestamp();
  let rotationAngle = 0;

  // Se o rastreamento já existe, atualize e calcule o ângulo de rotação
  if (trackings[id]) {
    const lastPosition = trackings[id].position;
    rotationAngle = calculateRotationAngle(lastPosition, position);
    trackings[id] = { id, created, startTime, endTime, status, position, vehicle, timestamp, rotationAngle };
    broadcastUpdate();
    return res.json({ message: 'Tracking updated', tracking: trackings[id] });
  }

  // Se o rastreamento não existe, crie um novo
  trackings[id] = { id, created, startTime, endTime, status, position, vehicle, timestamp, rotationAngle };
  broadcastUpdate();
  res.status(201).json({ message: 'Tracking created', tracking: trackings[id] });
});

// Rota para fazer pedido where id de um driver
app.post('/requests', async (req, res) => {
  const { driverId, requestId, driverDetails, documentId, origin } = req.body;

  if (!driverId || !requestId || !documentId || !origin) {
    return res.status(400).json({ error: 'driverId, requestId, documentId, and origin are required' });
  }

  try {
    // Consulta ao Firestore
    const docRef = db.collection('races').doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();
    const driver = new Driver(driverDetails);
    
    // Obter a posição atual do veículo
    const vehiclePosition = trackings[driverId]?.position;

    // Calcular a rota entre a posição do veículo e a origem do pedido
    let polyline = '';
    if (vehiclePosition) {
      polyline = await getPolylineBetweenPoints(vehiclePosition, origin);
    }

    requests[requestId] = { 
      driverId, 
      status: 'pending', 
      driver: driver.toJson(), 
      document: documentData,
      polyline 
    };

    // Emitir o pedido para todos os clientes
    clients.forEach(client => {
      client.emit('driverRequest', { 
        driverId, 
        requestId, 
        driver: driver.toJson(), 
        document: documentData,
        polyline
      });
    });
    res.json({ message: 'Request sent to all clients', request: requests[requestId] });
  } catch (error) {
    console.error('Error retrieving document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Outras rotas e configurações permanecem as mesmas

// Configuração do Socket.IO
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
  // Adiciona o novo cliente à lista de clientes conectados
  clients.add(socket);
  console.log('New client connected');

  // Enviar todos os rastreamentos para o cliente recém-conectado
  socket.emit('update', { type: 'initial', trackings });

  // Outros eventos...

  // Evento disparado quando um cliente se desconecta
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clients.delete(socket);
  });

  // Evento disparado quando ocorre um erro
  socket.on('error', (error) => {
    console.error('Socket.IO error:', error);
  });
});

// Função para tentar escutar em uma porta disponível
const tryListen = () => {
  if (currentPortIndex >= ports.length) {
    console.error('No available ports');
    process.exit(1);
  }

  const port = ports[currentPortIndex++];
  currentPort = port; // Armazena a porta que está sendo usada
  server.listen(port, () => {
    console.log(`Server listening on port ${currentPort}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use. Trying next port...`);
      tryListen();
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

// Iniciar a tentativa de escuta em portas disponíveis
tryListen();

// Chama removeStaleVehicles a cada minuto
setInterval(removeStaleVehicles, 60 * 1000);
