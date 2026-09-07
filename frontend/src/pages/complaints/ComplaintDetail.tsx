import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Tag,
  Trash2,
  UserCog,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import * as complaintService from '@/services/complaintService';
import type { Complaint, ComplaintPriority, ComplaintStatus } from '@/types/complaint';
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_PRIORITIES,
  COMPLAINT_PRIORITY_LABELS,
  COMPLAINT_STATUSES,
  COMPLAINT_STATUS_LABELS,
} from '@/types/complaint';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getErrorMessage } from '@/utils/errors';
import { complaintPriorityBadgeVariant, complaintStatusBadgeVariant } from '@/utils/complaint';

interface FieldRowProps {
  icon: typeof Tag;
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

export function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [statusDraft, setStatusDraft] = useState<ComplaintStatus>('OPEN');
  const [priorityDraft, setPriorityDraft] = useState<ComplaintPriority>('MEDIUM');
  const [assigneeDraft, setAssigneeDraft] = useState('');

  const fetchComplaint = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await complaintService.getComplaint(id);
      setComplaint(data);
      setStatusDraft(data.status);
      setPriorityDraft(data.priority);
      setAssigneeDraft(data.assignedStaffName ?? '');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load complaint'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchComplaint();
  }, [fetchComplaint]);

  const hasChanges =
    complaint &&
    (statusDraft !== complaint.status ||
      priorityDraft !== complaint.priority ||
      assigneeDraft !== (complaint.assignedStaffName ?? ''));

  const handleSave = async () => {
    if (!complaint) return;
    setIsSaving(true);
    try {
      const updated = await complaintService.updateComplaint(complaint.id, {
        status: statusDraft,
        priority: priorityDraft,
        assignedStaffName: assigneeDraft,
      });
      setComplaint(updated);
      setStatusDraft(updated.status);
      setPriorityDraft(updated.priority);
      setAssigneeDraft(updated.assignedStaffName ?? '');
      toast.success('Complaint updated');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update complaint'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!complaint) return;
    setIsDeleting(true);
    try {
      await complaintService.deleteComplaint(complaint.id);
      toast.success('Complaint deleted');
      navigate('/complaints', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete complaint'));
      setIsDeleting(false);
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

  if (error || !complaint) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-gray-500">{error || 'Complaint not found'}</p>
        <Button variant="outline" onClick={() => navigate('/complaints')}>
          Back to complaints
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
            onClick={() => navigate('/complaints')}
            className="cursor-pointer rounded-full p-2 text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Back to complaints"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Complaint details</h1>
        </div>
        {canManage && (
          <Button
            variant="danger"
            leftIcon={<Trash2 className="h-4 w-4" strokeWidth={1.8} />}
            onClick={() => setIsDeleteOpen(true)}
          >
            Delete
          </Button>
        )}
      </div>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">{complaint.title}</h2>
            <Badge variant={complaintStatusBadgeVariant(complaint.status)}>
              {COMPLAINT_STATUS_LABELS[complaint.status]}
            </Badge>
            <Badge variant={complaintPriorityBadgeVariant(complaint.priority)}>
              {COMPLAINT_PRIORITY_LABELS[complaint.priority]}
            </Badge>
          </div>
          <p className="whitespace-pre-wrap text-sm text-gray-600">{complaint.description}</p>

          <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <FieldRow icon={Tag} label="Category" value={COMPLAINT_CATEGORY_LABELS[complaint.category]} />
            <FieldRow icon={UserRound} label="Resident" value={complaint.resident?.name} />
            <FieldRow icon={UserCog} label="Assigned to" value={complaint.assignedStaffName} />
            <FieldRow
              icon={CheckCircle2}
              label="Resolved at"
              value={complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleString() : undefined}
            />
          </div>
        </CardBody>
      </Card>

      {canManage ? (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900">Manage complaint</h3>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Select
                label="Status"
                value={statusDraft}
                onChange={(event) => setStatusDraft(event.target.value as ComplaintStatus)}
              >
                {COMPLAINT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {COMPLAINT_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
              <Select
                label="Priority"
                value={priorityDraft}
                onChange={(event) => setPriorityDraft(event.target.value as ComplaintPriority)}
              >
                {COMPLAINT_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {COMPLAINT_PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </Select>
              <Input
                label="Assigned staff"
                placeholder="Staff member's name"
                value={assigneeDraft}
                onChange={(event) => setAssigneeDraft(event.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => void handleSave()}
                isLoading={isSaving}
                disabled={!hasChanges}
              >
                Save changes
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3.5 py-2.5 text-sm text-gray-600">
          <Calendar className="h-4 w-4 flex-shrink-0" strokeWidth={1.8} />
          Our team will review your complaint and update its status here.
        </div>
      )}

      <p className="text-xs text-gray-400">
        Filed {new Date(complaint.createdAt).toLocaleString()} · Last updated{' '}
        {new Date(complaint.updatedAt).toLocaleString()}
      </p>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete complaint"
        description={`Remove "${complaint.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}
