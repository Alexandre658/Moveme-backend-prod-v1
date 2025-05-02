/**
 * Interface for Transaction Service
 */
export class ITransactionService {
  /**
   * Creates a new transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} - Created transaction
   */
  async createTransaction(transactionData) {
    throw new Error('Method not implemented');
  }

  /**
   * Gets a transaction by ID
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} - Transaction data
   */
  async getTransaction(transactionId) {
    throw new Error('Method not implemented');
  }

  /**
   * Updates a transaction
   * @param {string} transactionId - Transaction ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated transaction
   */
  async updateTransaction(transactionId, updateData) {
    throw new Error('Method not implemented');
  }

  /**
   * Gets transactions by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of transactions
   * @param {number} options.offset - Number of transactions to skip
   * @returns {Promise<Object[]>} - List of transactions
   */
  async getTransactionsByUser(userId, { limit, offset } = {}) {
    throw new Error('Method not implemented');
  }
} 