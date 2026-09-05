import { api } from './api';
import type { ApiEnvelope } from '@/types/api';
import type { Bed, UpdateBedInput } from '@/types/room';

export async function updateBed(id: string, input: UpdateBedInput): Promise<Bed> {
  const { data } = await api.put<ApiEnvelope<{ bed: Bed }>>(`/beds/${id}`, input);
  return data.data.bed;
}

export async function deleteBed(id: string): Promise<void> {
  await api.delete(`/beds/${id}`);
}
