import { isAxiosError } from 'axios';
import type { ApiErrorEnvelope } from '@/types/api';

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (isAxiosError<ApiErrorEnvelope>(error)) {
    return error.response?.data.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function getFieldErrors(error: unknown): Record<string, string[]> | undefined {
  if (isAxiosError<ApiErrorEnvelope>(error)) {
    return error.response?.data.errors?.fieldErrors;
  }
  return undefined;
}
