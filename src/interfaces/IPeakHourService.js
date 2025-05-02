/**
 * Interface for Peak Hour Service
 */
export class IPeakHourService {
  /**
   * Initializes the service
   * @returns {Promise<IPeakHourService>}
   */
  async initialize() {
    throw new Error('Method not implemented');
  }

  /**
   * Checks if current time is within peak hours for a location
   * @param {string} country - Country code
   * @param {string} province - Province/State
   * @param {string} municipality - Municipality/City
   * @returns {boolean} - True if within peak hours
   */
  isWithinPeakHours(country, province, municipality) {
    throw new Error('Method not implemented');
  }

  /**
   * Gets peak hour status for a location
   * @param {string} country - Country code
   * @param {string} province - Province/State
   * @param {string} municipality - Municipality/City
   * @returns {Object} - Peak hour status object
   */
  getPeakStatus(country, province, municipality) {
    throw new Error('Method not implemented');
  }

  /**
   * Gets vehicle class by ID
   * @param {string} vehicleClassId - Vehicle class ID
   * @returns {Object|null} - Vehicle class object or null
   */
  getVehicleClass(vehicleClassId) {
    throw new Error('Method not implemented');
  }

  /**
   * Gets default vehicle class
   * @returns {Object|null} - Default vehicle class or null
   */
  getDefaultVehicleClass() {
    throw new Error('Method not implemented');
  }
} 