import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, Pencil, Plus, Search, Trash2, Users as UsersIcon } from 'lucide-react';
import * as residentService from '@/services/residentService';
import type { Resident, ResidentStatus } from '@/types/resident';
import { RESIDENT_STATUS_LABELS } from '@/types/resident';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getErrorMessage } from '@/utils/errors';
import { getInitials, statusBadgeVariant } from '@/utils/resident';

const PAGE_SIZE = 10;

export function ResidentsList() {
  const navigate = useNavigate();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ResidentStatus | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resident | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const fetchResidents = useCallback(
    async (signal?: { cancelled: boolean }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await residentService.listResidents({
          page,
          limit: PAGE_SIZE,
          status: statusFilter || undefined,
          q: query || undefined,
        });
        if (signal?.cancelled) return;
        setResidents(result.residents);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (err) {
        if (signal?.cancelled) return;
        setError(getErrorMessage(err, 'Failed to load residents'));
      } finally {
        if (!signal?.cancelled) setIsLoading(false);
      }
    },
    [page, statusFilter, query],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    void fetchResidents(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [fetchResidents]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await residentService.deleteResident(deleteTarget.id);
      toast.success(`${deleteTarget.name} was removed`);
      setDeleteTarget(null);
      if (residents.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        void fetchResidents();
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete resident'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_200ms_ease]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Residents</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} resident{total === 1 ? '' : 's'} in total
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" strokeWidth={1.8} />}
          onClick={() => navigate('/residents/new')}
        >
          Add resident
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="sm:max-w-xs sm:flex-1">
          <Input
            aria-label="Search residents"
            placeholder="Search by name, phone, email, or student ID"
            leftIcon={<Search className="h-4 w-4" strokeWidth={1.8} />}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as ResidentStatus | '');
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {Object.entries(RESIDENT_STATUS_LABELS).map(([value, label]) => (
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
            <Button variant="outline" onClick={() => void fetchResidents()}>
              Try again
            </Button>
          </div>
        ) : residents.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <UsersIcon className="h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="text-sm text-gray-500">
              {query || statusFilter ? 'No residents match your search' : 'No residents yet'}
            </p>
            {!query && !statusFilter && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => navigate('/residents/new')}
              >
                Add your first resident
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3">Resident</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Student ID</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {residents.map((resident) => (
                  <tr
                    key={resident.id}
                    className="cursor-pointer transition-colors duration-150 hover:bg-gray-50/60"
                    onClick={() => navigate(`/residents/${resident.id}`)}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        {resident.profileImage ? (
                          <img
                            src={resident.profileImage}
                            alt=""
                            className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
                            {getInitials(resident.name)}
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{resident.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      <div className="flex flex-col">
                        <span>{resident.phone || '—'}</span>
                        <span className="text-xs text-gray-400">{resident.email || ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">{resident.studentId || '—'}</td>
                    <td className="px-6 py-3.5">
                      <Badge variant={statusBadgeVariant(resident.status)}>
                        {RESIDENT_STATUS_LABELS[resident.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/residents/${resident.id}`)}
                          className="cursor-pointer rounded-md p-2 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700"
                          aria-label={`View ${resident.name}`}
                          title="View"
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.8} />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/residents/${resident.id}/edit`)}
                          className="cursor-pointer rounded-md p-2 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700"
                          aria-label={`Edit ${resident.name}`}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.8} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(resident)}
                          className="cursor-pointer rounded-md p-2 text-gray-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${resident.name}`}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                        </button>
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
        isOpen={deleteTarget !== null}
        title="Delete resident"
        description={`Remove ${deleteTarget?.name ?? 'this resident'}'s record? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
