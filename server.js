import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import corsConfig from './src/config/corsConfig.js';
import firebaseConfig, { isFirebaseInitialized } from './src/config/firebaseConfig.js'; // Importar a configuração do Firebase e a função isFirebaseInitialized
import errorHandler from './src/middlewares/errorHandler.js';
import routes from './src/routes/index.js';
import { swaggerSpec } from './src/config/swaggerConfig.js';
import swaggerUi from 'swagger-ui-express';
import setupSocket from './src/sockets/socketManager.js';
import apiKeyMiddleware from './src/middlewares/apiKeyMiddleware.js';

const app = express();
const server = http.createServer(app);
app.use(express.json());

// Configurar Firebase antes de iniciar qualquer serviço
console.log('Inicializando Firebase...');
await firebaseConfig();
console.log('Firebase inicializado com sucesso!');

// Verificar se o Firebase foi inicializado corretamente
if (!isFirebaseInitialized()) {
  console.error('Firebase não foi inicializado corretamente. Encerrando o servidor...');
  process.exit(1);
}

// Importar o serviço de horário de pico após inicializar o Firebase
console.log('Importando o serviço de horário de pico...');
const { PeakHourService } = await import('./src/services/peak_hour_service.js');
console.log('Serviço de horário de pico importado com sucesso!');

// Inicializar o serviço de horário de pico
console.log('Inicializando o serviço de horário de pico...');
const peakHourService = await new PeakHourService().initialize();
console.log('Serviço de horário de pico inicializado com sucesso!');

// Configuração do CORS
app.use(cors(corsConfig));
 // Middleware para JSON

// Middleware para proteger todas as rotas com API Key
app.use(apiKeyMiddleware);

// Rotas
app.use('/', routes);

// Middleware de tratamento de erros
app.use(errorHandler);

// Configurar o Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Teste de Firestore
app.get('/test-firestore', async (req, res) => {
  try {
    const snapshot = await db.collection('races').get(); // Usando Firestore
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (error) {
    console.error('Erro ao acessar Firestore:', error);
    res.status(500).json({ error: 'Erro ao acessar Firestore' });
  }
});

// Configuração do Socket.IO
const io = new Server(server, { cors: corsConfig.socketCors });
setupSocket(io); // Inicia a configuração do Socket.IO

/**
 * Inicia o temporizador para verificar o status do horário de pico
 * Verifica a cada minuto se o horário de pico começou ou terminou
 * e notifica os clientes via Socket.IO quando o status mudar
 * 
 * Nota: As configurações são armazenadas localmente e atualizadas em tempo real
 * através dos listeners do Firestore, então não precisamos buscar as configurações
 * a cada verificação.
 */
function startPeakHourTimer() {
  console.log('Iniciando temporizador de horário de pico...');
  
  // Armazenar o status anterior de cada configuração
  const previousStatus = {};
  
  // Verificar o status do horário de pico a cada minuto
  setInterval(async () => {
    try {
      // Obter todas as configurações de horário de pico (já armazenadas localmente)
      const configs = Object.values(peakHourService.peakHourConfigs);
      
      // Verificar cada configuração
      for (const config of configs) {
        if (config.status === 'ativo') {
          const key = peakHourService.getConfigKey(
            config.country, 
            config.province, 
            config.municipality
          );
          
          // Verificar se está em horário de pico
          const isPeakHour = peakHourService.isWithinPeakHours(
            config.country, 
            config.province, 
            config.municipality
          );
          
          // Se o status mudou, notificar os clientes e atualizar a base de dados
          if (previousStatus[key] !== isPeakHour) {
            console.log(`Status do horário de pico mudou para ${isPeakHour ? 'ativo' : 'inativo'} em ${config.municipality}, ${config.province}, ${config.country}`);
            
            // Atualizar o status anterior
            previousStatus[key] = isPeakHour;
            
            // Atualizar os preços na base de dados
            const updateResult = await peakHourService.updatePricesInDatabase(
              config.country,
              config.province,
              config.municipality,
              isPeakHour
            );
            
            console.log(`Resultado da atualização de preços: ${updateResult.message}`);
            
            // Enviar notificação via Socket.IO
            io.emit('peak_hour_status_changed', {
              country: config.country,
              province: config.province,
              municipality: config.municipality,
              isPeakHour,
              timestamp: new Date().toISOString(),
              updateResult
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do horário de pico:', error);
    }
  }, 60 * 1000); // Verificar a cada minuto
}

// Tentar escutar em múltiplas portas
const ports = [3000, 3001, 3002];
const tryListen = (portIndex = 0) => {
  if (portIndex >= ports.length) process.exit(1);
  server.listen(ports[portIndex], () => {
    const address = server.address();
    const ip = address.address === '::' ? 'localhost' : address.address; // Se for IPv6, substituir por 'localhost'
    console.log(`Servidor rodando na porta ${ports[portIndex]} e IP ${ip}`);
    
    // Iniciar o temporizador para verificar o status do horário de pico
    startPeakHourTimer();
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Porta ${ports[portIndex]} em uso. Tentando próxima porta...`);
      tryListen(portIndex + 1);
    } else {
      console.error('Erro no servidor:', err);
      process.exit(1);
    }
  });
};

// Iniciar a tentativa de escuta nas portas disponíveis
tryListen();
