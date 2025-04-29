import dotenv from 'dotenv';
import { adm } from '../config/firebaseConfig.js'; // Ajuste o caminho conforme sua estrutura

dotenv.config();

/**
 * Middleware que aceita API Key ou Firebase Token
 */
const authMiddleware = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];
  const firebaseToken = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  // 1. Verifica API Key primeiro
  if (apiKey) {
    if (apiKey === process.env.API_KEY) {
      return next();
    }
    return res.status(403).json({ error: 'API Key inválida' });
  }

  // 2. Se não tem API Key, verifica Firebase Token
  if (!firebaseToken) {
    return res.status(401).json({ 
      error: 'Autenticação necessária - forneça API Key ou Token Firebase' 
    });
  }

  try {
    // Verifica o token do Firebase usando sua configuração existente
    const decodedToken = await adm().auth().verifyIdToken(firebaseToken);
    
    req.user = {
      token:firebaseToken,
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      // Adicione outros campos úteis do token
      ...(decodedToken.name && { name: decodedToken.name }),
      ...(decodedToken.picture && { picture: decodedToken.picture })
    };
    
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    
    const errorMap = {
      'auth/id-token-expired': 'Token expirado',
      'auth/argument-error': 'Token malformado',
      'auth/invalid-id-token': 'Token inválido'
    };
    
    return res.status(403).json({ 
      error: errorMap[error.code] || 'Falha na autenticação com Firebase' 
    });
  }
};

export default authMiddleware;