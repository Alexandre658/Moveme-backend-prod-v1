import peakHourService from '../services/peak_hour_service.js';
import { getFirestore } from 'firebase-admin/firestore';

// Mock do Firestore
jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      get: jest.fn(),
      doc: jest.fn(() => ({
        set: jest.fn(),
        delete: jest.fn(),
      })),
    })),
  })),
}));

describe('PeakHourService', () => {
  // Mock da data atual para testes
  const mockDate = new Date('2024-04-07T08:30:00');
  const originalDate = global.Date;

  beforeEach(() => {
    // Configurar o mock da data
    global.Date = class extends Date {
      constructor() {
        return mockDate;
      }
      
      toLocaleTimeString() {
        return '08:30:00';
      }
      
      toISOString() {
        return '2024-04-07T08:30:00.000Z';
      }
    };
    
    // Limpar os mocks antes de cada teste
    jest.clearAllMocks();
    
    // Resetar as configurações do serviço
    peakHourService.peakHourConfigs = {};
    peakHourService.vehicleClasses = {};
  });

  afterAll(() => {
    // Restaurar a classe Date original
    global.Date = originalDate;
  });

  describe('getConfigKey', () => {
    it('deve gerar uma chave única para as configurações', () => {
      const key = peakHourService.getConfigKey('Brasil', 'São Paulo', 'São Paulo');
      expect(key).toBe('brasil_são paulo_são paulo');
    });
  });

  describe('isTimeBetween', () => {
    it('deve retornar true quando o horário está entre o início e o fim', () => {
      const result = peakHourService.isTimeBetween('08:30', '08:00', '09:00');
      expect(result).toBe(true);
    });

    it('deve retornar false quando o horário está antes do início', () => {
      const result = peakHourService.isTimeBetween('07:30', '08:00', '09:00');
      expect(result).toBe(false);
    });

    it('deve retornar false quando o horário está depois do fim', () => {
      const result = peakHourService.isTimeBetween('09:30', '08:00', '09:00');
      expect(result).toBe(false);
    });

    it('deve retornar true quando o horário é igual ao início', () => {
      const result = peakHourService.isTimeBetween('08:00', '08:00', '09:00');
      expect(result).toBe(true);
    });

    it('deve retornar true quando o horário é igual ao fim', () => {
      const result = peakHourService.isTimeBetween('09:00', '08:00', '09:00');
      expect(result).toBe(true);
    });
  });

  describe('isWithinPeakHours', () => {
    it('deve retornar false quando não há configuração para a localização', () => {
      const result = peakHourService.isWithinPeakHours('Brasil', 'São Paulo', 'São Paulo');
      expect(result).toBe(false);
    });

    it('deve retornar false quando a configuração está inativa', () => {
      // Configurar uma configuração inativa
      const key = peakHourService.getConfigKey('Brasil', 'São Paulo', 'São Paulo');
      peakHourService.peakHourConfigs[key] = {
        country: 'Brasil',
        province: 'São Paulo',
        municipality: 'São Paulo',
        startTime: '08:00',
        endTime: '09:00',
        pricePerHour: 15,
        status: 'inativo'
      };

      const result = peakHourService.isWithinPeakHours('Brasil', 'São Paulo', 'São Paulo');
      expect(result).toBe(false);
    });

    it('deve retornar true quando está dentro do horário de pico', () => {
      // Configurar uma configuração ativa
      const key = peakHourService.getConfigKey('Brasil', 'São Paulo', 'São Paulo');
      peakHourService.peakHourConfigs[key] = {
        country: 'Brasil',
        province: 'São Paulo',
        municipality: 'São Paulo',
        startTime: '08:00',
        endTime: '09:00',
        pricePerHour: 15,
        status: 'ativo'
      };

      const result = peakHourService.isWithinPeakHours('Brasil', 'São Paulo', 'São Paulo');
      expect(result).toBe(true);
    });

    it('deve retornar false quando está fora do horário de pico', () => {
      // Configurar uma configuração ativa
      const key = peakHourService.getConfigKey('Brasil', 'São Paulo', 'São Paulo');
      peakHourService.peakHourConfigs[key] = {
        country: 'Brasil',
        province: 'São Paulo',
        municipality: 'São Paulo',
        startTime: '09:00',
        endTime: '10:00',
        pricePerHour: 15,
        status: 'ativo'
      };

      const result = peakHourService.isWithinPeakHours('Brasil', 'São Paulo', 'São Paulo');
      expect(result).toBe(false);
    });
  });

  describe('calculatePeakPrice', () => {
    it('deve retornar o preço base quando não há configuração de horário de pico', () => {
      const result = peakHourService.calculatePeakPrice(100, 'Brasil', 'São Paulo', 'São Paulo');
      expect(result).toBe(100);
    });

    it('deve retornar o preço base quando a configuração está inativa', () => {
      // Configurar uma configuração inativa
      const key = peakHourService.getConfigKey('Brasil', 'São Paulo', 'São Paulo');
      peakHourService.peakHourConfigs[key] = {
        country: 'Brasil',
        province: 'São Paulo',
        municipality: 'São Paulo',
        startTime: '08:00',
        endTime: '09:00',
        pricePerHour: 15,
        status: 'inativo'
      };

      const result = peakHourService.calculatePeakPrice(100, 'Brasil', 'São Paulo', 'São Paulo');
      expect(result).toBe(100);
    });

    it('deve calcular o preço com multiplicador quando está em horário de pico', () => {
      // Configurar uma configuração ativa
      const key = peakHourService.getConfigKey('Brasil', 'São Paulo', 'São Paulo');
      peakHourService.peakHourConfigs[key] = {
        country: 'Brasil',
        province: 'São Paulo',
        municipality: 'São Paulo',
        startTime: '08:00',
        endTime: '09:00',
        pricePerHour: 15,
        status: 'ativo'
      };

      const result = peakHourService.calculatePeakPrice(100, 'Brasil', 'São Paulo', 'São Paulo');
      expect(result).toBe(150); // 100 * (15/10)
    });

    it('deve retornar o preço base quando está fora do horário de pico', () => {
      // Configurar uma configuração ativa
      const key = peakHourService.getConfigKey('Brasil', 'São Paulo', 'São Paulo');
      peakHourService.peakHourConfigs[key] = {
        country: 'Brasil',
        province: 'São Paulo',
        municipality: 'São Paulo',
        startTime: '09:00',
        endTime: '10:00',
        pricePerHour: 15,
        status: 'ativo'
      };

      const result = peakHourService.calculatePeakPrice(100, 'Brasil', 'São Paulo', 'São Paulo');
      expect(result).toBe(100);
    });

    it('deve usar o preço base da classe de veículo quando não é fornecido um preço base', () => {
      // Configurar uma configuração ativa
      const key = peakHourService.getConfigKey('Brasil', 'São Paulo', 'São Paulo');
      peakHourService.peakHourConfigs[key] = {
        country: 'Brasil',
        province: 'São Paulo',
        municipality: 'São Paulo',
        startTime: '08:00',
        endTime: '09:00',
        pricePerHour: 15,
        status: 'ativo'
      };

      // Configurar uma classe de veículo
      peakHourService.vehicleClasses['carro1'] = {
        id: 'carro1',
        basePrice: 80,
        basePriceMin: 50,
        basePricePerKm: 10,
        description: 'Carro padrão',
        designation: 'Standard',
        iconCategory: 'car',
        iconMap: 'car.png',
        isDefault: true,
        passengers: 4,
        percentage: 100,
        tarifaBase: 5
      };

      const result = peakHourService.calculatePeakPrice(0, 'Brasil', 'São Paulo', 'São Paulo', 'carro1');
      expect(result).toBe(120); // 80 * (15/10)
    });
  });

  describe('getPeakStatus', () => {
    it('deve retornar o status atual do horário de pico', () => {
      // Configurar uma configuração ativa
      const key = peakHourService.getConfigKey('Brasil', 'São Paulo', 'São Paulo');
      peakHourService.peakHourConfigs[key] = {
        country: 'Brasil',
        province: 'São Paulo',
        municipality: 'São Paulo',
        startTime: '08:00',
        endTime: '09:00',
        pricePerHour: 15,
        status: 'ativo'
      };

      const status = peakHourService.getPeakStatus('Brasil', 'São Paulo', 'São Paulo');
      
      expect(status.isPeakHour).toBe(true);
      expect(status.currentTime).toBe('2024-04-07T08:30:00.000Z');
      expect(status.config).toEqual(peakHourService.peakHourConfigs[key]);
      expect(status.allConfigs).toEqual(peakHourService.peakHourConfigs);
    });
  });

  describe('updatePeakHourConfig', () => {
    it('deve atualizar a configuração de horário de pico', async () => {
      // Mock do método set do Firestore
      const mockSet = jest.fn().mockResolvedValue();
      getFirestore().collection().doc().set = mockSet;

      const newConfig = {
        country: 'Brasil',
        province: 'São Paulo',
        municipality: 'São Paulo',
        startTime: '08:00',
        endTime: '09:00',
        pricePerHour: 15,
        status: 'ativo'
      };

      const result = await peakHourService.updatePeakHourConfig(newConfig);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Configuração atualizada com sucesso');
      expect(mockSet).toHaveBeenCalledWith(newConfig);
      
      const key = peakHourService.getConfigKey('Brasil', 'São Paulo', 'São Paulo');
      expect(peakHourService.peakHourConfigs[key]).toEqual(newConfig);
    });

    it('deve retornar erro quando faltam campos obrigatórios', async () => {
      const newConfig = {
        country: 'Brasil',
        province: 'São Paulo',
        municipality: 'São Paulo',
        startTime: '08:00',
        endTime: '09:00',
        // pricePerHour e status faltando
      };

      const result = await peakHourService.updatePeakHourConfig(newConfig);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Todos os campos são obrigatórios');
    });
  });

  describe('removePeakHourConfig', () => {
    it('deve remover a configuração de horário de pico', async () => {
      // Mock do método delete do Firestore
      const mockDelete = jest.fn().mockResolvedValue();
      getFirestore().collection().doc().delete = mockDelete;

      // Configurar uma configuração
      const key = peakHourService.getConfigKey('Brasil', 'São Paulo', 'São Paulo');
      peakHourService.peakHourConfigs[key] = {
        country: 'Brasil',
        province: 'São Paulo',
        municipality: 'São Paulo',
        startTime: '08:00',
        endTime: '09:00',
        pricePerHour: 15,
        status: 'ativo'
      };

      const result = await peakHourService.removePeakHourConfig('Brasil', 'São Paulo', 'São Paulo');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Configuração removida com sucesso');
      expect(mockDelete).toHaveBeenCalled();
      expect(peakHourService.peakHourConfigs[key]).toBeUndefined();
    });
  });

  describe('updateVehicleClass', () => {
    it('deve atualizar a classe de veículo', async () => {
      // Mock do método set do Firestore
      const mockSet = jest.fn().mockResolvedValue();
      getFirestore().collection().doc().set = mockSet;

      const vehicleClass = {
        id: 'carro1',
        basePrice: 80,
        basePriceMin: 50,
        basePricePerKm: 10,
        description: 'Carro padrão',
        designation: 'Standard',
        iconCategory: 'car',
        iconMap: 'car.png',
        isDefault: true,
        passengers: 4,
        percentage: 100,
        tarifaBase: 5
      };

      const result = await peakHourService.updateVehicleClass(vehicleClass);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Classe de veículo atualizada com sucesso');
      expect(mockSet).toHaveBeenCalled();
      expect(peakHourService.vehicleClasses['carro1']).toEqual(vehicleClass);
    });

    it('deve retornar erro quando o ID é obrigatório', async () => {
      const vehicleClass = {
        // id faltando
        basePrice: 80,
        basePriceMin: 50,
        basePricePerKm: 10,
        description: 'Carro padrão',
        designation: 'Standard',
        iconCategory: 'car',
        iconMap: 'car.png',
        isDefault: true,
        passengers: 4,
        percentage: 100,
        tarifaBase: 5
      };

      const result = await peakHourService.updateVehicleClass(vehicleClass);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('ID da classe de veículo é obrigatório');
    });
  });

  describe('removeVehicleClass', () => {
    it('deve remover a classe de veículo', async () => {
      // Mock do método delete do Firestore
      const mockDelete = jest.fn().mockResolvedValue();
      getFirestore().collection().doc().delete = mockDelete;

      // Configurar uma classe de veículo
      peakHourService.vehicleClasses['carro1'] = {
        id: 'carro1',
        basePrice: 80,
        basePriceMin: 50,
        basePricePerKm: 10,
        description: 'Carro padrão',
        designation: 'Standard',
        iconCategory: 'car',
        iconMap: 'car.png',
        isDefault: true,
        passengers: 4,
        percentage: 100,
        tarifaBase: 5
      };

      const result = await peakHourService.removeVehicleClass('carro1');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Classe de veículo removida com sucesso');
      expect(mockDelete).toHaveBeenCalled();
      expect(peakHourService.vehicleClasses['carro1']).toBeUndefined();
    });

    it('deve retornar erro quando o ID é obrigatório', async () => {
      const result = await peakHourService.removeVehicleClass('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('ID da classe de veículo é obrigatório');
    });
  });
}); 