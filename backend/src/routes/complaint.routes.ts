import { Router } from 'express';
import * as complaintController from '../controllers/complaint.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  createComplaintSchema,
  listComplaintsQuerySchema,
  updateComplaintSchema,
  complaintIdParamSchema,
} from '../validators/complaint.validator.js';

const router = Router();

// Unlike every prior module, all three roles may authenticate in here — a Resident is scoped to
// their own complaints inside the service layer, not blocked at the route level.
router.use(protect);

router.post('/', validate(createComplaintSchema), complaintController.createComplaint);
router.get('/', validate(listComplaintsQuerySchema, 'query'), complaintController.listComplaints);
// Must come before "/:id" so "stats" isn't parsed as an id.
router.get('/stats', complaintController.getComplaintStats);
router.get(
  '/:id',
  validate(complaintIdParamSchema, 'params'),
  complaintController.getComplaintById,
);
router.put(
  '/:id',
  authorize('admin', 'manager'),
  validate(complaintIdParamSchema, 'params'),
  validate(updateComplaintSchema),
  complaintController.updateComplaint,
);
router.delete(
  '/:id',
  authorize('admin', 'manager'),
  validate(complaintIdParamSchema, 'params'),
  complaintController.deleteComplaint,
);

export default router;
