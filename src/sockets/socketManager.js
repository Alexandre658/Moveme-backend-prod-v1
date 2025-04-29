import {trackings} from '../services/trackingService.js';
const setupSocket = (io) => {
  global.clients = new Set();

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
};

export default setupSocket;

