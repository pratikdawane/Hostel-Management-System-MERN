import { Router } from 'express';
import * as residentController from '../controllers/resident.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  createResidentSchema,
  listResidentsQuerySchema,
  residentIdParamSchema,
  updateResidentSchema,
} from '../validators/resident.validator.js';

const router = Router();

// Every route below is Admin/Manager-only, per FR-3.
router.use(protect, authorize('admin', 'manager'));

router.post('/', validate(createResidentSchema), residentController.createResident);
router.get('/', validate(listResidentsQuerySchema, 'query'), residentController.listResidents);
// Must come before "/:id" so "stats" isn't parsed as an id.
router.get('/stats', residentController.getResidentStats);
router.get('/:id', validate(residentIdParamSchema, 'params'), residentController.getResidentById);
router.put(
  '/:id',
  validate(residentIdParamSchema, 'params'),
  validate(updateResidentSchema),
  residentController.updateResident,
);
router.delete('/:id', validate(residentIdParamSchema, 'params'), residentController.deleteResident);

export default router;
