import { Router, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { validate, idParamSchema } from '../middleware/validation.js';
import { upshiftService } from '../services/upshift.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Helper to wrap responses in expected format
const apiResponse = <T>(data: T) => ({ data });

// Validation schemas
const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    dueDate: z.string().datetime().optional(),
    dueTime: z.string().optional(),
    estimatedMinutes: z.number().min(1).max(480).optional(),
    priority: z.enum(['urgent_important', 'important', 'urgent', 'low', 'none']).optional(),
    energyRequired: z.enum(['low', 'medium', 'high']).optional(),
    tags: z.array(z.string()).optional(),
    parentTaskId: z.string().uuid().optional(),
    smallestFirstStep: z.string().max(200).optional(),
    listId: z.string().optional(),
  }),
});

const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(['inbox', 'todo', 'in_progress', 'waiting', 'done', 'abandoned']).optional(),
    dueDate: z.string().datetime().nullable().optional(),
    dueTime: z.string().nullable().optional(),
    estimatedMinutes: z.number().min(1).max(480).nullable().optional(),
    priority: z.enum(['urgent_important', 'important', 'urgent', 'low', 'none']).optional(),
    energyRequired: z.enum(['low', 'medium', 'high']).optional(),
    tags: z.array(z.string()).optional(),
    smallestFirstStep: z.string().max(200).nullable().optional(),
    listId: z.string().optional(),
    scheduledDate: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    startTime: z.string().nullable().optional(),
    snoozedUntil: z.string().nullable().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

// Helper types
type TaskWithRelations = Prisma.TaskGetPayload<{
  include: { subtasks: true; checklistItems: true; list: true };
}>;

const toIsoDate = (date: Date): string => date.toISOString().split('T')[0] ?? '';

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
};

const emitTaskSync = async (task: TaskWithRelations | Prisma.TaskGetPayload<object>) => {
  const envelope = upshiftService.buildEnvelope('task_sync', {
    id: task.id,
    userId: task.userId,
    title: task.title,
    status: task.status,
    dueDate: task.dueDate?.toISOString(),
    scheduledDate: task.scheduledDate?.toISOString(),
    priority: task.priority,
    tags: task.tags,
    updatedAt: task.updatedAt.toISOString(),
    completedAt: task.completedAt?.toISOString(),
  });
  await upshiftService.send(envelope);
};

const parseQuickAdd = (text: string) => {
  const now = new Date();
  let clean = text;
  const tagMatches = Array.from(text.matchAll(/#([\w-]+)/g));
  const tags: string[] = tagMatches.map((m) => m[1]).filter((t): t is string => t !== undefined);
  clean = clean.replace(/#([\w-]+)/g, '').trim();

  let priority = 'none';
  if (text.includes('!!!')) priority = 'urgent_important';
  else if (text.includes('!!')) priority = 'important';
  else if (text.includes('!')) priority = 'urgent';
  clean = clean.replace(/!+/g, '').trim();

  let dueDate: Date | undefined;
  let scheduledDate: Date | undefined;
  const lower = text.toLowerCase();
  if (lower.includes('today')) {
    dueDate = now;
    clean = clean.replace(/today/gi, '').trim();
  } else if (lower.includes('tomorrow')) {
    dueDate = addDays(now, 1);
    clean = clean.replace(/tomorrow/gi, '').trim();
  } else if (lower.includes('next week')) {
    dueDate = addDays(now, 7);
    clean = clean.replace(/next week/gi, '').trim();
  } else if (lower.includes('next 7')) {
    dueDate = addDays(now, 7);
    clean = clean.replace(/next 7( days)?/gi, '').trim();
  }

  if (lower.includes('later')) {
    scheduledDate = addDays(now, 2);
    clean = clean.replace(/later/gi, '').trim();
  }

  return { title: clean.trim(), tags, priority, dueDate, scheduledDate };
};

// GET /tasks - Get all tasks for user
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, dueDate, priority, listId } = req.query;

    const where: Prisma.TaskWhereInput = {
      userId: req.userId!,
      parentTaskId: null, // Only top-level tasks
    };

    if (status) where.status = status as string;
    if (priority) where.priority = priority as string;
    if (listId) where.listId = listId as string;
    if (dueDate) {
      const dateStr = dueDate as string;
      const start = new Date(dateStr);
      const end = new Date(dateStr);
      end.setDate(end.getDate() + 1);
      where.dueDate = { gte: start, lt: end };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: { subtasks: true, checklistItems: true, list: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    res.json(apiResponse(tasks));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /tasks/today - Get today's tasks
router.get('/today', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = addDays(today, 1);

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.userId!,
        status: { notIn: ['done', 'abandoned'] },
        OR: [
          { dueDate: { gte: today, lt: tomorrow } },
          { scheduledDate: { gte: today, lt: tomorrow } },
        ],
      },
      include: { subtasks: true, checklistItems: true },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
    });

    res.json(apiResponse(tasks));
  } catch (error) {
    console.error('Error fetching today tasks:', error);
    res.status(500).json({ error: 'Failed to fetch today tasks' });
  }
});

// GET /tasks/overdue - Get overdue tasks
router.get('/overdue', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.userId!,
        status: { notIn: ['done', 'abandoned'] },
        dueDate: { lt: today },
      },
      include: { subtasks: true, checklistItems: true },
      orderBy: { dueDate: 'asc' },
    });

    res.json(apiResponse(tasks));
  } catch (error) {
    console.error('Error fetching overdue tasks:', error);
    res.status(500).json({ error: 'Failed to fetch overdue tasks' });
  }
});

// GET /tasks/inbox - Get inbox tasks
router.get('/inbox', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: req.userId!,
        status: 'inbox',
        parentTaskId: null,
      },
      include: { subtasks: true, checklistItems: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(apiResponse(tasks));
  } catch (error) {
    console.error('Error fetching inbox tasks:', error);
    res.status(500).json({ error: 'Failed to fetch inbox tasks' });
  }
});

// GET /tasks/search - Search tasks
router.get('/search', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    const query = (q as string || '').toLowerCase();

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.userId!,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { subtasks: true, checklistItems: true },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    res.json(apiResponse(tasks));
  } catch (error) {
    console.error('Error searching tasks:', error);
    res.status(500).json({ error: 'Failed to search tasks' });
  }
});

// GET /tasks/lists - Get task lists/projects
router.get('/lists', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const lists = await prisma.taskList.findMany({
      where: { userId: req.userId! },
      orderBy: { order: 'asc' },
      include: { _count: { select: { tasks: true } } },
    });

    res.json(apiResponse({ lists }));
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
});

// GET /tasks/smart-lists - Get smart lists with counts
router.get('/smart-lists', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const smartLists = await prisma.smartList.findMany({
      where: { userId: req.userId! },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'asc' }],
    });

    // Calculate counts for each smart list
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysOut = addDays(today, 7);

    const withCounts = await Promise.all(
      smartLists.map(async (list) => {
        const filters = list.filters as Record<string, unknown>;
        const where: Prisma.TaskWhereInput = { userId: req.userId! };

        // Apply filters based on smart list configuration
        if (filters.statusNot) {
          where.status = { notIn: filters.statusNot as string[] };
        }
        if (filters.due === 'today') {
          const tomorrow = addDays(today, 1);
          where.OR = [
            { dueDate: { gte: today, lt: tomorrow } },
            { scheduledDate: { gte: today, lt: tomorrow } },
          ];
        } else if (filters.due === 'overdue') {
          where.dueDate = { lt: today };
        } else if (filters.due === 'next_7_days') {
          where.dueDate = { gte: today, lte: sevenDaysOut };
        }
        if (filters.priority) {
          where.priority = { in: filters.priority as string[] };
        }

        const count = await prisma.task.count({ where });
        return { ...list, taskCount: count };
      })
    );

    res.json(apiResponse({ smartLists: withCounts }));
  } catch (error) {
    console.error('Error fetching smart lists:', error);
    res.status(500).json({ error: 'Failed to fetch smart lists' });
  }
});

// GET /tasks/smart-lists/:slug - Get tasks for smart list
router.get('/smart-lists/:slug', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const list = await prisma.smartList.findFirst({
      where: { userId: req.userId!, slug: req.params['slug'] },
    });

    if (!list) {
      res.status(404).json({ error: 'Smart list not found' });
      return;
    }

    const filters = list.filters as Record<string, unknown>;
    const where: Prisma.TaskWhereInput = { userId: req.userId! };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysOut = addDays(today, 7);

    if (filters.statusNot) {
      where.status = { notIn: filters.statusNot as string[] };
    }
    if (filters.due === 'today') {
      const tomorrow = addDays(today, 1);
      where.OR = [
        { dueDate: { gte: today, lt: tomorrow } },
        { scheduledDate: { gte: today, lt: tomorrow } },
      ];
    } else if (filters.due === 'overdue') {
      where.dueDate = { lt: today };
    } else if (filters.due === 'next_7_days') {
      where.dueDate = { gte: today, lte: sevenDaysOut };
    }
    if (filters.priority) {
      where.priority = { in: filters.priority as string[] };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: { subtasks: true, checklistItems: true },
      orderBy: { dueDate: 'asc' },
    });

    res.json(apiResponse({ smartList: list, tasks }));
  } catch (error) {
    console.error('Error fetching smart list tasks:', error);
    res.status(500).json({ error: 'Failed to fetch smart list tasks' });
  }
});

// POST /tasks/quick-add - Natural language quick add
router.post('/quick-add', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { text, listId } = req.body as { text: string; listId?: string };
    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    const parsed = parseQuickAdd(text);

    const task = await prisma.task.create({
      data: {
        userId: req.userId!,
        title: parsed.title || text.trim(),
        status: listId ? 'todo' : 'inbox',
        priority: parsed.priority,
        energyRequired: 'medium',
        tags: parsed.tags,
        dueDate: parsed.dueDate,
        scheduledDate: parsed.scheduledDate,
        listId: listId || undefined,
      },
      include: { subtasks: true, checklistItems: true },
    });

    void emitTaskSync(task);

    res.status(201).json(apiResponse({ task, parsed }));
  } catch (error) {
    console.error('Error quick-adding task:', error);
    res.status(500).json({ error: 'Failed to quick add task' });
  }
});

// GET /tasks/widgets/summary - Widget-friendly task summaries
router.get('/widgets/summary', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);

    const [todayTasks, upcomingTasks, lists, widgets] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId: req.userId!,
          status: { notIn: ['done', 'abandoned'] },
          OR: [
            { dueDate: { gte: today, lt: tomorrow } },
            { scheduledDate: { gte: today, lt: tomorrow } },
          ],
        },
        take: 5,
        orderBy: { dueDate: 'asc' },
      }),
      prisma.task.findMany({
        where: {
          userId: req.userId!,
          status: { notIn: ['done', 'abandoned'] },
          dueDate: { gt: today, lte: nextWeek },
        },
        take: 5,
        orderBy: { dueDate: 'asc' },
      }),
      prisma.taskList.findMany({
        where: { userId: req.userId!, isPinned: true },
        orderBy: { order: 'asc' },
      }),
      prisma.widgetPreset.findMany({
        where: { userId: req.userId! },
        orderBy: { order: 'asc' },
      }),
    ]);

    const [todayCount, upcomingCount] = await Promise.all([
      prisma.task.count({
        where: {
          userId: req.userId!,
          status: { notIn: ['done', 'abandoned'] },
          OR: [
            { dueDate: { gte: today, lt: tomorrow } },
            { scheduledDate: { gte: today, lt: tomorrow } },
          ],
        },
      }),
      prisma.task.count({
        where: {
          userId: req.userId!,
          status: { notIn: ['done', 'abandoned'] },
          dueDate: { gt: today, lte: nextWeek },
        },
      }),
    ]);

    res.json(
      apiResponse({
        widgets,
        today: { count: todayCount, tasks: todayTasks },
        next7Days: { count: upcomingCount, tasks: upcomingTasks },
        pinnedLists: lists,
      })
    );
  } catch (error) {
    console.error('Error building widget summary:', error);
    res.status(500).json({ error: 'Failed to build widget summary' });
  }
});

// GET /tasks/:id - Get single task
router.get('/:id', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
      include: { subtasks: true, checklistItems: true, list: true, parentTask: true },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(apiResponse(task));
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// GET /tasks/:id/subtasks - Get subtasks
router.get('/:id/subtasks', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const subtasks = await prisma.task.findMany({
      where: { parentTaskId: req.params['id'], userId: req.userId! },
      include: { checklistItems: true },
      orderBy: { order: 'asc' },
    });

    res.json(apiResponse(subtasks));
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    res.status(500).json({ error: 'Failed to fetch subtasks' });
  }
});

// GET /tasks/:id/checklist - Checklist items
router.get('/:id/checklist', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const items = await prisma.taskChecklistItem.findMany({
      where: { taskId: req.params['id'] },
      orderBy: { order: 'asc' },
    });

    res.json(apiResponse({ items }));
  } catch (error) {
    console.error('Error fetching checklist:', error);
    res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

// POST /tasks - Create new task
router.post('/', authMiddleware, validate(createTaskSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.create({
      data: {
        userId: req.userId!,
        title: req.body.title,
        description: req.body.description,
        status: req.body.parentTaskId ? 'todo' : 'inbox',
        priority: req.body.priority || 'none',
        energyRequired: req.body.energyRequired || 'medium',
        tags: req.body.tags || [],
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        dueTime: req.body.dueTime,
        estimatedMinutes: req.body.estimatedMinutes,
        parentTaskId: req.body.parentTaskId,
        smallestFirstStep: req.body.smallestFirstStep,
        listId: req.body.listId,
      },
      include: { subtasks: true, checklistItems: true },
    });

    void emitTaskSync(task);

    res.status(201).json(apiResponse(task));
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// POST /tasks/:id/subtasks - Create subtask
router.post('/:id/subtasks', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parentTask = await prisma.task.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!parentTask) {
      res.status(404).json({ error: 'Parent task not found' });
      return;
    }

    const subtask = await prisma.task.create({
      data: {
        userId: req.userId!,
        title: req.body.title,
        description: req.body.description,
        parentTaskId: req.params['id'],
        status: 'todo',
        priority: req.body.priority || 'none',
        energyRequired: req.body.energyRequired || 'medium',
        tags: req.body.tags || [],
        listId: parentTask.listId,
        estimatedMinutes: req.body.estimatedMinutes,
      },
      include: { checklistItems: true },
    });

    res.status(201).json(apiResponse(subtask));
  } catch (error) {
    console.error('Error creating subtask:', error);
    res.status(500).json({ error: 'Failed to create subtask' });
  }
});

// POST /tasks/:id/checklist - Add checklist item
router.post('/:id/checklist', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const { title, estimatedMinutes } = req.body as { title: string; estimatedMinutes?: number };
    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const maxOrder = await prisma.taskChecklistItem.aggregate({
      where: { taskId: task.id },
      _max: { order: true },
    });

    const item = await prisma.taskChecklistItem.create({
      data: {
        taskId: task.id,
        title: title.trim(),
        order: (maxOrder._max.order ?? -1) + 1,
        estimatedMinutes,
      },
    });

    res.status(201).json(apiResponse({ item }));
  } catch (error) {
    console.error('Error adding checklist item:', error);
    res.status(500).json({ error: 'Failed to add checklist item' });
  }
});

// PATCH /tasks/:id/checklist/:itemId - Update checklist item
router.patch('/:id/checklist/:itemId', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const item = await prisma.taskChecklistItem.findFirst({
      where: { id: req.params['itemId'], taskId: req.params['id'] },
      include: { task: true },
    });

    if (!item || item.task.userId !== req.userId) {
      res.status(404).json({ error: 'Checklist item not found' });
      return;
    }

    const updates = req.body as { title?: string; isCompleted?: boolean; order?: number };
    const updated = await prisma.taskChecklistItem.update({
      where: { id: req.params['itemId'] },
      data: {
        ...updates,
        completedAt: updates.isCompleted ? new Date() : updates.isCompleted === false ? null : undefined,
      },
    });

    res.json(apiResponse({ item: updated }));
  } catch (error) {
    console.error('Error updating checklist item:', error);
    res.status(500).json({ error: 'Failed to update checklist item' });
  }
});

// POST /tasks/reorder - Reorder tasks
router.post('/reorder', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskIds } = req.body as { taskIds: string[] };

    await prisma.$transaction(
      taskIds.map((id, index) =>
        prisma.task.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    res.json(apiResponse({ success: true }));
  } catch (error) {
    console.error('Error reordering tasks:', error);
    res.status(500).json({ error: 'Failed to reorder tasks' });
  }
});

// PATCH /tasks/:id - Update task
router.patch('/:id', authMiddleware, validate(updateTaskSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const existingTask = await prisma.task.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!existingTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const updateData: Prisma.TaskUpdateInput = { ...req.body };

    // Convert date strings to Date objects
    if (req.body.dueDate !== undefined) {
      updateData.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    }
    if (req.body.scheduledDate !== undefined) {
      updateData.scheduledDate = req.body.scheduledDate ? new Date(req.body.scheduledDate) : null;
    }
    if (req.body.startDate !== undefined) {
      updateData.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
    }
    if (req.body.snoozedUntil !== undefined) {
      updateData.snoozedUntil = req.body.snoozedUntil ? new Date(req.body.snoozedUntil) : null;
    }

    const task = await prisma.task.update({
      where: { id: req.params['id'] },
      data: updateData,
      include: { subtasks: true, checklistItems: true },
    });

    void emitTaskSync(task);

    res.json(apiResponse(task));
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /tasks/:id - Delete task
router.delete('/:id', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    await prisma.task.delete({ where: { id: req.params['id'] } });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// POST /tasks/:id/complete - Complete task and award XP
router.post('/:id/complete', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Calculate XP based on task properties
    let xpEarned = 10; // Base XP
    if (task.priority === 'urgent_important') xpEarned += 20;
    else if (task.priority === 'important') xpEarned += 15;
    else if (task.priority === 'urgent') xpEarned += 10;
    if (task.estimatedMinutes && task.estimatedMinutes > 30) {
      xpEarned += Math.floor(task.estimatedMinutes / 15) * 5;
    }

    const updatedTask = await prisma.task.update({
      where: { id: req.params['id'] },
      data: {
        status: 'done',
        completedAt: new Date(),
      },
      include: { subtasks: true, checklistItems: true },
    });

    // Update user progress
    await prisma.userProgress.upsert({
      where: { userId: req.userId! },
      update: {
        totalXp: { increment: xpEarned },
        tasksCompleted: { increment: 1 },
      },
      create: {
        userId: req.userId!,
        totalXp: xpEarned,
        tasksCompleted: 1,
      },
    });

    // Log XP event
    await prisma.xPEvent.create({
      data: {
        userId: req.userId!,
        amount: xpEarned,
        source: 'task_complete',
        sourceId: task.id,
        description: `Completed task: ${task.title}`,
      },
    });

    void emitTaskSync(updatedTask);

    res.json(apiResponse({
      task: updatedTask,
      xpEarned,
      badgesUnlocked: [],
    }));
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// POST /tasks/:id/uncomplete - Uncomplete task
router.post('/:id/uncomplete', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id: req.params['id'] },
      data: {
        status: 'todo',
        completedAt: null,
      },
      include: { subtasks: true, checklistItems: true },
    });

    res.json(apiResponse(updatedTask));
  } catch (error) {
    console.error('Error uncompleting task:', error);
    res.status(500).json({ error: 'Failed to uncomplete task' });
  }
});

// POST /tasks/:id/snooze - Snooze task
router.post('/:id/snooze', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { snoozeUntil } = req.body;
    const task = await prisma.task.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id: req.params['id'] },
      data: {
        snoozedUntil: snoozeUntil ? new Date(snoozeUntil) : null,
      },
      include: { subtasks: true, checklistItems: true },
    });

    res.json(apiResponse(updatedTask));
  } catch (error) {
    console.error('Error snoozing task:', error);
    res.status(500).json({ error: 'Failed to snooze task' });
  }
});

// POST /tasks/:id/decompose - AI decompose task
router.post('/:id/decompose', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Mock decomposition result (in production, call AI service)
    const result = {
      suggestedSteps: [
        { title: `Research and gather info for: ${task.title.substring(0, 30)}`, estimatedMinutes: 15, order: 1 },
        { title: 'Create a basic outline or plan', estimatedMinutes: 10, order: 2 },
        { title: 'Work on the main content', estimatedMinutes: 25, order: 3 },
        { title: 'Review and polish', estimatedMinutes: 10, order: 4 },
      ],
      smallestFirstStep: `Open your notes and write down 3 things you already know about: ${task.title}`,
      totalEstimatedMinutes: 60,
      motivationalNote: "You've got this! Remember: starting is the hardest part. 💪",
    };

    res.json(apiResponse(result));
  } catch (error) {
    console.error('Error decomposing task:', error);
    res.status(500).json({ error: 'Failed to decompose task' });
  }
});

// POST /tasks/:id/apply-decomposition - Apply decomposition steps as subtasks
router.post('/:id/apply-decomposition', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { steps } = req.body as { steps: { title: string; estimatedMinutes?: number; order: number }[] };
    const parentTask = await prisma.task.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!parentTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const createdSubtasks = await prisma.$transaction(
      steps.map((step, index) =>
        prisma.task.create({
          data: {
            userId: req.userId!,
            title: step.title,
            parentTaskId: req.params['id'],
            status: 'todo',
            priority: 'none',
            energyRequired: 'medium',
            tags: [],
            estimatedMinutes: step.estimatedMinutes,
            listId: parentTask.listId,
            order: index,
          },
        })
      )
    );

    // Mark parent as having used AI decomposition
    await prisma.task.update({
      where: { id: req.params['id'] },
      data: { aiDecompositionUsed: true },
    });

    res.json(apiResponse(createdSubtasks));
  } catch (error) {
    console.error('Error applying decomposition:', error);
    res.status(500).json({ error: 'Failed to apply decomposition' });
  }
});

export default router;
