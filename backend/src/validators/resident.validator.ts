import { z } from 'zod';
import { RESIDENT_STATUSES, GENDERS } from '../constants/residentStatus.js';
import { emailSchema, mobileSchema, objectIdSchema } from './common.validator.js';

// Accepts a real value, '', or null. '' and null both normalize to `undefined`
// (clear the field) once transformed. Sending `null` (rather than omitting the
// key) is what lets the *update* schema tell "leave unchanged" (key absent)
// apart from "explicitly cleared" (key present, value null) — `undefined` keys
// are dropped by JSON.stringify before they ever reach the server, but `null`
// survives, so the client must send `null` to clear a field on edit.
const optionalTrimmed = (max: number) =>
  z
    .union([z.string().trim().max(max), z.null()])
    .optional()
    .transform((value) => (value ? value : undefined));

const optionalEmail = z
  .union([emailSchema, z.literal(''), z.null()])
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalMobile = z
  .union([mobileSchema, z.literal(''), z.null()])
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalProfileImage = z
  .union([z.url('Invalid image URL').max(2048), z.literal(''), z.null()])
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalGender = z
  .enum(GENDERS)
  .nullable()
  .optional()
  .transform((value) => (value === null ? undefined : value));

// `z.null()` must come first: `z.coerce.date()` silently coerces `null` to
// the Unix epoch (`new Date(null)` === `new Date(0)`) instead of failing, so
// it would otherwise match `null` before the null branch got a chance.
const dateOfBirthSchema = z
  .union([z.null(), z.coerce.date().max(new Date(), 'Date of birth cannot be in the future')])
  .optional()
  .transform((value) => (value === null ? undefined : value));

const emergencyContactSchema = z.object({
  name: z.string().trim().min(2, 'Emergency contact name is required').max(100),
  phone: mobileSchema,
  relation: optionalTrimmed(50),
});

export const createResidentSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: optionalEmail,
  phone: optionalMobile,
  gender: optionalGender,
  dateOfBirth: dateOfBirthSchema,
  address: optionalTrimmed(300),
  emergencyContact: emergencyContactSchema.optional(),
  college: optionalTrimmed(150),
  course: optionalTrimmed(150),
  studentId: optionalTrimmed(50),
  profileImage: optionalProfileImage,
});

export const updateResidentSchema = createResidentSchema.partial().extend({
  status: z.enum(RESIDENT_STATUSES).optional(),
  userId: objectIdSchema.nullable().optional(),
  emergencyContact: emergencyContactSchema
    .nullable()
    .optional()
    .transform((value) => (value === null ? undefined : value)),
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
