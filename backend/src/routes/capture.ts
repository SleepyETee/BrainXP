import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { validate } from '../middleware/validation.js';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { transcriptionService } from '../services/transcription.js';

const router = Router();

const cleanupSchema = z.object({
  body: z.object({
    cleanupMode: z.enum(['verbatim', 'concise', 'action-items']),
    language: z.string().optional(),
    discountApplied: z.boolean().optional(),
  }),
});

// Get capture items
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;
    const where: Prisma.CaptureItemWhereInput = {
      userId: req.userId!,
    };
    if (typeof status === 'string') {
      where.status = status;
    }

    const items = await prisma.captureItem.findMany({
      where,
      orderBy: { capturedAt: 'desc' },
    });
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch capture items' });
  }
});

// Create capture item
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const itemData = req.body;

    const item = await prisma.captureItem.create({
      data: {
        userId: req.userId!,
        contentType: itemData.contentType || 'text',
        textContent: itemData.textContent,
        voiceUrl: itemData.voiceUrl,
        voiceTranscript: itemData.voiceTranscript,
        voiceDuration: itemData.voiceDuration,
        photoUrl: itemData.photoUrl,
        linkUrl: itemData.linkUrl,
        linkMetadata: itemData.linkMetadata,
        status: 'pending',
        source: itemData.source || 'app',
      },
    });

    res.status(201).json({ item });
  } catch (error) {
    res.status(500).json({ error: 'Failed to capture item' });
  }
});

// Process capture item (convert to task, habit, etc.)
router.post('/:id/process', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing capture id' });
      return;
    }
    const { convertedToType, convertedToId } = req.body;

    const item = await prisma.captureItem.update({
      where: { id },
      data: {
        status: 'processed',
        convertedToType,
        convertedToId,
        processedAt: new Date(),
      },
    });

    res.json({ item });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process item' });
  }
});

// Dismiss capture item
router.post('/:id/dismiss', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing capture id' });
      return;
    }

    const item = await prisma.captureItem.update({
      where: { id },
      data: { status: 'dismissed' },
    });

    res.json({ item });
  } catch (error) {
    res.status(500).json({ error: 'Failed to dismiss item' });
  }
});

// Transcribe voice note using Whisper API
router.post('/:id/transcribe', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing capture id' });
      return;
    }
    
    const item = await prisma.captureItem.findFirst({
      where: { id, userId: req.userId! },
    });

    if (!item) {
      res.status(404).json({ error: 'Capture not found' });
      return;
    }

    if (item.contentType !== 'voice') {
      res.status(400).json({ error: 'Capture is not a voice note' });
      return;
    }

    // If already transcribed, return existing transcript
    if (item.voiceTranscript) {
      res.json({
        transcript: item.voiceTranscript,
        item,
        cached: true,
      });
      return;
    }

    // Check if we have a voice URL to transcribe
    if (!item.voiceUrl) {
      res.status(400).json({ error: 'No voice URL available for transcription' });
      return;
    }

    // Transcribe using Whisper API
    const result = await transcriptionService.transcribeFromUrl(item.voiceUrl, {
      language: req.body?.language,
      prompt: 'This is a voice note for a task or reminder.',
    });

    // Update the capture item with the transcript
    const updated = await prisma.captureItem.update({
      where: { id },
      data: {
        voiceTranscript: result.text,
        voiceDuration: result.duration ?? item.voiceDuration,
        processedAt: new Date(),
      },
    });

    res.json({
      transcript: result.text,
      language: result.language,
      duration: result.duration,
      segments: result.segments,
      item: updated,
      cached: false,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe voice note' });
  }
});

// Direct transcription endpoint (for real-time transcription without saving)
router.post('/transcribe', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { audioUrl, audioBase64, mimeType, language } = req.body as {
      audioUrl?: string;
      audioBase64?: string;
      mimeType?: string;
      language?: string;
    };

    if (!audioUrl && !audioBase64) {
      res.status(400).json({ error: 'Either audioUrl or audioBase64 is required' });
      return;
    }

    let result;
    if (audioUrl) {
      result = await transcriptionService.transcribeFromUrl(audioUrl, { language });
    } else if (audioBase64) {
      result = await transcriptionService.transcribeFromBase64(
        audioBase64,
        mimeType || 'audio/webm',
        { language }
      );
    }

    res.json({
      transcript: result?.text,
      language: result?.language,
      duration: result?.duration,
      segments: result?.segments,
      configured: transcriptionService.isConfigured(),
    });
  } catch (error) {
    console.error('Direct transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// GET /capture/transcription/status - Check transcription service status
router.get('/transcription/status', authMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    configured: transcriptionService.isConfigured(),
    provider: 'openai-whisper',
  });
});

// Apply AI cleanup mode + discount metadata
router.post('/:id/cleanup', authMiddleware, validate(cleanupSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: 'Missing capture id' });
    return;
  }
  const { cleanupMode, language, discountApplied } = req.body;
  const capture = await prisma.captureItem.findUnique({ where: { id } });
  if (!capture) {
    res.status(404).json({ error: 'Capture not found' });
    return;
  }

  const metadata = await (prisma as any).captureMetadata.upsert({
    where: { captureId: id },
    update: { cleanupMode, language, discountApplied },
    create: { captureId: id, cleanupMode, language, discountApplied },
  });

  res.json({
    metadata,
    message: 'Cleanup mode recorded - wire to AI service',
  });
});

export default router;

