import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  createPaymentSchema,
  listPaymentsQuerySchema,
  paymentIdParamSchema,
} from '../validators/payment.validator.js';

const router = Router();

// Every route below is Admin/Manager-only, matching Allocations — managers record payments too.
router.use(protect, authorize('admin', 'manager'));

// Static sub-paths must be declared before the /:id route.
router.get('/dues', paymentController.getDues);
router.get('/stats', paymentController.getPaymentStats);

router.post('/', validate(createPaymentSchema), paymentController.createPayment);
router.get('/', validate(listPaymentsQuerySchema, 'query'), paymentController.listPayments);
router.get(
  '/:id',
  validate(paymentIdParamSchema, 'params'),
  paymentController.getPaymentById,
);

export default router;
