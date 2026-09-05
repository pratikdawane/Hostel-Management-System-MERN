import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, Bed as BedIcon, Pencil, Plus, Trash2 } from 'lucide-react';
import { bedSchema, type BedFormValues } from '@/lib/schemas';
import * as roomService from '@/services/roomService';
import * as bedService from '@/services/bedService';
import type { Bed, Room } from '@/types/room';
import { BED_STATUS_LABELS, ROOM_STATUS_LABELS, ROOM_TYPE_LABELS } from '@/types/room';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getErrorMessage } from '@/utils/errors';
import { bedStatusBadgeVariant, roomStatusBadgeVariant } from '@/utils/room';

interface AddBedModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onSubmit: (label: string) => void;
  onClose: () => void;
}

function AddBedModal({ isOpen, isSubmitting, onSubmit, onClose }: AddBedModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BedFormValues>({ resolver: zodResolver(bedSchema), defaultValues: { label: '' } });

  useEffect(() => {
    if (isOpen) reset({ label: '' });
  }, [isOpen, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add bed">
      <form
        onSubmit={handleSubmit((values) => onSubmit(values.label))}
        className="flex flex-col gap-4"
        noValidate
      >
        <Input
          label="Bed label"
          placeholder="e.g. E"
          error={errors.label?.message}
          {...register('label')}
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Add bed
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface EditBedModalProps {
  bed: Bed | null;
  isSubmitting: boolean;
  onSubmit: (values: { label: string; status?: 'AVAILABLE' | 'MAINTENANCE' }) => void;
  onClose: () => void;
}

function EditBedModal({ bed, isSubmitting, onSubmit, onClose }: EditBedModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BedFormValues>({ resolver: zodResolver(bedSchema), defaultValues: { label: '' } });
  const [status, setStatus] = useState<'AVAILABLE' | 'MAINTENANCE'>('AVAILABLE');
  const isOccupied = bed?.status === 'OCCUPIED';

  useEffect(() => {
    if (bed) {
      reset({ label: bed.label });
      setStatus(bed.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'AVAILABLE');
    }
  }, [bed, reset]);

  return (
    <Modal isOpen={bed !== null} onClose={onClose} title="Edit bed">
      <form
        onSubmit={handleSubmit((values) =>
          onSubmit({ label: values.label, ...(isOccupied ? {} : { status }) }),
        )}
        className="flex flex-col gap-4"
        noValidate
      >
        <Input label="Bed label" error={errors.label?.message} {...register('label')} />
        <Select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value as 'AVAILABLE' | 'MAINTENANCE')}
          disabled={isOccupied}
        >
          <option value="AVAILABLE">{BED_STATUS_LABELS.AVAILABLE}</option>
          <option value="MAINTENANCE">{BED_STATUS_LABELS.MAINTENANCE}</option>
        </Select>
        {isOccupied && (
          <p className="text-xs text-gray-500">
            This bed is occupied. Unassign the resident before changing its status.
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDeleteRoomOpen, setIsDeleteRoomOpen] = useState(false);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);

  const [isAddBedOpen, setIsAddBedOpen] = useState(false);
  const [isAddingBed, setIsAddingBed] = useState(false);

  const [editingBed, setEditingBed] = useState<Bed | null>(null);
  const [isSavingBed, setIsSavingBed] = useState(false);

  const [deleteBedTarget, setDeleteBedTarget] = useState<Bed | null>(null);
  const [isDeletingBed, setIsDeletingBed] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [roomData, bedsData] = await Promise.all([
        roomService.getRoom(id),
        roomService.listRoomBeds(id),
      ]);
      setRoom(roomData);
      setBeds(bedsData);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load room'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const bedCounts = beds.reduce(
    (acc, bed) => {
      acc.total += 1;
      if (bed.status === 'AVAILABLE') acc.available += 1;
      else if (bed.status === 'OCCUPIED') acc.occupied += 1;
      else acc.maintenance += 1;
      return acc;
    },
    { total: 0, available: 0, occupied: 0, maintenance: 0 },
  );

  const handleDeleteRoom = async () => {
    if (!room) return;
    setIsDeletingRoom(true);
    try {
      await roomService.deleteRoom(room.id);
      toast.success(`Room ${room.roomNumber} was removed`);
      navigate('/rooms', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete room'));
      setIsDeletingRoom(false);
    }
  };

  const handleAddBed = async (label: string) => {
    if (!room) return;
    setIsAddingBed(true);
    try {
      await roomService.createRoomBed(room.id, { label });
      toast.success(`Bed ${label} added`);
      setIsAddBedOpen(false);
      void fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not add bed'));
    } finally {
      setIsAddingBed(false);
    }
  };

  const handleSaveBed = async (values: { label: string; status?: 'AVAILABLE' | 'MAINTENANCE' }) => {
    if (!editingBed) return;
    setIsSavingBed(true);
    try {
      await bedService.updateBed(editingBed.id, values);
      toast.success(`Bed ${values.label} updated`);
      setEditingBed(null);
      void fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update bed'));
    } finally {
      setIsSavingBed(false);
    }
  };

  const handleDeleteBed = async () => {
    if (!deleteBedTarget) return;
    setIsDeletingBed(true);
    try {
      await bedService.deleteBed(deleteBedTarget.id);
      toast.success(`Bed ${deleteBedTarget.label} removed`);
      setDeleteBedTarget(null);
      void fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete bed'));
    } finally {
      setIsDeletingBed(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardBody className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-gray-500">{error || 'Room not found'}</p>
        <Button variant="outline" onClick={() => navigate('/rooms')}>
          Back to rooms
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_200ms_ease]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/rooms')}
            className="cursor-pointer rounded-full p-2 text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Back to rooms"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Room details</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<Pencil className="h-4 w-4" strokeWidth={1.8} />}
            onClick={() => navigate(`/rooms/${room.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            leftIcon={<Trash2 className="h-4 w-4" strokeWidth={1.8} />}
            onClick={() => setIsDeleteRoomOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-lg font-semibold text-primary-700">
            {room.roomNumber}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Room {room.roomNumber}</h2>
              <Badge variant={roomStatusBadgeVariant(room.status)}>
                {ROOM_STATUS_LABELS[room.status]}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Floor {room.floor} · {ROOM_TYPE_LABELS[room.type]} · ₹
              {room.monthlyRent.toLocaleString('en-IN')}/month
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-gray-50 px-4 py-2">
              <p className="text-lg font-semibold text-gray-900">{bedCounts.total}</p>
              <p className="text-xs text-gray-500">Total beds</p>
            </div>
            <div className="rounded-lg bg-green-50 px-4 py-2">
              <p className="text-lg font-semibold text-green-700">{bedCounts.available}</p>
              <p className="text-xs text-green-600">Available</p>
            </div>
            <div className="rounded-lg bg-primary-50 px-4 py-2">
              <p className="text-lg font-semibold text-primary-700">{bedCounts.occupied}</p>
              <p className="text-xs text-primary-600">Occupied</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {room.description && (
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">{room.description}</p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Beds</h3>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Plus className="h-4 w-4" strokeWidth={1.8} />}
            onClick={() => setIsAddBedOpen(true)}
          >
            Add bed
          </Button>
        </CardHeader>
        <CardBody>
          {beds.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <BedIcon className="h-8 w-8 text-gray-300" strokeWidth={1.5} />
              <p className="text-sm text-gray-500">No beds yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {beds.map((bed) => (
                <div
                  key={bed.id}
                  className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">Bed {bed.label}</span>
                    <Badge variant={bedStatusBadgeVariant(bed.status)}>
                      {BED_STATUS_LABELS[bed.status]}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    {bed.residentId ? bed.residentId.name : 'No resident assigned'}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingBed(bed)}
                      className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700"
                      aria-label={`Edit bed ${bed.label}`}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteBedTarget(bed)}
                      className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete bed ${bed.label}`}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <p className="text-xs text-gray-400">
        Added {new Date(room.createdAt).toLocaleString()} · Last updated{' '}
        {new Date(room.updatedAt).toLocaleString()}
      </p>

      <ConfirmDialog
        isOpen={isDeleteRoomOpen}
        title="Delete room"
        description={`Remove room ${room.roomNumber} and its ${bedCounts.total} bed${bedCounts.total === 1 ? '' : 's'}? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeletingRoom}
        onConfirm={() => void handleDeleteRoom()}
        onCancel={() => setIsDeleteRoomOpen(false)}
      />

      <ConfirmDialog
        isOpen={deleteBedTarget !== null}
        title="Delete bed"
        description={`Remove bed ${deleteBedTarget?.label ?? ''} from this room? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeletingBed}
        onConfirm={() => void handleDeleteBed()}
        onCancel={() => setDeleteBedTarget(null)}
      />

      <AddBedModal
        isOpen={isAddBedOpen}
        isSubmitting={isAddingBed}
        onSubmit={(label) => void handleAddBed(label)}
        onClose={() => setIsAddBedOpen(false)}
      />

      <EditBedModal
        bed={editingBed}
        isSubmitting={isSavingBed}
        onSubmit={(values) => void handleSaveBed(values)}
        onClose={() => setEditingBed(null)}
      />
    </div>
  );
}
