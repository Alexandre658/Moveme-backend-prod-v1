import express from 'express';
import storageController from '../controllers/storage.controller.js';
import storageService from '../services/storage.service.js';
import path from 'path';

const router = express.Router();

// Servir arquivos estáticos da pasta uploads
router.use('/uploads', express.static('uploads'));

// Rota para upload de arquivo
router.post('/upload', storageService.getUploadMiddleware(), storageController.uploadFile);

// Rota para deletar arquivo
router.delete('/:filePath', storageController.deleteFile);

// Rota para obter informações do arquivo
router.get('/info/:filePath', storageController.getFileInfo);

export default router; 