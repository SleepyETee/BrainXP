import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { validate, idParamSchema } from '../middleware/validation.js';

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
    anchorDescription: z.string().max(200).optional(),
    preferredTime: z.string().optional(),
    reminderEnabled: z.boolean().optional(),
    reminderTime: z.string().optional(),
    allowPartialCredit: z.boolean().optional(),
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

// Mock data
const mockHabits: any[] = [
  {
    id: '1',
    userId: 'mock-user-id',
    name: 'Morning Meditation',
    icon: '🧘',
    color: '#3B82F6',
    frequencyType: 'daily',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    allowPartialCredit: true,
    reminderEnabled: false,
    createdAt: new Date().toISOString(),
  },
];

const mockLogs: any[] = [];

// GET /habits - Get all habits for user
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const habits = mockHabits.filter((h) => h.userId === req.userId);
    const today = new Date().toISOString().split('T')[0];
    
    // Attach today's log and stats to each habit
    const habitsWithLogs = habits.map((habit) => {
      const logs = mockLogs.filter((l) => l.habitId === habit.id);
      const todayLog = logs.find((l) => l.date.startsWith(today));
      
      // Calculate streak
      let currentStreak = 0;
      const sortedLogs = logs
        .filter((l) => l.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Simple streak calculation
      for (const log of sortedLogs) {
        if (log.completed) currentStreak++;
        else break;
      }
      
      return {
        ...habit,
        logs,
        todayLog,
        currentStreak,
        completionRate: logs.length > 0 
          ? logs.filter((l) => l.completed).length / logs.length 
          : 0,
      };
    });
    
    res.json({ habits: habitsWithLogs });
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// POST /habits - Create new habit
router.post('/', authMiddleware, validate(createHabitSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const newHabit = {
      id: Date.now().toString(),
      userId: req.userId!,
      ...req.body,
      frequencyType: req.body.frequencyType || 'daily',
      daysOfWeek: req.body.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
      targetCount: req.body.targetCount || 1,
      allowPartialCredit: req.body.allowPartialCredit ?? true,
      createdAt: new Date().toISOString(),
    };
    
    mockHabits.push(newHabit);
    
    res.status(201).json(newHabit);
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// POST /habits/:id/log - Log habit completion
router.post('/:id/log', authMiddleware, validate(logHabitSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const habit = mockHabits.find((h) => h.id === req.params['id'] && h.userId === req.userId);
    
    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }
    
    const { date, completed, partialCredit, note } = req.body;
    
    // Check if log already exists for this date
    const existingLogIndex = mockLogs.findIndex(
      (l) => l.habitId === habit.id && l.date.startsWith(date)
    );
    
    let xpEarned = 0;
    
    if (existingLogIndex !== -1) {
      // Update existing log
      mockLogs[existingLogIndex] = {
        ...mockLogs[existingLogIndex],
        completed,
        partialCredit,
        note,
      };
    } else {
      // Create new log
      const newLog = {
        id: Date.now().toString(),
        habitId: habit.id,
        date,
        completed,
        partialCredit,
        note,
        createdAt: new Date().toISOString(),
      };
      mockLogs.push(newLog);
      
      // Award XP for new completion
      if (completed) {
        xpEarned = 10;
      } else if (partialCredit && partialCredit > 0) {
        xpEarned = Math.round(5 * partialCredit);
      }
    }
    
    res.json({
      log: mockLogs.find((l) => l.habitId === habit.id && l.date.startsWith(date)),
      xpEarned,
    });
  } catch (error) {
    console.error('Error logging habit:', error);
    res.status(500).json({ error: 'Failed to log habit' });
  }
});

// DELETE /habits/:id - Delete/archive habit
router.delete('/:id', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const habitIndex = mockHabits.findIndex(
      (h) => h.id === req.params['id'] && h.userId === req.userId
    );
    
    if (habitIndex === -1) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }
    
    // Soft delete (archive)
    mockHabits[habitIndex].archivedAt = new Date().toISOString();
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

export default router;
