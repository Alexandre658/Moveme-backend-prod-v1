import express from 'express';
import storageController from '../controllers/storage.controller.js';
import storageService from '../services/storage.service.js';
import path from 'path';
import { fileURLToPath } from 'url';
import apiKeyMiddleware from '../middlewares/apiKeyMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Servir arquivos estáticos da pasta uploads (público, sem API key)
router.use('/uploads', express.static('uploads'));

// Rota de teste simples (público, sem API key)
router.get('/test', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Teste de Upload</title>
        </head>
        <body>
            <h1>Teste de Upload</h1>
            <form action="/api/storage/upload" method="post" enctype="multipart/form-data">
                <input type="file" name="file">
                <button type="submit">Enviar</button>
            </form>
        </body>
        </html>
    `);
});

// Middleware de API key para as outras rotas
router.use(apiKeyMiddleware);

// Rota para upload de arquivo (requer API key)
router.post('/upload', storageService.getUploadMiddleware(), storageController.uploadFile);

// Rota para deletar arquivo (requer API key)
router.delete('/:filePath', storageController.deleteFile);

// Rota para obter informações do arquivo (requer API key)
router.get('/info/:filePath', storageController.getFileInfo);

export default router; 