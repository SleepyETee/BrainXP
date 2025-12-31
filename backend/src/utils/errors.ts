/**
 * Custom API Error class for consistent error handling
 * 
 * Usage:
 * throw new ApiError(404, 'Task not found');
 * throw new ApiError(400, 'Validation failed', { title: 'Title is required' });
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error codes for common scenarios
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: { status: 401, message: 'Unauthorized' },
  FORBIDDEN: { status: 403, message: 'Forbidden' },
  INVALID_TOKEN: { status: 401, message: 'Invalid or expired token' },
  
  // Resource errors
  NOT_FOUND: { status: 404, message: 'Resource not found' },
  ALREADY_EXISTS: { status: 409, message: 'Resource already exists' },
  
  // Validation errors
  VALIDATION_FAILED: { status: 400, message: 'Validation failed' },
  MISSING_REQUIRED_FIELD: { status: 400, message: 'Required field missing' },
  INVALID_INPUT: { status: 400, message: 'Invalid input' },
  
  // Server errors
  INTERNAL_ERROR: { status: 500, message: 'Internal server error' },
  SERVICE_UNAVAILABLE: { status: 503, message: 'Service temporarily unavailable' },
} as const;

/**
 * Create ApiError from error code
 */
export const createError = (
  code: keyof typeof ErrorCodes,
  details?: Record<string, unknown>
): ApiError => {
  const errorInfo = ErrorCodes[code];
  return new ApiError(errorInfo.status, errorInfo.message, details);
};

/**
 * Check if error is an ApiError
 */
export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};
