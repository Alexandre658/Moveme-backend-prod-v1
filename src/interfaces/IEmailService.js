/**
 * Interface for Email Service
 */
export class IEmailService {
  /**
   * Sends a welcome email to a new user
   * @param {string} email - Recipient's email address
   * @param {string} name - Recipient's name
   * @returns {Promise<void>}
   */
  async sendWelcomeEmail(email, name) {
    throw new Error('Method not implemented');
  }

  /**
   * Sends a custom email
   * @param {string} to - Recipient's email address
   * @param {string} subject - Email subject
   * @param {string} content - Email content in HTML format
   * @returns {Promise<void>}
   */
  async sendCustomEmail(to, subject, content) {
    throw new Error('Method not implemented');
  }
} 