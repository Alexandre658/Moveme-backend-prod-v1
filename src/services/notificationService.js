  
import {admMessaging} from '../config/firebaseConfig.js'

 

/**
 * Enviar notificação push para um único dispositivo.
 * @param {string} token - O token do dispositivo para o qual a notificação será enviada.
 * @param {string} title - O título da notificação.
 * @param {string} body - O corpo da notificação.
 * @param {object} [data] - Dados adicionais a serem enviados com a notificação.
 */
export const sendPushNotification = async (token, title, body, data = {}) => {
  const message = {
    notification: {
      title,
      body,
    },
    data,
    token,
  };

  try {
    const response = await admMessaging().send(message);
    console.log('Notificação enviada com sucesso:', response);
    return response;
  } catch (error) {
    console.error('Erro ao enviar a notificação:', error);
    throw error;
  }
};

/**
 * Enviar notificação push para vários dispositivos ao mesmo tempo.
 * @param {Array<string>} tokens - Lista de tokens dos dispositivos.
 * @param {string} title - O título da notificação.
 * @param {string} body - O corpo da notificação.
 * @param {object} [data] - Dados adicionais a serem enviados com a notificação.
 */
export const sendBulkPushNotification = async (tokens, title, body, data = {}) => {
  const message = {
    notification: {
      title,
      body,
    },
    data,
    tokens,
  };

  try {
    const response = await admMessaging.sendMulticast(message);
    console.log(`${response.successCount} notificações enviadas com sucesso, ${response.failureCount} falharam`);
    return response;
  } catch (error) {
    console.error('Erro ao enviar notificações:', error);
    throw error;
  }
};
