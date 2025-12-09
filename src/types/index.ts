// Task types
export * from './task';

// Habit types
export * from './habit';

// Routine types
export * from './routine';

// Focus types
export * from './focus';

// Capture types
export * from './capture';

// User types
export * from './user';

// Progress types
export * from './progress';

// Common types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}
