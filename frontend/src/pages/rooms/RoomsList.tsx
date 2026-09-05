import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import * as roomService from '@/services/roomService';
import type { Room, RoomStatus } from '@/types/room';
import { ROOM_STATUS_LABELS, ROOM_TYPE_LABELS } from '@/types/room';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getErrorMessage } from '@/utils/errors';
import { roomStatusBadgeVariant } from '@/utils/room';

const PAGE_SIZE = 10;

export function RoomsList() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RoomStatus | ''>('');
  const [floorFilter, setFloorFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const fetchRooms = useCallback(
    async (signal?: { cancelled: boolean }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await roomService.listRooms({
          page,
          limit: PAGE_SIZE,
          status: statusFilter || undefined,
          floor: floorFilter.trim() ? Number(floorFilter) : undefined,
          q: query || undefined,
        });
        if (signal?.cancelled) return;
        setRooms(result.rooms);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (err) {
        if (signal?.cancelled) return;
        setError(getErrorMessage(err, 'Failed to load rooms'));
      } finally {
        if (!signal?.cancelled) setIsLoading(false);
      }
    },
    [page, statusFilter, floorFilter, query],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    void fetchRooms(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [fetchRooms]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await roomService.deleteRoom(deleteTarget.id);
      toast.success(`Room ${deleteTarget.roomNumber} was removed`);
      setDeleteTarget(null);
      if (rooms.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        void fetchRooms();
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete room'));
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(query || statusFilter || floorFilter);

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_200ms_ease]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Rooms &amp; beds</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} room{total === 1 ? '' : 's'} in total
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" strokeWidth={1.8} />}
          onClick={() => navigate('/rooms/new')}
        >
          Add room
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="sm:max-w-xs sm:flex-1">
          <Input
            aria-label="Search rooms"
            placeholder="Search by room number"
            leftIcon={<Search className="h-4 w-4" strokeWidth={1.8} />}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <div className="w-full sm:w-32">
          <Input
            aria-label="Filter by floor"
            type="number"
            placeholder="Floor"
            value={floorFilter}
            onChange={(event) => {
              setFloorFilter(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as RoomStatus | '');
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => (
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
            <Button variant="outline" onClick={() => void fetchRooms()}>
              Try again
            </Button>
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Building2 className="h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="text-sm text-gray-500">
              {hasActiveFilters ? 'No rooms match your search' : 'No rooms yet'}
            </p>
            {!hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => navigate('/rooms/new')}
              >
                Add your first room
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3">Room</th>
                  <th className="px-6 py-3">Floor</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Beds</th>
                  <th className="px-6 py-3 text-right">Rent</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rooms.map((room) => (
                  <tr
                    key={room.id}
                    className="cursor-pointer transition-colors duration-150 hover:bg-gray-50/60"
                    onClick={() => navigate(`/rooms/${room.id}`)}
                  >
                    <td className="px-6 py-3.5 font-medium text-gray-900">{room.roomNumber}</td>
                    <td className="px-6 py-3.5 text-gray-600">{room.floor}</td>
                    <td className="px-6 py-3.5 text-gray-600">{ROOM_TYPE_LABELS[room.type]}</td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {room.bedCounts
                        ? `${room.bedCounts.available}/${room.bedCounts.total} available`
                        : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-right text-gray-600">
                      ₹{room.monthlyRent.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={roomStatusBadgeVariant(room.status)}>
                        {ROOM_STATUS_LABELS[room.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/rooms/${room.id}`)}
                          className="cursor-pointer rounded-md p-2 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700"
                          aria-label={`View room ${room.roomNumber}`}
                          title="View"
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.8} />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/rooms/${room.id}/edit`)}
                          className="cursor-pointer rounded-md p-2 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700"
                          aria-label={`Edit room ${room.roomNumber}`}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.8} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(room)}
                          className="cursor-pointer rounded-md p-2 text-gray-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete room ${room.roomNumber}`}
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
        title="Delete room"
        description={`Remove room ${deleteTarget?.roomNumber ?? ''} and all its beds? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
