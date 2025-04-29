import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createRequire } from 'module';
import { readFile } from 'fs/promises';
// Substituir o require por import para compatibilidade com ES6 modules
import Driver from './Driver.js';
import cors from 'cors'; // Import the CORS middleware
// Substituir o require por import para compatibilidade com ES6 modules
import { timeStamp } from 'console';
import peakHourService from './src/services/peak_hour_service.js';
const timers = {};
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');
const serviceAccount = JSON.parse(
  await readFile(new URL('./firebase/serviceAccountKey.json', import.meta.url))
);

const app = express();

// Configurar o CORS
app.use(cors({
  origin: '*', // Permitir todas as origens - altere para seu domínio em produção
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
}));

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
  const { id, created, startTime, endTime, status, position, vehicle,classVehicle } = req.body;

  if (!created || !startTime || !status || !position || !vehicle || !classVehicle) {
    return res.status(400).json({ error: 'created, startTime, status, position, and vehicle are required' });
  }

  const timestamp = getCurrentTimestamp();
  let rotationAngle = 0;

  // Se o rastreamento já existe, atualize e calcule o ângulo de rotação
  if (trackings[id]) {
    const lastPosition = trackings[id].position;
    rotationAngle = calculateRotationAngle(lastPosition, position);
    trackings[id] = { id, created, startTime, endTime, status, position, vehicle, timestamp, rotationAngle,classVehicle };
    broadcastUpdate();
    return res.json({ message: 'Tracking updated', tracking: trackings[id] });
  }

  // Se o rastreamento não existe, crie um novo
  trackings[id] = { id, created, startTime, endTime, status, position, vehicle, timestamp, rotationAngle,classVehicle };
  broadcastUpdate();
  res.status(201).json({ message: 'Tracking created', tracking: trackings[id] });
});

// Rota para obter todos os rastreamentos
app.get('/trackings', (req, res) => {
  res.json(trackings);
});

// Rota para obter um rastreamento pelo ID
app.get('/trackings/:id', (req, res) => {
  const { id } = req.params;
  const tracking = trackings[id];

  if (!tracking) {
    return res.status(404).json({ error: 'Tracking not found' });
  }

  res.json(tracking);
});

// Rota para atualizar um rastreamento pelo ID
app.put('/trackings/:id', (req, res) => {
  const { id } = req.params;
  const { created, startTime, endTime, status, position, vehicle } = req.body;

  if (!created || !startTime || !status || !position || !vehicle) {
    return res.status(400).json({ error: 'created, startTime, status, position, and vehicle are required' });
  }

  if (!trackings[id]) {
    return res.status(404).json({ error: 'Tracking not found' });
  }

  const timestamp = getCurrentTimestamp();
  const lastPosition = trackings[id].position;
  const rotationAngle = calculateRotationAngle(lastPosition, position);
  trackings[id] = { id, created, startTime, endTime, status, position, vehicle, timestamp, rotationAngle };
  broadcastUpdate();
  res.json({ message: 'Tracking updated', tracking: trackings[id] });
});

// Rota para deletar um rastreamento pelo ID
app.delete('/trackings/:id', (req, res) => {
  const { id } = req.params;

  if (!trackings[id]) {
    return res.status(404).json({ error: 'Tracking not found' });
  }

  delete trackings[id];
  broadcastUpdate();
  res.json({ message: 'Tracking deleted' });
});

// Rota para fazer pedido where id de um driver
app.post('/requests', async (req, res) => {
  const { driverId, requestId, driverDetails, documentId } = req.body;

  if (!driverId || !requestId || !documentId) {
    return res.status(400).json({ error: 'driverId, requestId, and documentId are required' });
  }

  try {
    // Consulta ao Firestore
    const docRef = db.collection('races').doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();f

    // Extrair a origem (latitude e longitude) do documento
    const { originLatitude, originLongitude } = documentData;

    if (originLatitude === undefined || originLongitude === undefined) {
      return res.status(400).json({ error: 'Origin latitude and longitude are required in the document' });
    }

    const origin = {
      latitude: originLatitude,
      longitude: originLongitude,
    };

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


// Rota para aceitar um pedido
// Rota para aceitar um pedido
app.post('/requests/:requestId/accept', async (req, res) => {
  const { requestId } = req.params;
  const { driverId, tripId, vehicle } = req.body; // Add these fields to the request body

  if (!requests[requestId]) {
    return res.status(404).json({ error: 'Request not found' });
  }

  // Update the status and other details in the local 'requests' collection
  requests[requestId] = {
    ...requests[requestId],
    status: 'accepted',
    assigned: driverId,
    tripId,
    vehicle
  };

  // Update the status in the 'races' collection in Firebase
  try {
    const raceRef = db.collection('races').doc(requestId);
    await raceRef.update({
      status: 2,
      assigned: driverId,
      tripId,
      vehicle
    });

    // Emit the response to all clients
    clients.forEach(client => {
      client.emit('requestResponse', {
        requestId,
        response: 'accepted',
        assigned: driverId,
        tripId,
        vehicle
      });
    });

    res.json({ message: 'Request accepted', request: requests[requestId] });
  } catch (error) {
    console.error('Error updating race status:', error);
    res.status(500).json({ error: 'Failed to update race status' });
  }
});

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


// Rota para negar um pedido
app.post('/requests/:requestId/deny', async (req, res) => {
  const { requestId } = req.params;

  if (!requests[requestId]) {
    return res.status(404).json({ error: 'Request not found' });
  }

  // Atualizar o status na coleção local 'requests'
  requests[requestId].status = 'denied';

  // Atualizar o status na coleção 'races' do Firebase
  try {
    const raceRef = db.collection('races').doc(requestId);
    await raceRef.update({ status: 1 });

    // Emitir a resposta para todos os clientes
    clients.forEach(client => {
      client.emit('requestResponse', { requestId, response: 'denied' });
    });

    res.json({ message: 'Request denied' });
  } catch (error) {
    console.error('Error updating race status:', error);
    res.status(500).json({ error: 'Failed to update race status' });
  }
});

//switch (this) {
//  case DriverStatus.offline:
//    return 0;
//  case DriverStatus.online:
//    return 1;
//  case DriverStatus.assigned:
//    return 2;
//  case DriverStatus.enRouteToPickup:
//    return 3;
//  case DriverStatus.waitingForPassenger:
//    return 4;
//  case DriverStatus.rideInProgress:
//    return 5;
//  case DriverStatus.completed:
//    return 6;
//  case DriverStatus.cancelled:
//    return 7;
//  case DriverStatus.paused:
//    return 8;
//  case DriverStatus.meetingPlace:
//    return 9;




// Rota para cancelar um pedido
app.post('/requests/:requestId/cancel', async (req, res) => {
  const { requestId } = req.params;
  const { reason } = req.body;


  // Atualizar o status na coleção 'races' do Firebase
  try {
    const raceRef = db.collection('races').doc(requestId);
    await raceRef.update({ status: 7, reason: reason, });

    // Emitir a resposta para todos os clientes
    clients.forEach(client => {
      client.emit('requestResponse', { requestId, response: 'cancel' });
    });

    res.json({ message: 'Request cancel' });
  } catch (error) {
    console.error('Error updating race status:', error);
    res.status(500).json({ error: 'Failed to update race status' });
  }
});



// Rota para o motorista avisar que chegou
app.post('/requests/:requestId/arrived', async (req, res) => {
  const { requestId } = req.params;

  if (!requests[requestId]) {
    return res.status(404).json({ error: 'Request not found' });
  }

  // Atualizar o status na coleção local 'requests'
  requests[requestId].status = 'arrived';

  // Atualizar o status na coleção 'races' do Firebase
  try {
    const raceRef = db.collection('races').doc(requestId);
    await raceRef.update({ status: 4 });

    // Emitir a resposta para todos os clientes
    clients.forEach(client => {
      client.emit('driverArrived', { requestId });

    });

    res.json({ message: 'Driver arrived' });
  } catch (error) {
    console.error('Error updating race status:', error);
    res.status(500).json({ error: 'Failed to update race status' });
  }
});


const startTripRecording = async (driverId, requestId) => {
  try {
    // Create a new trip document in Firestore and get the generated tripId
    const tripRef = await db.collection('trips').add({
      startTime: admin.firestore.FieldValue.serverTimestamp(),
      requestId,
      status: 'ongoing'
    });
    const tripId = tripRef.id;  // The generated tripId

    // Update the tripId in the races collection
    const raceRef = db.collection('races').doc(requestId);
    await raceRef.update({ tripId });

    // Start the route recording with the new tripId
    timers[tripId] = setInterval(async () => {
      try {
        // Get the vehicle's position using the driverId
        const vehiclePosition = trackings[driverId]?.position;

        if (vehiclePosition) {
          await db.collection('trips')
            .doc(tripId)
            .collection('routes')
            .add({
              latitude: vehiclePosition.latitude,
              longitude: vehiclePosition.longitude,
              speed: vehiclePosition.speed,  // Assuming speed is part of the position data
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });

          console.log(`Route recorded for trip: ${tripId}`);
        } else {
          console.error('Vehicle position not found for driver:', driverId);
        }
      } catch (error) {
        console.error('Error recording route:', error);
      }
    }, 60000);  // 60,000 milliseconds = 1 minute

    return tripId;
  } catch (error) {
    console.error('Error starting trip recording:', error);
    throw new Error('Failed to start trip recording');
  }
};

// Example usage in your startTheRace routef
app.post('/requests/:requestId/startTheRace', async (req, res) => {
  const { requestId } = req.params;
  const { vehicleId } = req.body;  // Assuming driverId is passed in the request body

  // Update local status
  requests[requestId].status = 'startTheRace';

  try {
    const tripId = await startTripRecording(vehicleId, requestId);  // Start the trip recording and get tripId

    clients.forEach(client => {
      client.emit('driverStartTheRace', { requestId, tripId });
    });

    res.json({ message: 'Driver started the race and route recording began', tripId });
  } catch (error) {
    console.error('Error starting the race or recording route:', error);
    res.status(500).json({ error: 'Failed to start the race or record route' });
  }
});

const stopTripRecording = (tripId) => {
  if (timers[tripId]) {
    clearInterval(timers[tripId]);
    delete timers[tripId];
    console.log(`Route recording stopped for trip: ${tripId}`);
  } else {
    console.log(`No active trip recording to stop for trip: ${tripId}`);
  }
};

// Função auxiliar para apagar as conversas de uma corrida
const deleteChatMessages = async (userDriver, userCliente) => {
  try {
    // Buscar todas as conversas entre o motorista e o cliente
    const chatsRef = db.collection('chats');
    const querySnapshot = await chatsRef
      .where('userDriver', '==', userDriver)
      .where('userCliente', '==', userCliente)
      .get();

    // Apagar cada mensagem encontrada
    const batch = db.batch();
    querySnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Chat messages deleted for driver ${userDriver} and client ${userCliente}`);
  } catch (error) {
    console.error('Error deleting chat messages:', error);
  }
};

// Rota para finalizar a corrida
app.post('/requests/:requestId/finish', async (req, res) => {
  const { requestId } = req.params;

  const docRef = db.collection('races').doc(requestId);
  const doc = await docRef.get();

  if (!doc.exists) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const documentData = doc.data();
  const { startTime, tripId, basePrice, country, province, municipality, vehicleClassId, userdriverId, userCliente } = documentData;

  if (!startTime) {
    return res.status(400).json({ error: 'Start time not found for this request' });
  }

  // Obter o tempo atual como endTime em formato timestamp
  const endTime = admin.firestore.FieldValue.serverTimestamp();

  try {
    // Calcular o preço final considerando o horário de pico
    const finalPrice = peakHourService.calculatePeakPrice(basePrice || 0, country, province, municipality, vehicleClassId);
    const isPeakHour = peakHourService.isWithinPeakHours(country, province, municipality);
    
    // Obter a configuração de horário de pico
    const key = peakHourService.getConfigKey(country, province, municipality);
    const peakHourConfig = peakHourService.peakHourConfigs[key];
    const priceMultiplier = peakHourConfig && peakHourConfig.status === 'ativo' ? 
      (peakHourConfig.pricePerHour / 10) : 1;

    // Atualizar o status na coleção 'races' com o endTime e preço final
    await docRef.update({
      status: 6,
      endTime,
      finalPrice,
      isPeakHour,
      priceMultiplier
    });

    // Apagar as conversas entre o motorista e o cliente
    if (userdriverId && userCliente) {
      await deleteChatMessages(userdriverId, userCliente);
    }

    // Após o Firestore atualizar o documento com o timestamp do servidor, recupere o documento atualizado
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();
    const actualEndTime = updatedData.endTime.toDate();  // Converter para Date

    // Calcular a diferença entre endTime e startTime em minutos
    const travelTimeMinutes = Math.round((actualEndTime - startTime.toDate()) / (1000 * 60));

    // Atualizar o campo travelTimeMinutes na coleção 'races'
    await docRef.update({ travelTimeMinutes });

    // Atualizar o campo end_time na coleção 'trips' usando o tripId
    if (tripId) {
      const tripRef = db.collection('trips').doc(tripId);
      await tripRef.update({
        end_time: actualEndTime
      });
      stopTripRecording(tripId);
    }

    // Emitir a resposta para todos os clientes
    clients.forEach(client => {
      client.emit('rideFinished', {
        requestId,
        endTime: actualEndTime,
        travelTimeMinutes,
        status: 6,
        finalPrice,
        isPeakHour,
        priceMultiplier
      });
    });

    res.json({ 
      message: 'Ride finished', 
      endTime: actualEndTime, 
      travelTimeMinutes, 
      status: 6,
      finalPrice,
      isPeakHour,
      priceMultiplier
    });
  } catch (error) {
    console.error('Error updating race status or trip end_time:', error);
    res.status(500).json({ error: 'Failed to update race status or trip end_time' });
  }
});





// Função para transmitir atualizações para todos os clientes WebSocket conectados
const broadcastUpdate = () => {
  const update = { type: 'update', trackings };
  clients.forEach(client => {
    client.emit('update', update);
  });
};

// Configuração do Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Ajuste conforme necessário
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  // Adiciona o novo cliente à lista de clientes conectados
  clients.add(socket);
  console.log('New client connected');

  // Enviar todos os rastreamentos para o cliente recém-conectado
  socket.emit('update', { type: 'initial', trackings });

  // Evento para responder à solicitação de localização e status do motorista por driverId
  socket.on('wheredriverID', (driverId) => {
    const result = Object.values(trackings).filter(tracking => tracking.vehicle.driver.id === driverId);
    if (result.length === 0) {
      socket.emit('wheredriverIDResponse', { error: 'Driver not found' });
    } else {
      socket.emit('wheredriverIDResponse', result);
    }
  });

  // Evento para ouvir pedidos de aceitação ou rejeição de pedido
  socket.on('requestResponse', (data) => {
    const { requestId, response } = data;

    // Emitir a resposta para todos os clientes
    clients.forEach(client => {
      client.emit('requestResponse', { requestId, response });
    });
  });

  // Evento para ouvir se o motorista chegou
  socket.on('driverArrived', (data) => {
    const { requestId } = data;

    // Emitir a notificação para todos os clientes
    clients.forEach(client => {
      client.emit('driverArrived', { requestId });
    });
  });

  socket.on('driverStartTheRace', (data) => {
    const { requestId } = data;

    // Emitir a notificação para todos os clientes
    clients.forEach(client => {
      client.emit('driverStartTheRace', { requestId });
    });
  });
  socket.on('call', (data) => {
    const { targetId, sdp } = data;
    io.to(targetId).emit('call', {
      sdp,
      callerId: socket.id,
    });
  });

  socket.on('endCall', (data) => {
    const { targetId } = data;
    io.to(targetId).emit('callEnded', {
      from: socket.id,
    });
  });

  socket.on('answer', (data) => {
    const { callerId, sdp } = data;
    io.to(callerId).emit('answer', {
      sdp,
      calleeId: socket.id,
    });
  });

  socket.on('candidate', (data) => {
    const { targetId, candidate } = data;
    io.to(targetId).emit('candidate', {
      candidate,
      senderId: socket.id,
    });
  });


  // Evento para ouvir se a corrida foi finalizada
  socket.on('rideFinished', (data) => {
    const { requestId } = data;

    // Emitir a notificação para todos os clientes
    clients.forEach(client => {
      client.emit('rideFinished', { requestId });
    });
  });

  // Evento disparado quando um cliente se desconecta
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clients.delete(socket);
  });

  // Evento disparado quando ocorre um erro
  socket.on('error', (error) => {
    console.error('Socket.IO error:', error);
  });

  // Evento disparado quando o servidor recebe uma mensagem do cliente
  socket.on('message', (message) => {
    console.log('Received message:', message);
    // Aqui você pode adicionar lógica para lidar com as mensagens recebidas
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
    const address = server.address();
    const ip = address.address === '::' ? 'localhost' : address.address; // Se for IPv6, substituir por 'localhost'
    console.log(`Servidor rodando na porta ${currentPort} e IP ${ip}`);
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

// Rotas para gerenciamento de horário de pico
app.get('/api/peak-hour/status', (req, res) => {
    const { country, province, municipality } = req.query;
    
    if (!country || !province || !municipality) {
        return res.status(400).json({ error: 'Parâmetros country, province e municipality são obrigatórios' });
    }
    
    const status = peakHourService.getPeakStatus(country, province, municipality);
    res.json(status);
});

app.post('/api/peak-hour/config', async (req, res) => {
    const { country, province, municipality, startTime, endTime, pricePerHour, status } = req.body;
    
    if (!country || !province || !municipality || !startTime || !endTime || !pricePerHour || !status) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    const result = await peakHourService.updatePeakHourConfig({
        country,
        province,
        municipality,
        startTime,
        endTime,
        pricePerHour,
        status
    });
    
    if (result.success) {
        res.json({ message: result.message });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.delete('/api/peak-hour/config', async (req, res) => {
    const { country, province, municipality } = req.query;
    
    if (!country || !province || !municipality) {
        return res.status(400).json({ error: 'Parâmetros country, province e municipality são obrigatórios' });
    }
    
    const result = await peakHourService.removePeakHourConfig(country, province, municipality);
    
    if (result.success) {
        res.json({ message: result.message });
    } else {
        res.status(500).json({ error: result.error });
    }
});

// Rotas para gerenciamento de classes de veículos
app.get('/api/vehicle-classes', (req, res) => {
    const vehicleClasses = Object.values(peakHourService.vehicleClasses);
    res.json(vehicleClasses);
});

app.get('/api/vehicle-classes/:id', (req, res) => {
    const { id } = req.params;
    const vehicleClass = peakHourService.getVehicleClass(id);
    
    if (!vehicleClass) {
        return res.status(404).json({ error: 'Classe de veículo não encontrada' });
    }
    
    res.json(vehicleClass);
});

app.post('/api/vehicle-classes', async (req, res) => {
    const vehicleClass = req.body;
    
    if (!vehicleClass.id) {
        return res.status(400).json({ error: 'ID da classe de veículo é obrigatório' });
    }
    
    const result = await peakHourService.updateVehicleClass(vehicleClass);
    
    if (result.success) {
        res.json({ message: result.message });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.delete('/api/vehicle-classes/:id', async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ error: 'ID da classe de veículo é obrigatório' });
    }
    
    const result = await peakHourService.removeVehicleClass(id);
    
    if (result.success) {
        res.json({ message: result.message });
    } else {
        res.status(500).json({ error: result.error });
    }
});
