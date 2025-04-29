import request from 'supertest';
import app from '../../index.js';
import peakHourService from '../services/peak_hour_service.js';
import { getFirestore } from 'firebase-admin/firestore';

// Mock do serviço de horário de pico
jest.mock('../services/peak_hour_service.js');

// Mock do Firestore
jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        update: jest.fn(),
      })),
    })),
  })),
}));

describe('Testes de Integração do Horário de Pico', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /requests/:requestId/finish', () => {
    it('deve finalizar uma corrida e aplicar o preço de horário de pico', async () => {
      // Mock do método isWithinPeakHours
      peakHourService.isWithinPeakHours.mockReturnValue(true);
      
      // Mock do método calculatePeakPrice
      peakHourService.calculatePeakPrice.mockReturnValue(150);
      
      // Mock do método getConfigKey
      peakHourService.getConfigKey.mockReturnValue('brasil_são paulo_são paulo');
      
      // Mock da propriedade peakHourConfigs
      Object.defineProperty(peakHourService, 'peakHourConfigs', {
        get: jest.fn().mockReturnValue({
          'brasil_são paulo_são paulo': {
            country: 'Brasil',
            province: 'São Paulo',
            municipality: 'São Paulo',
            startTime: '08:00',
            endTime: '09:00',
            pricePerHour: 15,
            status: 'ativo'
          }
        })
      });
      
      // Mock do método get do Firestore
      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          startTime: { toDate: () => new Date('2024-04-07T08:00:00Z') },
          tripId: 'trip123',
          basePrice: 100,
          country: 'Brasil',
          province: 'São Paulo',
          municipality: 'São Paulo',
          vehicleClassId: 'carro1'
        })
      });
      
      // Mock do método update do Firestore
      const mockUpdate = jest.fn().mockResolvedValue();
      
      getFirestore().collection().doc().get = mockGet;
      getFirestore().collection().doc().update = mockUpdate;
      
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
        .post('/requests/request123/finish');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Ride finished');
      expect(response.body.finalPrice).toBe(150);
      expect(response.body.isPeakHour).toBe(true);
      expect(response.body.priceMultiplier).toBe(1.5);
      
      // Verificar se o método update do Firestore foi chamado com os parâmetros corretos
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        status: 6,
        finalPrice: 150,
        isPeakHour: true,
        priceMultiplier: 1.5
      }));
      
      // Verificar se o método isWithinPeakHours foi chamado com os parâmetros corretos
      expect(peakHourService.isWithinPeakHours).toHaveBeenCalledWith('Brasil', 'São Paulo', 'São Paulo');
      
      // Verificar se o método calculatePeakPrice foi chamado com os parâmetros corretos
      expect(peakHourService.calculatePeakPrice).toHaveBeenCalledWith(100, 'Brasil', 'São Paulo', 'São Paulo', 'carro1');
    });

    it('deve finalizar uma corrida sem aplicar o preço de horário de pico quando não está em horário de pico', async () => {
      // Mock do método isWithinPeakHours
      peakHourService.isWithinPeakHours.mockReturnValue(false);
      
      // Mock do método calculatePeakPrice
      peakHourService.calculatePeakPrice.mockReturnValue(100);
      
      // Mock do método getConfigKey
      peakHourService.getConfigKey.mockReturnValue('brasil_são paulo_são paulo');
      
      // Mock da propriedade peakHourConfigs
      Object.defineProperty(peakHourService, 'peakHourConfigs', {
        get: jest.fn().mockReturnValue({
          'brasil_são paulo_são paulo': {
            country: 'Brasil',
            province: 'São Paulo',
            municipality: 'São Paulo',
            startTime: '08:00',
            endTime: '09:00',
            pricePerHour: 15,
            status: 'ativo'
          }
        })
      });
      
      // Mock do método get do Firestore
      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          startTime: { toDate: () => new Date('2024-04-07T08:00:00Z') },
          tripId: 'trip123',
          basePrice: 100,
          country: 'Brasil',
          province: 'São Paulo',
          municipality: 'São Paulo',
          vehicleClassId: 'carro1'
        })
      });
      
      // Mock do método update do Firestore
      const mockUpdate = jest.fn().mockResolvedValue();
      
      getFirestore().collection().doc().get = mockGet;
      getFirestore().collection().doc().update = mockUpdate;
      
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
        .post('/requests/request123/finish');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Ride finished');
      expect(response.body.finalPrice).toBe(100);
      expect(response.body.isPeakHour).toBe(false);
      expect(response.body.priceMultiplier).toBe(1);
      
      // Verificar se o método update do Firestore foi chamado com os parâmetros corretos
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        status: 6,
        finalPrice: 100,
        isPeakHour: false,
        priceMultiplier: 1
      }));
    });

    it('deve retornar erro 404 quando a corrida não existe', async () => {
      // Mock do método get do Firestore
      const mockGet = jest.fn().mockResolvedValue({
        exists: false
      });
      
      getFirestore().collection().doc().get = mockGet;

      const response = await request(app)
        .post('/requests/request999/finish');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Document not found');
    });

    it('deve retornar erro 400 quando o horário de início não existe', async () => {
      // Mock do método get do Firestore
      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          // startTime faltando
          tripId: 'trip123',
          basePrice: 100,
          country: 'Brasil',
          province: 'São Paulo',
          municipality: 'São Paulo',
          vehicleClassId: 'carro1'
        })
      });
      
      getFirestore().collection().doc().get = mockGet;

      const response = await request(app)
        .post('/requests/request123/finish');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Start time not found for this request');
    });

    it('deve retornar erro 500 quando ocorre um erro na atualização', async () => {
      // Mock do método isWithinPeakHours
      peakHourService.isWithinPeakHours.mockReturnValue(true);
      
      // Mock do método calculatePeakPrice
      peakHourService.calculatePeakPrice.mockReturnValue(150);
      
      // Mock do método getConfigKey
      peakHourService.getConfigKey.mockReturnValue('brasil_são paulo_são paulo');
      
      // Mock da propriedade peakHourConfigs
      Object.defineProperty(peakHourService, 'peakHourConfigs', {
        get: jest.fn().mockReturnValue({
          'brasil_são paulo_são paulo': {
            country: 'Brasil',
            province: 'São Paulo',
            municipality: 'São Paulo',
            startTime: '08:00',
            endTime: '09:00',
            pricePerHour: 15,
            status: 'ativo'
          }
        })
      });
      
      // Mock do método get do Firestore
      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          startTime: { toDate: () => new Date('2024-04-07T08:00:00Z') },
          tripId: 'trip123',
          basePrice: 100,
          country: 'Brasil',
          province: 'São Paulo',
          municipality: 'São Paulo',
          vehicleClassId: 'carro1'
        })
      });
      
      // Mock do método update do Firestore para lançar um erro
      const mockUpdate = jest.fn().mockRejectedValue(new Error('Erro ao atualizar corrida'));
      
      getFirestore().collection().doc().get = mockGet;
      getFirestore().collection().doc().update = mockUpdate;
      
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
        .post('/requests/request123/finish');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update race status or trip end_time');
    });
  });
}); 