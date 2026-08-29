export interface ApiEnvelope<T> {
  success: true;
  statusCode: number;
  data: T;
  message: string;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  errors?: {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
}
