export default {
    origin: '*', // Em produção, substitua pelo domínio da aplicação
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    socketCors: {
      origin: '*', 
      methods: ['GET', 'POST'],
    },
  };
  