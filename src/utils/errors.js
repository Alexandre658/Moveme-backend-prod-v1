// Erros de autenticação
export class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

export class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
  }
}

export class ServiceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = 500;
  }
}

// Função auxiliar para validar parâmetros
export const validateParams = (params, schema) => {
  const errors = [];
  
  for (const [key, value] of Object.entries(params)) {
    if (!schema[key]) continue;
    
    const { type, required, minLength, maxLength, pattern } = schema[key];
    
    if (required && !value) {
      errors.push(`${key} é obrigatório`);
      continue;
    }
    
    if (value) {
      if (type && typeof value !== type) {
        errors.push(`${key} deve ser do tipo ${type}`);
      }
      
      if (minLength && value.length < minLength) {
        errors.push(`${key} deve ter no mínimo ${minLength} caracteres`);
      }
      
      if (maxLength && value.length > maxLength) {
        errors.push(`${key} deve ter no máximo ${maxLength} caracteres`);
      }
      
      if (pattern && !pattern.test(value)) {
        errors.push(`${key} não está no formato correto`);
      }
    }
  }
  
  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }
}; 