import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquareWarning, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import * as complaintService from '@/services/complaintService';
import type { Complaint, ComplaintPriority, ComplaintStatus } from '@/types/complaint';
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_PRIORITY_LABELS,
  COMPLAINT_STATUS_LABELS,
} from '@/types/complaint';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';
import { getErrorMessage } from '@/utils/errors';
import { complaintPriorityBadgeVariant, complaintStatusBadgeVariant } from '@/utils/complaint';

const PAGE_SIZE = 10;

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleDateString() : '—';
}

export function ComplaintsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canViewAll = user?.role === 'admin' || user?.role === 'manager';

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<ComplaintPriority | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaints = useCallback(
    async (signal?: { cancelled: boolean }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await complaintService.listComplaints({
          page,
          limit: PAGE_SIZE,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
        });
        if (signal?.cancelled) return;
        setComplaints(result.complaints);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (err) {
        if (signal?.cancelled) return;
        setError(getErrorMessage(err, 'Failed to load complaints'));
      } finally {
        if (!signal?.cancelled) setIsLoading(false);
      }
    },
    [page, statusFilter, priorityFilter],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    void fetchComplaints(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [fetchComplaints]);

  const hasActiveFilters = Boolean(statusFilter || priorityFilter);

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_200ms_ease]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Complaints</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} complaint{total === 1 ? '' : 's'} {canViewAll ? 'recorded' : 'filed by you'}
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" strokeWidth={1.8} />}
          onClick={() => navigate('/complaints/new')}
        >
          Raise complaint
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="w-full sm:w-48">
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as ComplaintStatus | '');
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {Object.entries(COMPLAINT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <Select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(event) => {
              setPriorityFilter(event.target.value as ComplaintPriority | '');
              setPage(1);
            }}
          >
            <option value="">All priorities</option>
            {Object.entries(COMPLAINT_PRIORITY_LABELS).map(([value, label]) => (
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
            <Button variant="outline" onClick={() => void fetchComplaints()}>
              Try again
            </Button>
          </div>
        ) : complaints.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <MessageSquareWarning className="h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="text-sm text-gray-500">
              {hasActiveFilters ? 'No complaints match your filter' : 'No complaints filed yet'}
            </p>
            {!hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => navigate('/complaints/new')}
              >
                Raise your first complaint
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  {canViewAll && <th className="px-6 py-3">Resident</th>}
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Priority</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Filed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {complaints.map((complaint) => (
                  <tr
                    key={complaint.id}
                    className="cursor-pointer transition-colors duration-150 hover:bg-gray-50/60"
                    onClick={() => navigate(`/complaints/${complaint.id}`)}
                  >
                    <td className="px-6 py-3.5 font-medium text-gray-900">{complaint.title}</td>
                    {canViewAll && (
                      <td className="px-6 py-3.5 text-gray-600">
                        {complaint.resident?.name ?? '—'}
                      </td>
                    )}
                    <td className="px-6 py-3.5 text-gray-600">
                      {COMPLAINT_CATEGORY_LABELS[complaint.category]}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={complaintPriorityBadgeVariant(complaint.priority)}>
                        {COMPLAINT_PRIORITY_LABELS[complaint.priority]}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={complaintStatusBadgeVariant(complaint.status)}>
                        {COMPLAINT_STATUS_LABELS[complaint.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">{formatDate(complaint.createdAt)}</td>
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
