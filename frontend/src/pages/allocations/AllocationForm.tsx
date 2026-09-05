import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, BedDouble, Building2, Loader2, Search, UserRound } from 'lucide-react';
import { allocationSchema, type AllocationFormValues } from '@/lib/schemas';
import * as allocationService from '@/services/allocationService';
import * as residentService from '@/services/residentService';
import * as roomService from '@/services/roomService';
import type { Resident } from '@/types/resident';
import type { Bed, Room } from '@/types/room';
import type { CreateAllocationInput } from '@/types/allocation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getErrorMessage } from '@/utils/errors';

interface SearchPickerProps<T> {
  label: string;
  placeholder: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  fetchOptions: (query: string) => Promise<T[]>;
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  getSubLabel: (item: T) => string;
  selected: T | null;
  onSelect: (item: T) => void;
  onClear: () => void;
  error?: string;
}

function SearchPicker<T>({
  label,
  placeholder,
  icon: Icon,
  fetchOptions,
  getId,
  getLabel,
  getSubLabel,
  selected,
  onSelect,
  onClear,
  error,
}: SearchPickerProps<T>) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    const timeout = setTimeout(() => {
      setIsLoading(true);
      fetchOptions(query.trim())
        .then((result) => {
          if (!cancelled) setOptions(result);
        })
        .catch(() => {
          if (!cancelled) setOptions([]);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, isOpen, fetchOptions]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {selected ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Icon className="h-4 w-4" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{getLabel(selected)}</p>
              <p className="truncate text-xs text-gray-500">{getSubLabel(selected)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="flex-shrink-0 cursor-pointer text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <Input
            placeholder={placeholder}
            leftIcon={<Search className="h-4 w-4" strokeWidth={1.8} />}
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            error={error}
          />
          {isOpen && (
            <div className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-4 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  Searching...
                </div>
              ) : options.length === 0 ? (
                <p className="px-4 py-4 text-center text-sm text-gray-500">No matches found</p>
              ) : (
                <ul className="max-h-60 overflow-y-auto py-1">
                  {options.map((option) => (
                    <li key={getId(option)}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(option);
                          setIsOpen(false);
                          setQuery('');
                        }}
                        className="flex w-full cursor-pointer flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-gray-50"
                      >
                        <span className="text-sm font-medium text-gray-900">{getLabel(option)}</span>
                        <span className="text-xs text-gray-500">{getSubLabel(option)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AllocationForm() {
  const navigate = useNavigate();
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [beds, setBeds] = useState<Bed[]>([]);
  const [isLoadingBeds, setIsLoadingBeds] = useState(false);
  const [bedsError, setBedsError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AllocationFormValues>({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      checkInDate: todayIsoDate(),
      expectedCheckOutDate: '',
      monthlyRent: 0,
      securityDeposit: 0,
    },
  });

  const fetchResidents = useCallback(async (query: string) => {
    const result = await residentService.listResidents({ q: query || undefined, limit: 8 });
    return result.residents;
  }, []);

  const fetchRooms = useCallback(async (query: string) => {
    const result = await roomService.listRooms({ q: query || undefined, limit: 8 });
    return result.rooms;
  }, []);

  useEffect(() => {
    if (!selectedRoom) {
      setBeds([]);
      setSelectedBedId('');
      return undefined;
    }

    let cancelled = false;
    setIsLoadingBeds(true);
    setBedsError(null);
    setSelectedBedId('');
    setValue('monthlyRent', selectedRoom.monthlyRent);

    roomService
      .listRoomBeds(selectedRoom.id)
      .then((data) => {
        if (cancelled) return;
        setBeds(data.filter((bed) => bed.status === 'AVAILABLE'));
      })
      .catch((err: unknown) => {
        if (!cancelled) setBedsError(getErrorMessage(err, 'Failed to load beds'));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBeds(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRoom, setValue]);

  const onSubmit = async (values: AllocationFormValues) => {
    setSubmitAttempted(true);
    if (!selectedResident || !selectedRoom || !selectedBedId) {
      return;
    }

    try {
      const payload: CreateAllocationInput = {
        residentId: selectedResident.id,
        roomId: selectedRoom.id,
        bedId: selectedBedId,
        checkInDate: values.checkInDate,
        expectedCheckOutDate: values.expectedCheckOutDate || undefined,
        monthlyRent: values.monthlyRent,
        securityDeposit: values.securityDeposit,
      };
      await allocationService.createAllocation(payload);
      toast.success(`${selectedResident.name} was allocated to Room ${selectedRoom.roomNumber}`);
      navigate('/allocations');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create allocation'));
    }
  };

  const selectedBed = beds.find((bed) => bed.id === selectedBedId) ?? null;

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
        <h1 className="text-2xl font-semibold text-gray-900">New allocation</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Resident</h2>
          </CardHeader>
          <CardBody>
            <SearchPicker
              label="Resident"
              placeholder="Search residents by name, email, or student ID"
              icon={UserRound}
              fetchOptions={fetchResidents}
              getId={(resident) => resident.id}
              getLabel={(resident) => resident.name}
              getSubLabel={(resident) => resident.email || resident.phone || 'No contact on file'}
              selected={selectedResident}
              onSelect={setSelectedResident}
              onClear={() => setSelectedResident(null)}
              error={submitAttempted && !selectedResident ? 'Select a resident' : undefined}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Room &amp; bed</h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <SearchPicker
              label="Room"
              placeholder="Search rooms by room number"
              icon={Building2}
              fetchOptions={fetchRooms}
              getId={(room) => room.id}
              getLabel={(room) => `Room ${room.roomNumber}`}
              getSubLabel={(room) => `Floor ${room.floor} · ₹${room.monthlyRent.toLocaleString('en-IN')}/month`}
              selected={selectedRoom}
              onSelect={setSelectedRoom}
              onClear={() => setSelectedRoom(null)}
              error={submitAttempted && !selectedRoom ? 'Select a room' : undefined}
            />

            {selectedRoom && (
              <div>
                {isLoadingBeds ? (
                  <p className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                    Loading beds...
                  </p>
                ) : bedsError ? (
                  <p className="text-sm text-red-600">{bedsError}</p>
                ) : beds.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
                    <BedDouble className="h-4 w-4 flex-shrink-0" strokeWidth={1.8} />
                    This room has no vacant beds right now.
                  </div>
                ) : (
                  <Select
                    label="Available bed"
                    value={selectedBedId}
                    onChange={(event) => setSelectedBedId(event.target.value)}
                    error={submitAttempted && !selectedBedId ? 'Select an available bed' : undefined}
                  >
                    <option value="">Select a bed</option>
                    {beds.map((bed) => (
                      <option key={bed.id} value={bed.id}>
                        Bed {bed.label}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Stay details</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Check-in date"
              type="date"
              error={errors.checkInDate?.message}
              {...register('checkInDate')}
            />
            <Input
              label="Expected check-out date (optional)"
              type="date"
              error={errors.expectedCheckOutDate?.message}
              {...register('expectedCheckOutDate')}
            />
            <Input
              label="Monthly rent (₹)"
              type="number"
              min={0}
              error={errors.monthlyRent?.message}
              {...register('monthlyRent', { valueAsNumber: true })}
            />
            <Input
              label="Security deposit (₹)"
              type="number"
              min={0}
              error={errors.securityDeposit?.message}
              {...register('securityDeposit', { valueAsNumber: true })}
            />
          </CardBody>
        </Card>

        {selectedResident && selectedRoom && selectedBed && (
          <Card>
            <CardBody>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{selectedResident.name}</span> will be
                allocated to{' '}
                <span className="font-medium text-gray-900">
                  Room {selectedRoom.roomNumber}, Bed {selectedBed.label}
                </span>
                .
              </p>
            </CardBody>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create allocation
          </Button>
        </div>
      </form>
    </div>
  );
}
