import request from 'supertest';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import storageRoutes from '../routes/storage.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use('/storage', storageRoutes);

describe('Storage Service Tests', () => {
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    let uploadedFilePath;
    let uploadedFileUrl;

    beforeAll(async () => {
        // Criar uma imagem de teste JPEG válida
        const testImage = Buffer.from([
            0xff, 0xd8, // SOI marker
            0xff, 0xe0, // APP0 marker
            0x00, 0x10, // Length of APP0 segment
            0x4a, 0x46, 0x49, 0x46, 0x00, // JFIF identifier
            0x01, 0x01, // Version
            0x00, // Units
            0x00, 0x01, // X density
            0x00, 0x01, // Y density
            0x00, 0x00, // Thumbnail
            0xff, 0xd9  // EOI marker
        ]);
        await fs.writeFile(testImagePath, testImage);
    });

    afterAll(async () => {
        // Limpar arquivos de teste
        try {
            await fs.unlink(testImagePath);
            if (uploadedFilePath) {
                await fs.unlink(uploadedFilePath);
            }
        } catch (error) {
            console.error('Error cleaning up test files:', error);
        }
    });

    test('should upload an image file and return URL', async () => {
        const response = await request(app)
            .post('/storage/upload')
            .attach('file', testImagePath);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.path).toBeDefined();
        expect(response.body.url).toBeDefined();
        expect(response.body.url).toMatch(/^http:\/\/.*\/uploads\/.*/);
        
        uploadedFilePath = response.body.path;
        uploadedFileUrl = response.body.url;
    });

    test('should get file info with URL', async () => {
        const response = await request(app)
            .get(`/storage/info/${path.basename(uploadedFilePath)}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.info).toBeDefined();
        expect(response.body.info.size).toBeDefined();
        expect(response.body.url).toBeDefined();
        expect(response.body.url).toBe(uploadedFileUrl);
    });

    test('should access uploaded file through URL', async () => {
        const fileUrl = new URL(uploadedFileUrl);
        const response = await request(app).get(fileUrl.pathname);
        expect(response.status).toBe(200);
    });

    test('should delete file', async () => {
        const response = await request(app)
            .delete(`/storage/${path.basename(uploadedFilePath)}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
}); 