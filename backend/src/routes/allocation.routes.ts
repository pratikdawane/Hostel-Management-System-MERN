import { Router } from 'express';
import * as allocationController from '../controllers/allocation.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  allocationIdParamSchema,
  createAllocationSchema,
  listAllocationsQuerySchema,
} from '../validators/allocation.validator.js';

const router = Router();

// Every route below is Admin/Manager-only, per FR-5.
router.use(protect, authorize('admin', 'manager'));

router.post('/', validate(createAllocationSchema), allocationController.createAllocation);
router.get(
  '/',
  validate(listAllocationsQuerySchema, 'query'),
  allocationController.listAllocations,
);
router.patch(
  '/:id/cancel',
  validate(allocationIdParamSchema, 'params'),
  allocationController.cancelAllocation,
);

export default router;
