import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError, isApiError } from '../utils/errors.js';

/**
 * Standard API error response format
 */
interface ErrorResponse {
  success: false;
  error: string;
  details?: Record<string, unknown>;
  stack?: string;
}

/**
 * Centralized error handling middleware
 * 
 * Handles:
 * - ApiError (our custom errors)
 * - Prisma errors (database)
 * - Zod validation errors
 * - Generic errors
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log all errors for monitoring
  console.error('[Error Handler]', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: (req as any).userId,
  });

  // ApiError - our custom errors with specific status codes
  if (isApiError(err)) {
    const response: ErrorResponse = {
      success: false,
      error: err.message,
      ...(err.details && { details: err.details }),
    };

    res.status(err.statusCode).json(response);
    return;
  }

  // Prisma errors - database errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const response: ErrorResponse = { success: false, error: '' };

    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        response.error = 'Resource already exists';
        res.status(409).json(response);
        return;

      case 'P2025':
        // Record not found
        response.error = 'Resource not found';
        res.status(404).json(response);
        return;

      case 'P2003':
        // Foreign key constraint failed
        response.error = 'Related resource not found';
        res.status(400).json(response);
        return;

      default:
        response.error = 'Database error';
        response.details = { code: err.code };
        res.status(400).json(response);
        return;
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    const response: ErrorResponse = {
      success: false,
      error: 'Invalid data provided',
    };

    res.status(400).json(response);
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const response: ErrorResponse = {
      success: false,
      error: 'Validation failed',
      details: err.issues.reduce((acc: Record<string, string>, error) => {
        const path = error.path.join('.');
        acc[path] = error.message;
        return acc;
      }, {} as Record<string, string>),
    };

    res.status(400).json(response);
    return;
  }

  // Generic error fallback
  const response: ErrorResponse = {
    success: false,
    error: 'Internal server error',
  };

  // Only include error details in development
  if (process.env.NODE_ENV === 'development') {
    response.details = {
      message: err.message,
      name: err.name,
    };
    response.stack = err.stack;
  }

  res.status(500).json(response);
};

/**
 * Async handler wrapper to catch promise rejections
 * 
 * Usage:
 * router.get('/path', asyncHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   res.json({ data });
 * }));
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
