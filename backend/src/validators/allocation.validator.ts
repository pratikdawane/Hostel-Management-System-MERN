import { z } from 'zod';
import { ALLOCATION_STATUSES } from '../constants/allocation.js';
import { objectIdSchema } from './common.validator.js';

export const createAllocationSchema = z
  .object({
    residentId: objectIdSchema,
    roomId: objectIdSchema,
    bedId: objectIdSchema,
    checkInDate: z.coerce.date(),
    expectedCheckOutDate: z.coerce.date().optional(),
    monthlyRent: z.coerce.number().min(0, 'Monthly rent cannot be negative'),
    securityDeposit: z.coerce.number().min(0, 'Security deposit cannot be negative'),
  })
  .refine(
    (data) => !data.expectedCheckOutDate || data.expectedCheckOutDate > data.checkInDate,
    {
      message: 'Expected check-out date must be after the check-in date',
      path: ['expectedCheckOutDate'],
    },
  );

export const listAllocationsQuerySchema = z.object({
  status: z.enum(ALLOCATION_STATUSES).optional(),
  roomId: objectIdSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const allocationIdParamSchema = z.object({
  id: objectIdSchema,
});

export type CreateAllocationInput = z.infer<typeof createAllocationSchema>;
export type ListAllocationsQuery = z.infer<typeof listAllocationsQuerySchema>;
