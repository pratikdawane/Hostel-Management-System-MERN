import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import residentRoutes from './resident.routes.js';
import roomRoutes from './room.routes.js';
import bedRoutes from './bed.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/residents', residentRoutes);
router.use('/rooms', roomRoutes);
router.use('/beds', bedRoutes);

export default router;
