import { authService } from '../services/authService.js';
import { ValidationError, AuthenticationError, DatabaseError, ServiceError } from '../utils/errors.js';

// Mock das dependências
const mockDb = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue({ exists: true }),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined)
    }))
  }))
};

const mockAdm = {
  auth: jest.fn(() => ({
    getUserByPhoneNumber: jest.fn().mockResolvedValue({
      uid: '123',
      metadata: { creationTime: '2024-01-01' }
    }),
    createCustomToken: jest.fn().mockResolvedValue('token'),
    updateUser: jest.fn().mockResolvedValue(undefined)
  })),
  firestore: jest.fn(() => ({
    FieldValue: {
      serverTimestamp: jest.fn()
    },
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ exists: true }),
        set: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined)
      }))
    }))
  }))
};

jest.mock('../config/firebaseConfig.js', () => ({
  db: jest.fn(() => mockDb),
  adm: jest.fn(() => mockAdm)
}));

jest.mock('../services/smsService.js', () => ({
  enviarSMS: jest.fn()
}));

jest.mock('../services/emailService.js', () => ({
  default: {
    sendAccessCodeEmail: jest.fn()
  }
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Resetar os mocks para o estado padrão
    mockDb.collection.mockImplementation(() => ({
      doc: jest.fn(() => ({
        set: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue({ exists: true }),
        update: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined)
      }))
    }));
  });

  describe('enviarCodigoVerificacao', () => {
    it('deve lançar ValidationError para telefone inválido', async () => {
      await expect(authService.enviarCodigoVerificacao('123', 'chave'))
        .rejects
        .toThrow(ValidationError);
    });

    it('deve lançar ServiceError quando falhar ao enviar SMS', async () => {
      const enviarSMS = require('../services/smsService.js').enviarSMS;
      enviarSMS.mockResolvedValue({ success: false });

      await expect(authService.enviarCodigoVerificacao('+5511999999999', 'chave'))
        .rejects
        .toThrow(ServiceError);
    });

    it('deve enviar código com sucesso', async () => {
      const enviarSMS = require('../services/smsService.js').enviarSMS;
      enviarSMS.mockResolvedValue({ success: true });

      const result = await authService.enviarCodigoVerificacao('+5511999999999', 'chave');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Código de verificação enviado com sucesso');
    });
  });

  describe('verificarCodigo', () => {
    it('deve lançar ValidationError para código inválido', async () => {
      await expect(authService.verificarCodigo('+5511999999999', '123'))
        .rejects
        .toThrow(ValidationError);
    });

    it('deve lançar AuthenticationError para código não encontrado', async () => {
      mockDb.collection.mockImplementationOnce(() => ({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ exists: false })
        }))
      }));

      await expect(authService.verificarCodigo('+5511999999999', '123456'))
        .rejects
        .toThrow(AuthenticationError);
    });

    it('deve verificar código com sucesso', async () => {
      mockDb.collection.mockImplementationOnce(() => ({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              codigo: '123456',
              verificado: false,
              expirationTime: { toDate: () => new Date(Date.now() + 60000) }
            })
          }),
          update: jest.fn().mockResolvedValue(undefined)
        }))
      }));

      const result = await authService.verificarCodigo('+5511999999999', '123456');
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });
  });
}); 