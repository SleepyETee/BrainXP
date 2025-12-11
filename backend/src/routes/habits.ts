import { Router, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { validate, idParamSchema } from '../middleware/validation.js';
import { upshiftService } from '../services/upshift.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Validation schemas
const createHabitSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    icon: z.string().optional(),
    color: z.string().optional(),
    frequencyType: z.enum(['daily', 'weekly', 'specific_days']).optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    targetCount: z.number().min(1).max(100).optional(),
    anchorHabitId: z.string().uuid().optional(),
    anchorDescription: z.string().max(200).optional(),
    preferredTime: z.string().optional(),
    reminderEnabled: z.boolean().optional(),
    reminderTime: z.string().optional(),
    allowPartialCredit: z.boolean().optional(),
  }),
});

const updateHabitSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    frequencyType: z.enum(['daily', 'weekly', 'specific_days']).optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    targetCount: z.number().min(1).max(100).optional(),
    anchorHabitId: z.string().uuid().nullable().optional(),
    anchorDescription: z.string().max(200).nullable().optional(),
    preferredTime: z.string().nullable().optional(),
    reminderEnabled: z.boolean().optional(),
    reminderTime: z.string().nullable().optional(),
    allowPartialCredit: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

const logHabitSchema = z.object({
  body: z.object({
    date: z.string(),
    completed: z.boolean(),
    partialCredit: z.number().min(0).max(1).optional(),
    note: z.string().max(500).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

type HabitWithLogs = Prisma.HabitGetPayload<{ include: { logs: true } }>;

const todayIso = () => new Date().toISOString().split('T')[0] ?? '';

const emitHabitSync = async (habit: HabitWithLogs | Prisma.HabitGetPayload<object>) => {
  const envelope = upshiftService.buildEnvelope('habit_sync', {
    id: habit.id,
    userId: habit.userId,
    name: habit.name,
    frequencyType: habit.frequencyType,
    daysOfWeek: habit.daysOfWeek,
    targetCount: habit.targetCount,
    reminderTime: habit.reminderTime,
    archivedAt: habit.archivedAt?.toISOString(),
  });
  await upshiftService.send(envelope);
};

const emitHabitLogSync = async (log: Prisma.HabitLogGetPayload<object>, userId: string) => {
  const envelope = upshiftService.buildEnvelope('habit_sync', {
    habitId: log.habitId,
    userId,
    date: log.date.toISOString(),
    completed: log.completed,
    partialCredit: log.partialCredit,
    note: log.note,
  });
  await upshiftService.send(envelope);
};

const calculateStreak = async (habitId: string): Promise<number> => {
  const logs = await prisma.habitLog.findMany({
    where: { habitId, completed: true },
    orderBy: { date: 'desc' },
    take: 365, // Limit to last year
  });

  if (logs.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = new Date(today);

  for (const log of logs) {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);

    if (logDate.getTime() === cursor.getTime()) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (logDate.getTime() < cursor.getTime()) {
      // Gap in streak
      break;
    }
  }

  return streak;
};

// GET /habits - Get all habits for user
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const habits = await prisma.habit.findMany({
      where: {
        userId: req.userId!,
        archivedAt: null,
      },
      include: {
        logs: {
          orderBy: { date: 'desc' },
          take: 30, // Last 30 logs for stats
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Attach today's log and stats to each habit
    const habitsWithStats = await Promise.all(
      habits.map(async (habit) => {
        const todayLog = habit.logs.find((l) => {
          const logDate = new Date(l.date);
          logDate.setHours(0, 0, 0, 0);
          return logDate.getTime() === today.getTime();
        });

        const currentStreak = await calculateStreak(habit.id);
        const completedLogs = habit.logs.filter((l) => l.completed);
        const completionRate = habit.logs.length > 0
          ? completedLogs.length / habit.logs.length
          : 0;

        return {
          ...habit,
          todayLog,
          currentStreak,
          completionRate,
        };
      })
    );

    res.json({ habits: habitsWithStats });
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// GET /habits/summary - Lightweight widget-friendly stats
router.get('/summary', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalHabits, completedToday, allLogs] = await Promise.all([
      prisma.habit.count({
        where: { userId: req.userId!, archivedAt: null },
      }),
      prisma.habitLog.count({
        where: {
          habit: { userId: req.userId! },
          date: { gte: today, lt: tomorrow },
          completed: true,
        },
      }),
      prisma.habitLog.findMany({
        where: { habit: { userId: req.userId! } },
        select: { completed: true },
        take: 100,
      }),
    ]);

    // Find longest streak among all habits
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId!, archivedAt: null },
      select: { id: true },
    });

    let longestStreak = 0;
    for (const habit of habits) {
      const streak = await calculateStreak(habit.id);
      if (streak > longestStreak) longestStreak = streak;
    }

    const completionRate = allLogs.length > 0
      ? allLogs.filter((l) => l.completed).length / allLogs.length
      : 0;

    res.json({
      totalHabits,
      completedToday,
      longestStreak,
      completionRate,
    });
  } catch (error) {
    console.error('Error fetching habit summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// GET /habits/:id - Get single habit
router.get('/:id', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const habit = await prisma.habit.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
      include: { logs: { orderBy: { date: 'desc' }, take: 30 } },
    });

    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    const currentStreak = await calculateStreak(habit.id);

    res.json({ habit: { ...habit, currentStreak } });
  } catch (error) {
    console.error('Error fetching habit:', error);
    res.status(500).json({ error: 'Failed to fetch habit' });
  }
});

// GET /habits/:id/calendar - Month view data
router.get('/:id/calendar', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const habit = await prisma.habit.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    const monthQuery = req.query['month'] as string | undefined; // format YYYY-MM
    const defaultMonth = todayIso().slice(0, 7);
    const monthPrefix = monthQuery || defaultMonth;

    // Parse month to get date range
    const [year, month] = monthPrefix.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const logs = await prisma.habitLog.findMany({
      where: {
        habitId: habit.id,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    res.json({ habit, logs, month: monthPrefix });
  } catch (error) {
    console.error('Error fetching habit calendar:', error);
    res.status(500).json({ error: 'Failed to fetch habit calendar' });
  }
});

// POST /habits - Create new habit
router.post('/', authMiddleware, validate(createHabitSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const habit = await prisma.habit.create({
      data: {
        userId: req.userId!,
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color,
        frequencyType: req.body.frequencyType || 'daily',
        daysOfWeek: req.body.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
        targetCount: req.body.targetCount || 1,
        anchorHabitId: req.body.anchorHabitId,
        anchorDescription: req.body.anchorDescription,
        preferredTime: req.body.preferredTime,
        reminderEnabled: req.body.reminderEnabled ?? false,
        reminderTime: req.body.reminderTime,
        allowPartialCredit: req.body.allowPartialCredit ?? true,
      },
      include: { logs: true },
    });

    void emitHabitSync(habit);

    res.status(201).json(habit);
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// PATCH /habits/:id - Update habit
router.patch('/:id', authMiddleware, validate(updateHabitSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const existingHabit = await prisma.habit.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!existingHabit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    const habit = await prisma.habit.update({
      where: { id: req.params['id'] },
      data: req.body,
      include: { logs: { orderBy: { date: 'desc' }, take: 30 } },
    });

    void emitHabitSync(habit);

    res.json(habit);
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

// POST /habits/:id/log - Log habit completion
router.post('/:id/log', authMiddleware, validate(logHabitSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const habit = await prisma.habit.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    const { date, completed, partialCredit, note } = req.body;
    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);

    // Upsert the log (create or update)
    const log = await prisma.habitLog.upsert({
      where: {
        habitId_date: {
          habitId: habit.id,
          date: logDate,
        },
      },
      update: {
        completed,
        partialCredit,
        note,
      },
      create: {
        habitId: habit.id,
        date: logDate,
        completed,
        partialCredit,
        note,
      },
    });

    // Calculate XP earned
    let xpEarned = 0;
    if (completed) {
      xpEarned = 10;
    } else if (partialCredit && partialCredit > 0) {
      xpEarned = Math.round(5 * partialCredit);
    }

    // Update user progress if XP earned
    if (xpEarned > 0) {
      await prisma.userProgress.upsert({
        where: { userId: req.userId! },
        update: {
          totalXp: { increment: xpEarned },
          habitsLogged: { increment: 1 },
        },
        create: {
          userId: req.userId!,
          totalXp: xpEarned,
          habitsLogged: 1,
        },
      });

      // Log XP event
      await prisma.xPEvent.create({
        data: {
          userId: req.userId!,
          amount: xpEarned,
          source: completed ? 'habit_log' : 'habit_partial',
          sourceId: habit.id,
          description: `Logged habit: ${habit.name}`,
        },
      });
    }

    void emitHabitLogSync(log, req.userId!);

    res.json({ log, xpEarned });
  } catch (error) {
    console.error('Error logging habit:', error);
    res.status(500).json({ error: 'Failed to log habit' });
  }
});

// DELETE /habits/:id - Delete/archive habit
router.delete('/:id', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const habit = await prisma.habit.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    // Soft delete (archive)
    await prisma.habit.update({
      where: { id: req.params['id'] },
      data: { archivedAt: new Date() },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

export default router;
