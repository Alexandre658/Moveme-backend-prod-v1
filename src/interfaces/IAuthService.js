/**
 * Interface para o serviço de autenticação
 * @interface IAuthService
 */
export class IAuthService {
  /**
   * Envia um código de verificação para o telefone do usuário
   * @param {string} telefone - Número de telefone do usuário
   * @param {string} chaveEntidade - Chave da API de SMS
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async enviarCodigoVerificacao(telefone, chaveEntidade) {
    throw new Error('Método não implementado');
  }

  /**
   * Verifica se o código de verificação é válido
   * @param {string} telefone - Número de telefone do usuário
   * @param {string} codigoInserido - Código inserido pelo usuário
   * @returns {Promise<{success: boolean, message?: string, error?: string, token?: string, user?: object}>}
   */
  async verificarCodigo(telefone, codigoInserido) {
    throw new Error('Método não implementado');
  }

  /**
   * Adiciona ou atualiza o email do usuário com verificação
   * @param {string} uid - ID do usuário
   * @param {string} email - Email do usuário
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async adicionarEmailComVerificacao(uid, email) {
    throw new Error('Método não implementado');
  }

  /**
   * Verifica o código de verificação do email
   * @param {string} email - Email do usuário
   * @param {string} codigoInserido - Código inserido pelo usuário
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async verificarCodigoEmail(email, codigoInserido) {
    throw new Error('Método não implementado');
  }
} 