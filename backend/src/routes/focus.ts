import { Router, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { validate, idParamSchema } from '../middleware/validation.js';
import { upshiftService } from '../services/upshift.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Validation schemas
const startSessionSchema = z.object({
  body: z.object({
    taskId: z.string().uuid().optional(),
    timelineBlockId: z.string().uuid().optional(),
    taskDescription: z.string().min(1).max(200),
    plannedDuration: z.number().min(1).max(480),
    backgroundSound: z.string().optional(),
    sessionType: z.enum(['pomodoro', 'deep_work', 'sprint']).optional(),
    breakDuration: z.number().min(1).max(60).optional(),
    longBreakDuration: z.number().min(1).max(60).optional(),
    autoContinue: z.boolean().optional(),
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

const cancelSessionSchema = z.object({
  body: z.object({
    reason: z.string().max(200).optional(),
  }).optional(),
  params: z.object({
    id: z.string().uuid(),
  }),
});

// Preset timers for focus sessions
const presetTimers = [
  { id: 'pomodoro', label: '25/5', work: 25, shortBreak: 5, longBreak: 15, sessions: 4 },
  { id: 'ultra', label: '50/10', work: 50, shortBreak: 10, longBreak: 20, sessions: 3 },
  { id: 'micro', label: '15/3', work: 15, shortBreak: 3, longBreak: 10, sessions: 4 },
];

type FocusSessionWithTask = Prisma.FocusSessionGetPayload<{ include: { task: true } }>;

const emitFocusSync = async (session: FocusSessionWithTask | Prisma.FocusSessionGetPayload<object>) => {
  const envelope = upshiftService.buildEnvelope('focus_session_sync', {
    id: session.id,
    userId: session.userId,
    taskId: session.taskId,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime?.toISOString(),
    actualDuration: session.actualDuration,
    plannedDuration: session.plannedDuration,
    completedTask: session.completedTask,
    interruptions: Array.isArray(session.interruptions) ? session.interruptions.length : 0,
  });
  await upshiftService.send(envelope);
};

// GET /focus/sessions - Get user's focus sessions
router.get('/sessions', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const where: Prisma.FocusSessionWhereInput = {
      userId: req.userId!,
    };

    if (startDate && typeof startDate === 'string') {
      where.startTime = { ...(where.startTime as object), gte: new Date(startDate) };
    }
    if (endDate && typeof endDate === 'string') {
      where.startTime = { ...(where.startTime as object), lte: new Date(endDate) };
    }

    const sessions = await prisma.focusSession.findMany({
      where,
      include: { task: true },
      orderBy: { startTime: 'desc' },
      take: 100,
    });

    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch focus sessions' });
  }
});

// GET /focus/stats - Get focus stats
router.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [allSessions, todaySessions, aggregates] = await Promise.all([
      prisma.focusSession.findMany({
        where: { userId: req.userId!, endTime: { not: null } },
        select: { actualDuration: true, qualityRating: true },
      }),
      prisma.focusSession.findMany({
        where: {
          userId: req.userId!,
          startTime: { gte: today, lt: tomorrow },
          endTime: { not: null },
        },
        select: { actualDuration: true },
      }),
      prisma.focusSession.aggregate({
        where: { userId: req.userId!, endTime: { not: null } },
        _sum: { actualDuration: true },
        _avg: { actualDuration: true, qualityRating: true },
        _count: true,
      }),
    ]);

    const todayMinutes = todaySessions.reduce((acc, s) => acc + (s.actualDuration ?? 0), 0);

    res.json({
      totalMinutes: aggregates._sum.actualDuration ?? 0,
      totalSessions: aggregates._count,
      avgDuration: Math.round(aggregates._avg.actualDuration ?? 0),
      avgRating: Math.round((aggregates._avg.qualityRating ?? 0) * 10) / 10,
      todayMinutes,
      todaySessions: todaySessions.length,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch focus stats' });
  }
});

// GET /focus/presets - Recommended timer presets
router.get('/presets', authMiddleware, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.json({ presets: presetTimers });
});

// GET /focus/widgets/summary - Widget-friendly focus data
router.get('/widgets/summary', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [activeSession, todaySessions] = await Promise.all([
      prisma.focusSession.findFirst({
        where: { userId: req.userId!, endTime: null, status: 'active' },
        include: { task: true },
      }),
      prisma.focusSession.findMany({
        where: {
          userId: req.userId!,
          startTime: { gte: today, lt: tomorrow },
        },
        select: { actualDuration: true, plannedDuration: true, endTime: true },
      }),
    ]);

    const todayMinutes = todaySessions.reduce(
      (acc, s) => acc + (s.actualDuration ?? (s.endTime ? 0 : s.plannedDuration)),
      0
    );

    res.json({
      presets: presetTimers,
      activeSession,
      todayMinutes,
      todaySessions: todaySessions.length,
    });
  } catch (error) {
    console.error('Error fetching focus widget data:', error);
    res.status(500).json({ error: 'Failed to fetch widget data' });
  }
});

// POST /focus/sessions - Start new focus session
router.post('/sessions', authMiddleware, validate(startSessionSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Cancel any existing active sessions first
    await prisma.focusSession.updateMany({
      where: { userId: req.userId!, status: 'active', endTime: null },
      data: { status: 'cancelled', endTime: new Date(), outcome: 'auto_cancelled' },
    });

    const session = await prisma.focusSession.create({
      data: {
        userId: req.userId!,
        taskId: req.body.taskId,
        timelineBlockId: req.body.timelineBlockId,
        taskDescription: req.body.taskDescription,
        plannedDuration: req.body.plannedDuration,
        sessionType: req.body.sessionType || 'pomodoro',
        breakDuration: req.body.breakDuration ?? 5,
        longBreakDuration: req.body.longBreakDuration ?? 15,
        autoContinue: req.body.autoContinue ?? false,
        backgroundSound: req.body.backgroundSound,
        status: 'active',
      },
      include: { task: true },
    });

    void emitFocusSync(session);

    res.status(201).json(session);
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start focus session' });
  }
});

// GET /focus/sessions/:id - Get single session
router.get('/sessions/:id', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const session = await prisma.focusSession.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
      include: { task: true },
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ session });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch focus session' });
  }
});

// POST /focus/sessions/:id/end - End focus session
router.post('/sessions/:id/end', authMiddleware, validate(endSessionSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const existingSession = await prisma.focusSession.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!existingSession) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

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

    const outcome = completedTask
      ? 'completed_task'
      : actualDuration < existingSession.plannedDuration
        ? 'stopped_early'
        : 'completed';

    const session = await prisma.focusSession.update({
      where: { id: req.params['id'] },
      data: {
        endTime: new Date(),
        actualDuration,
        qualityRating,
        completedTask: completedTask ?? false,
        interruptions: interruptions ?? [],
        xpEarned,
        status: 'completed',
        outcome,
      },
      include: { task: true },
    });

    // Update user progress
    await prisma.userProgress.upsert({
      where: { userId: req.userId! },
      update: {
        totalXp: { increment: xpEarned },
        focusMinutes: { increment: actualDuration },
      },
      create: {
        userId: req.userId!,
        totalXp: xpEarned,
        focusMinutes: actualDuration,
      },
    });

    // Log XP event
    await prisma.xPEvent.create({
      data: {
        userId: req.userId!,
        amount: xpEarned,
        source: 'focus_session',
        sourceId: session.id,
        description: `Completed ${actualDuration}min focus session`,
      },
    });

    void emitFocusSync(session);

    res.json({ session, xpEarned });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end focus session' });
  }
});

// POST /focus/sessions/:id/cancel - Cancel focus session
router.post('/sessions/:id/cancel', authMiddleware, validate(cancelSessionSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const existingSession = await prisma.focusSession.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!existingSession) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const outcome = req.body?.reason ? `cancelled:${req.body.reason}` : 'cancelled';

    const session = await prisma.focusSession.update({
      where: { id: req.params['id'] },
      data: {
        endTime: new Date(),
        status: 'cancelled',
        outcome,
      },
      include: { task: true },
    });

    void emitFocusSync(session);

    res.json({ session });
  } catch (error) {
    console.error('Error cancelling session:', error);
    res.status(500).json({ error: 'Failed to cancel focus session' });
  }
});

// POST /focus/sessions/:id/extend - Extend focus session
router.post('/sessions/:id/extend', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { minutes } = req.body as { minutes: number };

    const existingSession = await prisma.focusSession.findFirst({
      where: { id: req.params['id'], userId: req.userId!, status: 'active' },
    });

    if (!existingSession) {
      res.status(404).json({ error: 'Active session not found' });
      return;
    }

    const session = await prisma.focusSession.update({
      where: { id: req.params['id'] },
      data: {
        plannedDuration: existingSession.plannedDuration + (minutes || 10),
        status: 'extended',
      },
      include: { task: true },
    });

    res.json({ session });
  } catch (error) {
    console.error('Error extending session:', error);
    res.status(500).json({ error: 'Failed to extend focus session' });
  }
});

// POST /focus/sessions/:id/interruption - Log an interruption
router.post('/sessions/:id/interruption', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type, duration } = req.body as { type: string; duration?: number };

    const existingSession = await prisma.focusSession.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!existingSession) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const currentInterruptions = (existingSession.interruptions as Array<{ type: string; timestamp: string; duration?: number }>) || [];
    const newInterruption = {
      type,
      timestamp: new Date().toISOString(),
      duration,
    };

    const session = await prisma.focusSession.update({
      where: { id: req.params['id'] },
      data: {
        interruptions: [...currentInterruptions, newInterruption],
      },
      include: { task: true },
    });

    res.json({ session, interruption: newInterruption });
  } catch (error) {
    console.error('Error logging interruption:', error);
    res.status(500).json({ error: 'Failed to log interruption' });
  }
});

export default router;
