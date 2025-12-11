import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (admin.apps.length === 0) {
    // Check for service account credentials
    const serviceAccount = process.env['FIREBASE_SERVICE_ACCOUNT'];
    const projectId = process.env['FIREBASE_PROJECT_ID'];

    if (serviceAccount) {
      try {
        const parsedServiceAccount = JSON.parse(serviceAccount);
        admin.initializeApp({
          credential: admin.credential.cert(parsedServiceAccount),
        });
        console.log('Firebase Admin initialized with service account');
      } catch (error) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', error);
        // Fall back to application default credentials
        admin.initializeApp({
          projectId: projectId || 'brainxp-dev',
        });
      }
    } else if (projectId) {
      // Use application default credentials (for Cloud Run, etc.)
      admin.initializeApp({
        projectId,
      });
      console.log('Firebase Admin initialized with project ID:', projectId);
    } else {
      // Development mode - initialize without credentials
      console.log('Firebase Admin running in development mode (no credentials)');
    }
  }
};

// Initialize on module load
initializeFirebase();

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  user?: {
    id: string;
    uid: string; // Alias for id (Firebase convention)
    email?: string;
    emailVerified?: boolean;
    displayName?: string;
    photoURL?: string;
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

    // Development mode: accept dev-token for testing
    if (process.env['NODE_ENV'] === 'development' && token === 'dev-token') {
      req.userId = 'dev-user-id';
      req.userEmail = 'dev@example.com';
      req.user = {
        id: 'dev-user-id',
        uid: 'dev-user-id',
        email: 'dev@example.com',
        emailVerified: true,
        displayName: 'Dev User',
      };
      next();
      return;
    }

    // Verify Firebase token
    if (admin.apps.length > 0) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        req.userId = decodedToken.uid;
        req.userEmail = decodedToken.email;
        req.user = {
          id: decodedToken.uid,
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          displayName: decodedToken.name,
          photoURL: decodedToken.picture,
        };
        
        next();
        return;
      } catch (firebaseError) {
        console.error('Firebase token verification failed:', firebaseError);
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        });
        return;
      }
    }

    // Fallback for development without Firebase credentials
    if (process.env['NODE_ENV'] === 'development') {
      console.warn('Firebase not configured - using mock auth for development');
      req.userId = 'mock-user-id';
      req.userEmail = 'user@example.com';
      req.user = {
        id: 'mock-user-id',
        uid: 'mock-user-id',
        email: 'user@example.com',
        emailVerified: true,
      };
      next();
      return;
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication service not configured',
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
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
        req.user = {
          id: 'dev-user-id',
          uid: 'dev-user-id',
          email: 'dev@example.com',
          emailVerified: true,
          displayName: 'Dev User',
        };
      } else if (admin.apps.length > 0) {
        try {
          const decodedToken = await admin.auth().verifyIdToken(token);
          req.userId = decodedToken.uid;
          req.userEmail = decodedToken.email;
          req.user = {
            id: decodedToken.uid,
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            displayName: decodedToken.name,
            photoURL: decodedToken.picture,
          };
        } catch {
          // Token invalid, continue without auth
        }
      }
    }

    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};

/**
 * Admin-only middleware - requires admin claim
 */
export const adminMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    if (admin.apps.length > 0) {
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      if (!decodedToken.admin) {
        res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
        return;
      }

      req.userId = decodedToken.uid;
      req.userEmail = decodedToken.email;
      req.user = {
        id: decodedToken.uid,
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
      
      next();
      return;
    }

    // Development fallback
    if (process.env['NODE_ENV'] === 'development' && token === 'admin-token') {
      req.userId = 'admin-user-id';
      req.userEmail = 'admin@example.com';
      req.user = { id: 'admin-user-id', uid: 'admin-user-id', email: 'admin@example.com' };
      next();
      return;
    }

    res.status(403).json({ error: 'Forbidden' });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

