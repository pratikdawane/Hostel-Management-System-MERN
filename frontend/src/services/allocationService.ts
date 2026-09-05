import { api } from './api';
import type { ApiEnvelope } from '@/types/api';
import type {
  Allocation,
  AllocationStatus,
  CreateAllocationInput,
  PaginatedAllocations,
} from '@/types/allocation';

export interface ListAllocationsParams {
  status?: AllocationStatus;
  roomId?: string;
  page?: number;
  limit?: number;
}

export async function createAllocation(input: CreateAllocationInput): Promise<Allocation> {
  const { data } = await api.post<ApiEnvelope<{ allocation: Allocation }>>('/allocations', input);
  return data.data.allocation;
}

export async function listAllocations(
  params: ListAllocationsParams = {},
): Promise<PaginatedAllocations> {
  const { data } = await api.get<ApiEnvelope<PaginatedAllocations>>('/allocations', { params });
  return data.data;
}

export async function cancelAllocation(id: string): Promise<Allocation> {
  const { data } = await api.patch<ApiEnvelope<{ allocation: Allocation }>>(
    `/allocations/${id}/cancel`,
  );
  return data.data.allocation;
}
