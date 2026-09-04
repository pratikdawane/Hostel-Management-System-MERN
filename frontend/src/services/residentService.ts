import { api } from './api';
import type { ApiEnvelope } from '@/types/api';
import type {
  CreateResidentInput,
  PaginatedResidents,
  Resident,
  ResidentStats,
  ResidentStatus,
  UpdateResidentInput,
} from '@/types/resident';

export interface ListResidentsParams {
  q?: string;
  status?: ResidentStatus;
  page?: number;
  limit?: number;
}

export async function createResident(input: CreateResidentInput): Promise<Resident> {
  const { data } = await api.post<ApiEnvelope<{ resident: Resident }>>('/residents', input);
  return data.data.resident;
}

export async function listResidents(params: ListResidentsParams = {}): Promise<PaginatedResidents> {
  const { data } = await api.get<ApiEnvelope<PaginatedResidents>>('/residents', { params });
  return data.data;
}

export async function getResidentStats(): Promise<ResidentStats> {
  const { data } = await api.get<ApiEnvelope<ResidentStats>>('/residents/stats');
  return data.data;
}

export async function getResident(id: string): Promise<Resident> {
  const { data } = await api.get<ApiEnvelope<{ resident: Resident }>>(`/residents/${id}`);
  return data.data.resident;
}

export async function updateResident(id: string, input: UpdateResidentInput): Promise<Resident> {
  const { data } = await api.put<ApiEnvelope<{ resident: Resident }>>(`/residents/${id}`, input);
  return data.data.resident;
}

export async function deleteResident(id: string): Promise<void> {
  await api.delete(`/residents/${id}`);
}
