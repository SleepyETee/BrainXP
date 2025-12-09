import { Request, Response, NextFunction } from 'express';
// import admin from 'firebase-admin';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  user?: {
    id: string;
    uid: string; // Alias for id (Firebase convention)
    email?: string;
  };
}

/**
 * Firebase authentication middleware
 * Verifies the JWT token from Firebase Auth
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    // For development, accept a mock token
    if (process.env['NODE_ENV'] === 'development' && token === 'dev-token') {
      req.userId = 'dev-user-id';
      req.userEmail = 'dev@example.com';
      req.user = { id: 'dev-user-id', uid: 'dev-user-id', email: 'dev@example.com' };
      next();
      return;
    }

    // In production, verify with Firebase Admin
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // req.userId = decodedToken.uid;
    // req.userEmail = decodedToken.email;

    // For now, mock the verification
    req.userId = 'mock-user-id';
    req.userEmail = 'user@example.com';
    req.user = { id: 'mock-user-id', uid: 'mock-user-id', email: 'user@example.com' };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 */
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      
      if (process.env['NODE_ENV'] === 'development' && token === 'dev-token') {
        req.userId = 'dev-user-id';
        req.userEmail = 'dev@example.com';
        req.user = { id: 'dev-user-id', uid: 'dev-user-id', email: 'dev@example.com' };
      } else {
        // Verify token
        req.userId = 'mock-user-id';
        req.userEmail = 'user@example.com';
        req.user = { id: 'mock-user-id', uid: 'mock-user-id', email: 'user@example.com' };
      }
    }

    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};

