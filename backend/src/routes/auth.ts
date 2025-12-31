import { Router, Request, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

// Mock user storage (in production, use database)
const users: Map<string, { id: string; email: string; name: string; password: string; createdAt: string }> = new Map();

// Helper to generate mock token
const generateToken = () => `mock_token_${Date.now()}_${Math.random().toString(36).substring(2)}`;

// Default user settings
const defaultSettings = {
  theme: 'auto',
  notificationsEnabled: true,
  hapticFeedback: true,
  soundEffects: true,
  defaultFocusDuration: 25,
  defaultBreakDuration: 5,
  autoStartBreaks: false,
  focusDailyGoal: 120,
  defaultTaskView: 'list',
  showCompletedTasks: false,
  taskSortBy: 'dueDate',
  habitReminderTime: '09:00',
  flexibleStreakWindow: 14,
  progressMetaphor: 'minimal',
  celebrationsEnabled: true,
  analyticsEnabled: true,
};

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password required' });
    return;
  }

  // Check if user exists or auto-create for dev
  let user = Array.from(users.values()).find(u => u.email === email);
  
  if (!user) {
    user = {
      id: `user_${Date.now()}`,
      email,
      name: email.split('@')[0] || 'User',
      password,
      createdAt: new Date().toISOString(),
    };
    users.set(user.id, user);
  } else if (user.password !== password) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  const token = generateToken();

  res.json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt, settings: defaultSettings },
      token,
    },
  });
});

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  const { email, name, password } = req.body || {};

  if (!email || !name || !password) {
    res.status(400).json({ success: false, error: 'Email, name, and password required' });
    return;
  }

  const existingUser = Array.from(users.values()).find(u => u.email === email);
  if (existingUser) {
    res.status(409).json({ success: false, error: 'User already exists' });
    return;
  }

  const user = {
    id: `user_${Date.now()}`,
    email,
    name,
    password,
    createdAt: new Date().toISOString(),
  };
  users.set(user.id, user);

  const token = generateToken();

  res.status(201).json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt, settings: defaultSettings },
      token,
    },
  });
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const user = users.get(userId || '');

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  res.json({
    success: true,
    data: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt, settings: defaultSettings },
  });
});

// PATCH /api/auth/me
router.patch('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const user = users.get(userId || '');

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  if (req.body?.name) user.name = req.body.name;
  users.set(user.id, user);

  res.json({
    success: true,
    data: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt, settings: defaultSettings },
  });
});

// POST /api/auth/refresh
router.post('/refresh', (_req: Request, res: Response) => {
  const token = generateToken();
  res.json({ success: true, data: { token } });
});

export default router;
