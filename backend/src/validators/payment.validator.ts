import { z } from 'zod';
import { PAYMENT_METHODS, PAYMENT_STATUSES, PAYMENT_TYPES } from '../constants/payment.js';
import { objectIdSchema } from './common.validator.js';

export const createPaymentSchema = z.object({
  residentId: objectIdSchema,
  allocationId: objectIdSchema,
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  paymentDate: z.coerce.date().max(new Date(), 'Payment date cannot be in the future'),
  method: z.enum(PAYMENT_METHODS),
  transactionId: z.string().trim().max(100).optional(),
  type: z.enum(PAYMENT_TYPES),
  status: z.enum(PAYMENT_STATUSES).default('PAID'),
  notes: z.string().trim().max(500).optional(),
});

export const listPaymentsQuerySchema = z.object({
  residentId: objectIdSchema.optional(),
  allocationId: objectIdSchema.optional(),
  status: z.enum(PAYMENT_STATUSES).optional(),
  type: z.enum(PAYMENT_TYPES).optional(),
  method: z.enum(PAYMENT_METHODS).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const paymentIdParamSchema = z.object({
  id: objectIdSchema,
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
