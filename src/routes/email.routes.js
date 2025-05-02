import express from 'express';
import { emailService } from '../services/emailService.js';
import apiKeyMiddleware from '../middlewares/apiKeyMiddleware.js';

const router = express.Router();

// Middleware para proteger todas as rotas com API Key
router.use(apiKeyMiddleware);

/**
 * @swagger
 * /api/email/welcome:
 *   post:
 *     summary: Envia email de boas-vindas
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email do destinatário
 *               name:
 *                 type: string
 *                 description: Nome do destinatário
 */
router.post('/welcome', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email e nome são obrigatórios' });
    }
    const result = await emailService.sendWelcomeEmail(email, name);
    res.json({ success: true, message: 'Email de boas-vindas enviado com sucesso', result });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar email de boas-vindas', details: error.message });
  }
});

/**
 * @swagger
 * /api/email/password-reset:
 *   post:
 *     summary: Envia email de redefinição de senha
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - resetToken
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email do destinatário
 *               resetToken:
 *                 type: string
 *                 description: Token de redefinição de senha
 */
router.post('/password-reset', async (req, res) => {
  try {
    const { email, resetToken } = req.body;
    if (!email || !resetToken) {
      return res.status(400).json({ error: 'Email e token são obrigatórios' });
    }
    const result = await emailService.sendPasswordResetEmail(email, resetToken);
    res.json({ success: true, message: 'Email de redefinição de senha enviado com sucesso', result });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar email de redefinição de senha', details: error.message });
  }
});

/**
 * @swagger
 * /api/email/password-changed:
 *   post:
 *     summary: Envia email de confirmação de alteração de senha
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email do destinatário
 *               name:
 *                 type: string
 *                 description: Nome do destinatário
 */
router.post('/password-changed', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email e nome são obrigatórios' });
    }
    const result = await emailService.sendPasswordChangedEmail(email, name);
    res.json({ success: true, message: 'Email de confirmação de alteração de senha enviado com sucesso', result });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar email de confirmação de alteração de senha', details: error.message });
  }
});

/**
 * @swagger
 * /api/email/access-code:
 *   post:
 *     summary: Envia email com código de acesso
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email do destinatário
 *               name:
 *                 type: string
 *                 description: Nome do destinatário
 *               code:
 *                 type: string
 *                 description: Código de acesso
 */
router.post('/access-code', async (req, res) => {
  try {
    const { email, name, code } = req.body;
    if (!email || !name || !code) {
      return res.status(400).json({ error: 'Email, nome e código são obrigatórios' });
    }
    const result = await emailService.sendAccessCodeEmail(email, name, code);
    res.json({ success: true, message: 'Email com código de acesso enviado com sucesso', result });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar email com código de acesso', details: error.message });
  }
});

/**
 * @swagger
 * /api/email/ride-receipt:
 *   post:
 *     summary: Envia email com recibo da viagem
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - rideData
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email do destinatário
 *               rideData:
 *                 type: object
 *                 description: Dados da viagem
 */
router.post('/ride-receipt', async (req, res) => {
  try {
    const { email, rideData } = req.body;
    if (!email || !rideData) {
      return res.status(400).json({ error: 'Email e dados da viagem são obrigatórios' });
    }
    const result = await emailService.sendRideReceiptEmail(email, rideData);
    res.json({ success: true, message: 'Email com recibo da viagem enviado com sucesso', result });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar email com recibo da viagem', details: error.message });
  }
});

/**
 * @swagger
 * /api/email/verification:
 *   post:
 *     summary: Envia email de verificação
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email do destinatário
 *               code:
 *                 type: string
 *                 description: Código de verificação
 */
router.post('/verification', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email e código são obrigatórios' });
    }
    const result = await emailService.enviarEmailVerificacao(email, code);
    res.json({ success: true, message: 'Email de verificação enviado com sucesso', result });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar email de verificação', details: error.message });
  }
});

/**
 * @swagger
 * /api/email/marketing:
 *   post:
 *     summary: Envia email de marketing
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - users
 *               - campaign
 *             properties:
 *               users:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                 description: Lista de usuários
 *               campaign:
 *                 type: object
 *                 properties:
 *                   subject:
 *                     type: string
 *                   content:
 *                     type: string
 *                 description: Dados da campanha
 */
router.post('/marketing', async (req, res) => {
  try {
    const { users, campaign } = req.body;
    if (!users || !campaign || !campaign.subject || !campaign.content) {
      return res.status(400).json({ error: 'Usuários e dados da campanha são obrigatórios' });
    }
    const result = await emailService.sendMarketingEmail(users, campaign);
    res.json({ success: true, message: 'Email de marketing enviado com sucesso', result });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar email de marketing', details: error.message });
  }
});

/**
 * @swagger
 * /api/email/custom:
 *   post:
 *     summary: Envia email personalizado
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - content
 *             properties:
 *               to:
 *                 type: string
 *                 description: Email do destinatário
 *               subject:
 *                 type: string
 *                 description: Assunto do email
 *               content:
 *                 type: string
 *                 description: Conteúdo do email em HTML
 */
router.post('/custom', async (req, res) => {
  try {
    const { to, subject, content } = req.body;
    if (!to || !subject || !content) {
      return res.status(400).json({ error: 'Destinatário, assunto e conteúdo são obrigatórios' });
    }
    const result = await emailService.sendCustomEmail(to, subject, content);
    res.json({ success: true, message: 'Email personalizado enviado com sucesso', result });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar email personalizado', details: error.message });
  }
});

/**
 * @swagger
 * /api/email/password-reset-notification:
 *   post:
 *     summary: Envia email de notificação de redefinição de senha
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email do destinatário
 *               name:
 *                 type: string
 *                 description: Nome do destinatário
 */
router.post('/password-reset-notification', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email e nome são obrigatórios' });
    }
    const result = await emailService.sendPasswordResetNotificationEmail(email, name);
    res.json({ success: true, message: 'Email de notificação de redefinição de senha enviado com sucesso', result });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar email de notificação de redefinição de senha', details: error.message });
  }
});

export default router; 