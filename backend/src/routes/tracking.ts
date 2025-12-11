import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

const ingestSchema = z.object({
  body: z.object({
    events: z.array(
      z.object({
        source: z.string(),
        appName: z.string().optional(),
        appId: z.string().optional(),
        website: z.string().optional(),
        category: z.string().optional(),
        durationSec: z.number().min(1),
        isActiveWindow: z.boolean().optional(),
        blocked: z.boolean().optional(),
        collectedAt: z.string().datetime().optional(),
      })
    ),
  }),
});

const blocklistSchema = z.object({
  body: z.object({
    pattern: z.string().min(1),
    type: z.enum(['app', 'website']),
  }),
});

router.post('/events', authMiddleware, validate(ingestSchema), (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const now = new Date();
  const mapped = req.body.events.map((e: any) => ({
    userId,
    source: e.source,
    appName: e.appName,
    appId: e.appId,
    website: e.website,
    category: e.category,
    durationSec: e.durationSec,
    isActiveWindow: e.isActiveWindow ?? true,
    blocked: e.blocked ?? false,
    collectedAt: e.collectedAt ? new Date(e.collectedAt) : now,
    metadata: {},
  }));

  prisma.passiveTrackingEvent
    .createMany({ data: mapped })
    .then((result) => res.status(201).json({ saved: result.count }))
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: 'Failed to save events' });
    });
});

router.get('/reports/daily', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const day = (req.query.day as string) || new Date().toISOString().split('T')[0];
    const start = new Date(`${day}T00:00:00.000Z`);
    const end = new Date(`${day}T23:59:59.999Z`);

    const dayEvents = await prisma.passiveTrackingEvent.findMany({
      where: { userId, collectedAt: { gte: start, lte: end } },
    });

    const total = dayEvents.reduce((acc, e) => acc + e.durationSec, 0);
    const byCategory: Record<string, number> = {};
    dayEvents.forEach((e) => {
      const key = e.category || 'unsorted';
      byCategory[key] = (byCategory[key] || 0) + e.durationSec;
    });
    const topDistractors = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, durationSec]) => ({ name, durationSec }));
    const focusScore = Math.max(
      0,
      100 - (topDistractors.reduce((a, b) => a + b.durationSec, 0) / Math.max(total, 1)) * 100
    );

    await prisma.attentionReport.upsert({
      where: { userId_date: { userId, date: start } },
      update: {
        focusScore: Math.round(focusScore),
        topDistractors,
        attentionLeaks: [],
        suggestedBlocks: [],
      },
      create: {
        userId,
        date: start,
        focusScore: Math.round(focusScore),
        topDistractors,
      },
    });

    res.json({
      report: {
        day,
        totalSec: total,
        focusScore: Math.round(focusScore),
        topDistractors,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to build report' });
  }
});

router.get('/blocklist', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const items = await prisma.trackingBlocklist.findMany({ where: { userId: req.userId! } });
  res.json({ blocklist: items });
});

router.post('/blocklist', authMiddleware, validate(blocklistSchema), async (req: AuthenticatedRequest, res: Response) => {
  const item = await prisma.trackingBlocklist.create({
    data: {
      userId: req.userId!,
      pattern: req.body.pattern,
      type: req.body.type,
    },
  });
  res.status(201).json({ item });
});

router.delete('/blocklist/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.trackingBlocklist.delete({
      where: { id: req.params['id'] },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ error: 'Not found' });
  }
});

export default router;
