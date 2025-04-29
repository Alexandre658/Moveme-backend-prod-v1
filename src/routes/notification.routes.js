import { Router } from 'express';
import { sendNotificationToSingleDevice, sendNotificationToMultipleDevices } from '../controllers/notification.controller.js';

const router = Router();

/**
 * @swagger
 * /notifications/send:
 *   post:
 *     summary: Enviar uma notificação push para um único dispositivo.
 *     tags: [Notificações]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: "seu_token_fcm_aqui"
 *               title:
 *                 type: string
 *                 example: "Nova mensagem!"
 *               body:
 *                 type: string
 *                 example: "Você tem uma nova notificação."
 *               data:
 *                 type: object
 *                 example: { "url": "https://meusite.com" }
 *     responses:
 *       200:
 *         description: Notificação enviada com sucesso.
 *       400:
 *         description: Parâmetros faltando.
 *       500:
 *         description: Erro ao enviar a notificação.
 */
router.post('/send', sendNotificationToSingleDevice);

/**
 * @swagger
 * /notifications/send-bulk:
 *   post:
 *     summary: Enviar notificações push para múltiplos dispositivos.
 *     tags: [Notificações]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tokens:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["token1", "token2"]
 *               title:
 *                 type: string
 *                 example: "Nova mensagem para todos!"
 *               body:
 *                 type: string
 *                 example: "Você tem uma nova notificação."
 *               data:
 *                 type: object
 *                 example: { "url": "https://meusite.com" }
 *     responses:
 *       200:
 *         description: Notificações enviadas com sucesso.
 *       400:
 *         description: Parâmetros faltando.
 *       500:
 *         description: Erro ao enviar as notificações.
 */
router.post('/send-bulk', sendNotificationToMultipleDevices);

export default router;
