import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, BedDouble, Loader2, UserRound, Wallet } from 'lucide-react';
import { paymentSchema, type PaymentFormValues } from '@/lib/schemas';
import * as paymentService from '@/services/paymentService';
import * as residentService from '@/services/residentService';
import * as allocationService from '@/services/allocationService';
import type { Resident } from '@/types/resident';
import type { Allocation } from '@/types/allocation';
import type { CreatePaymentInput } from '@/types/payment';
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_TYPES,
  PAYMENT_TYPE_LABELS,
} from '@/types/payment';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SearchPicker } from '@/components/ui/SearchPicker';
import { getErrorMessage } from '@/utils/errors';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

interface NavigationState {
  residentId?: string;
  residentName?: string;
}

export function PaymentForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as NavigationState | null) ?? null;

  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [activeAllocation, setActiveAllocation] = useState<Allocation | null>(null);
  const [isLoadingAllocation, setIsLoadingAllocation] = useState(false);
  const [allocationChecked, setAllocationChecked] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      paymentDate: todayIsoDate(),
      method: 'CASH',
      type: 'RENT',
      status: 'PAID',
      transactionId: '',
      notes: '',
    },
  });

  const type = watch('type');

  const fetchResidents = useCallback(async (query: string) => {
    const result = await residentService.listResidents({ q: query || undefined, limit: 8 });
    return result.residents;
  }, []);

  useEffect(() => {
    if (!navState?.residentId) return;
    residentService
      .getResident(navState.residentId)
      .then((resident) => setSelectedResident(resident))
      .catch(() => {
        // Fall back to manual search if the resident lookup fails.
      });
  }, [navState]);

  useEffect(() => {
    if (!selectedResident) {
      setActiveAllocation(null);
      setAllocationChecked(false);
      return undefined;
    }

    let cancelled = false;
    setIsLoadingAllocation(true);
    setAllocationChecked(false);

    allocationService
      .listAllocations({ residentId: selectedResident.id, status: 'ACTIVE', limit: 1 })
      .then((result) => {
        if (cancelled) return;
        setActiveAllocation(result.allocations[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setActiveAllocation(null);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingAllocation(false);
          setAllocationChecked(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedResident]);

  useEffect(() => {
    if (!activeAllocation || amountTouched) return;
    const suggested = type === 'SECURITY_DEPOSIT' ? activeAllocation.securityDeposit : activeAllocation.monthlyRent;
    setValue('amount', suggested);
  }, [activeAllocation, type, amountTouched, setValue]);

  const onSubmit = async (values: PaymentFormValues) => {
    setSubmitAttempted(true);
    if (!selectedResident || !activeAllocation) {
      return;
    }

    try {
      const payload: CreatePaymentInput = {
        residentId: selectedResident.id,
        allocationId: activeAllocation.id,
        amount: values.amount,
        paymentDate: values.paymentDate,
        method: values.method,
        type: values.type,
        status: values.status,
        transactionId: values.transactionId || undefined,
        notes: values.notes || undefined,
      };
      await paymentService.createPayment(payload);
      toast.success(`Payment recorded for ${selectedResident.name}`);
      navigate('/payments');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not record payment'));
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_200ms_ease]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="cursor-pointer rounded-full p-2 text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Record payment</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Resident</h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <SearchPicker
              label="Resident"
              placeholder="Search residents by name, email, or student ID"
              icon={UserRound}
              fetchOptions={fetchResidents}
              getId={(resident) => resident.id}
              getLabel={(resident) => resident.name}
              getSubLabel={(resident) => resident.email || resident.phone || 'No contact on file'}
              selected={selectedResident}
              onSelect={(resident) => {
                setSelectedResident(resident);
                setAmountTouched(false);
              }}
              onClear={() => {
                setSelectedResident(null);
                setAmountTouched(false);
              }}
              error={submitAttempted && !selectedResident ? 'Select a resident' : undefined}
            />

            {selectedResident && isLoadingAllocation && (
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Looking up their current allocation...
              </p>
            )}

            {selectedResident && allocationChecked && !isLoadingAllocation && !activeAllocation && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" strokeWidth={1.8} />
                This resident has no active room allocation — a payment cannot be recorded until
                they're allocated a room.
              </div>
            )}

            {activeAllocation && (
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <BedDouble className="h-4 w-4" strokeWidth={1.8} />
                </div>
                <p className="text-sm text-gray-700">
                  {activeAllocation.room ? `Room ${activeAllocation.room.roomNumber}` : 'Room —'}
                  {activeAllocation.bed ? ` · Bed ${activeAllocation.bed.label}` : ''} · Rent ₹
                  {activeAllocation.monthlyRent.toLocaleString('en-IN')}/month
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Payment details</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Amount (₹)"
              type="number"
              min={0}
              step="0.01"
              leftIcon={<Wallet className="h-4 w-4" strokeWidth={1.8} />}
              error={errors.amount?.message}
              {...register('amount', {
                valueAsNumber: true,
                onChange: () => setAmountTouched(true),
              })}
            />
            <Input
              label="Payment date"
              type="date"
              max={todayIsoDate()}
              error={errors.paymentDate?.message}
              {...register('paymentDate')}
            />
            <Select label="Method" error={errors.method?.message} {...register('method')}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </option>
              ))}
            </Select>
            <Select label="Type" error={errors.type?.message} {...register('type')}>
              {PAYMENT_TYPES.map((paymentType) => (
                <option key={paymentType} value={paymentType}>
                  {PAYMENT_TYPE_LABELS[paymentType]}
                </option>
              ))}
            </Select>
            <Select label="Status" error={errors.status?.message} {...register('status')}>
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PAYMENT_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
            <Input
              label="Transaction ID (optional)"
              placeholder="UPI ref / bank ref number"
              error={errors.transactionId?.message}
              {...register('transactionId')}
            />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Notes (optional)
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-shadow duration-150 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                placeholder="Any additional context for this payment"
                {...register('notes')}
              />
              {errors.notes?.message && (
                <p className="mt-1.5 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!activeAllocation}>
            Record payment
          </Button>
        </div>
      </form>
    </div>
  );
}
