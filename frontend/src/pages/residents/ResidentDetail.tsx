import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BedDouble,
  Building2,
  Cake,
  GraduationCap,
  IdCard,
  Link2,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  Trash2,
  Unlink,
  Wallet,
} from 'lucide-react';
import * as residentService from '@/services/residentService';
import * as allocationService from '@/services/allocationService';
import type { Resident } from '@/types/resident';
import { GENDER_LABELS, RESIDENT_STATUS_LABELS } from '@/types/resident';
import type { Allocation } from '@/types/allocation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getErrorMessage } from '@/utils/errors';
import { statusBadgeVariant } from '@/utils/resident';
import { getInitials } from '@/utils/format';

interface FieldRowProps {
  icon: typeof Mail;
  label: string;
  value?: string;
}

function FieldRow({ icon: Icon, label, value }: FieldRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-sm text-gray-900">{value || '—'}</p>
      </div>
    </div>
  );
}

export function ResidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resident, setResident] = useState<Resident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [activeAllocation, setActiveAllocation] = useState<Allocation | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const fetchResident = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await residentService.getResident(id);
      setResident(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load resident'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchResident();
  }, [fetchResident]);

  const fetchActiveAllocation = useCallback(async (residentId: string) => {
    try {
      const result = await allocationService.listAllocations({
        residentId,
        status: 'ACTIVE',
        limit: 1,
      });
      setActiveAllocation(result.allocations[0] ?? null);
    } catch {
      setActiveAllocation(null);
    }
  }, []);

  useEffect(() => {
    if (resident) void fetchActiveAllocation(resident.id);
  }, [resident, fetchActiveAllocation]);

  const handleDelete = async () => {
    if (!resident) return;
    setIsDeleting(true);
    try {
      await residentService.deleteResident(resident.id);
      toast.success(`${resident.name} was removed`);
      navigate('/residents', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete resident'));
      setIsDeleting(false);
    }
  };

  const handleUnlink = async () => {
    if (!resident) return;
    setIsUnlinking(true);
    try {
      const updated = await residentService.updateResident(resident.id, { userId: null });
      setResident(updated);
      toast.success('Login account unlinked');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not unlink account'));
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleCheckout = async () => {
    if (!resident || !activeAllocation) return;
    setIsCheckingOut(true);
    try {
      await allocationService.checkoutAllocation(activeAllocation.id);
      toast.success(`${resident.name} was checked out and their bed is now available`);
      setIsCheckoutOpen(false);
      setActiveAllocation(null);
      setResident((prev) => (prev ? { ...prev, status: 'CHECKED_OUT' } : prev));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not check out resident'));
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardBody className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error || !resident) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-gray-500">{error || 'Resident not found'}</p>
        <Button variant="outline" onClick={() => navigate('/residents')}>
          Back to residents
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
            onClick={() => navigate('/residents')}
            className="cursor-pointer rounded-full p-2 text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Back to residents"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Resident details</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<Pencil className="h-4 w-4" strokeWidth={1.8} />}
            onClick={() => navigate(`/residents/${resident.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            leftIcon={<Trash2 className="h-4 w-4" strokeWidth={1.8} />}
            onClick={() => setIsDeleteOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {resident.profileImage ? (
            <img
              src={resident.profileImage}
              alt=""
              className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-lg font-semibold text-primary-700">
              {getInitials(resident.name)}
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{resident.name}</h2>
              <Badge variant={statusBadgeVariant(resident.status)}>
                {RESIDENT_STATUS_LABELS[resident.status]}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {resident.gender ? GENDER_LABELS[resident.gender] : 'Gender not specified'}
              {resident.dateOfBirth &&
                ` · Born ${new Date(resident.dateOfBirth).toLocaleDateString()}`}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
            {resident.user ? (
              <>
                <Link2 className="h-4 w-4 text-primary-600" strokeWidth={1.8} />
                <span className="text-gray-700">Login linked</span>
                <button
                  type="button"
                  onClick={() => void handleUnlink()}
                  disabled={isUnlinking}
                  className="ml-1 cursor-pointer text-gray-400 transition-colors duration-150 hover:text-red-600 disabled:cursor-not-allowed"
                  aria-label="Unlink account"
                  title="Unlink account"
                >
                  <Unlink className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </>
            ) : (
              <span className="text-gray-500">No login account yet</span>
            )}
          </div>
        </CardBody>
      </Card>

      {activeAllocation && (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Current allocation</h3>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<LogOut className="h-4 w-4" strokeWidth={1.8} />}
              onClick={() => setIsCheckoutOpen(true)}
            >
              Check out
            </Button>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FieldRow
              icon={Building2}
              label="Room"
              value={activeAllocation.room ? `Room ${activeAllocation.room.roomNumber}` : undefined}
            />
            <FieldRow icon={BedDouble} label="Bed" value={activeAllocation.bed?.label} />
            <FieldRow
              icon={Cake}
              label="Check-in date"
              value={new Date(activeAllocation.checkInDate).toLocaleDateString()}
            />
            <FieldRow
              icon={Wallet}
              label="Monthly rent"
              value={`₹${activeAllocation.monthlyRent.toLocaleString('en-IN')}`}
            />
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900">Contact details</h3>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <FieldRow icon={Mail} label="Email" value={resident.email} />
            <FieldRow icon={Phone} label="Phone" value={resident.phone} />
            <FieldRow icon={MapPin} label="Address" value={resident.address} />
            <FieldRow
              icon={Cake}
              label="Date of birth"
              value={
                resident.dateOfBirth
                  ? new Date(resident.dateOfBirth).toLocaleDateString()
                  : undefined
              }
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900">Emergency contact</h3>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <FieldRow icon={ShieldAlert} label="Name" value={resident.emergencyContact?.name} />
            <FieldRow icon={Phone} label="Phone" value={resident.emergencyContact?.phone} />
            <FieldRow
              icon={ShieldAlert}
              label="Relation"
              value={resident.emergencyContact?.relation}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900">College / course</h3>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FieldRow icon={GraduationCap} label="College" value={resident.college} />
            <FieldRow icon={GraduationCap} label="Course" value={resident.course} />
            <FieldRow icon={IdCard} label="Student ID" value={resident.studentId} />
          </CardBody>
        </Card>
      </div>

      <p className="text-xs text-gray-400">
        Added {new Date(resident.createdAt).toLocaleString()} · Last updated{' '}
        {new Date(resident.updatedAt).toLocaleString()}
      </p>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete resident"
        description={`Remove ${resident.name}'s record? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteOpen(false)}
      />

      <ConfirmDialog
        isOpen={isCheckoutOpen}
        title="Check out resident"
        description={`Check out ${resident.name}? Their bed will become available and their status will change to Checked out. This cannot be undone.`}
        confirmLabel="Check out"
        variant="primary"
        isLoading={isCheckingOut}
        onConfirm={() => void handleCheckout()}
        onCancel={() => setIsCheckoutOpen(false)}
      />
    </div>
  );
}
