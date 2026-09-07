import type { PaymentStatus } from '@/types/payment';

export function paymentStatusBadgeVariant(
  status: PaymentStatus,
): 'success' | 'warning' | 'danger' {
  if (status === 'PAID') return 'success';
  if (status === 'PENDING') return 'warning';
  return 'danger';
}
