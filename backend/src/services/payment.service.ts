import type { Types } from 'mongoose';
import { Payment, type PaymentDocument } from '../models/payment.model.js';
import { Resident, type IResident } from '../models/resident.model.js';
import { RoomAllocation } from '../models/allocation.model.js';
import type { IRoom } from '../models/room.model.js';
import type { IBed } from '../models/bed.model.js';
import { ApiError } from '../utils/ApiError.js';
import type { CreatePaymentInput, ListPaymentsQuery } from '../validators/payment.validator.js';

export async function createPayment(
  input: CreatePaymentInput,
  createdBy: string,
): Promise<PaymentDocument> {
  const [resident, allocation] = await Promise.all([
    Resident.findById(input.residentId),
    RoomAllocation.findById(input.allocationId),
  ]);

  if (!resident) {
    throw ApiError.notFound('Resident not found');
  }
  if (!allocation) {
    throw ApiError.notFound('Allocation not found');
  }
  if (String(allocation.residentId) !== String(resident._id)) {
    throw ApiError.badRequest('This allocation does not belong to the selected resident');
  }

  return Payment.create({
    residentId: resident._id,
    allocationId: allocation._id,
    amount: input.amount,
    paymentDate: input.paymentDate,
    method: input.method,
    transactionId: input.transactionId,
    type: input.type,
    status: input.status,
    notes: input.notes,
    createdBy,
  });
}

export interface PaymentListItem {
  id: string;
  resident: { id: string; name: string } | null;
  allocation: { id: string; roomNumber?: string; bedLabel?: string } | null;
  amount: number;
  paymentDate: Date;
  method: PaymentDocument['method'];
  transactionId?: string;
  type: PaymentDocument['type'];
  status: PaymentDocument['status'];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedPayments {
  payments: PaymentListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type PopulatedResident = Pick<IResident, 'name'> & { _id: Types.ObjectId };
type PopulatedAllocation = { _id: Types.ObjectId; roomId?: Pick<IRoom, 'roomNumber'> | null; bedId?: Pick<IBed, 'label'> | null };

export async function listPayments(query: ListPaymentsQuery): Promise<PaginatedPayments> {
  const filter: Record<string, unknown> = {};
  if (query.residentId) filter.residentId = query.residentId;
  if (query.allocationId) filter.allocationId = query.allocationId;
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.method) filter.method = query.method;

  const skip = (query.page - 1) * query.limit;

  const [rows, total] = await Promise.all([
    Payment.find(filter)
      .sort({ paymentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .populate<{ residentId: PopulatedResident | null }>('residentId', 'name')
      .populate<{ allocationId: PopulatedAllocation | null }>({
        path: 'allocationId',
        select: 'roomId bedId',
        populate: [
          { path: 'roomId', select: 'roomNumber' },
          { path: 'bedId', select: 'label' },
        ],
      }),
    Payment.countDocuments(filter),
  ]);

  const payments: PaymentListItem[] = rows.map((row) => ({
    id: String(row._id),
    resident: row.residentId ? { id: String(row.residentId._id), name: row.residentId.name } : null,
    allocation: row.allocationId
      ? {
          id: String(row.allocationId._id),
          roomNumber: row.allocationId.roomId?.roomNumber,
          bedLabel: row.allocationId.bedId?.label,
        }
      : null,
    amount: row.amount,
    paymentDate: row.paymentDate,
    method: row.method,
    transactionId: row.transactionId,
    type: row.type,
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  return {
    payments,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function getPaymentById(id: string): Promise<PaymentListItem> {
  const row = await Payment.findById(id)
    .populate<{ residentId: PopulatedResident | null }>('residentId', 'name')
    .populate<{ allocationId: PopulatedAllocation | null }>({
      path: 'allocationId',
      select: 'roomId bedId',
      populate: [
        { path: 'roomId', select: 'roomNumber' },
        { path: 'bedId', select: 'label' },
      ],
    });

  if (!row) {
    throw ApiError.notFound('Payment not found');
  }

  return {
    id: String(row._id),
    resident: row.residentId ? { id: String(row.residentId._id), name: row.residentId.name } : null,
    allocation: row.allocationId
      ? {
          id: String(row.allocationId._id),
          roomNumber: row.allocationId.roomId?.roomNumber,
          bedLabel: row.allocationId.bedId?.label,
        }
      : null,
    amount: row.amount,
    paymentDate: row.paymentDate,
    method: row.method,
    transactionId: row.transactionId,
    type: row.type,
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * A resident's rent cycle renews every month on the calendar day of their checkInDate
 * (checked in on the 15th -> a new month's rent is due starting the 15th of each month).
 * Returns how many such cycles have started as of `asOf`.
 */
function monthsElapsedSince(checkInDate: Date, asOf: Date): number {
  let months = (asOf.getFullYear() - checkInDate.getFullYear()) * 12 + (asOf.getMonth() - checkInDate.getMonth());
  if (asOf.getDate() >= checkInDate.getDate()) {
    months += 1;
  }
  return Math.max(months, 0);
}

export interface DueItem {
  allocationId: string;
  residentId: string;
  residentName: string;
  roomNumber?: string;
  bedLabel?: string;
  monthlyRent: number;
  checkInDate: Date;
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

type PopulatedDueResident = Pick<IResident, 'name'> & { _id: Types.ObjectId };
type PopulatedDueRoom = Pick<IRoom, 'roomNumber'> & { _id: Types.ObjectId };
type PopulatedDueBed = Pick<IBed, 'label'> & { _id: Types.ObjectId };

export async function getDues(): Promise<DuesSummary> {
  const activeAllocations = await RoomAllocation.find({ status: 'ACTIVE' })
    .populate<{ residentId: PopulatedDueResident | null }>('residentId', 'name')
    .populate<{ roomId: PopulatedDueRoom | null }>('roomId', 'roomNumber')
    .populate<{ bedId: PopulatedDueBed | null }>('bedId', 'label');

  const allocationIds = activeAllocations.map((allocation) => allocation._id);
  const paymentTotals = await Payment.aggregate<{
    _id: { allocationId: Types.ObjectId; type: string };
    total: number;
  }>([
    { $match: { allocationId: { $in: allocationIds }, status: 'PAID' } },
    { $group: { _id: { allocationId: '$allocationId', type: '$type' }, total: { $sum: '$amount' } } },
  ]);

  const totalsByAllocation = new Map<string, { rent: number; deposit: number }>();
  for (const row of paymentTotals) {
    const key = String(row._id.allocationId);
    const entry = totalsByAllocation.get(key) ?? { rent: 0, deposit: 0 };
    if (row._id.type === 'RENT') entry.rent += row.total;
    else if (row._id.type === 'SECURITY_DEPOSIT') entry.deposit += row.total;
    totalsByAllocation.set(key, entry);
  }

  const now = new Date();
  const dues: DueItem[] = activeAllocations
    .filter((allocation): allocation is typeof allocation & { residentId: PopulatedDueResident } =>
      Boolean(allocation.residentId),
    )
    .map((allocation) => {
      const monthsDue = monthsElapsedSince(allocation.checkInDate, now);
      const expectedRent = monthsDue * allocation.monthlyRent;
      const totals = totalsByAllocation.get(String(allocation._id)) ?? { rent: 0, deposit: 0 };

      return {
        allocationId: String(allocation._id),
        residentId: String(allocation.residentId._id),
        residentName: allocation.residentId.name,
        roomNumber: allocation.roomId?.roomNumber,
        bedLabel: allocation.bedId?.label,
        monthlyRent: allocation.monthlyRent,
        checkInDate: allocation.checkInDate,
        monthsDue,
        expectedRent,
        paidRent: totals.rent,
        amountDue: expectedRent - totals.rent,
        securityDeposit: allocation.securityDeposit,
        securityDepositPaid: totals.deposit,
      };
    })
    .sort((a, b) => b.amountDue - a.amountDue);

  const totalDue = dues.reduce((sum, due) => sum + Math.max(due.amountDue, 0), 0);

  return { dues, totalDue };
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

export async function getPaymentStats(): Promise<PaymentStats> {
  const now = new Date();
  const sixMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const rows = await Payment.aggregate<{
    _id: { year: number; month: number };
    total: number;
  }>([
    { $match: { status: 'PAID', paymentDate: { $gte: sixMonthsAgoStart } } },
    {
      $group: {
        _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } },
        total: { $sum: '$amount' },
      },
    },
  ]);

  const totalsByKey = new Map<string, number>();
  for (const row of rows) {
    totalsByKey.set(`${row._id.year}-${row._id.month}`, row.total);
  }

  const monthlyTrend: MonthlyRevenuePoint[] = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    return {
      month: date.toLocaleDateString(undefined, { month: 'short' }),
      revenue: totalsByKey.get(key) ?? 0,
    };
  });

  const monthlyRevenue = monthlyTrend[monthlyTrend.length - 1]?.revenue ?? 0;
  const { totalDue } = await getDues();

  return { monthlyRevenue, totalOutstanding: totalDue, monthlyTrend };
}
