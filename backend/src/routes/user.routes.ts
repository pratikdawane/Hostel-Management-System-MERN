import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  createUserSchema,
  listUsersQuerySchema,
  userIdParamSchema,
  updateUserStatusSchema,
} from '../validators/user.validator.js';

const router = Router();

// Every route below is Admin-only: Admins are the only role that creates/manages accounts.
router.use(protect, authorize('admin'));

router.post('/', validate(createUserSchema), userController.createUser);
router.get('/', validate(listUsersQuerySchema, 'query'), userController.listUsers);
router.patch(
  '/:id/status',
  validate(userIdParamSchema, 'params'),
  validate(updateUserStatusSchema),
  userController.updateUserStatus,
);

export default router;
