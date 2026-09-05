import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ClipboardList, Plus, XCircle } from 'lucide-react';
import * as allocationService from '@/services/allocationService';
import type { Allocation, AllocationStatus } from '@/types/allocation';
import { ALLOCATION_STATUS_LABELS } from '@/types/allocation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getErrorMessage } from '@/utils/errors';
import { allocationStatusBadgeVariant } from '@/utils/allocation';

const PAGE_SIZE = 10;

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleDateString() : '—';
}

export function AllocationsList() {
  const navigate = useNavigate();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<AllocationStatus | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Allocation | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchAllocations = useCallback(
    async (signal?: { cancelled: boolean }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await allocationService.listAllocations({
          page,
          limit: PAGE_SIZE,
          status: statusFilter || undefined,
        });
        if (signal?.cancelled) return;
        setAllocations(result.allocations);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (err) {
        if (signal?.cancelled) return;
        setError(getErrorMessage(err, 'Failed to load allocations'));
      } finally {
        if (!signal?.cancelled) setIsLoading(false);
      }
    },
    [page, statusFilter],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    void fetchAllocations(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [fetchAllocations]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      await allocationService.cancelAllocation(cancelTarget.id);
      toast.success('Allocation cancelled and bed freed up');
      setCancelTarget(null);
      void fetchAllocations();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not cancel allocation'));
    } finally {
      setIsCancelling(false);
    }
  };

  const hasActiveFilters = Boolean(statusFilter);

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_200ms_ease]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Room allocations</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} allocation{total === 1 ? '' : 's'} in total
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" strokeWidth={1.8} />}
          onClick={() => navigate('/allocations/new')}
        >
          New allocation
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="w-full sm:w-48">
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as AllocationStatus | '');
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {Object.entries(ALLOCATION_STATUS_LABELS).map(([value, label]) => (
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
            <Button variant="outline" onClick={() => void fetchAllocations()}>
              Try again
            </Button>
          </div>
        ) : allocations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <ClipboardList className="h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="text-sm text-gray-500">
              {hasActiveFilters ? 'No allocations match your filter' : 'No allocations yet'}
            </p>
            {!hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => navigate('/allocations/new')}
              >
                Create your first allocation
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
                  <th className="px-6 py-3">Check-in</th>
                  <th className="px-6 py-3">Expected check-out</th>
                  <th className="px-6 py-3 text-right">Rent</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allocations.map((allocation) => (
                  <tr key={allocation.id} className="transition-colors duration-150 hover:bg-gray-50/60">
                    <td className="px-6 py-3.5 font-medium text-gray-900">
                      {allocation.resident?.name ?? '—'}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {allocation.room
                        ? `Room ${allocation.room.roomNumber}${
                            allocation.bed ? ` · Bed ${allocation.bed.label}` : ''
                          }`
                        : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">{formatDate(allocation.checkInDate)}</td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {formatDate(allocation.expectedCheckOutDate)}
                    </td>
                    <td className="px-6 py-3.5 text-right text-gray-600">
                      ₹{allocation.monthlyRent.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={allocationStatusBadgeVariant(allocation.status)}>
                        {ALLOCATION_STATUS_LABELS[allocation.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {allocation.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => setCancelTarget(allocation)}
                            className="cursor-pointer rounded-md p-2 text-gray-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Cancel allocation for ${allocation.resident?.name ?? 'resident'}`}
                            title="Cancel allocation"
                          >
                            <XCircle className="h-4 w-4" strokeWidth={1.8} />
                          </button>
                        )}
                      </div>
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

      <ConfirmDialog
        isOpen={cancelTarget !== null}
        title="Cancel allocation"
        description={`Cancel this allocation for ${cancelTarget?.resident?.name ?? 'this resident'}? Their bed will become available again. This cannot be undone.`}
        confirmLabel="Cancel allocation"
        isLoading={isCancelling}
        onConfirm={() => void handleCancel()}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
