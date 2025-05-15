// TransactionRepository.js
import axios from 'axios';

class TransactionRepository {
  /**
   * Constructs a new TransactionRepository instance.
   *
   * @param {object} options - Configuration options.
   * @param {string} options.baseUrl - The base URL for the API.
   * @param {string} options.token - The authentication token.
   */
  constructor({ baseUrl, token }) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  /**
   * Generates headers with authentication token.
   *
   * @returns {object} - Headers object.
   */
  _headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    };
  }

  /**
   * Processes HTTP responses, throwing an error for non-200 status codes.
   *
   * @param {object} response - The Axios response object.
   * @returns {object} - The response data.
   * @throws {Error} - If the response status is not 200.
   */
  _processResponse(response) {
    if (response.status === 200) {
      return response.data;
    }
    throw new Error('Failed to load data');
  }

  /**
   * Retrieves user transactions based on type and optional date range.
   *
   * @param {string} type - The transaction type.
   * @param {object} [dateRange] - Optional date range.
   * @param {string} [dateRange.start] - Start date.
   * @param {string} [dateRange.end] - End date.
   * @returns {Promise<TransactionModel[]>} - Array of TransactionModel instances.
   * @throws {Error} - If there's an error fetching transactions.
   */
  async getTransactions(type, { start, end } = {}) {
    try {
      const params = new URLSearchParams();
      params.append('type', type);
      if (start) params.append('start', start);
      if (end) params.append('end', end);

      const response = await axios.get(`${this.baseUrl}/getTransactions`, {
        headers: this._headers(),
        params,
      });

      const data = this._processResponse(response);
      return data.transactions.map((t) => new TransactionModel(t));
    } catch (error) {
      throw new Error(`Error getting transactions: ${error.message}`);
    }
  }

  /**
   * Retrieves all transactions based on type and optional date range.
   *
   * @param {string} type - The transaction type.
   * @param {object} [dateRange] - Optional date range.
   * @param {string} [dateRange.start] - Start date.
   * @param {string} [dateRange.end] - End date.
   * @returns {Promise<TransactionModel[]>} - Array of TransactionModel instances.
   * @throws {Error} - If there's an error fetching all transactions.
   */
  async getAllTransactions(type, { start, end } = {}) {
    try {
      const params = new URLSearchParams();
      params.append('type', type);
      if (start) params.append('start', start);
      if (end) params.append('end', end);

      const response = await axios.get(`${this.baseUrl}/getAllTransactions`, {
        headers: this._headers(),
        params,
      });

      const data = this._processResponse(response);
      return data.transactions.map((t) => new TransactionModel(t));
    } catch (error) {
      throw new Error(`Error getting all transactions: ${error.message}`);
    }
  }

  /**
   * Retrieves the user's balance.
   *
   * @param {string} type - The balance type.
   * @param {object} [dateRange] - Optional date range.
   * @param {string} [dateRange.start] - Start date.
   * @param {string} [dateRange.end] - End date.
   * @returns {Promise<number>} - The user's balance.
   * @throws {Error} - If there's an error fetching the balance.
   */
  async getBalance(type, { start, end } = {}) {
    try {
      const params = new URLSearchParams();
      params.append('type', type);
      if (start) params.append('start', start);
      if (end) params.append('end', end);

      const response = await axios.get(`${this.baseUrl}/getBalance`, {
        headers: this._headers(),
        params,
      });

      const data = this._processResponse(response);
      return parseFloat(data.balance);
    } catch (error) {
      throw new Error(`Error getting balance: ${error.message}`);
    }
  }

  /**
   * Creates a new user account.
   *
   * @returns {Promise<Wallet>} - The created Wallet instance.
   * @throws {Error} - If there's an error creating the account.
   */
  async createAccount() {
    try {
      const response = await axios.post(`${this.baseUrl}/createAccount`, {}, { headers: this._headers() });
      const data = this._processResponse(response);
      return new Wallet(data.wallet);
    } catch (error) {
      throw new Error(`Error creating account: ${error.message}`);
    }
  }

  /**
   * Toggles the user account status.
   *
   * @param {boolean} active - The new account status.
   * @throws {Error} - If there's an error toggling the account status.
   */
  async toggleAccountStatus(active) {
    try {
      const response = await axios.post(`${this.baseUrl}/toggleAccountStatus`, { active }, { headers: this._headers() });
      this._processResponse(response);
    } catch (error) {
      throw new Error(`Error toggling account status: ${error.message}`);
    }
  }

  /**
   * Updates the account amount.
   *
   * @param {number} amount - The amount to update.
   * @param {string} type - The update type (e.g., 'debit', 'credit').
   * @throws {Error} - If there's an error updating the amount.
   */
  async updateAmount(amount, type, maxRetries = 3) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `${this.baseUrl}/updateAmount`, 
          { amount, type }, 
          { 
            headers: this._headers(),
            timeout: 30000 // 30 second timeout
          }
        );
        return this._processResponse(response);
      } catch (error) {
        lastError = error;
        if (error.response?.status === 503) {
          console.log(`Attempt ${attempt} failed with 503 error. Retrying...`);
          // Wait for 1 second before retrying (with exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
          continue;
        }
        // For other errors, throw immediately
        throw new Error(`Error updating amount: ${error.message}`);
      }
    }
    // If we've exhausted all retries, throw the last error
    throw new Error(`Failed to update amount after ${maxRetries} attempts. Last error: ${lastError.message}`);
  }

  /**
   * Retrieves the user's transaction history.
   *
   * @returns {Promise<TransactionModel[]>} - Array of TransactionModel instances.
   * @throws {Error} - If there's an error fetching the transaction history.
   */
  async getTransactionHistory() {
    try {
      const response = await axios.get(`${this.baseUrl}/getTransactionHistory`, { headers: this._headers() });
      const data = this._processResponse(response);
      return data.transactions.map((t) => new TransactionModel(t));
    } catch (error) {
      throw new Error(`Error getting transaction history: ${error.message}`);
    }
  }
}

// Models
class TransactionModel {
  constructor(data) {
    Object.assign(this, data);
  }
}

class Wallet {
  constructor(data) {
    Object.assign(this, data);
  }
}

export default TransactionRepository;