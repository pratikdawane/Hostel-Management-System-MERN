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

export interface PaymentResident {
  id: string;
  name: string;
}

export interface PaymentAllocation {
  id: string;
  roomNumber?: string;
  bedLabel?: string;
}

export interface Payment {
  id: string;
  resident: PaymentResident | null;
  allocation: PaymentAllocation | null;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  transactionId?: string;
  type: PaymentType;
  status: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPayments {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePaymentInput {
  residentId: string;
  allocationId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  transactionId?: string;
  type: PaymentType;
  status: PaymentStatus;
  notes?: string;
}

export interface DueItem {
  allocationId: string;
  residentId: string;
  residentName: string;
  roomNumber?: string;
  bedLabel?: string;
  monthlyRent: number;
  checkInDate: string;
  monthsDue: number;
  expectedRent: number;
  paidRent: number;
  amountDue: number;
  securityDeposit: number;
  securityDepositPaid: number;
}

export interface DuesSummary {
  dues: DueItem[];
  totalDue: number;
}

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
}

export interface PaymentStats {
  monthlyRevenue: number;
  totalOutstanding: number;
  monthlyTrend: MonthlyRevenuePoint[];
}
