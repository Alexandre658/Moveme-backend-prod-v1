import { sendPushNotification, sendBulkPushNotification } from '../services/notificationService.js';

export const sendNotificationToSingleDevice = async (req, res) => {
  const { token, title, body, data } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({ error: 'Token, título e corpo são obrigatórios' });
  }

  try {
    const response = await sendPushNotification(token, title, body, data);
    res.status(200).json({ message: 'Notificação enviada com sucesso', response });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao enviar a notificação', details: error.message });
  }
};

export const sendNotificationToMultipleDevices = async (req, res) => {
  const { tokens, title, body, data } = req.body;

  if (!tokens || !title || !body) {
    return res.status(400).json({ error: 'Tokens, título e corpo são obrigatórios' });
  }

  try {
    const response = await sendBulkPushNotification(tokens, title, body, data);
    res.status(200).json({ message: 'Notificações enviadas com sucesso', response });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao enviar as notificações', details: error.message });
  }
};
