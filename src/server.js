import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import firebaseConfig from './config/firebaseConfig.js';
import { PeakHourService } from './services/peak_hour_service.js';
import peakHourRoutes from './routes/peak_hour.routes.js';
import authRoutes from './routes/auth.routes.js';

// Inicialização do Firebase Admin
try {
  await firebaseConfig();
  console.log('Firebase inicializado com sucesso');
} catch (error) {
  console.error('Erro ao inicializar Firebase:', error);
  process.exit(1);
}

// Configuração do Express
const app = express();
app.use(cors());
app.use(express.json());

// Configuração do Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Inicializar o serviço de horário de pico
const peakHourService = new PeakHourService();
await peakHourService.initialize();

// Rotas
app.use('/api/peak-hour', peakHourRoutes);
app.use('/auth', authRoutes);

// Eventos do Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Iniciar o temporizador para verificar o status do horário de pico
  startPeakHourTimer();
});

/**
 * Inicia o temporizador para verificar o status do horário de pico
 * Verifica a cada minuto se o horário de pico começou ou terminou
 * e notifica os clientes via Socket.IO quando o status mudar
 */
function startPeakHourTimer() {
  console.log('Iniciando temporizador de horário de pico...');
  
  // Armazenar o status anterior de cada configuração
  const previousStatus = {};
  
  // Verificar o status do horário de pico a cada minuto
  setInterval(async () => {
    try {
      // Obter todas as configurações de horário de pico
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
          
          // Se o status mudou, notificar os clientes
          if (previousStatus[key] !== isPeakHour) {
            console.log(`Status do horário de pico mudou para ${isPeakHour ? 'ativo' : 'inativo'} em ${config.municipality}, ${config.province}, ${config.country}`);
            
            // Atualizar o status anterior
            previousStatus[key] = isPeakHour;
            
            // Enviar notificação via Socket.IO
            io.emit('peak_hour_status_changed', {
              country: config.country,
              province: config.province,
              municipality: config.municipality,
              isPeakHour,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do horário de pico:', error);
    }
  }, 60 * 1000); // Verificar a cada minuto
}

export { app, io }; 