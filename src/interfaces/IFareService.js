/**
 * Interface for Fare Service
 */
export class IFareService {
  /**
   * Calculates the total fare for a ride
   * @param {number} distance - Distance in kilometers
   * @param {number} duration - Duration in minutes
   * @param {Object} options - Options object
   * @param {Object} options.vehicleCateg - Vehicle category object
   * @param {number} options.vehicleCateg.basePrice - Base price
   * @param {number} options.vehicleCateg.basePricePerKm - Price per kilometer
   * @param {number} options.vehicleCateg.basePriceMin - Price per minute
   * @returns {number} - Total fare rounded to nearest 50
   */
  calculateFare(distance, duration, { vehicleCateg }) {
    throw new Error('Method not implemented');
  }

  /**
   * Calculates driver's balance after commission
   * @param {number} rideAmount - Total ride amount
   * @param {number} discountRate - Commission rate (0-1)
   * @returns {number} - Driver's balance after commission
   */
  calculateDriverBalance(rideAmount, discountRate) {
    throw new Error('Method not implemented');
  }
} 