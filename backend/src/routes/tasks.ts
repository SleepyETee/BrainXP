import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { validate, idParamSchema } from '../middleware/validation.js';
// import { PrismaClient } from '@prisma/client';

const router = Router();
// const prisma = new PrismaClient();

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
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

// Mock task type
interface MockTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  energyRequired: string;
  tags: string[];
  estimatedMinutes?: number;
  dueDate?: string;
  scheduledDate?: string;
  parentTaskId?: string;
  smallestFirstStep?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Mock data for development
const mockTasks: MockTask[] = [
  {
    id: '1',
    userId: 'mock-user-id',
    title: 'Complete project documentation',
    description: 'Write comprehensive docs for the new feature',
    status: 'todo',
    priority: 'important',
    energyRequired: 'medium',
    tags: ['work', 'docs'],
    estimatedMinutes: 60,
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// GET /tasks - Get all tasks for user
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, dueDate, priority } = req.query;
    
    // Filter mock tasks
    let tasks = mockTasks.filter((t) => t.userId === req.userId);
    
    if (status) {
      tasks = tasks.filter((t) => t.status === status);
    }
    
    res.json(apiResponse(tasks));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /tasks/today - Get today's tasks
router.get('/today', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tasks = mockTasks.filter(
      (t) => t.userId === req.userId && 
      (t.dueDate?.startsWith(today) || t.scheduledDate?.startsWith(today)) &&
      t.status !== 'done' && t.status !== 'abandoned'
    );
    
    res.json(apiResponse(tasks));
  } catch (error) {
    console.error('Error fetching today tasks:', error);
    res.status(500).json({ error: 'Failed to fetch today tasks' });
  }
});

// GET /tasks/overdue - Get overdue tasks
router.get('/overdue', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tasks = mockTasks.filter(
      (t) => t.userId === req.userId && 
      t.dueDate && t.dueDate < today &&
      t.status !== 'done' && t.status !== 'abandoned'
    );
    
    res.json(apiResponse(tasks));
  } catch (error) {
    console.error('Error fetching overdue tasks:', error);
    res.status(500).json({ error: 'Failed to fetch overdue tasks' });
  }
});

// GET /tasks/inbox - Get inbox tasks
router.get('/inbox', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tasks = mockTasks.filter(
      (t) => t.userId === req.userId && t.status === 'inbox' && !t.parentTaskId
    );
    
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
    
    const tasks = mockTasks.filter(
      (t) => t.userId === req.userId && 
      (t.title.toLowerCase().includes(query) || t.description?.toLowerCase().includes(query))
    );
    
    res.json(apiResponse(tasks));
  } catch (error) {
    console.error('Error searching tasks:', error);
    res.status(500).json({ error: 'Failed to search tasks' });
  }
});

// GET /tasks/:id - Get single task
router.get('/:id', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const task = mockTasks.find((t) => t.id === req.params['id'] && t.userId === req.userId);
    
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
    const subtasks = mockTasks.filter(
      (t) => t.parentTaskId === req.params['id'] && t.userId === req.userId
    );
    
    res.json(apiResponse(subtasks));
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    res.status(500).json({ error: 'Failed to fetch subtasks' });
  }
});

// POST /tasks - Create new task
router.post('/', authMiddleware, validate(createTaskSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const newTask: MockTask = {
      id: Date.now().toString(),
      userId: req.userId!,
      ...req.body,
      status: req.body.parentTaskId ? 'todo' : 'inbox',
      priority: req.body.priority || 'none',
      energyRequired: req.body.energyRequired || 'medium',
      tags: req.body.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockTasks.push(newTask);
    
    res.status(201).json(apiResponse(newTask));
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// POST /tasks/:id/subtasks - Create subtask
router.post('/:id/subtasks', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parentTask = mockTasks.find((t) => t.id === req.params['id'] && t.userId === req.userId);
    if (!parentTask) {
      res.status(404).json({ error: 'Parent task not found' });
      return;
    }

    const newSubtask: MockTask = {
      id: Date.now().toString(),
      userId: req.userId!,
      ...req.body,
      parentTaskId: req.params['id'],
      status: 'todo',
      priority: req.body.priority || 'none',
      energyRequired: req.body.energyRequired || 'medium',
      tags: req.body.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockTasks.push(newSubtask);
    
    res.status(201).json(apiResponse(newSubtask));
  } catch (error) {
    console.error('Error creating subtask:', error);
    res.status(500).json({ error: 'Failed to create subtask' });
  }
});

// POST /tasks/reorder - Reorder tasks
router.post('/reorder', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskIds } = req.body;
    // In real implementation, update order field for each task
    res.json(apiResponse({ success: true }));
  } catch (error) {
    console.error('Error reordering tasks:', error);
    res.status(500).json({ error: 'Failed to reorder tasks' });
  }
});

// PATCH /tasks/:id - Update task
router.patch('/:id', authMiddleware, validate(updateTaskSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const taskIndex = mockTasks.findIndex((t) => t.id === req.params['id'] && t.userId === req.userId);
    
    if (taskIndex === -1) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    mockTasks[taskIndex] = {
      ...mockTasks[taskIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    
    res.json(apiResponse(mockTasks[taskIndex]));
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /tasks/:id - Delete task
router.delete('/:id', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const taskIndex = mockTasks.findIndex((t) => t.id === req.params['id'] && t.userId === req.userId);
    
    if (taskIndex === -1) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    mockTasks.splice(taskIndex, 1);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// POST /tasks/:id/complete - Complete task and award XP
router.post('/:id/complete', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const taskIndex = mockTasks.findIndex((t) => t.id === req.params['id'] && t.userId === req.userId);
    const task = mockTasks[taskIndex];
    
    if (taskIndex === -1 || !task) {
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
    
    const updatedTask: MockTask = {
      ...task,
      status: 'done',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockTasks[taskIndex] = updatedTask;
    
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
    const taskIndex = mockTasks.findIndex((t) => t.id === req.params['id'] && t.userId === req.userId);
    const task = mockTasks[taskIndex];
    
    if (taskIndex === -1 || !task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    const updatedTask: MockTask = {
      ...task,
      status: 'todo',
      completedAt: undefined,
      updatedAt: new Date().toISOString(),
    };
    
    mockTasks[taskIndex] = updatedTask;
    
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
    const taskIndex = mockTasks.findIndex((t) => t.id === req.params['id'] && t.userId === req.userId);
    const task = mockTasks[taskIndex];
    
    if (taskIndex === -1 || !task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    const updatedTask: MockTask = {
      ...task,
      scheduledDate: snoozeUntil,
      updatedAt: new Date().toISOString(),
    };
    
    mockTasks[taskIndex] = updatedTask;
    
    res.json(apiResponse(updatedTask));
  } catch (error) {
    console.error('Error snoozing task:', error);
    res.status(500).json({ error: 'Failed to snooze task' });
  }
});

// POST /tasks/:id/decompose - AI decompose task (calls AI router internally)
router.post('/:id/decompose', authMiddleware, validate(idParamSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const task = mockTasks.find((t) => t.id === req.params['id'] && t.userId === req.userId);
    
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
    const { steps } = req.body;
    const parentTask = mockTasks.find((t) => t.id === req.params['id'] && t.userId === req.userId);
    
    if (!parentTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    const createdSubtasks: MockTask[] = steps.map((step: { title: string; estimatedMinutes?: number; order: number }, index: number) => {
      const subtask: MockTask = {
        id: `${Date.now()}-${index}`,
        userId: req.userId!,
        title: step.title,
        parentTaskId: req.params['id'],
        status: 'todo',
        priority: 'none',
        energyRequired: 'medium',
        tags: [],
        estimatedMinutes: step.estimatedMinutes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockTasks.push(subtask);
      return subtask;
    });
    
    // Mark parent as having used AI decomposition
    const parentIndex = mockTasks.findIndex((t) => t.id === req.params['id']);
    if (parentIndex !== -1) {
      (mockTasks[parentIndex] as MockTask & { aiDecompositionUsed?: boolean }).aiDecompositionUsed = true;
    }
    
    res.json(apiResponse(createdSubtasks));
  } catch (error) {
    console.error('Error applying decomposition:', error);
    res.status(500).json({ error: 'Failed to apply decomposition' });
  }
});

export default router;
