import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'));

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number');

const optionalPhoneSchema = z.string().trim().optional().or(z.literal(''));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerAdminSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: emailSchema,
  password: passwordSchema,
  phone: optionalPhoneSchema,
});
export type RegisterAdminFormValues = z.infer<typeof registerAdminSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['admin', 'manager', 'resident']),
  phone: optionalPhoneSchema,
});
export type CreateUserFormValues = z.infer<typeof createUserSchema>;

const optionalEmailSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
    message: 'Enter a valid email address',
  });

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((value) => !value || /^https?:\/\/\S+$/i.test(value), {
    message: 'Enter a valid image URL (starting with http:// or https://)',
  });

export const residentSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
    gender: z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
    dateOfBirth: z.string().optional().or(z.literal('')),
    address: z.string().trim().max(300).optional().or(z.literal('')),
    emergencyContactName: z.string().trim().max(100).optional().or(z.literal('')),
    emergencyContactPhone: z.string().trim().max(20).optional().or(z.literal('')),
    emergencyContactRelation: z.string().trim().max(50).optional().or(z.literal('')),
    college: z.string().trim().max(150).optional().or(z.literal('')),
    course: z.string().trim().max(150).optional().or(z.literal('')),
    studentId: z.string().trim().max(50).optional().or(z.literal('')),
    profileImage: optionalUrlSchema,
  })
  .refine((data) => !data.emergencyContactPhone || Boolean(data.emergencyContactName), {
    message: 'Required when a phone is given',
    path: ['emergencyContactName'],
  })
  .refine((data) => !data.emergencyContactName || Boolean(data.emergencyContactPhone), {
    message: 'Required when a name is given',
    path: ['emergencyContactPhone'],
  });
export type ResidentFormValues = z.infer<typeof residentSchema>;
