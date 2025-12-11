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

// Therapy types (CBT, Mindfulness, Psychoeducation, etc.)
export * from './therapy';

// Study & Flashcard types (Quizlet-inspired)
export * from './study';

// Notes & Documents types (NotebookLM-inspired)
export * from './notes';

// AI Tools types (Goblin.tools-inspired)
export * from './aiTools';
// Timeline types
export * from './timeline';
// Upshift types
export * from './upshift';

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
