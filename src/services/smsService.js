import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// URL base da API
const API_URL = 'https://www.telcosms.co.ao/send_message';

/**
 * Enviar um SMS para o destinatário.
 * @param {string} destinatario - Número de telefone do destinatário (ex: +244999999999).
 * @param {string} descricaoSms - Texto da mensagem que será enviada.
 */
export const sendSMS = async (destinatario, descricaoSms) => {
  try { 
    const chaveEntidade = process.env.CHAVE_ENTIDADE;
    
    if (!chaveEntidade) {
      throw new Error('Chave da entidade não encontrada nas variáveis de ambiente');
    }

    console.log('Tentando enviar SMS com os seguintes dados:', {
      destinatario,
      descricaoSms,
      url: API_URL
    });

    const data = {
      message: {
        api_key_app: chaveEntidade,
        phone_number: destinatario,
        message_body: descricaoSms
      }
    };
    
    console.log('Payload da requisição:', JSON.stringify(data, null, 2));
    
    const config = {
      method: 'post',
      url: API_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      data: data
    };

    console.log('Iniciando requisição para a API de SMS...');
    const response = await axios(config);
    console.log('Resposta da API de SMS:', JSON.stringify(response.data, null, 2)); 

    if (response.data && response.status === 200) {
      console.log('SMS enviado com sucesso!');
      return { success: true, data: response.data };
    } else {
      console.log('Falha no envio do SMS. Status:', response.status);
      return { success: false, error: 'Falha no envio do SMS' };
    }
    
  } catch (error) {
    console.error('Erro detalhado ao enviar SMS:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
};

/**
 * Consultar saldo da conta NetSMS.
 * @param {string} telefone - Telefone do usuário da API.
 * @param {string} senha - Senha da conta da API.
 */
export const consultarSaldo = async (telefone, senha) => {
  try {
    const response = await axios.get(`${API_URL}?accao=consultar-saldo&telefone=${telefone}&senha=${senha}`);

    if (response.data && response.data.status === 'sucesso') {
      return { success: true, saldo: response.data.saldo };
    } else {
      return { success: false, error: 'Falha ao consultar saldo' };
    }
  } catch (error) {
    console.error('Erro ao consultar saldo:', error);
    return { success: false, error: error.message };
  }
};
