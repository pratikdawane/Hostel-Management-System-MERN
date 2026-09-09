import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Like Complaints, all three roles may authenticate in here — a Resident is scoped to their
// own data inside dashboard.service.ts, not blocked at the route level.
router.use(protect);

router.get('/', dashboardController.getDashboard);

export default router;
