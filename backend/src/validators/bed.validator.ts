import { z } from 'zod';
import { objectIdSchema } from './common.validator.js';

export const createBedSchema = z.object({
  label: z.string().trim().min(1, 'Bed label is required').max(10),
});

// Occupancy (`status: 'OCCUPIED'`, `residentId`) is exclusively written by Feature 5 (Room
// Allocation) — this update endpoint only ever toggles a bed between available and maintenance.
export const updateBedSchema = z.object({
  label: z.string().trim().min(1, 'Bed label is required').max(10).optional(),
  status: z.enum(['AVAILABLE', 'MAINTENANCE']).optional(),
});

export const bedIdParamSchema = z.object({
  id: objectIdSchema,
});

export type CreateBedInput = z.infer<typeof createBedSchema>;
export type UpdateBedInput = z.infer<typeof updateBedSchema>;
