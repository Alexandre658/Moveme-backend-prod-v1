import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API de Autenticação e Notificações', // Título da API
    version: '1.0.0', // Versão
    description: 'API para autenticação de usuário via SMS e envio de notificações push', // Descrição
  },
  servers: [
    {
      url: 'http://localhost:3000', // URL do servidor da API
      description: 'Servidor de Desenvolvimento',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'], // Caminho para os arquivos de rotas
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
