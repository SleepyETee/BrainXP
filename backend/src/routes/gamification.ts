import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

const equipSchema = z.object({
  body: z.object({
    cosmeticId: z.string(),
    equipped: z.boolean(),
  }),
});

const seedCosmetics = async () => {
  await prisma.cosmeticItem.upsert({
    where: { slug: 'focus-halo' },
    update: {},
    create: {
      slug: 'focus-halo',
      name: 'Focus Halo',
      rarity: 'rare',
      costXp: 200,
    },
  });
  await prisma.cosmeticItem.upsert({
    where: { slug: 'streak-shield' },
    update: {},
    create: {
      slug: 'streak-shield',
      name: 'Streak Shield',
      rarity: 'epic',
      costXp: 350,
    },
  });
};

router.get('/cosmetics', authMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  await seedCosmetics();
  const cosmetics = await prisma.cosmeticItem.findMany();
  res.json({ cosmetics });
});

router.get('/inventory', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const inventory = await prisma.userCosmetic.findMany({
    where: { userId: req.userId! },
    include: { cosmetic: true },
  });
  res.json({ inventory });
});

router.post('/inventory/:cosmeticId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const cosmeticId = req.params['cosmeticId'];
  if (!cosmeticId) {
    res.status(400).json({ error: 'Cosmetic ID is required' });
    return;
  }
  const cosmetic = await prisma.cosmeticItem.findUnique({ where: { id: cosmeticId } });
  if (!cosmetic) {
    res.status(404).json({ error: 'Cosmetic not found' });
    return;
  }
  const item = await prisma.userCosmetic.upsert({
    where: { userId_cosmeticId: { userId: req.userId!, cosmeticId: cosmetic.id } },
    update: {},
    create: {
      userId: req.userId!,
      cosmeticId: cosmetic.id,
    },
  });
  res.status(201).json({ item });
});

router.post('/inventory/equip', authMiddleware, validate(equipSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await prisma.userCosmetic.update({
      where: { userId_cosmeticId: { userId: req.userId!, cosmeticId: req.body.cosmeticId } },
      data: { equipped: req.body.equipped },
    });
    res.json({ item });
  } catch (error) {
    res.status(404).json({ error: 'Not owned' });
  }
});

export default router;
