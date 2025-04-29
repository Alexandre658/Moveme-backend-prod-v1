import { getCurrentTimestamp } from '../utils/getCurrentTimestamp.js';
import { calculateRotationAngle } from '../utils/calculateRotationAngle.js';
import {trackings} from '../services/trackingService.js';


const CHECK_INTERVAL = 60 * 1000; // Verifica a cada 1 minuto~

// Função que verifica se o tracking expirou
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

// Configurar para rodar o verificador a cada minuto
setInterval(removeStaleVehicles, CHECK_INTERVAL);

// Criar ou atualizar tracking
export const createTracking = (req, res) => {
  const { id, created, startTime, endTime, status, position, vehicle, classVehicle } = req.body;

  if (!created || !startTime || !status || !position || !vehicle || !classVehicle) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  const timestamp = getCurrentTimestamp();
  let rotationAngle = 0;

  // Atualizar se o rastreamento já existir
  if (trackings[id]) {
    const lastPosition = trackings[id].position;
    rotationAngle = calculateRotationAngle(lastPosition, position);
    trackings[id] = { id, created, startTime, endTime, status, position, vehicle, timestamp, rotationAngle, classVehicle };
    broadcastUpdate();
    return res.json({ message: 'Tracking atualizado', tracking: trackings[id] });
  }

  // Criar um novo rastreamento
  trackings[id] = { id, created, startTime, endTime, status, position, vehicle, timestamp, rotationAngle, classVehicle };
  res.status(201).json({ message: 'Tracking criado', tracking: trackings[id] });
  broadcastUpdate();
};

// Obter todos os trackings
export const getAllTrackings = (req, res) => {
  res.json(trackings);
};

// Obter um tracking por ID
export const getTrackingById = (req, res) => {
  const { id } = req.params;
  const tracking = trackings[id];
  if (!tracking) {
    return res.status(404).json({ error: 'Tracking não encontrado' });
  }
  res.json(tracking);
};

// Atualizar um tracking
export const updateTracking = (req, res) => {
  const { id } = req.params;
  const { created, startTime, endTime, status, position, vehicle } = req.body;

  if (!created || !startTime || !status || !position || !vehicle) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  if (!trackings[id]) {
    return res.status(404).json({ error: 'Tracking não encontrado' });
  }

  const timestamp = getCurrentTimestamp();
  const lastPosition = trackings[id].position;
  const rotationAngle = calculateRotationAngle(lastPosition, position);
  trackings[id] = { id, created, startTime, endTime, status, position, vehicle, timestamp, rotationAngle };
  res.json({ message: 'Tracking atualizado', tracking: trackings[id] });
  broadcastUpdate();
};

// Deletar um tracking
export const deleteTracking = (req, res) => {
  const { id } = req.params;
  if (!trackings[id]) {
    return res.status(404).json({ error: 'Tracking não encontrado' });
  }
  delete trackings[id];
  res.json({ message: 'Tracking deletado' });
  broadcastUpdate();
};

// Notificar todos os clientes sobre uma atualização
const broadcastUpdate = () => {
  const update = { type: 'update', trackings };
  global.clients.forEach(client => {
    client.emit('update', update);
  });
};
 