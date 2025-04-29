import { PeakHourService } from '../services/peak_hour_service.js';

export class PeakHourController {
  constructor() {
    this.peakHourService = null;
  }

  async initialize() {
    this.peakHourService = await new PeakHourService().initialize();
    return this;
  }

  // Métodos de status e configuração
  getPeakStatus = async (req, res) => {
    try {
      const { country, province, municipality } = req.query;

      if (!country || !province || !municipality) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const status = await this.peakHourService.getPeakStatus(country, province, municipality);
      res.json(status);
    } catch (error) {
      console.error('Error getting peak status:', error);
      res.status(500).json({ error: 'Failed to get peak status' });
    }
  };

  updatePeakHourConfig = async (req, res) => {
    try {
      const { country, province, municipality, startTime, endTime, pricePerHour, status } = req.body;

      if (!country || !province || !municipality || !startTime || !endTime || !pricePerHour || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await this.peakHourService.updatePeakHourConfig(
        country,
        province,
        municipality,
        startTime,
        endTime,
        pricePerHour,
        status
      );

      res.json({ message: 'Peak hour configuration updated successfully' });
    } catch (error) {
      console.error('Error updating peak hour config:', error);
      res.status(500).json({ error: 'Failed to update peak hour configuration' });
    }
  };

  removePeakHourConfig = async (req, res) => {
    try {
      const { country, province, municipality } = req.query;

      if (!country || !province || !municipality) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      await this.peakHourService.removePeakHourConfig(country, province, municipality);
      res.json({ message: 'Peak hour configuration removed successfully' });
    } catch (error) {
      console.error('Error removing peak hour config:', error);
      res.status(500).json({ error: 'Failed to remove peak hour configuration' });
    }
  };

  // Métodos de classes de veículo
  getAllVehicleClasses = async (req, res) => {
    try {
      const vehicleClasses = await this.peakHourService.getAllVehicleClasses();
      res.json(vehicleClasses);
    } catch (error) {
      console.error('Error getting vehicle classes:', error);
      res.status(500).json({ error: 'Failed to get vehicle classes' });
    }
  };

  getVehicleClass = async (req, res) => {
    try {
      const { id } = req.params;
      const vehicleClass = await this.peakHourService.getVehicleClass(id);

      if (!vehicleClass) {
        return res.status(404).json({ error: 'Vehicle class not found' });
      }

      res.json(vehicleClass);
    } catch (error) {
      console.error('Error getting vehicle class:', error);
      res.status(500).json({ error: 'Failed to get vehicle class' });
    }
  };

  updateVehicleClass = async (req, res) => {
    try {
      const { id, ...vehicleClassData } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Vehicle class ID is required' });
      }

      await this.peakHourService.updateVehicleClass(id, vehicleClassData);
      res.json({ message: 'Vehicle class updated successfully' });
    } catch (error) {
      console.error('Error updating vehicle class:', error);
      res.status(500).json({ error: 'Failed to update vehicle class' });
    }
  };

  removeVehicleClass = async (req, res) => {
    try {
      const { id } = req.params;
      await this.peakHourService.removeVehicleClass(id);
      res.json({ message: 'Vehicle class removed successfully' });
    } catch (error) {
      console.error('Error removing vehicle class:', error);
      res.status(500).json({ error: 'Failed to remove vehicle class' });
    }
  };
} 