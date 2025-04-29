import request from 'supertest';
import app from '../../index.js';
import peakHourService from '../services/peak_hour_service.js';

// Mock do serviço de horário de pico
jest.mock('../services/peak_hour_service.js');

describe('Testes de Rotas de Horário de Pico', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/peak-hour/status', () => {
    it('deve retornar o status do horário de pico', async () => {
      // Mock do método getPeakStatus
      peakHourService.getPeakStatus.mockReturnValue({
        isPeakHour: true,
        currentTime: '2024-04-07T08:30:00.000Z',
        config: {
          country: 'Brasil',
          province: 'São Paulo',
          municipality: 'São Paulo',
          startTime: '08:00',
          endTime: '09:00',
          pricePerHour: 15,
          status: 'ativo'
        },
        allConfigs: {}
      });

      const response = await request(app)
        .get('/api/peak-hour/status')
        .query({
          country: 'Brasil',
          province: 'São Paulo',
          municipality: 'São Paulo'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        isPeakHour: true,
        currentTime: '2024-04-07T08:30:00.000Z',
        config: {
          country: 'Brasil',
          province: 'São Paulo',
          municipality: 'São Paulo',
          startTime: '08:00',
          endTime: '09:00',
          pricePerHour: 15,
          status: 'ativo'
        },
        allConfigs: {}
      });
      expect(peakHourService.getPeakStatus).toHaveBeenCalledWith('Brasil', 'São Paulo', 'São Paulo');
    });

    it('deve retornar erro 400 quando faltam parâmetros', async () => {
      const response = await request(app)
        .get('/api/peak-hour/status')
        .query({
          country: 'Brasil',
          // province e municipality faltando
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Parâmetros country, province e municipality são obrigatórios');
    });
  });

  describe('POST /api/peak-hour/config', () => {
    it('deve criar uma nova configuração de horário de pico', async () => {
      // Mock do método updatePeakHourConfig
      peakHourService.updatePeakHourConfig.mockResolvedValue({
        success: true,
        message: 'Configuração atualizada com sucesso'
      });

      const newConfig = {
        country: 'Brasil',
        province: 'São Paulo',
        municipality: 'São Paulo',
        startTime: '08:00',
        endTime: '09:00',
        pricePerHour: 15,
        status: 'ativo'
      };

      const response = await request(app)
        .post('/api/peak-hour/config')
        .send(newConfig);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Configuração atualizada com sucesso');
      expect(peakHourService.updatePeakHourConfig).toHaveBeenCalledWith(newConfig);
    });

    it('deve retornar erro 400 quando faltam campos obrigatórios', async () => {
      const newConfig = {
        country: 'Brasil',
        province: 'São Paulo',
        municipality: 'São Paulo',
        startTime: '08:00',
        endTime: '09:00',
        // pricePerHour e status faltando
      };

      const response = await request(app)
        .post('/api/peak-hour/config')
        .send(newConfig);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Todos os campos são obrigatórios');
    });

    it('deve retornar erro 500 quando ocorre um erro na atualização', async () => {
      // Mock do método updatePeakHourConfig para retornar erro
      peakHourService.updatePeakHourConfig.mockResolvedValue({
        success: false,
        error: 'Erro ao atualizar configuração'
      });

      const newConfig = {
        country: 'Brasil',
        province: 'São Paulo',
        municipality: 'São Paulo',
        startTime: '08:00',
        endTime: '09:00',
        pricePerHour: 15,
        status: 'ativo'
      };

      const response = await request(app)
        .post('/api/peak-hour/config')
        .send(newConfig);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Erro ao atualizar configuração');
    });
  });

  describe('DELETE /api/peak-hour/config', () => {
    it('deve remover uma configuração de horário de pico', async () => {
      // Mock do método removePeakHourConfig
      peakHourService.removePeakHourConfig.mockResolvedValue({
        success: true,
        message: 'Configuração removida com sucesso'
      });

      const response = await request(app)
        .delete('/api/peak-hour/config')
        .query({
          country: 'Brasil',
          province: 'São Paulo',
          municipality: 'São Paulo'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Configuração removida com sucesso');
      expect(peakHourService.removePeakHourConfig).toHaveBeenCalledWith('Brasil', 'São Paulo', 'São Paulo');
    });

    it('deve retornar erro 400 quando faltam parâmetros', async () => {
      const response = await request(app)
        .delete('/api/peak-hour/config')
        .query({
          country: 'Brasil',
          // province e municipality faltando
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Parâmetros country, province e municipality são obrigatórios');
    });

    it('deve retornar erro 500 quando ocorre um erro na remoção', async () => {
      // Mock do método removePeakHourConfig para retornar erro
      peakHourService.removePeakHourConfig.mockResolvedValue({
        success: false,
        error: 'Erro ao remover configuração'
      });

      const response = await request(app)
        .delete('/api/peak-hour/config')
        .query({
          country: 'Brasil',
          province: 'São Paulo',
          municipality: 'São Paulo'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Erro ao remover configuração');
    });
  });

  describe('GET /api/vehicle-classes', () => {
    it('deve retornar todas as classes de veículos', async () => {
      // Mock das classes de veículos
      const mockVehicleClasses = {
        'carro1': {
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
        },
        'carro2': {
          id: 'carro2',
          basePrice: 100,
          basePriceMin: 70,
          basePricePerKm: 12,
          description: 'Carro luxo',
          designation: 'Luxury',
          iconCategory: 'car',
          iconMap: 'luxury-car.png',
          isDefault: false,
          passengers: 4,
          percentage: 100,
          tarifaBase: 7
        }
      };

      // Mock da propriedade vehicleClasses
      Object.defineProperty(peakHourService, 'vehicleClasses', {
        get: jest.fn().mockReturnValue(mockVehicleClasses)
      });

      const response = await request(app)
        .get('/api/vehicle-classes');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(Object.values(mockVehicleClasses));
    });
  });

  describe('GET /api/vehicle-classes/:id', () => {
    it('deve retornar uma classe de veículo específica', async () => {
      // Mock do método getVehicleClass
      peakHourService.getVehicleClass.mockReturnValue({
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
      });

      const response = await request(app)
        .get('/api/vehicle-classes/carro1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
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
      });
      expect(peakHourService.getVehicleClass).toHaveBeenCalledWith('carro1');
    });

    it('deve retornar erro 404 quando a classe de veículo não existe', async () => {
      // Mock do método getVehicleClass para retornar null
      peakHourService.getVehicleClass.mockReturnValue(null);

      const response = await request(app)
        .get('/api/vehicle-classes/carro999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Classe de veículo não encontrada');
    });
  });

  describe('POST /api/vehicle-classes', () => {
    it('deve criar uma nova classe de veículo', async () => {
      // Mock do método updateVehicleClass
      peakHourService.updateVehicleClass.mockResolvedValue({
        success: true,
        message: 'Classe de veículo atualizada com sucesso'
      });

      const vehicleClass = {
        id: 'carro3',
        basePrice: 120,
        basePriceMin: 90,
        basePricePerKm: 15,
        description: 'Carro premium',
        designation: 'Premium',
        iconCategory: 'car',
        iconMap: 'premium-car.png',
        isDefault: false,
        passengers: 4,
        percentage: 100,
        tarifaBase: 10
      };

      const response = await request(app)
        .post('/api/vehicle-classes')
        .send(vehicleClass);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Classe de veículo atualizada com sucesso');
      expect(peakHourService.updateVehicleClass).toHaveBeenCalledWith(vehicleClass);
    });

    it('deve retornar erro 400 quando o ID é obrigatório', async () => {
      const vehicleClass = {
        // id faltando
        basePrice: 120,
        basePriceMin: 90,
        basePricePerKm: 15,
        description: 'Carro premium',
        designation: 'Premium',
        iconCategory: 'car',
        iconMap: 'premium-car.png',
        isDefault: false,
        passengers: 4,
        percentage: 100,
        tarifaBase: 10
      };

      const response = await request(app)
        .post('/api/vehicle-classes')
        .send(vehicleClass);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ID da classe de veículo é obrigatório');
    });

    it('deve retornar erro 500 quando ocorre um erro na atualização', async () => {
      // Mock do método updateVehicleClass para retornar erro
      peakHourService.updateVehicleClass.mockResolvedValue({
        success: false,
        error: 'Erro ao atualizar classe de veículo'
      });

      const vehicleClass = {
        id: 'carro3',
        basePrice: 120,
        basePriceMin: 90,
        basePricePerKm: 15,
        description: 'Carro premium',
        designation: 'Premium',
        iconCategory: 'car',
        iconMap: 'premium-car.png',
        isDefault: false,
        passengers: 4,
        percentage: 100,
        tarifaBase: 10
      };

      const response = await request(app)
        .post('/api/vehicle-classes')
        .send(vehicleClass);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Erro ao atualizar classe de veículo');
    });
  });

  describe('DELETE /api/vehicle-classes/:id', () => {
    it('deve remover uma classe de veículo', async () => {
      // Mock do método removeVehicleClass
      peakHourService.removeVehicleClass.mockResolvedValue({
        success: true,
        message: 'Classe de veículo removida com sucesso'
      });

      const response = await request(app)
        .delete('/api/vehicle-classes/carro1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Classe de veículo removida com sucesso');
      expect(peakHourService.removeVehicleClass).toHaveBeenCalledWith('carro1');
    });

    it('deve retornar erro 500 quando ocorre um erro na remoção', async () => {
      // Mock do método removeVehicleClass para retornar erro
      peakHourService.removeVehicleClass.mockResolvedValue({
        success: false,
        error: 'Erro ao remover classe de veículo'
      });

      const response = await request(app)
        .delete('/api/vehicle-classes/carro1');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Erro ao remover classe de veículo');
    });
  });
}); 