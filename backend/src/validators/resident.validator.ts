import { z } from 'zod';
import { RESIDENT_STATUSES, GENDERS } from '../constants/residentStatus.js';
import { emailSchema, objectIdSchema } from './common.validator.js';

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? value : undefined));

const optionalEmail = emailSchema
  .optional()
  .or(z.literal(''))
  .transform((value) => (value ? value : undefined));

const dateOfBirthSchema = z.coerce
  .date()
  .max(new Date(), 'Date of birth cannot be in the future')
  .optional();

const emergencyContactSchema = z.object({
  name: z.string().trim().min(2, 'Emergency contact name is required').max(100),
  phone: z.string().trim().min(7, 'Emergency contact phone is required').max(20),
  relation: optionalTrimmed(50),
});

export const createResidentSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: optionalEmail,
  phone: optionalTrimmed(20),
  gender: z.enum(GENDERS).optional(),
  dateOfBirth: dateOfBirthSchema,
  address: optionalTrimmed(300),
  emergencyContact: emergencyContactSchema.optional(),
  college: optionalTrimmed(150),
  course: optionalTrimmed(150),
  studentId: optionalTrimmed(50),
  profileImage: z
    .url('Invalid image URL')
    .max(2048)
    .optional()
    .or(z.literal(''))
    .transform((value) => (value ? value : undefined)),
});

export const updateResidentSchema = createResidentSchema.partial().extend({
  status: z.enum(RESIDENT_STATUSES).optional(),
  userId: objectIdSchema.nullable().optional(),
});

export const listResidentsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => (value ? value : undefined)),
  status: z.enum(RESIDENT_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const residentIdParamSchema = z.object({
  id: objectIdSchema,
});

export type CreateResidentInput = z.infer<typeof createResidentSchema>;
export type UpdateResidentInput = z.infer<typeof updateResidentSchema>;
export type ListResidentsQuery = z.infer<typeof listResidentsQuerySchema>;
