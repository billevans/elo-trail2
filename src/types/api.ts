export interface ApiErrorDetails {
  code: string;
  message: string;
}

export type ApiSuccess<T> = {
  data: T;
  error?: never;
};

export type ApiFailure = {
  data?: never;
  error: ApiErrorDetails;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
