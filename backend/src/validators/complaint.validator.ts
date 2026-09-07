import { z } from 'zod';
import { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES, COMPLAINT_STATUSES } from '../constants/complaint.js';
import { objectIdSchema } from './common.validator.js';

export const createComplaintSchema = z.object({
  residentId: objectIdSchema.optional(),
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150, 'Title is too long'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description is too long'),
  category: z.enum(COMPLAINT_CATEGORIES),
  priority: z.enum(COMPLAINT_PRIORITIES).default('MEDIUM'),
});

export const updateComplaintSchema = z
  .object({
    status: z.enum(COMPLAINT_STATUSES).optional(),
    priority: z.enum(COMPLAINT_PRIORITIES).optional(),
    assignedStaffName: z.string().trim().max(100, 'Assignee name is too long').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const listComplaintsQuerySchema = z.object({
  residentId: objectIdSchema.optional(),
  status: z.enum(COMPLAINT_STATUSES).optional(),
  priority: z.enum(COMPLAINT_PRIORITIES).optional(),
  category: z.enum(COMPLAINT_CATEGORIES).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const complaintIdParamSchema = z.object({ id: objectIdSchema });

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type UpdateComplaintInput = z.infer<typeof updateComplaintSchema>;
export type ListComplaintsQuery = z.infer<typeof listComplaintsQuerySchema>;
