import { api } from './api';
import type { ApiEnvelope } from '@/types/api';
import type {
  CreatePaymentInput,
  DuesSummary,
  PaginatedPayments,
  Payment,
  PaymentMethod,
  PaymentStats,
  PaymentStatus,
  PaymentType,
} from '@/types/payment';

export interface ListPaymentsParams {
  residentId?: string;
  allocationId?: string;
  status?: PaymentStatus;
  type?: PaymentType;
  method?: PaymentMethod;
  page?: number;
  limit?: number;
}

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  const { data } = await api.post<ApiEnvelope<{ payment: Payment }>>('/payments', input);
  return data.data.payment;
}

export async function listPayments(params: ListPaymentsParams = {}): Promise<PaginatedPayments> {
  const { data } = await api.get<ApiEnvelope<PaginatedPayments>>('/payments', { params });
  return data.data;
}

export async function getPayment(id: string): Promise<Payment> {
  const { data } = await api.get<ApiEnvelope<{ payment: Payment }>>(`/payments/${id}`);
  return data.data.payment;
}

export async function getDues(): Promise<DuesSummary> {
  const { data } = await api.get<ApiEnvelope<DuesSummary>>('/payments/dues');
  return data.data;
}

export async function getPaymentStats(): Promise<PaymentStats> {
  const { data } = await api.get<ApiEnvelope<PaymentStats>>('/payments/stats');
  return data.data;
}
