import { Router, Request, Response } from 'express';
import authRouter from './auth.js';
import tasksRouter from './tasks.js';
import habitsRouter from './habits.js';
import focusRouter from './focus.js';
import aiRouter from './ai.js';
import aiToolsRouter from './aiTools.js';
import studyRouter from './study.js';
import captureRouter from './capture.js';
import analyticsRouter from './analytics.js';
import timelineRouter from './timeline.js';
import trackingRouter from './tracking.js';
import mindmapRouter from './mindmap.js';
import lessonsRouter from './lessons.js';
import gamificationRouter from './gamification.js';

const router = Router();

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'BrainXP API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API version info
router.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'BrainXP API',
    version: '1.0.0',
    description: 'Backend API for BrainXP ADHD Support Application',
    endpoints: {
      tasks: '/api/tasks',
      habits: '/api/habits',
      focus: '/api/focus',
      ai: '/api/ai',
      aiTools: '/api/ai-tools',
      study: '/api/study',
      captures: '/api/captures',
      analytics: '/api/analytics',
      timeline: '/api/timeline',
      tracking: '/api/tracking',
      mindmap: '/api/mindmap',
      lessons: '/api/lessons',
      gamification: '/api/gamification',
    },
  });
});

// Mount route modules
router.use('/auth', authRouter);
router.use('/tasks', tasksRouter);
router.use('/habits', habitsRouter);
router.use('/focus', focusRouter);
router.use('/ai', aiRouter);
router.use('/ai-tools', aiToolsRouter);
router.use('/study', studyRouter);
router.use('/captures', captureRouter);
router.use('/analytics', analyticsRouter);
router.use('/timeline', timelineRouter);
router.use('/tracking', trackingRouter);
router.use('/mindmap', mindmapRouter);
router.use('/lessons', lessonsRouter);
router.use('/gamification', gamificationRouter);

export default router;
