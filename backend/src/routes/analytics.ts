import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { upshiftService } from '../services/upshift.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Helper to get date range
const getDateRange = (days: number) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// GET /analytics/progress - Get user progress
router.get('/progress', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const progress = await prisma.userProgress.findUnique({
      where: { userId: req.userId! },
    });

    if (!progress) {
      // Return default progress for new users
      res.json({
        progress: {
          totalXp: 0,
          level: 1,
          tasksCompleted: 0,
          focusMinutes: 0,
          habitsLogged: 0,
          routinesCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
      });
      return;
    }

    // Calculate level from XP
    const xpForLevel = (level: number) => Math.floor(100 * Math.pow(1.5, level - 1));
    let level = 1;
    let xpRemaining = progress.totalXp;
    while (xpRemaining >= xpForLevel(level)) {
      xpRemaining -= xpForLevel(level);
      level++;
    }

    res.json({
      progress: {
        ...progress,
        level,
        xpToNextLevel: xpForLevel(level) - xpRemaining,
        xpProgress: xpRemaining,
        xpRequired: xpForLevel(level),
      },
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// GET /analytics/daily - Get daily summary
router.get('/daily', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const dateParam = req.query['date'] as string | undefined;
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const [
      tasksTotal,
      tasksCompleted,
      habitsTotal,
      habitsCompleted,
      focusSessions,
      xpEvents,
      moodEntry,
    ] = await Promise.all([
      // Tasks due/scheduled for this day
      prisma.task.count({
        where: {
          userId: req.userId!,
          OR: [
            { dueDate: { gte: targetDate, lt: nextDay } },
            { scheduledDate: { gte: targetDate, lt: nextDay } },
          ],
        },
      }),
      // Completed tasks
      prisma.task.count({
        where: {
          userId: req.userId!,
          status: 'done',
          completedAt: { gte: targetDate, lt: nextDay },
        },
      }),
      // Habits scheduled for this day of week
      prisma.habit.count({
        where: {
          userId: req.userId!,
          archivedAt: null,
          daysOfWeek: { has: targetDate.getDay() },
        },
      }),
      // Completed habits
      prisma.habitLog.count({
        where: {
          habit: { userId: req.userId! },
          date: { gte: targetDate, lt: nextDay },
          completed: true,
        },
      }),
      // Focus sessions
      prisma.focusSession.findMany({
        where: {
          userId: req.userId!,
          startTime: { gte: targetDate, lt: nextDay },
          endTime: { not: null },
        },
        select: { actualDuration: true },
      }),
      // XP earned
      prisma.xPEvent.aggregate({
        where: {
          userId: req.userId!,
          timestamp: { gte: targetDate, lt: nextDay },
        },
        _sum: { amount: true },
      }),
      // Mood entry
      prisma.moodEntry.findFirst({
        where: {
          userId: req.userId!,
          timestamp: { gte: targetDate, lt: nextDay },
        },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    const focusMinutes = focusSessions.reduce((sum, s) => sum + (s.actualDuration ?? 0), 0);

    res.json({
      summary: {
        date: targetDate.toISOString().split('T')[0],
        tasksCompleted,
        tasksTotal,
        habitsCompleted,
        habitsTotal,
        focusMinutes,
        focusSessions: focusSessions.length,
        xpEarned: xpEvents._sum?.amount ?? 0,
        mood: moodEntry ? {
          level: moodEntry.moodLevel,
          energy: moodEntry.energyLevel,
          descriptor: moodEntry.descriptor,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    res.status(500).json({ error: 'Failed to fetch daily summary' });
  }
});

// GET /analytics/weekly - Get weekly stats
router.get('/weekly', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { start, end } = getDateRange(7);

    // Get daily breakdowns for the week
    const days: string[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      days.push(cursor.toISOString().split('T')[0]);
      cursor.setDate(cursor.getDate() + 1);
    }

    const [tasks, habits, focusSessions, moods, xpTotal] = await Promise.all([
      // Tasks completed per day
      prisma.task.findMany({
        where: {
          userId: req.userId!,
          status: 'done',
          completedAt: { gte: start, lte: end },
        },
        select: { completedAt: true },
      }),
      // Habits completed per day
      prisma.habitLog.findMany({
        where: {
          habit: { userId: req.userId! },
          date: { gte: start, lte: end },
          completed: true,
        },
        select: { date: true },
      }),
      // Focus sessions per day
      prisma.focusSession.findMany({
        where: {
          userId: req.userId!,
          startTime: { gte: start, lte: end },
          endTime: { not: null },
        },
        select: { startTime: true, actualDuration: true },
      }),
      // Mood entries
      prisma.moodEntry.findMany({
        where: {
          userId: req.userId!,
          timestamp: { gte: start, lte: end },
        },
        select: { timestamp: true, moodLevel: true, energyLevel: true },
        orderBy: { timestamp: 'asc' },
      }),
      // Total XP
      prisma.xPEvent.aggregate({
        where: {
          userId: req.userId!,
          timestamp: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
    ]);

    // Build daily stats
    const tasksByDay = days.map((day) => ({
      date: day,
      count: tasks.filter((t) => t.completedAt?.toISOString().startsWith(day)).length,
    }));

    const habitsByDay = days.map((day) => ({
      date: day,
      count: habits.filter((h) => h.date.toISOString().startsWith(day)).length,
    }));

    const focusByDay = days.map((day) => ({
      date: day,
      minutes: focusSessions
        .filter((s) => s.startTime.toISOString().startsWith(day))
        .reduce((sum, s) => sum + (s.actualDuration ?? 0), 0),
    }));

    const moodsByDay = days.map((day) => {
      const dayMoods = moods.filter((m) => m.timestamp.toISOString().startsWith(day));
      if (dayMoods.length === 0) return { date: day, mood: null, energy: null };
      const avgMood = dayMoods.reduce((sum, m) => sum + m.moodLevel, 0) / dayMoods.length;
      const avgEnergy = dayMoods.reduce((sum, m) => sum + (m.energyLevel ?? 0), 0) / dayMoods.length;
      return { date: day, mood: Math.round(avgMood * 10) / 10, energy: Math.round(avgEnergy * 10) / 10 };
    });

    res.json({
      stats: {
        taskCompletion: tasksByDay,
        habitCompletion: habitsByDay,
        focusMinutes: focusByDay,
        moods: moodsByDay,
        totalXp: xpTotal._sum?.amount ?? 0,
        totalTasks: tasks.length,
        totalHabits: habits.length,
        totalFocusMinutes: focusSessions.reduce((sum, s) => sum + (s.actualDuration ?? 0), 0),
      },
    });
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    res.status(500).json({ error: 'Failed to fetch weekly stats' });
  }
});

// GET /analytics/monthly - Get monthly stats
router.get('/monthly', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { start, end } = getDateRange(30);

    const [taskCount, habitCount, focusStats, xpTotal] = await Promise.all([
      prisma.task.count({
        where: {
          userId: req.userId!,
          status: 'done',
          completedAt: { gte: start, lte: end },
        },
      }),
      prisma.habitLog.count({
        where: {
          habit: { userId: req.userId! },
          date: { gte: start, lte: end },
          completed: true,
        },
      }),
      prisma.focusSession.aggregate({
        where: {
          userId: req.userId!,
          startTime: { gte: start, lte: end },
          endTime: { not: null },
        },
        _sum: { actualDuration: true },
        _count: true,
        _avg: { qualityRating: true },
      }),
      prisma.xPEvent.aggregate({
        where: {
          userId: req.userId!,
          timestamp: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      stats: {
        period: '30 days',
        tasksCompleted: taskCount,
        habitsLogged: habitCount,
        focusMinutes: focusStats._sum?.actualDuration ?? 0,
        focusSessions: focusStats._count,
        avgFocusRating: Math.round((focusStats._avg?.qualityRating ?? 0) * 10) / 10,
        totalXp: xpTotal._sum?.amount ?? 0,
      },
    });
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    res.status(500).json({ error: 'Failed to fetch monthly stats' });
  }
});

// GET /analytics/badges - Get badges
router.get('/badges', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [earnedBadges, progress] = await Promise.all([
      prisma.userBadge.findMany({
        where: { userId: req.userId! },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.userProgress.findUnique({
        where: { userId: req.userId! },
      }),
    ]);

    // Define available badges with unlock criteria
    const availableBadges = [
      { id: 'first_task', name: 'Task Starter', description: 'Complete your first task', icon: '✅', xpReward: 50, criteriaKey: 'tasksCompleted', criteriaValue: 1 },
      { id: 'task_10', name: 'Task Master', description: 'Complete 10 tasks', icon: '🏆', xpReward: 100, criteriaKey: 'tasksCompleted', criteriaValue: 10 },
      { id: 'task_50', name: 'Productivity Pro', description: 'Complete 50 tasks', icon: '⭐', xpReward: 250, criteriaKey: 'tasksCompleted', criteriaValue: 50 },
      { id: 'focus_60', name: 'Focus Initiate', description: 'Focus for 60 minutes total', icon: '⏱️', xpReward: 75, criteriaKey: 'focusMinutes', criteriaValue: 60 },
      { id: 'focus_300', name: 'Deep Worker', description: 'Focus for 5 hours total', icon: '🧘', xpReward: 200, criteriaKey: 'focusMinutes', criteriaValue: 300 },
      { id: 'habit_7', name: 'Week Warrior', description: 'Log habits for 7 days', icon: '📅', xpReward: 100, criteriaKey: 'habitsLogged', criteriaValue: 7 },
      { id: 'streak_7', name: 'Hot Streak', description: 'Maintain a 7-day streak', icon: '🔥', xpReward: 150, criteriaKey: 'currentStreak', criteriaValue: 7 },
    ];

    const earnedIds = new Set(earnedBadges.map((b) => b.badge.id));
    const earned = earnedBadges.map((ub) => ({
      ...ub.badge,
      earnedAt: ub.earnedAt,
    }));

    const available = availableBadges
      .filter((b) => !earnedIds.has(b.id))
      .map((b) => {
        const current = progress ? (progress[b.criteriaKey as keyof typeof progress] as number) ?? 0 : 0;
        return {
          ...b,
          progress: Math.min(100, Math.round((current / b.criteriaValue) * 100)),
        };
      });

    res.json({ badges: { earned, available } });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// Helper to calculate badge progress
function calculateBadgeProgress(criteria: Record<string, number>, progress: { tasksCompleted: number; focusMinutes: number; habitsLogged: number; currentStreak: number; totalXp: number }): number {
  const key = Object.keys(criteria)[0] as keyof typeof criteria;
  const required = criteria[key];
  const current = progress[key as keyof typeof progress] ?? 0;
  return Math.min(100, Math.round((current / required) * 100));
}

// POST /analytics/mood - Record mood entry
const moodSchema = z.object({
  body: z.object({
    moodLevel: z.number().min(1).max(5),
    energyLevel: z.number().min(1).max(5).optional(),
    descriptor: z.string().max(100).optional(),
  }),
});

router.post('/mood', authMiddleware, validate(moodSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { moodLevel, energyLevel, descriptor } = req.body;

    const entry = await prisma.moodEntry.create({
      data: {
        userId: req.userId!,
        moodLevel,
        energyLevel: energyLevel ?? moodLevel,
        descriptor,
      },
    });

    // Award XP for logging mood
    const xpEarned = 5;
    await prisma.userProgress.upsert({
      where: { userId: req.userId! },
      update: { totalXp: { increment: xpEarned } },
      create: { userId: req.userId!, totalXp: xpEarned },
    });

    await prisma.xPEvent.create({
      data: {
        userId: req.userId!,
        amount: xpEarned,
        source: 'mood_log',
        sourceId: entry.id,
        description: 'Logged mood',
      },
    });

    res.status(201).json({ entry, xpEarned });
  } catch (error) {
    console.error('Error recording mood:', error);
    res.status(500).json({ error: 'Failed to record mood' });
  }
});

// GET /analytics/moods - Get mood history
router.get('/moods', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query['days'] as string) || 7;
    const { start, end } = getDateRange(days);

    const moods = await prisma.moodEntry.findMany({
      where: {
        userId: req.userId!,
        timestamp: { gte: start, lte: end },
      },
      orderBy: { timestamp: 'desc' },
    });

    res.json({ moods });
  } catch (error) {
    console.error('Error fetching moods:', error);
    res.status(500).json({ error: 'Failed to fetch moods' });
  }
});

// GET /analytics/xp-history - Get XP event history
router.get('/xp-history', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query['limit'] as string) || 50;

    const events = await prisma.xPEvent.findMany({
      where: { userId: req.userId! },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    res.json({ events });
  } catch (error) {
    console.error('Error fetching XP history:', error);
    res.status(500).json({ error: 'Failed to fetch XP history' });
  }
});

// GET /analytics/upshift/status - Check Upshift configuration
router.get('/upshift/status', async (_req, res: Response): Promise<void> => {
  try {
    res.json({
      configured: upshiftService.isConfigured(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check Upshift status' });
  }
});

// POST /analytics/upshift/ping - Fire a test event to Upshift
router.post('/upshift/ping', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const envelope = upshiftService.buildEnvelope('user_sync', {
      id: req.userId,
      source: 'ping',
    });
    const result = await upshiftService.send(envelope);
    res.json({ ok: result.ok, skipped: result.skipped, status: result.status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send ping' });
  }
});

export default router;

