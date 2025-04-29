// FareService.js
import { log } from 'console';

class FareService {
  /**
   * Calculates the total fare for a ride.
   *
   * @param {number} distance - The distance of the ride in kilometers.
   * @param {number} duration - The duration of the ride in minutes.
   * @param {object} options - An object containing vehicle category information.
   * @param {object} options.vehicleCateg - The vehicle category object.
   * @param {number} options.vehicleCateg.basePrice - The base price of the ride.
   * @param {number} options.vehicleCateg.basePricePerKm - The price per kilometer.
   * @param {number} options.vehicleCateg.basePriceMin - The price per minute.
   * @returns {number} - The rounded total fare.
   * @throws {Error} - If vehicle category is not provided.
   */
  calculateFare(distance, duration, { vehicleCateg }) {
    if (!vehicleCateg) {
      throw new Error('Vehicle category cannot be null.');
    }
  
    const totalFare = this._calculateTotalFare(
      vehicleCateg.basePrice,
      vehicleCateg.basePricePerKm,
      vehicleCateg.basePriceMin,
      distance,
      duration
    );

    return this._roundToNearestMultiple50(totalFare);
  }

  /**
   * Calculates the total fare based on base price, distance, and duration.
   *
   * @param {number} basePrice - The base price of the ride.
   * @param {number} basePricePerKm - The price per kilometer.
   * @param {number} basePriceMin - The price per minute.
   * @param {number} distance - The distance of the ride.
   * @param {number} duration - The duration of the ride.
   * @returns {number} - The calculated total fare.
   */
  _calculateTotalFare(basePrice, basePricePerKm, basePriceMin, distance, duration) {
    return (basePrice + (basePricePerKm * distance) + (basePriceMin * duration));
  }

  /**
   * Rounds a value to the nearest multiple of 50.
   *
   * @param {number} value - The value to round.
   * @returns {number} - The rounded value.
   */
  _roundToNearestMultiple50(value) {
    return Math.ceil(value / 50) * 50;
  }

  /**
   * Calculates the driver's balance after deducting commission.
   *
   * @param {number} rideAmount - The total ride amount.
   * @param {number} discountRate - The commission discount rate (e.g., 0.2 for 20%).
   * @returns {number} - The driver's balance after commission.
   * @throws {Error} - If ride amount or discount rate is invalid.
   */
  calculateDriverBalance(rideAmount, discountRate) {
    if (rideAmount <= 0 || discountRate < 0 || discountRate > 1) {
      throw new Error('Invalid ride amount or discount rate.');
    }

    const commission = this._calculateCommission(rideAmount, discountRate);
    return rideAmount - commission;
  }

  /**
   * Calculates the commission based on the ride amount and discount rate.
   *
   * @param {number} rideAmount - The total ride amount.
   * @param {number} discountRate - The commission discount rate.
   * @returns {number} - The calculated commission.
   */
  _calculateCommission(rideAmount, discountRate) {
    return rideAmount * discountRate;
  }
}

export default FareService;