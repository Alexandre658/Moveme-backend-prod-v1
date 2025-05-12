import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

class StorageService {
    constructor() {
        // Configurar o armazenamento
        this.storage = multer.diskStorage({
            destination: async (req, file, cb) => {
                const uploadDir = 'uploads/';
                try {
                    await fs.mkdir(uploadDir, { recursive: true });
                    cb(null, uploadDir);
                } catch (error) {
                    cb(error);
                }
            },
            filename: (req, file, cb) => {
                const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
                cb(null, uniqueName);
            }
        });

        // Configurar o upload
        this.upload = multer({
            storage: this.storage,
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
            fileFilter: (req, file, cb) => {
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
                if (allowedTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error('Tipo de arquivo não suportado'));
                }
            }
        });
    }

    async processImage(filePath, options = {}) {
        try {
            const { width = 800, height = 600, quality = 80 } = options;
            const processedPath = filePath.replace(/\.[^/.]+$/, '_processed.jpg');
            
            // Verificar se o arquivo existe antes de processar
            await fs.access(filePath);
            
            const image = sharp(filePath);
            const metadata = await image.metadata();
            
            if (!metadata) {
                throw new Error('Arquivo de imagem inválido');
            }

            await image
                .resize(width, height, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality })
                .toFile(processedPath);

            // Remover arquivo original
            await fs.unlink(filePath);
            
            return {
                success: true,
                path: processedPath
            };
        } catch (error) {
            console.error('Error processing image:', error);
            // Se houver erro no processamento, manter o arquivo original
            return {
                success: true,
                path: filePath,
                warning: 'Não foi possível processar a imagem, mantendo arquivo original'
            };
        }
    }

    async deleteFile(filePath) {
        try {
            await fs.access(filePath);
            await fs.unlink(filePath);
            return {
                success: true,
                message: 'Arquivo deletado com sucesso'
            };
        } catch (error) {
            console.error('Error deleting file:', error);
            return {
                success: false,
                error: 'Arquivo não encontrado ou não pode ser deletado'
            };
        }
    }

    async getFileInfo(filePath) {
        try {
            await fs.access(filePath);
            const stats = await fs.stat(filePath);
            return {
                success: true,
                info: {
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                }
            };
        } catch (error) {
            console.error('Error getting file info:', error);
            return {
                success: false,
                error: 'Arquivo não encontrado'
            };
        }
    }

    getUploadMiddleware() {
        return this.upload.single('file');
    }
}

export default new StorageService(); 