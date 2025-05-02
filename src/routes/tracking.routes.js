import { Router } from 'express';
import { createTracking, getAllTrackings, getTrackingById, updateTracking, deleteTracking } from '../controllers/tracking.controller.js';

const router = Router();

/**
 * @swagger
 * /trackings:
 *   post:
 *     summary: Create or update a vehicle tracking.
 *     tags: [Tracking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "123"
 *               created:
 *                 type: string
 *                 example: "2024-01-01T00:00:00Z"
 *               startTime:
 *                 type: string
 *                 example: "2024-01-01T00:10:00Z"
 *               endTime:
 *                 type: string
 *                 example: "2024-01-01T01:00:00Z"
 *               status:
 *                 type: string
 *                 example: "active"
 *               position:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: -8.837
 *                   longitude:
 *                     type: number
 *                     example: 13.234
 *               vehicle:
 *                 type: string
 *                 example: "Vehicle1"
 *               classVehicle:
 *                 type: string
 *                 example: "Car"
 *     responses:
 *       201:
 *         description: Tracking created or updated successfully.
 *       400:
 *         description: Missing required parameters.
 *       500:
 *         description: Error creating or updating tracking.
 */
router.post('/', createTracking);

/**
 * @swagger
 * /trackings:
 *   get:
 *     summary: Get all trackings.
 *     tags: [Tracking]
 *     responses:
 *       200:
 *         description: List of all trackings.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 123: 
 *                   id: "123"
 *                   created: "2024-01-01T00:00:00Z"
 *                   startTime: "2024-01-01T00:10:00Z"
 *                   endTime: "2024-01-01T01:00:00Z"
 *                   status: "active"
 *                   position:
 *                     latitude: -8.837
 *                     longitude: 13.234
 *                   vehicle: "Vehicle1"
 *                   classVehicle: "Car"
 *       500:
 *         description: Error getting trackings.
 */
router.get('/', getAllTrackings);

/**
 * @swagger
 * /trackings/{id}:
 *   get:
 *     summary: Get a tracking by ID.
 *     tags: [Tracking]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Tracking ID
 *     responses:
 *       200:
 *         description: Tracking found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: "123"
 *                 created: "2024-01-01T00:00:00Z"
 *                 startTime: "2024-01-01T00:10:00Z"
 *                 endTime: "2024-01-01T01:00:00Z"
 *                 status: "active"
 *                 position:
 *                   latitude: -8.837
 *                   longitude: 13.234
 *                 vehicle: "Vehicle1"
 *                 classVehicle: "Car"
 *       404:
 *         description: Tracking not found.
 *       500:
 *         description: Error getting tracking.
 */
router.get('/:id', getTrackingById);

/**
 * @swagger
 * /trackings/{id}:
 *   put:
 *     summary: Update a tracking by ID.
 *     tags: [Tracking]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the tracking to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               created:
 *                 type: string
 *                 example: "2024-01-01T00:00:00Z"
 *               startTime:
 *                 type: string
 *                 example: "2024-01-01T00:10:00Z"
 *               endTime:
 *                 type: string
 *                 example: "2024-01-01T01:00:00Z"
 *               status:
 *                 type: string
 *                 example: "active"
 *               position:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: -8.837
 *                   longitude:
 *                     type: number
 *                     example: 13.234
 *               vehicle:
 *                 type: string
 *                 example: "Vehicle1"
 *     responses:
 *       200:
 *         description: Tracking updated successfully.
 *       404:
 *         description: Tracking not found.
 *       400:
 *         description: Missing required parameters.
 *       500:
 *         description: Error updating tracking.
 */
router.put('/:id', updateTracking);

/**
 * @swagger
 * /trackings/{id}:
 *   delete:
 *     summary: Delete a tracking by ID.
 *     tags: [Tracking]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the tracking to delete
 *     responses:
 *       200:
 *         description: Tracking deleted successfully.
 *       404:
 *         description: Tracking not found.
 *       500:
 *         description: Error deleting tracking.
 */
router.delete('/:id', deleteTracking);

export default router;
