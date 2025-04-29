import { Router } from 'express';
import authMiddleware from '../middlewares/apiKeyMiddleware.js';
import { createRequest, acceptRequest, denyRequest, finishRequest, arrivedRequest, startTheRaceRequest,cancelRace } from '../controllers/request.controller.js';

const router = Router();

router.post('/', createRequest);
router.post('/:requestId/accept', acceptRequest);
router.post('/:requestId/deny', denyRequest);
router.post('/:requestId/cancel', cancelRace); 
router.post('/:requestId/finish', authMiddleware, (req, res) =>  finishRequest(req, res));
router.post('/:requestId/arrived', arrivedRequest);
router.post('/:requestId/startTheRace', startTheRaceRequest);


export default router;


