import request from 'supertest';
import app from '../../server.js'; // Importa o app do Express
import trackings from '../services/trackingService.js';

// Mock do serviço de tracking
jest.mock('../services/trackingService.js');

describe('Testes de Tracking', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Limpar mocks após cada teste
  });

  it('Deve criar um novo tracking', async () => {
    const newTracking = {
      id: '123',
      created: '2024-01-01T00:00:00Z',
      startTime: '2024-01-01T00:10:00Z',
      endTime: '2024-01-01T01:00:00Z',
      status: 'active',
      position: { latitude: 10, longitude: 10 },
      vehicle: 'Vehicle1',
      classVehicle: 'Car'
    };

    trackings[newTracking.id] = newTracking;

    const response = await request(app)
      .post('/trackings')
      .send(newTracking);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Tracking criado');
    expect(trackings[newTracking.id]).toEqual(newTracking);
  });

  it('Deve buscar todos os trackings', async () => {
    const mockTrackings = {
      '123': { id: '123', vehicle: 'Vehicle1' },
      '456': { id: '456', vehicle: 'Vehicle2' },
    };

    trackings.mockImplementation(() => mockTrackings); // Mock dos trackings

    const response = await request(app).get('/trackings');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockTrackings);
  });

  it('Deve buscar um tracking por ID', async () => {
    const mockTracking = { id: '123', vehicle: 'Vehicle1' };
    trackings['123'] = mockTracking;

    const response = await request(app).get('/trackings/123');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockTracking);
  });

  it('Deve retornar 404 para um tracking inexistente', async () => {
    const response = await request(app).get('/trackings/999');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Tracking não encontrado');
  });

  it('Deve atualizar um tracking existente', async () => {
    const updatedTracking = {
      id: '123',
      created: '2024-01-01T00:00:00Z',
      startTime: '2024-01-01T00:10:00Z',
      endTime: '2024-01-01T01:00:00Z',
      status: 'completed',
      position: { latitude: 15, longitude: 15 },
      vehicle: 'Vehicle1',
    };

    trackings['123'] = { id: '123', vehicle: 'Vehicle1' };

    const response = await request(app)
      .put('/trackings/123')
      .send(updatedTracking);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Tracking atualizado');
    expect(trackings['123']).toEqual(updatedTracking);
  });

  it('Deve deletar um tracking existente', async () => {
    trackings['123'] = { id: '123', vehicle: 'Vehicle1' };

    const response = await request(app).delete('/trackings/123');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Tracking deletado');
    expect(trackings['123']).toBeUndefined();
  });

  it('Deve retornar 404 ao deletar um tracking inexistente', async () => {
    const response = await request(app).delete('/trackings/999');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Tracking não encontrado');
  });
});
