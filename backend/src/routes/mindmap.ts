import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

const nodeSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    content: z.string().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
    position: z.object({
      x: z.number(),
      y: z.number(),
      scale: z.number().optional(),
    }),
    taskId: z.string().uuid().optional(),
    noteId: z.string().uuid().optional(),
  }),
});

const updateNodeSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    content: z.string().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
    position: z.object({
      x: z.number(),
      y: z.number().optional(),
      scale: z.number().optional(),
    }).optional(),
    taskId: z.string().uuid().optional(),
    noteId: z.string().uuid().optional(),
  }),
});

const edgeSchema = z.object({
  body: z.object({
    sourceId: z.string(),
    targetId: z.string(),
    label: z.string().optional(),
    style: z.record(z.string(), z.any()).optional(),
  }),
});

router.get('/nodes', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const nodes = await prisma.mindMapNode.findMany({
    where: { userId: req.userId! },
    include: { outgoingEdges: true, incomingEdges: true },
  });
  res.json({ nodes });
});

router.post('/nodes', authMiddleware, validate(nodeSchema), async (req: AuthenticatedRequest, res: Response) => {
  const node = await prisma.mindMapNode.create({
    data: {
      userId: req.userId!,
      title: req.body.title,
      content: req.body.content,
      color: req.body.color,
      icon: req.body.icon,
      position: req.body.position,
      taskId: req.body.taskId,
      noteId: req.body.noteId,
    },
  });
  res.status(201).json({ node });
});

router.put('/nodes/:id', authMiddleware, validate(updateNodeSchema), async (req: AuthenticatedRequest, res: Response) => {
  const nodeId = req.params['id'];
  if (!nodeId) {
    res.status(400).json({ error: 'Node ID is required' });
    return;
  }
  
  const updated = await prisma.mindMapNode.updateMany({
    where: { id: nodeId, userId: req.userId! },
    data: {
      title: req.body.title,
      content: req.body.content,
      color: req.body.color,
      icon: req.body.icon,
      position: req.body.position,
      taskId: req.body.taskId,
      noteId: req.body.noteId,
    },
  });
  if (updated.count === 0) {
    res.status(404).json({ error: 'Node not found' });
    return;
  }
  const node = await prisma.mindMapNode.findUnique({ where: { id: nodeId } });
  res.json({ node });
});

router.delete('/nodes/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const nodeId = req.params['id'];
  if (!nodeId) {
    res.status(400).json({ error: 'Node ID is required' });
    return;
  }
  
  const deleted = await prisma.mindMapNode.deleteMany({
    where: { id: nodeId, userId: req.userId! },
  });
  if (deleted.count === 0) {
    res.status(404).json({ error: 'Node not found' });
    return;
  }
  await prisma.mindMapEdge.deleteMany({
    where: { OR: [{ sourceId: nodeId }, { targetId: nodeId }] },
  });
  res.json({ success: true });
});

router.get('/edges', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const edges = await prisma.mindMapEdge.findMany({
    where: { userId: req.userId! },
  });
  res.json({ edges });
});

router.post('/edges', authMiddleware, validate(edgeSchema), async (req: AuthenticatedRequest, res: Response) => {
  // Ensure source/target belong to user
  const userId = req.userId!;
  const nodes = await prisma.mindMapNode.findMany({
    where: { id: { in: [req.body.sourceId, req.body.targetId] }, userId },
    select: { id: true },
  });
  if (nodes.length !== 2) {
    res.status(400).json({ error: 'Source/target must belong to user' });
    return;
  }

  const edge = await prisma.mindMapEdge.create({
    data: {
      userId,
      sourceId: req.body.sourceId,
      targetId: req.body.targetId,
      label: req.body.label,
      style: req.body.style,
    },
  });
  res.status(201).json({ edge });
});

router.delete('/edges/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const edgeId = req.params['id'];
  if (!edgeId) {
    res.status(400).json({ error: 'Edge ID is required' });
    return;
  }
  
  const deleted = await prisma.mindMapEdge.deleteMany({
    where: { id: edgeId, userId: req.userId! },
  });
  if (deleted.count === 0) {
    res.status(404).json({ error: 'Edge not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
