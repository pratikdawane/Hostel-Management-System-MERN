import { z } from 'zod';
import { ROLES } from '../constants/roles.js';
import { emailSchema, mobileSchema, passwordSchema, objectIdSchema } from './common.validator.js';

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(ROLES),
  phone: mobileSchema.optional(),
});

export const listUsersQuerySchema = z.object({
  role: z.enum(ROLES).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const userIdParamSchema = z.object({
  id: objectIdSchema,
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
