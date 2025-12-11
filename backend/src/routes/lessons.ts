import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

const seedLessons = async () => {
  await prisma.lesson.upsert({
    where: { slug: 'cbt-basics' },
    update: {},
    create: {
      slug: 'cbt-basics',
      title: 'CBT for Attention',
      summary: 'Learn a quick ABC model to reframe distractions.',
      content: 'Short lesson content...',
      durationMin: 8,
      tags: ['cbt', 'focus'],
    },
  });
};

const reflectionSchema = z.object({
  body: z.object({
    lessonId: z.string(),
    response: z.string().min(1),
    moodLevel: z.number().min(1).max(5).optional(),
  }),
});

const commentSchema = z.object({
  body: z.object({
    lessonId: z.string(),
    threadId: z.string().optional(),
    content: z.string().min(1),
    moodSignal: z.number().min(1).max(5).optional(),
  }),
});

router.get('/', authMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  await seedLessons();
  const lessons = await prisma.lesson.findMany({ where: { published: true } });
  res.json({ lessons });
});

router.get('/:slug', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const slug = req.params['slug'];
  if (!slug) {
    res.status(400).json({ error: 'Slug is required' });
    return;
  }
  const lesson = await prisma.lesson.findUnique({ where: { slug } });
  if (!lesson) {
    res.status(404).json({ error: 'Lesson not found' });
    return;
  }
  res.json({ lesson });
});

router.post('/reflections', authMiddleware, validate(reflectionSchema), async (req: AuthenticatedRequest, res: Response) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: req.body.lessonId } });
  if (!lesson) {
    res.status(404).json({ error: 'Lesson not found' });
    return;
  }
  const reflection = await prisma.lessonReflection.create({
    data: {
      lessonId: lesson.id,
      userId: req.userId!,
      response: req.body.response,
      moodLevel: req.body.moodLevel,
    },
  });
  res.status(201).json({ reflection });
});

router.get('/:slug/reflections', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const slug = req.params['slug'];
  if (!slug) {
    res.status(400).json({ error: 'Slug is required' });
    return;
  }
  const lesson = await prisma.lesson.findUnique({ where: { slug } });
  if (!lesson) {
    res.status(404).json({ error: 'Lesson not found' });
    return;
  }
  const reflections = await prisma.lessonReflection.findMany({
    where: { lessonId: lesson.id, userId: req.userId! },
    orderBy: { submittedAt: 'desc' },
  });
  res.json({ reflections });
});

router.post('/comments', authMiddleware, validate(commentSchema), async (req: AuthenticatedRequest, res: Response) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: req.body.lessonId } });
  if (!lesson) {
    res.status(404).json({ error: 'Lesson not found' });
    return;
  }

  let threadId = req.body.threadId;
  if (!threadId) {
    const thread = await prisma.lessonThread.create({
      data: {
        lessonId: lesson.id,
        userId: req.userId!,
        title: 'General',
      },
    });
    threadId = thread.id;
  }

  const comment = await prisma.lessonComment.create({
    data: {
      threadId,
      userId: req.userId!,
      content: req.body.content,
      moodSignal: req.body.moodSignal,
    },
  });
  res.status(201).json({ comment });
});

router.get('/:slug/comments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const slug = req.params['slug'];
  if (!slug) {
    res.status(400).json({ error: 'Slug is required' });
    return;
  }
  const lesson = await prisma.lesson.findUnique({ where: { slug } });
  if (!lesson) {
    res.status(404).json({ error: 'Lesson not found' });
    return;
  }
  const threads = await prisma.lessonThread.findMany({
    where: { lessonId: lesson.id },
    include: { comments: true },
  });
  res.json({ threads });
});

export default router;
