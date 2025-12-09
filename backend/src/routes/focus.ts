import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { validate, idParamSchema } from '../middleware/validation.js';

const router = Router();

// Validation schemas
const startSessionSchema = z.object({
  body: z.object({
    taskId: z.string().uuid().optional(),
    taskDescription: z.string().min(1).max(200),
    plannedDuration: z.number().min(1).max(480),
    backgroundSound: z.string().optional(),
  }),
});

const endSessionSchema = z.object({
  body: z.object({
    actualDuration: z.number().min(0),
    qualityRating: z.number().min(1).max(5).optional(),
    completedTask: z.boolean().optional(),
    interruptions: z.array(z.object({
      type: z.string(),
      timestamp: z.string(),
      duration: z.number().optional(),
    })).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

// Mock data
const mockSessions: any[] = [];

// GET /focus/sessions - Get user's focus sessions
router.get('/sessions', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    let sessions = mockSessions.filter((s) => s.userId === req.userId);
    
    if (startDate) {
      sessions = sessions.filter((s) => new Date(s.startTime) >= new Date(startDate as string));
    }
    if (endDate) {
      sessions = sessions.filter((s) => new Date(s.startTime) <= new Date(endDate as string));
    }
    
    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch focus sessions' });
  }
});

// GET /focus/stats - Get focus stats
router.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const sessions = mockSessions.filter((s) => s.userId === req.userId && s.endTime);
    
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.actualDuration || 0), 0);
    const totalSessions = sessions.length;
    const avgDuration = totalSessions > 0 ? totalMinutes / totalSessions : 0;
    const avgRating = sessions.filter((s) => s.qualityRating).length > 0
      ? sessions.reduce((acc, s) => acc + (s.qualityRating || 0), 0) / sessions.filter((s) => s.qualityRating).length
      : 0;
    
    // Today's stats
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter((s) => s.startTime.startsWith(today));
    const todayMinutes = todaySessions.reduce((acc, s) => acc + (s.actualDuration || 0), 0);
    
    res.json({
      totalMinutes,
      totalSessions,
      avgDuration: Math.round(avgDuration),
      avgRating: Math.round(avgRating * 10) / 10,
      todayMinutes,
      todaySessions: todaySessions.length,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch focus stats' });
  }
});

// POST /focus/sessions - Start new focus session
router.post('/sessions', authMiddleware, validate(startSessionSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const newSession = {
      id: Date.now().toString(),
      userId: req.userId!,
      ...req.body,
      startTime: new Date().toISOString(),
      xpEarned: 0,
    };
    
    mockSessions.push(newSession);
    
    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start focus session' });
  }
});

// POST /focus/sessions/:id/end - End focus session
router.post('/sessions/:id/end', authMiddleware, validate(endSessionSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const sessionIndex = mockSessions.findIndex(
      (s) => s.id === req.params['id'] && s.userId === req.userId
    );
    
    if (sessionIndex === -1) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    
    const session = mockSessions[sessionIndex];
    const { actualDuration, qualityRating, completedTask, interruptions } = req.body;
    
    // Calculate XP based on session
    let xpEarned = 15; // Base XP for any session
    
    // Bonus for longer sessions
    if (actualDuration >= 25) xpEarned += 5;
    if (actualDuration >= 45) xpEarned += 10;
    if (actualDuration >= 60) xpEarned += 10;
    
    // Bonus for high quality rating
    if (qualityRating && qualityRating >= 4) xpEarned += 5;
    
    // Bonus for completing associated task
    if (completedTask) xpEarned += 15;
    
    // Penalty for many interruptions (but still positive)
    if (interruptions && interruptions.length > 3) {
      xpEarned = Math.max(10, xpEarned - 5);
    }
    
    mockSessions[sessionIndex] = {
      ...session,
      endTime: new Date().toISOString(),
      actualDuration,
      qualityRating,
      completedTask,
      interruptions,
      xpEarned,
    };
    
    res.json({
      session: mockSessions[sessionIndex],
      xpEarned,
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end focus session' });
  }
});

export default router;
