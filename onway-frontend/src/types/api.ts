//Matches src/middleware/error-handler.ts and every controller's success response exactly.
export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  [key: string]: unknown; // e.g. `pagination` on list endpoints
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
