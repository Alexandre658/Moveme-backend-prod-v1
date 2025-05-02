import { Router } from 'express';
import { enviarCodigo, verificarCodigoInserido, adicionarTelefone,sendAccessCodeEmailController, verificarCodigoTelefoneController, adicionarEmail, verificarCodigEmail } from '../controllers/auth.controller.js';
import apiKeyMiddleware from '../middlewares/apiKeyMiddleware.js';
const router = Router();

/**
 * @swagger
 * /auth/enviar-codigo:
 *   post:
 *     summary: Enviar código de verificação via SMS.
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               telefone:
 *                 type: string
 *                 example: "+244999999999"
 *               chave_entidade:
 *                 type: string
 *                 example: "sua_chave_entidade"
 *     responses:
 *       200:
 *         description: Código de verificação enviado com sucesso.
 *       400:
 *         description: Parâmetros faltando.
 *       500:
 *         description: Erro ao enviar o código.
 */
router.post('/enviar-codigo', apiKeyMiddleware, enviarCodigo);

/**
 * @swagger
 * /auth/verificar-codigo:
 *   post:
 *     summary: Verificar código de verificação.
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               telefone:
 *                 type: string
 *                 example: "+244999999999"
 *               codigo:  
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Código verificado com sucesso.
 *       400:
 *         description: Código incorreto ou expirado.
 *       500:
 *         description: Erro ao verificar o código.
 */
router.post('/verificar-codigo', apiKeyMiddleware, verificarCodigoInserido);


// Rota para adicionar ou atualizar o telefone e enviar código de verificação
router.post('/telefone/adicionar', apiKeyMiddleware, adicionarTelefone);

// Rota para verificar o código de verificação do telefone
router.post('/telefone/verificar', apiKeyMiddleware, verificarCodigoTelefoneController);

// Rota para adicionar ou atualizar o email e enviar código de verificação
router.post('/email/update-email', apiKeyMiddleware, adicionarEmail);

// Rota para enviar código de verificação para o email
router.post('/email/send-access-code', apiKeyMiddleware, sendAccessCodeEmailController);

// Rota para verificar o código de verificação do email
router.post('/email/verify-access-code', apiKeyMiddleware, verificarCodigEmail);

export default router;
