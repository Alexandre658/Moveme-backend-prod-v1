/**
 * Abstract class for authentication service
 */
export class IAuthService {
  /**
   * @param {string} phone - User's phone number
   * @param {string} entityKey - Entity key for SMS sending
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async sendVerificationCode(phone, entityKey) {
    throw new Error('Method not implemented');
  }

  /**
   * @param {string} phone - User's phone number
   * @param {string} code - Verification code
   * @returns {Promise<{success: boolean, message?: string, error?: string, token?: string, user?: object}>}
   */
  async verifyCode(phone, code) {
    throw new Error('Method not implemented');
  }

  /**
   * @param {string} uid - User ID
   * @param {string} email - User's email
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async addEmailWithVerification(uid, email) {
    throw new Error('Method not implemented');
  }

  /**
   * @param {string} email - User's email
   * @param {string} code - Verification code
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async verifyEmailCode(email, code) {
    throw new Error('Method not implemented');
  }
}