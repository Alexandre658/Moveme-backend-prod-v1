import { Router } from 'express';
import trackingRoutes from './tracking.routes.js';
import requestRoutes from './request.routes.js';
import notificationRoutes from './notification.routes.js';
import authRoutes from './auth.routes.js'; 
import peakHourRoutes from './peakHour.routes.js';
import emailRoutes from './email.routes.js';
import storageRoutes from './storage.routes.js';

const router = Router();

router.use('/trackings', trackingRoutes);
router.use('/requests', requestRoutes);
router.use('/notifications', notificationRoutes);
router.use('/auth', authRoutes);
router.use('/peak-hour', peakHourRoutes);
router.use('/api/email', emailRoutes);
router.use('/api/storage', storageRoutes);

export default router;
