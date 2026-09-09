import { api } from './api';
import type { ApiEnvelope } from '@/types/api';
import type { DashboardSummary } from '@/types/dashboard';

export async function getDashboard(): Promise<DashboardSummary> {
  const { data } = await api.get<ApiEnvelope<DashboardSummary>>('/dashboard');
  return data.data;
}
