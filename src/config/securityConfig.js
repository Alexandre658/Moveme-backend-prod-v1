import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Configuração do Helmet
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.API_URL || 'http://localhost:3000'],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

// Configuração do Rate Limiting
export const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 1000, // limite de 1000 requisições por IP por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições deste IP, por favor tente novamente mais tarde.',
  skip: (req) => {
    // Pular rate limiting para IPs confiáveis
    const trustedIps = process.env.TRUSTED_IPS?.split(',') || [];
    return trustedIps.includes(req.ip);
  }
});

// Rate Limiter específico para endpoints de rastreamento
export const trackingRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 5000, // limite mais alto para endpoints de rastreamento
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Limite de requisições de rastreamento excedido.',
  skip: (req) => {
    // Pular rate limiting para IPs confiáveis
    const trustedIps = process.env.TRUSTED_IPS?.split(',') || [];
    return trustedIps.includes(req.ip);
  }
});

// Configuração do CORS
export const corsConfig = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
  maxAge: 86400, // 24 horas
}; 