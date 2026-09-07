import { api } from './api';
import type { ApiEnvelope } from '@/types/api';
import type {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStats,
  ComplaintStatus,
  CreateComplaintInput,
  PaginatedComplaints,
  UpdateComplaintInput,
} from '@/types/complaint';

export interface ListComplaintsParams {
  residentId?: string;
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  category?: ComplaintCategory;
  page?: number;
  limit?: number;
}

export async function createComplaint(input: CreateComplaintInput): Promise<Complaint> {
  const { data } = await api.post<ApiEnvelope<{ complaint: Complaint }>>('/complaints', input);
  return data.data.complaint;
}

export async function listComplaints(
  params: ListComplaintsParams = {},
): Promise<PaginatedComplaints> {
  const { data } = await api.get<ApiEnvelope<PaginatedComplaints>>('/complaints', { params });
  return data.data;
}

export async function getComplaint(id: string): Promise<Complaint> {
  const { data } = await api.get<ApiEnvelope<{ complaint: Complaint }>>(`/complaints/${id}`);
  return data.data.complaint;
}

export async function updateComplaint(
  id: string,
  input: UpdateComplaintInput,
): Promise<Complaint> {
  const { data } = await api.put<ApiEnvelope<{ complaint: Complaint }>>(
    `/complaints/${id}`,
    input,
  );
  return data.data.complaint;
}

export async function deleteComplaint(id: string): Promise<void> {
  await api.delete(`/complaints/${id}`);
}

export async function getComplaintStats(): Promise<ComplaintStats> {
  const { data } = await api.get<ApiEnvelope<ComplaintStats>>('/complaints/stats');
  return data.data;
}
