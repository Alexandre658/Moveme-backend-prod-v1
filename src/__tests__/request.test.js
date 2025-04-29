import request from 'supertest';
import app from '../../server.js'; // Importa o app do Express
import requests from '../services/requestService.js';
import { getDocument, updateDocument } from '../services/firebaseService.js';

// Mock dos serviços de Firebase
jest.mock('../src/services/firebaseService.js');
jest.mock('../src/services/requestService.js');

describe('Testes de Request', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Deve criar um novo pedido', async () => {
    const newRequest = {
      driverId: 'driver1',
      requestId: 'req1',
      driverDetails: { name: 'Driver 1' },
      documentId: 'doc1',
    };

    const documentData = {
      originLatitude: 10,
      originLongitude: 10,
    };

    getDocument.mockResolvedValue(documentData);

    const response = await request(app)
      .post('/requests')
      .send(newRequest);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Pedido enviado para todos os clientes');
    expect(requests[newRequest.requestId]).toEqual(expect.objectContaining({
      driverId: 'driver1',
      status: 'pending',
    }));
  });

  it('Deve aceitar um pedido existente', async () => {
    requests['req1'] = { driverId: 'driver1', status: 'pending' };

    const response = await request(app)
      .post('/requests/req1/accept')
      .send({ driverId: 'driver1', tripId: 'trip1', vehicle: 'Vehicle1' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Pedido aceito');
    expect(requests['req1']).toEqual(expect.objectContaining({
      status: 'accepted',
      assigned: 'driver1',
      tripId: 'trip1',
    }));
    expect(updateDocument).toHaveBeenCalledWith('races', 'req1', expect.any(Object));
  });

  it('Deve negar um pedido existente', async () => {
    requests['req1'] = { driverId: 'driver1', status: 'pending' };

    const response = await request(app).post('/requests/req1/deny');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Pedido negado');
    expect(requests['req1'].status).toBe('denied');
    expect(updateDocument).toHaveBeenCalledWith('races', 'req1', { status: 1 });
  });

  it('Deve finalizar um pedido existente', async () => {
    const requestId = 'req1';
    requests[requestId] = { status: 'ongoing' };

    const startTime = new Date(Date.now() - 1000 * 60 * 60); // Uma hora atrás
    getDocument.mockResolvedValue({ startTime, tripId: 'trip1' });

    const response = await request(app).post(`/requests/${requestId}/finish`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Corrida finalizada');
    expect(updateDocument).toHaveBeenCalledWith('races', requestId, expect.any(Object));
  });
});
