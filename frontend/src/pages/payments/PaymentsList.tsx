import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleDollarSign, Plus, Receipt } from 'lucide-react';
import * as paymentService from '@/services/paymentService';
import type { DueItem, Payment, PaymentStatus, PaymentType } from '@/types/payment';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
} from '@/types/payment';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';
import { getErrorMessage } from '@/utils/errors';
import { paymentStatusBadgeVariant } from '@/utils/payment';

const PAGE_SIZE = 10;

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleDateString() : '—';
}

function formatCurrency(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function DuesCard() {
  const navigate = useNavigate();
  const [dues, setDues] = useState<DueItem[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    paymentService
      .getDues()
      .then((result) => {
        if (cancelled) return;
        setDues(result.dues);
        setTotalDue(result.totalDue);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err, 'Failed to load outstanding dues'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-1 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <CircleDollarSign className="h-4.5 w-4.5" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Outstanding dues</h2>
            <p className="text-xs text-gray-500">Who owes what, as of today</p>
          </div>
        </div>
        {!isLoading && !error && (
          <p className="text-sm font-semibold text-gray-900">
            Total due: <span className="text-primary-700">{formatCurrency(totalDue)}</span>
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3 p-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      ) : dues.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-sm text-gray-500">No active allocations yet — nothing is due.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-6 py-3">Resident</th>
                <th className="px-6 py-3">Room / Bed</th>
                <th className="px-6 py-3 text-right">Months due</th>
                <th className="px-6 py-3 text-right">Expected</th>
                <th className="px-6 py-3 text-right">Paid</th>
                <th className="px-6 py-3 text-right">Amount due</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dues.map((due) => (
                <tr key={due.allocationId} className="transition-colors duration-150 hover:bg-gray-50/60">
                  <td className="px-6 py-3.5 font-medium text-gray-900">{due.residentName}</td>
                  <td className="px-6 py-3.5 text-gray-600">
                    {due.roomNumber
                      ? `Room ${due.roomNumber}${due.bedLabel ? ` · Bed ${due.bedLabel}` : ''}`
                      : '—'}
                  </td>
                  <td className="px-6 py-3.5 text-right text-gray-600">{due.monthsDue}</td>
                  <td className="px-6 py-3.5 text-right text-gray-600">
                    {formatCurrency(due.expectedRent)}
                  </td>
                  <td className="px-6 py-3.5 text-right text-gray-600">
                    {formatCurrency(due.paidRent)}
                  </td>
                  <td
                    className={`px-6 py-3.5 text-right font-semibold ${
                      due.amountDue > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {due.amountDue > 0 ? formatCurrency(due.amountDue) : 'Settled'}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate('/payments/new', {
                          state: { residentId: due.residentId, residentName: due.residentName },
                        })
                      }
                    >
                      Record payment
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function PaymentsList() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<PaymentType | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(
    async (signal?: { cancelled: boolean }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await paymentService.listPayments({
          page,
          limit: PAGE_SIZE,
          status: statusFilter || undefined,
          type: typeFilter || undefined,
        });
        if (signal?.cancelled) return;
        setPayments(result.payments);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (err) {
        if (signal?.cancelled) return;
        setError(getErrorMessage(err, 'Failed to load payments'));
      } finally {
        if (!signal?.cancelled) setIsLoading(false);
      }
    },
    [page, statusFilter, typeFilter],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    void fetchPayments(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [fetchPayments]);

  const hasActiveFilters = Boolean(statusFilter || typeFilter);

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_200ms_ease]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} payment{total === 1 ? '' : 's'} recorded
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" strokeWidth={1.8} />}
          onClick={() => navigate('/payments/new')}
        >
          Record payment
        </Button>
      </div>

      <DuesCard />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="w-full sm:w-48">
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as PaymentStatus | '');
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <Select
            aria-label="Filter by type"
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value as PaymentType | '');
              setPage(1);
            }}
          >
            <option value="">All types</option>
            {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col gap-3 p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-gray-500">{error}</p>
            <Button variant="outline" onClick={() => void fetchPayments()}>
              Try again
            </Button>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Receipt className="h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="text-sm text-gray-500">
              {hasActiveFilters ? 'No payments match your filter' : 'No payments recorded yet'}
            </p>
            {!hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => navigate('/payments/new')}
              >
                Record your first payment
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3">Resident</th>
                  <th className="px-6 py-3">Room / Bed</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="transition-colors duration-150 hover:bg-gray-50/60">
                    <td className="px-6 py-3.5 font-medium text-gray-900">
                      {payment.resident?.name ?? '—'}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {payment.allocation?.roomNumber
                        ? `Room ${payment.allocation.roomNumber}${
                            payment.allocation.bedLabel ? ` · Bed ${payment.allocation.bedLabel}` : ''
                          }`
                        : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">{formatDate(payment.paymentDate)}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {PAYMENT_METHOD_LABELS[payment.method]}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">{PAYMENT_TYPE_LABELS[payment.type]}</td>
                    <td className="px-6 py-3.5">
                      <Badge variant={paymentStatusBadgeVariant(payment.status)}>
                        {PAYMENT_STATUS_LABELS[payment.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
