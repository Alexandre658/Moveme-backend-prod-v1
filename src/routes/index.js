import { Router } from 'express';
import trackingRoutes from './tracking.routes.js';
import requestRoutes from './request.routes.js';
import notificationRoutes from './notification.routes.js';
import authRoutes from './auth.routes.js'; 
import peakHourRoutes from './peak_hour.routes.js';
import emailRoutes from './emailRoutes.js';

const router = Router();

router.use('/trackings', trackingRoutes);
router.use('/requests', requestRoutes);
router.use('/notifications', notificationRoutes);
router.use('/auth', authRoutes);
router.use('/peak-hour', peakHourRoutes);
router.use('/api/email', emailRoutes);

export default router;
