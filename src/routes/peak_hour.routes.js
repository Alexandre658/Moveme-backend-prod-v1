import express from 'express';
import { PeakHourController } from '../controllers/peak_hour.controller.js';
import firebaseConfig from '../config/firebaseConfig.js';

const router = express.Router();

// Função para inicializar o controlador
const initializeController = async () => {
    // Garantir que o Firebase está inicializado
    await firebaseConfig();
    
    // Criar e inicializar o controlador
    const peakHourController = new PeakHourController();
    await peakHourController.initialize();
    
    // Configurar as rotas
    router.get('/status', peakHourController.getPeakStatus);
    router.post('/config', peakHourController.updatePeakHourConfig);
    router.delete('/config', peakHourController.removePeakHourConfig);
    
    // Rotas de classes de veículo
    router.get('/vehicle-classes', peakHourController.getAllVehicleClasses);
    router.get('/vehicle-classes/:id', peakHourController.getVehicleClass);
    router.post('/vehicle-classes', peakHourController.updateVehicleClass);
    router.delete('/vehicle-classes/:id', peakHourController.removeVehicleClass);
};

// Inicializar o controlador
initializeController().catch(error => {
    console.error('Erro ao inicializar o controlador:', error);
});

export default router; 