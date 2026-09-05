import { Router } from 'express';
import * as bedController from '../controllers/bed.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { bedIdParamSchema, updateBedSchema } from '../validators/bed.validator.js';

const router = Router();

// Every route below is Admin/Manager-only, per FR-4.
router.use(protect, authorize('admin', 'manager'));

router.put(
  '/:id',
  validate(bedIdParamSchema, 'params'),
  validate(updateBedSchema),
  bedController.updateBed,
);
router.delete('/:id', validate(bedIdParamSchema, 'params'), bedController.deleteBed);

export default router;
