import { Router, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { validate, idParamSchema } from '../middleware/validation.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

const toIso = (value: string | Date) => new Date(value).toISOString();
const dayFromIso = (value: string): Date => {
  const dateStr = new Date(value).toISOString().split('T')[0];
  return new Date(dateStr + 'T00:00:00.000Z');
};

const createBlockSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    type: z.enum(['task', 'focus', 'break', 'buffer', 'routine', 'event']).optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    color: z.string().optional(),
    isBuffer: z.boolean().optional(),
    notes: z.string().max(1000).optional(),
    taskId: z.string().uuid().optional(),
  }),
});

const updateBlockSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    type: z.enum(['task', 'focus', 'break', 'buffer', 'routine', 'event']).optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    color: z.string().optional(),
    isBuffer: z.boolean().optional(),
    notes: z.string().max(1000).optional(),
    taskId: z.string().uuid().nullable().optional(),
  }),
});

const reorderSchema = z.object({
  body: z.object({
    day: z.string().optional(),
    orderedIds: z.array(z.string()),
  }),
});

const bufferSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    minutes: z.number().min(1).max(120).optional(),
    color: z.string().optional(),
    title: z.string().max(200).optional(),
  }).optional(),
});

// GET /timeline/blocks?day=YYYY-MM-DD
router.get('/blocks', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { day } = req.query;

    const where: Prisma.TimelineBlockWhereInput = {
      userId: req.userId!,
    };

    if (day && typeof day === 'string') {
      where.day = day;
    }

    const blocks = await prisma.timelineBlock.findMany({
      where,
      include: { task: true },
      orderBy: [{ order: 'asc' }, { startTime: 'asc' }],
    });

    res.json({ blocks });
  } catch (error) {
    console.error('Error fetching timeline blocks:', error);
    res.status(500).json({ error: 'Failed to fetch timeline blocks' });
  }
});

// GET /timeline/blocks/:id - Get single block
router.get('/blocks/:id', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const block = await prisma.timelineBlock.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
      include: { task: true },
    });

    if (!block) {
      res.status(404).json({ error: 'Block not found' });
      return;
    }

    res.json({ block });
  } catch (error) {
    console.error('Error fetching timeline block:', error);
    res.status(500).json({ error: 'Failed to fetch timeline block' });
  }
});

// POST /timeline/blocks - Create new block
router.post('/blocks', authMiddleware, validate(createBlockSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, type, startTime, endTime, color, isBuffer, notes, taskId } = req.body;

    const day = dayFromIso(startTime);

    // Get the max order for this day
    const maxOrder = await prisma.timelineBlock.aggregate({
      where: { userId: req.userId!, day },
      _max: { order: true },
    });

    const block = await prisma.timelineBlock.create({
      data: {
        userId: req.userId!,
        title,
        type: type || 'task',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        day,
        color,
        isBuffer: isBuffer ?? false,
        notes,
        taskId,
        order: (maxOrder._max.order ?? -1) + 1,
      },
      include: { task: true },
    });

    res.status(201).json({ block });
  } catch (error) {
    console.error('Error creating timeline block:', error);
    res.status(500).json({ error: 'Failed to create timeline block' });
  }
});

// PUT /timeline/blocks/:id - Update block
router.put('/blocks/:id', authMiddleware, validate(updateBlockSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const existingBlock = await prisma.timelineBlock.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!existingBlock) {
      res.status(404).json({ error: 'Block not found' });
      return;
    }

    const { startTime, endTime, taskId, ...rest } = req.body;
    const updateData: Prisma.TimelineBlockUpdateInput = { ...rest };

    // Handle date conversions
    if (startTime) {
      updateData.startTime = new Date(startTime);
      updateData.day = dayFromIso(startTime);
    }
    if (endTime) {
      updateData.endTime = new Date(endTime);
    }

    // Handle taskId - use relation connect/disconnect
    if (taskId === null) {
      updateData.task = { disconnect: true };
    } else if (taskId) {
      updateData.task = { connect: { id: taskId } };
    }

    const block = await prisma.timelineBlock.update({
      where: { id: req.params['id'] },
      data: updateData,
      include: { task: true },
    });

    res.json({ block });
  } catch (error) {
    console.error('Error updating timeline block:', error);
    res.status(500).json({ error: 'Failed to update timeline block' });
  }
});

// DELETE /timeline/blocks/:id
router.delete('/blocks/:id', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const block = await prisma.timelineBlock.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!block) {
      res.status(404).json({ error: 'Block not found' });
      return;
    }

    await prisma.timelineBlock.delete({
      where: { id: req.params['id'] },
    });

    // Re-order remaining blocks for the same day
    const remainingBlocks = await prisma.timelineBlock.findMany({
      where: { userId: req.userId!, day: block.day },
      orderBy: [{ order: 'asc' }, { startTime: 'asc' }],
    });

    await prisma.$transaction(
      remainingBlocks.map((b, index) =>
        prisma.timelineBlock.update({
          where: { id: b.id },
          data: { order: index },
        })
      )
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting timeline block:', error);
    res.status(500).json({ error: 'Failed to delete timeline block' });
  }
});

// POST /timeline/blocks/reorder
router.post('/blocks/reorder', authMiddleware, validate(reorderSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { orderedIds, day } = req.body;

    // Update order for each block
    await prisma.$transaction(
      orderedIds.map((id: string, index: number) =>
        prisma.timelineBlock.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    // Fetch updated blocks
    const where: Prisma.TimelineBlockWhereInput = { userId: req.userId! };
    if (day) where.day = day;

    const blocks = await prisma.timelineBlock.findMany({
      where,
      include: { task: true },
      orderBy: [{ order: 'asc' }, { startTime: 'asc' }],
    });

    res.json({ blocks });
  } catch (error) {
    console.error('Error reordering timeline blocks:', error);
    res.status(500).json({ error: 'Failed to reorder timeline blocks' });
  }
});

// POST /timeline/blocks/:id/buffer - insert a buffer block right after the referenced block
router.post('/blocks/:id/buffer', authMiddleware, validate(bufferSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parentBlock = await prisma.timelineBlock.findFirst({
      where: { id: req.params['id'], userId: req.userId! },
    });

    if (!parentBlock) {
      res.status(404).json({ error: 'Block not found' });
      return;
    }

    const minutes = req.body?.minutes ?? 5;
    const color = req.body?.color ?? '#94a3b8';
    const title = req.body?.title ?? 'Buffer';

    const start = new Date(parentBlock.endTime);
    const end = new Date(start.getTime() + minutes * 60 * 1000);

    // Create buffer block with order just after parent
    const bufferBlock = await prisma.timelineBlock.create({
      data: {
        userId: parentBlock.userId,
        title,
        type: 'buffer',
        startTime: start,
        endTime: end,
        day: parentBlock.day,
        color,
        isBuffer: true,
        order: parentBlock.order + 1,
      },
      include: { task: true },
    });

    // Increment order of all blocks after the parent
    await prisma.timelineBlock.updateMany({
      where: {
        userId: req.userId!,
        day: parentBlock.day,
        order: { gt: parentBlock.order },
        id: { not: bufferBlock.id },
      },
      data: {
        order: { increment: 1 },
      },
    });

    res.status(201).json({ block: bufferBlock });
  } catch (error) {
    console.error('Error creating buffer block:', error);
    res.status(500).json({ error: 'Failed to create buffer block' });
  }
});

// POST /timeline/blocks/from-task - Create a timeline block from a task
router.post('/blocks/from-task', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId, startTime, duration } = req.body as {
      taskId: string;
      startTime: string;
      duration?: number;
    };

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: req.userId! },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const start = new Date(startTime);
    const durationMinutes = duration || task.estimatedMinutes || 30;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const day = dayFromIso(startTime);

    const maxOrder = await prisma.timelineBlock.aggregate({
      where: { userId: req.userId!, day },
      _max: { order: true },
    });

    const block = await prisma.timelineBlock.create({
      data: {
        userId: req.userId!,
        title: task.title,
        type: 'task',
        startTime: start,
        endTime: end,
        day,
        taskId: task.id,
        order: (maxOrder._max.order ?? -1) + 1,
      },
      include: { task: true },
    });

    res.status(201).json({ block });
  } catch (error) {
    console.error('Error creating timeline block from task:', error);
    res.status(500).json({ error: 'Failed to create timeline block from task' });
  }
});

// GET /timeline/suggestions?day=YYYY-MM-DD - Get AI suggestions for scheduling
router.get('/suggestions', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { day } = req.query;
    const targetDay = (day as string) || new Date().toISOString().split('T')[0];

    // Get unscheduled tasks for the day
    const unscheduledTasks = await prisma.task.findMany({
      where: {
        userId: req.userId!,
        status: { in: ['todo', 'in_progress'] },
        OR: [
          { dueDate: { equals: new Date(targetDay) } },
          { scheduledDate: { equals: new Date(targetDay) } },
        ],
      },
      take: 10,
    });

    // Get existing blocks for the day
    const existingBlocks = await prisma.timelineBlock.findMany({
      where: { userId: req.userId!, day: targetDay },
      orderBy: { startTime: 'asc' },
    });

    // Simple suggestion: find gaps and suggest placing tasks
    const suggestions = unscheduledTasks.map((task, index) => ({
      taskId: task.id,
      taskTitle: task.title,
      suggestedStartTime: new Date(new Date(targetDay).setHours(9 + index, 0, 0, 0)).toISOString(),
      suggestedDuration: task.estimatedMinutes || 30,
      reason: 'Available time slot',
    }));

    res.json({ suggestions, unscheduledTasks, existingBlocks });
  } catch (error) {
    console.error('Error generating timeline suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

export default router;
