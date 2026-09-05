import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { roomSchema, type RoomFormValues } from '@/lib/schemas';
import * as roomService from '@/services/roomService';
import type { CreateRoomInput, Room, UpdateRoomInput } from '@/types/room';
import { MAX_ROOM_CAPACITY, ROOM_STATUS_LABELS, ROOM_TYPE_LABELS } from '@/types/room';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { getErrorMessage } from '@/utils/errors';

interface RoomFormProps {
  mode: 'create' | 'edit';
}

const emptyDefaults: RoomFormValues = {
  roomNumber: '',
  floor: 0,
  type: 'SINGLE',
  capacity: 1,
  monthlyRent: 0,
  description: '',
};

function toFormValues(room: Room): RoomFormValues {
  return {
    roomNumber: room.roomNumber,
    floor: room.floor,
    type: room.type,
    capacity: room.capacity,
    monthlyRent: room.monthlyRent,
    description: room.description ?? '',
  };
}

export function RoomForm({ mode }: RoomFormProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<'AVAILABLE' | 'MAINTENANCE'>('AVAILABLE');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (mode !== 'edit' || !id) return;

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    roomService
      .getRoom(id)
      .then((room) => {
        if (cancelled) return;
        reset(toFormValues(room));
        setStatus(room.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'AVAILABLE');
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Failed to load room'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, id, reset]);

  const onSubmit = async (values: RoomFormValues) => {
    try {
      if (mode === 'create') {
        const payload: CreateRoomInput = {
          roomNumber: values.roomNumber,
          floor: values.floor,
          type: values.type,
          capacity: values.capacity,
          monthlyRent: values.monthlyRent,
          description: values.description || undefined,
        };
        const room = await roomService.createRoom(payload);
        toast.success(
          `Room ${room.roomNumber} added with ${room.capacity} bed${room.capacity === 1 ? '' : 's'}`,
        );
        navigate(`/rooms/${room.id}`);
      } else if (id) {
        const payload: UpdateRoomInput = {
          roomNumber: values.roomNumber,
          floor: values.floor,
          type: values.type,
          capacity: values.capacity,
          monthlyRent: values.monthlyRent,
          description: values.description || null,
          status,
        };
        const room = await roomService.updateRoom(id, payload);
        toast.success(`Room ${room.roomNumber} updated`);
        navigate(`/rooms/${room.id}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, `Could not ${mode === 'create' ? 'create' : 'update'} room`));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardBody className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </CardBody>
        </Card>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-gray-500">{loadError}</p>
        <Button variant="outline" onClick={() => navigate('/rooms')}>
          Back to rooms
        </Button>
      </div>
    );
  }

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
        <h1 className="text-2xl font-semibold text-gray-900">
          {mode === 'create' ? 'Add room' : 'Edit room'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Room details</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Room number"
              error={errors.roomNumber?.message}
              {...register('roomNumber')}
            />
            <Input
              label="Floor"
              type="number"
              error={errors.floor?.message}
              {...register('floor', { valueAsNumber: true })}
            />
            <Select label="Room type" error={errors.type?.message} {...register('type')}>
              {Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Input
              label="Monthly rent (₹)"
              type="number"
              min={0}
              error={errors.monthlyRent?.message}
              {...register('monthlyRent', { valueAsNumber: true })}
            />
            <Input
              label="Description (optional)"
              error={errors.description?.message}
              {...register('description')}
              className="sm:col-span-2"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Beds</h2>
          </CardHeader>
          <CardBody>
            <Input
              label="Capacity"
              type="number"
              min={1}
              max={MAX_ROOM_CAPACITY}
              error={errors.capacity?.message}
              hint={
                mode === 'create'
                  ? 'Creates that many beds automatically, labeled A, B, C, ...'
                  : 'Editing capacity does not add or remove beds — manage individual beds from the room details page.'
              }
              {...register('capacity', { valueAsNumber: true })}
            />
          </CardBody>
        </Card>

        {mode === 'edit' && (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Status</h2>
            </CardHeader>
            <CardBody className="flex flex-col gap-1.5">
              <Select
                label="Room status"
                value={status}
                onChange={(event) => setStatus(event.target.value as 'AVAILABLE' | 'MAINTENANCE')}
              >
                <option value="AVAILABLE">{ROOM_STATUS_LABELS.AVAILABLE}</option>
                <option value="MAINTENANCE">{ROOM_STATUS_LABELS.MAINTENANCE}</option>
              </Select>
              <p className="text-xs text-gray-500">
                Partially occupied / full are calculated automatically from bed occupancy.
              </p>
            </CardBody>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {mode === 'create' ? 'Add room' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
