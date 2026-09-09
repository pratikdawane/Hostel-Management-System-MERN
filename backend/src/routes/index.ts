import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import residentRoutes from './resident.routes.js';
import roomRoutes from './room.routes.js';
import bedRoutes from './bed.routes.js';
import allocationRoutes from './allocation.routes.js';
import paymentRoutes from './payment.routes.js';
import complaintRoutes from './complaint.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/residents', residentRoutes);
router.use('/rooms', roomRoutes);
router.use('/beds', bedRoutes);
router.use('/allocations', allocationRoutes);
router.use('/payments', paymentRoutes);
router.use('/complaints', complaintRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
