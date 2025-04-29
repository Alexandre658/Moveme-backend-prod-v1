import { Router } from 'express';
import { createTracking, getAllTrackings, getTrackingById, updateTracking, deleteTracking } from '../controllers/tracking.controller.js';

const router = Router();

/**
 * @swagger
 * /trackings:
 *   post:
 *     summary: Criar ou atualizar um rastreamento de veículo.
 *     tags: [Rastreamento]
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
 *         description: Tracking criado ou atualizado com sucesso.
 *       400:
 *         description: Parâmetros obrigatórios faltando.
 *       500:
 *         description: Erro ao criar ou atualizar o tracking.
 */
router.post('/', createTracking);

/**
 * @swagger
 * /trackings:
 *   get:
 *     summary: Obter todos os rastreamentos.
 *     tags: [Rastreamento]
 *     responses:
 *       200:
 *         description: Lista de todos os rastreamentos.
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
 *         description: Erro ao obter os rastreamentos.
 */
router.get('/', getAllTrackings);

/**
 * @swagger
 * /trackings/{id}:
 *   get:
 *     summary: Obter um rastreamento por ID.
 *     tags: [Rastreamento]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do rastreamento
 *     responses:
 *       200:
 *         description: Rastreamento encontrado.
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
 *         description: Rastreamento não encontrado.
 *       500:
 *         description: Erro ao obter o rastreamento.
 */
router.get('/:id', getTrackingById);

/**
 * @swagger
 * /trackings/{id}:
 *   put:
 *     summary: Atualizar um rastreamento por ID.
 *     tags: [Rastreamento]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do rastreamento a ser atualizado
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
 *         description: Rastreamento atualizado com sucesso.
 *       404:
 *         description: Rastreamento não encontrado.
 *       400:
 *         description: Parâmetros obrigatórios faltando.
 *       500:
 *         description: Erro ao atualizar o rastreamento.
 */
router.put('/:id', updateTracking);

/**
 * @swagger
 * /trackings/{id}:
 *   delete:
 *     summary: Deletar um rastreamento por ID.
 *     tags: [Rastreamento]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do rastreamento a ser deletado
 *     responses:
 *       200:
 *         description: Rastreamento deletado com sucesso.
 *       404:
 *         description: Rastreamento não encontrado.
 *       500:
 *         description: Erro ao deletar o rastreamento.
 */
router.delete('/:id', deleteTracking);

export default router;
