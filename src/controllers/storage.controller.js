import storageService from '../services/storage.service.js';
import path from 'path';
import config from '../config/config.js';

class StorageController {
    async uploadFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'Nenhum arquivo enviado'
                });
            }

            const filePath = req.file.path;
            const fileType = path.extname(req.file.originalname).toLowerCase();
            const fileName = path.basename(filePath);

            // Função para gerar URL do arquivo
            const getFileUrl = (filepath) => {
                const baseUrl = config.baseUrl || `${req.protocol}://${req.get('host')}`;
                return `${baseUrl}/uploads/${path.basename(filepath)}`;
            };

            // Se for uma imagem, processa ela
            if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileType)) {
                const result = await storageService.processImage(filePath);
                return res.json({
                    ...result,
                    url: getFileUrl(result.path)
                });
            }

            // Se não for imagem, retorna o caminho e URL do arquivo
            return res.json({
                success: true,
                message: 'Arquivo salvo com sucesso',
                path: filePath,
                url: getFileUrl(filePath)
            });
        } catch (error) {
            console.error('Error in uploadFile:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao processar o upload do arquivo'
            });
        }
    }

    async deleteFile(req, res) {
        try {
            const { filePath } = req.params;
            
            if (!filePath) {
                return res.status(400).json({
                    success: false,
                    error: 'Caminho do arquivo não fornecido'
                });
            }

            const fullPath = path.join('uploads', filePath);
            const result = await storageService.deleteFile(fullPath);
            
            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.json(result);
        } catch (error) {
            console.error('Error in deleteFile:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao deletar o arquivo'
            });
        }
    }

    async getFileInfo(req, res) {
        try {
            const { filePath } = req.params;
            
            if (!filePath) {
                return res.status(400).json({
                    success: false,
                    error: 'Caminho do arquivo não fornecido'
                });
            }

            const fullPath = path.join('uploads', filePath);
            const result = await storageService.getFileInfo(fullPath);
            
            if (!result.success) {
                return res.status(404).json(result);
            }

            // Adicionar URL ao resultado
            const baseUrl = config.baseUrl || `${req.protocol}://${req.get('host')}`;
            result.url = `${baseUrl}/uploads/${path.basename(fullPath)}`;

            return res.json(result);
        } catch (error) {
            console.error('Error in getFileInfo:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao obter informações do arquivo'
            });
        }
    }
}

export default new StorageController(); 