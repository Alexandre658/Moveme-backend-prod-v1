import { authService } from '../services/authService.js';

/**
 * Enviar o código de verificação para o número de telefone.
 */
export const enviarCodigo = async (req, res) => {
  const { telefone } = req.body;

  if (!telefone ) {
    return res.status(400).json({ error: 'Telefone e chave da entidade são obrigatórios' });
  }

  try {
    const resultado = await authService.sendVerificationCode(telefone);
    if (resultado.success) {
      res.status(200).json({ message: resultado.message });
    } else {
      res.status(500).json({ error: resultado.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar código de verificação' });
  }
};

/**
 * Verificar o código de verificação inserido pelo usuário.
 */
export const verificarCodigoInserido = async (req, res) => {
  const { telefone, codigo } = req.body;

  if (!telefone || !codigo) {
    return res.status(400).json({ error: 'Telefone e código são obrigatórios' });
  }

  try {
    const resultado = await authService.verifyCode(telefone, codigo);

    if (resultado.success) {
      res.status(200).json({ resultado });
    } else {
      res.status(400).json({ error: resultado.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar o código' });
  }
};


/**
 * Controller para adicionar ou atualizar o e-mail do usuário e enviar o código de verificação.
 * @param {Object} req - Objeto de requisição HTTP.
 * @param {Object} res - Objeto de resposta HTTP.
 */
export const adicionarEmail = async (req, res) => {
  const { uid, email } = req.body;

  // Validação básica dos parâmetros
  if (!uid || !email) {
    return res.status(400).json({ success: false, error: 'UID e e-mail são necessários.' });
  }

  try {
    // Chama o serviço para adicionar o e-mail e enviar o código de verificação
    const resultado = await authService.addEmailWithVerification(uid, email);

    if (resultado.success) {
      return res.status(200).json({ success: true, message: resultado.message });
    } else {
      return res.status(500).json({ success: false, error: resultado.error });
    }
  } catch (error) {
    console.error('Erro no controller ao adicionar e-mail:', error);
    return res.status(500).json({ success: false, error: 'Erro ao adicionar e-mail.' });
  }
};

/**
 * Controller para verificar o código de verificação do e-mail.
 * @param {Object} req - Objeto de requisição HTTP.
 * @param {Object} res - Objeto de resposta HTTP.
 */
export const verificarCodigEmail = async (req, res) => {
  const { email, codigo } = req.body;

  // Validação básica dos parâmetros
  if (!email || !codigo) {
    return res.status(400).json({ success: false, error: 'E-mail e código são necessários.' });
  }

  try {
    // Chama o serviço para verificar o código de verificação
    const resultado = await authService.verifyEmailCode(email, codigo);

    if (resultado.success) {
      return res.status(200).json({ success: true, message: resultado.message, token: resultado.token, user: resultado.user`` });
    } else {
      return res.status(400).json({ success: false, error: resultado.error });
    }
  } catch (error) {
    console.error('Erro no controller ao verificar código:', error);
    return res.status(500).json({ success: false, error: 'Erro ao verificar o código de verificação.' });
  }
};

/**
 * Controller para adicionar ou atualizar o telefone do usuário e enviar o código de verificação por SMS.
 * @param {Object} req - Objeto de requisição HTTP.
 * @param {Object} res - Objeto de resposta HTTP.
 */
export const adicionarTelefone = async (req, res) => {
  const { uid, telefone, chaveEntidade } = req.body;

  // Validação básica dos parâmetros
  if (!uid || !telefone || !chaveEntidade) {
    return res.status(400).json({ success: false, error: 'UID, telefone e chave da entidade são necessários.' });
  }

  try {
    // Chama o serviço para adicionar o telefone e enviar o código de verificação
    const resultado = await authService.addPhoneWithVerification(uid, telefone, chaveEntidade);

    if (resultado.success) {
      return res.status(200).json({ success: true, message: resultado.message });
    } else {
      return res.status(500).json({ success: false, error: resultado.error });
    }
  } catch (error) {
    console.error('Erro no controller ao adicionar telefone:', error);
    return res.status(500).json({ success: false, error: 'Erro ao adicionar telefone.' });
  }
};

/**
 * Controller para verificar o código de verificação do telefone.
 * @param {Object} req - Objeto de requisição HTTP.
 * @param {Object} res - Objeto de resposta HTTP.
 */
export const verificarCodigoTelefoneController = async (req, res) => {
  const { telefone, codigo } = req.body;

  // Validação básica dos parâmetros
  if (!telefone || !codigo) {
    return res.status(400).json({ success: false, error: 'Telefone e código são necessários.' });
  }

  try {
    // Chama o serviço para verificar o código de verificação do telefone
    const resultado = await authService.verifyPhoneCode(telefone, codigo);

    if (resultado.success) {
      return res.status(200).json({ success: true, message: resultado.message });
    } else {
      return res.status(400).json({ success: false, error: resultado.error });
    }
  } catch (error) {
    console.error('Erro no controller ao verificar código do telefone:', error);
    return res.status(500).json({ success: false, error: 'Erro ao verificar o código de verificação.' });
  }
};