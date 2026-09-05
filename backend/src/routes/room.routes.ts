import { Router } from 'express';
import * as roomController from '../controllers/room.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  createRoomSchema,
  listRoomsQuerySchema,
  roomIdParamSchema,
  roomIdRouteParamSchema,
  updateRoomSchema,
} from '../validators/room.validator.js';
import { createBedSchema } from '../validators/bed.validator.js';

const router = Router();

// Every route below is Admin/Manager-only, per FR-4.
router.use(protect, authorize('admin', 'manager'));

router.post('/', validate(createRoomSchema), roomController.createRoom);
router.get('/', validate(listRoomsQuerySchema, 'query'), roomController.listRooms);
// Must come before "/:id" so "stats" isn't parsed as an id.
router.get('/stats', roomController.getRoomStats);
router.get(
  '/:roomId/beds',
  validate(roomIdRouteParamSchema, 'params'),
  roomController.listRoomBeds,
);
router.post(
  '/:roomId/beds',
  validate(roomIdRouteParamSchema, 'params'),
  validate(createBedSchema),
  roomController.createRoomBed,
);
router.get('/:id', validate(roomIdParamSchema, 'params'), roomController.getRoomById);
router.put(
  '/:id',
  validate(roomIdParamSchema, 'params'),
  validate(updateRoomSchema),
  roomController.updateRoom,
);
router.delete('/:id', validate(roomIdParamSchema, 'params'), roomController.deleteRoom);

export default router;
