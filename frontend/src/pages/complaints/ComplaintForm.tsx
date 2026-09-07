import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, UserRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { complaintSchema, type ComplaintFormValues } from '@/lib/schemas';
import * as complaintService from '@/services/complaintService';
import * as residentService from '@/services/residentService';
import type { Resident } from '@/types/resident';
import type { CreateComplaintInput } from '@/types/complaint';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_PRIORITIES,
  COMPLAINT_PRIORITY_LABELS,
} from '@/types/complaint';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SearchPicker } from '@/components/ui/SearchPicker';
import { getErrorMessage } from '@/utils/errors';

export function ComplaintForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canFileForOthers = user?.role === 'admin' || user?.role === 'manager';

  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'OTHER',
      priority: 'MEDIUM',
    },
  });

  const fetchResidents = useCallback(async (query: string) => {
    const result = await residentService.listResidents({ q: query || undefined, limit: 8 });
    return result.residents;
  }, []);

  const onSubmit = async (values: ComplaintFormValues) => {
    setSubmitAttempted(true);
    if (canFileForOthers && !selectedResident) {
      return;
    }

    try {
      const payload: CreateComplaintInput = {
        residentId: canFileForOthers ? (selectedResident?.id ?? undefined) : undefined,
        title: values.title,
        description: values.description,
        category: values.category,
        priority: values.priority,
      };
      await complaintService.createComplaint(payload);
      toast.success('Complaint filed successfully');
      navigate('/complaints');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not file complaint'));
    }
  };

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
        <h1 className="text-2xl font-semibold text-gray-900">Raise complaint</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        {canFileForOthers && (
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
        )}

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Complaint details</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Title"
                placeholder="Short summary of the issue"
                error={errors.title?.message}
                {...register('title')}
              />
            </div>
            <Select label="Category" error={errors.category?.message} {...register('category')}>
              {COMPLAINT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {COMPLAINT_CATEGORY_LABELS[category]}
                </option>
              ))}
            </Select>
            <Select label="Priority" error={errors.priority?.message} {...register('priority')}>
              {COMPLAINT_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {COMPLAINT_PRIORITY_LABELS[priority]}
                </option>
              ))}
            </Select>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                rows={4}
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-shadow duration-150 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                placeholder="Describe the issue in detail"
                {...register('description')}
              />
              {errors.description?.message && (
                <p className="mt-1.5 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Raise complaint
          </Button>
        </div>
      </form>
    </div>
  );
}
