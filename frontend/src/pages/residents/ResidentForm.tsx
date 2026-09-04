import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, Link2 } from 'lucide-react';
import { residentSchema, type ResidentFormValues } from '@/lib/schemas';
import * as residentService from '@/services/residentService';
import type { CreateResidentInput, Resident, UpdateResidentInput } from '@/types/resident';
import { GENDER_LABELS, RESIDENT_STATUS_LABELS, type ResidentStatus } from '@/types/resident';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { getErrorMessage } from '@/utils/errors';

interface ResidentFormProps {
  mode: 'create' | 'edit';
}

const emptyDefaults: ResidentFormValues = {
  name: '',
  email: '',
  phone: '',
  gender: '',
  dateOfBirth: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  college: '',
  course: '',
  studentId: '',
  profileImage: '',
};

function toFormValues(resident: Resident): ResidentFormValues {
  return {
    name: resident.name,
    email: resident.email ?? '',
    phone: resident.phone ?? '',
    gender: resident.gender ?? '',
    dateOfBirth: resident.dateOfBirth ? resident.dateOfBirth.slice(0, 10) : '',
    address: resident.address ?? '',
    emergencyContactName: resident.emergencyContact?.name ?? '',
    emergencyContactPhone: resident.emergencyContact?.phone ?? '',
    emergencyContactRelation: resident.emergencyContact?.relation ?? '',
    college: resident.college ?? '',
    course: resident.course ?? '',
    studentId: resident.studentId ?? '',
    profileImage: resident.profileImage ?? '',
  };
}

export function ResidentForm({ mode }: ResidentFormProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<ResidentStatus>('ACTIVE');
  const [linkedUserId, setLinkedUserId] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResidentFormValues>({
    resolver: zodResolver(residentSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (mode !== 'edit' || !id) return;

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    residentService
      .getResident(id)
      .then((resident) => {
        if (cancelled) return;
        reset(toFormValues(resident));
        setStatus(resident.status);
        setLinkedUserId(resident.user ?? '');
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Failed to load resident'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, id, reset]);

  const onSubmit = async (values: ResidentFormValues) => {
    const payload: CreateResidentInput = {
      name: values.name,
      email: values.email || undefined,
      phone: values.phone || undefined,
      gender: values.gender || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      address: values.address || undefined,
      college: values.college || undefined,
      course: values.course || undefined,
      studentId: values.studentId || undefined,
      profileImage: values.profileImage || undefined,
      emergencyContact:
        values.emergencyContactName && values.emergencyContactPhone
          ? {
              name: values.emergencyContactName,
              phone: values.emergencyContactPhone,
              relation: values.emergencyContactRelation || undefined,
            }
          : undefined,
    };

    try {
      if (mode === 'create') {
        const resident = await residentService.createResident(payload);
        toast.success(`${resident.name} added`);
        navigate(`/residents/${resident.id}`);
      } else if (id) {
        const updatePayload: UpdateResidentInput = {
          ...payload,
          status,
          userId: linkedUserId.trim() ? linkedUserId.trim() : null,
        };
        const resident = await residentService.updateResident(id, updatePayload);
        toast.success(`${resident.name} updated`);
        navigate(`/residents/${resident.id}`);
      }
    } catch (err) {
      toast.error(
        getErrorMessage(err, `Could not ${mode === 'create' ? 'create' : 'update'} resident`),
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardBody className="flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
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
        <Button variant="outline" onClick={() => navigate('/residents')}>
          Back to residents
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
          {mode === 'create' ? 'Add resident' : 'Edit resident'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Basic information</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              error={errors.name?.message}
              {...register('name')}
              className="sm:col-span-2"
            />
            <Select label="Gender" error={errors.gender?.message} {...register('gender')}>
              <option value="">Not specified</option>
              {Object.entries(GENDER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Input
              label="Date of birth"
              type="date"
              error={errors.dateOfBirth?.message}
              {...register('dateOfBirth')}
            />
            <Input
              label="Profile image URL (optional)"
              placeholder="https://..."
              error={errors.profileImage?.message}
              {...register('profileImage')}
              className="sm:col-span-2"
            />
            {mode === 'edit' && (
              <Select
                label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value as ResidentStatus)}
              >
                {Object.entries(RESIDENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Contact details</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
            <Input
              label="Address"
              error={errors.address?.message}
              {...register('address')}
              className="sm:col-span-2"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Emergency contact</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Name"
              error={errors.emergencyContactName?.message}
              {...register('emergencyContactName')}
            />
            <Input
              label="Phone"
              type="tel"
              error={errors.emergencyContactPhone?.message}
              {...register('emergencyContactPhone')}
            />
            <Input
              label="Relation"
              placeholder="Parent, sibling, ..."
              error={errors.emergencyContactRelation?.message}
              {...register('emergencyContactRelation')}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">College / course</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="College" error={errors.college?.message} {...register('college')} />
            <Input label="Course" error={errors.course?.message} {...register('course')} />
            <Input
              label="Student ID"
              error={errors.studentId?.message}
              {...register('studentId')}
            />
          </CardBody>
        </Card>

        {mode === 'edit' && (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Login account link</h2>
            </CardHeader>
            <CardBody>
              <Input
                label="Linked account ID"
                leftIcon={<Link2 className="h-4 w-4" strokeWidth={1.8} />}
                placeholder="Paste the account's ID, or leave blank for none"
                hint="Create the login first from Manage Users (role Resident), then paste its ID here to connect it to this record."
                value={linkedUserId}
                onChange={(event) => setLinkedUserId(event.target.value)}
              />
            </CardBody>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {mode === 'create' ? 'Add resident' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
