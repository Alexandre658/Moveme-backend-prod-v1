/**
 * Interface for SMS Service
 */
export class ISmsService {
  /**
   * Sends an SMS message
   * @param {string} phone - Recipient's phone number
   * @param {string} message - Message content
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendSMS(phone, message) {
    throw new Error('Method not implemented');
  }

  /**
   * Sends a verification code via SMS
   * @param {string} phone - Recipient's phone number
   * @param {string} code - Verification code
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendVerificationCode(phone, code) {
    throw new Error('Method not implemented');
  }
} 