export const PAYMENT_METHODS = ['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'OTHER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank transfer',
  CARD: 'Card',
  OTHER: 'Other',
};

export const PAYMENT_TYPES = ['RENT', 'SECURITY_DEPOSIT', 'OTHER'] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  RENT: 'Rent',
  SECURITY_DEPOSIT: 'Security deposit',
  OTHER: 'Other',
};

export const PAYMENT_STATUSES = ['PAID', 'PENDING', 'FAILED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAID: 'Paid',
  PENDING: 'Pending',
  FAILED: 'Failed',
};
