import express from 'express';
import { PeakHourController } from '../controllers/peak_hour.controller.js';
import firebaseConfig from '../config/firebaseConfig.js';

const router = express.Router();

// Function to initialize the controller
const initializeController = async () => {
    // Ensure Firebase is initialized
    await firebaseConfig();
    
    // Create and initialize the controller
    const peakHourController = new PeakHourController();
    await peakHourController.initialize();
    
    // Configure routes
    router.get('/status', peakHourController.getPeakStatus);
    router.post('/config', peakHourController.updatePeakHourConfig);
    router.delete('/config', peakHourController.removePeakHourConfig);
    
    // Vehicle class routes
    router.get('/vehicle-classes', peakHourController.getAllVehicleClasses);
    router.get('/vehicle-classes/:id', peakHourController.getVehicleClass);
    router.post('/vehicle-classes', peakHourController.updateVehicleClass);
    router.delete('/vehicle-classes/:id', peakHourController.removeVehicleClass);
};

// Initialize the controller
initializeController().catch(error => {
    console.error('Error initializing controller:', error);
});

export default router; 