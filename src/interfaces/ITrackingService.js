/**
 * Interface for Tracking Service
 */
export class ITrackingService {
  /**
   * Starts tracking a ride
   * @param {string} rideId - Ride ID
   * @param {Object} location - Initial location
   * @param {number} location.latitude - Latitude
   * @param {number} location.longitude - Longitude
   * @returns {Promise<{success: boolean, trackingId?: string, error?: string}>}
   */
  async startTracking(rideId, location) {
    throw new Error('Method not implemented');
  }

  /**
   * Updates ride location
   * @param {string} rideId - Ride ID
   * @param {Object} location - New location
   * @param {number} location.latitude - Latitude
   * @param {number} location.longitude - Longitude
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateLocation(rideId, location) {
    throw new Error('Method not implemented');
  }

  /**
   * Stops tracking a ride
   * @param {string} rideId - Ride ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async stopTracking(rideId) {
    throw new Error('Method not implemented');
  }

  /**
   * Gets current location of a ride
   * @param {string} rideId - Ride ID
   * @returns {Promise<{success: boolean, location?: Object, error?: string}>}
   */
  async getCurrentLocation(rideId) {
    throw new Error('Method not implemented');
  }
} 