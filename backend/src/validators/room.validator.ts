import { z } from 'zod';
import { ROOM_TYPES, ROOM_STATUSES, MAX_ROOM_CAPACITY } from '../constants/room.js';
import { objectIdSchema } from './common.validator.js';

const optionalTrimmed = (max: number) =>
  z
    .union([z.string().trim().max(max), z.null()])
    .optional()
    .transform((value) => (value ? value : undefined));

export const createRoomSchema = z.object({
  roomNumber: z.string().trim().min(1, 'Room number is required').max(20),
  floor: z.coerce.number().int('Floor must be a whole number'),
  type: z.enum(ROOM_TYPES),
  capacity: z.coerce
    .number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(MAX_ROOM_CAPACITY, `Capacity cannot exceed ${MAX_ROOM_CAPACITY}`),
  monthlyRent: z.coerce.number().min(0, 'Monthly rent cannot be negative'),
  description: optionalTrimmed(500),
});

export const updateRoomSchema = createRoomSchema.partial().extend({
  status: z.enum(['AVAILABLE', 'MAINTENANCE']).optional(),
});

export const listRoomsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((value) => (value ? value : undefined)),
  floor: z.coerce.number().int().optional(),
  status: z.enum(ROOM_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const roomIdParamSchema = z.object({
  id: objectIdSchema,
});

export const roomIdRouteParamSchema = z.object({
  roomId: objectIdSchema,
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type ListRoomsQuery = z.infer<typeof listRoomsQuerySchema>;
