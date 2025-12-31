import { Router, Response } from 'express';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'] || '',
});

// Study-focused system prompt
const STUDY_SYSTEM_PROMPT = `You are an AI tutor specialized in creating effective learning materials.
Your responses should be:
- Educational and accurate
- ADHD-friendly (clear, engaging, not overwhelming)
- Focused on active recall and spaced repetition principles
- Using varied question types for better retention

Always provide structured JSON responses as specified.`;

// ═══════════════════════════════════════════════════════════════════════════════
// STUDY SETS CRUD
// ═══════════════════════════════════════════════════════════════════════════════

const createStudySetSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    icon: z.string().max(10).optional(),
    color: z.string().max(20).optional(),
    isPublic: z.boolean().optional(),
  }),
});

// POST /study/sets - Create a study set
router.post('/sets', authMiddleware, validate(createStudySetSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, icon, color, isPublic } = req.body;
    const userId = req.user!.uid;

    // For now, return mock data - integrate with Prisma later
    const studySet = {
      id: `set_${Date.now()}`,
      userId,
      title,
      description,
      icon: icon || '📚',
      color: color || '#4F46E5',
      isPublic: isPublic || false,
      isFavorite: false,
      aiGenerated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cardCount: 0,
      masteredCount: 0,
      dueCount: 0,
    };

    res.json({ success: true, data: studySet });
  } catch (error) {
    console.error('Error creating study set:', error);
    res.status(500).json({ success: false, message: 'Failed to create study set' });
  }
});

// GET /study/sets - List user's study sets
router.get('/sets', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Mock data for now
    const sets = [
      {
        id: 'set_1',
        title: 'Sample Study Set',
        description: 'A sample set to get you started',
        icon: '📚',
        color: '#4F46E5',
        cardCount: 0,
        masteredCount: 0,
        dueCount: 0,
        createdAt: new Date().toISOString(),
      },
    ];

    res.json({ success: true, data: sets });
  } catch (error) {
    console.error('Error fetching study sets:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch study sets' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// FLASHCARDS CRUD
// ═══════════════════════════════════════════════════════════════════════════════

const createFlashcardSchema = z.object({
  body: z.object({
    studySetId: z.string(),
    front: z.string().min(1).max(2000),
    back: z.string().min(1).max(2000),
    hint: z.string().max(500).optional(),
    explanation: z.string().max(2000).optional(),
    tags: z.array(z.string()).optional(),
  }),
});

// POST /study/cards - Create a flashcard
router.post('/cards', authMiddleware, validate(createFlashcardSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { studySetId, front, back, hint, explanation, tags } = req.body;

    const card = {
      id: `card_${Date.now()}`,
      studySetId,
      front,
      back,
      hint,
      explanation,
      tags: tags || [],
      order: 0,
      
      // SM-2 defaults
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      learningState: 'new',
      lapses: 0,
      
      aiGenerated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json({ success: true, data: card });
  } catch (error) {
    console.error('Error creating flashcard:', error);
    res.status(500).json({ success: false, message: 'Failed to create flashcard' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SPACED REPETITION (SM-2 Algorithm)
// ═══════════════════════════════════════════════════════════════════════════════

const reviewCardSchema = z.object({
  body: z.object({
    flashcardId: z.string(),
    quality: z.number().min(0).max(5),
    responseTime: z.number().optional(),
  }),
});

// SM-2 Algorithm implementation
function calculateSM2(
  quality: number,
  repetitions: number,
  easeFactor: number,
  interval: number
): { newEaseFactor: number; newInterval: number; newRepetitions: number } {
  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  // Update ease factor
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
    newRepetitions = repetitions + 1;
  } else {
    // Incorrect response - reset
    newRepetitions = 0;
    newInterval = 1;
  }

  return { newEaseFactor, newInterval, newRepetitions };
}

// POST /study/review - Review a flashcard
router.post('/review', authMiddleware, validate(reviewCardSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { flashcardId, quality, responseTime } = req.body;
    const userId = req.user!.uid;

    // Mock previous state (would come from DB)
    const prevState = {
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
    };

    const { newEaseFactor, newInterval, newRepetitions } = calculateSM2(
      quality,
      prevState.repetitions,
      prevState.easeFactor,
      prevState.interval
    );

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    // Determine learning state
    let learningState = 'review';
    if (newRepetitions === 0) {
      learningState = quality < 3 ? 'relearning' : 'learning';
    } else if (newInterval >= 21) {
      learningState = 'review'; // Mature card
    }

    // Calculate XP
    let xpEarned = 5; // Base XP
    if (quality >= 4) xpEarned += 5;
    if (quality === 5) xpEarned += 5;

    const review = {
      id: `review_${Date.now()}`,
      flashcardId,
      userId,
      quality,
      responseTime,
      prevEaseFactor: prevState.easeFactor,
      prevInterval: prevState.interval,
      newEaseFactor,
      newInterval,
      reviewedAt: new Date().toISOString(),
    };

    const updatedCard = {
      id: flashcardId,
      easeFactor: newEaseFactor,
      interval: newInterval,
      repetitions: newRepetitions,
      nextReview: nextReview.toISOString(),
      lastReview: new Date().toISOString(),
      learningState,
    };

    res.json({
      success: true,
      data: {
        flashcard: updatedCard,
        review,
        xpEarned,
      },
    });
  } catch (error) {
    console.error('Error reviewing card:', error);
    res.status(500).json({ success: false, message: 'Failed to review card' });
  }
});

// GET /study/due/:setId - Get cards due for review
router.get('/due/:setId', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { setId } = req.params;
    const { limit = 20 } = req.query;

    // Mock due cards (would query DB for nextReview <= now)
    const dueCards: unknown[] = [];

    res.json({
      success: true,
      data: {
        cards: dueCards,
        newCount: 0,
        learningCount: 0,
        reviewCount: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching due cards:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch due cards' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AI FLASHCARD GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

const generateFlashcardsSchema = z.object({
  body: z.object({
    content: z.string().min(50).max(50000),
    count: z.number().min(3).max(50).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    focusAreas: z.array(z.string()).optional(),
    studySetId: z.string().optional(),
    studySetTitle: z.string().max(200).optional(),
  }),
});

router.post('/generate/flashcards', authMiddleware, validate(generateFlashcardsSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { content, count = 10, difficulty = 'medium', focusAreas, studySetTitle } = req.body;

    const difficultyGuide: Record<string, string> = {
      easy: 'basic definitions, simple facts, straightforward Q&A',
      medium: 'conceptual understanding, relationships between ideas, application',
      hard: 'analysis, synthesis, edge cases, nuanced understanding',
    };

    const prompt = `Generate ${count} high-quality flashcards from this content.

Content:
"""
${content.substring(0, 10000)}
"""

Difficulty: ${difficulty} (${difficultyGuide[difficulty] || difficultyGuide['medium']})
${focusAreas?.length ? `Focus on: ${focusAreas.join(', ')}` : ''}

Create flashcards optimized for spaced repetition learning. Mix question types:
- Definition/term cards
- Concept explanation cards
- Application/example cards
- Compare/contrast cards

Provide a JSON response:
{
  "cards": [
    {
      "front": "Question or term (clear, specific)",
      "back": "Answer (concise but complete)",
      "hint": "Optional hint to help recall",
      "explanation": "Optional deeper explanation",
      "tags": ["relevant", "tags"],
      "difficulty": "easy" | "medium" | "hard"
    }
  ],
  "summary": "Brief summary of what these cards cover",
  "suggestedTitle": "Suggested study set title"
}

Make cards:
- Clear and unambiguous
- Focused on one concept each
- Using active recall (not recognition)
- Varied in format to maintain engagement`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: STUDY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Create study set and cards
    const studySet = {
      id: `set_${Date.now()}`,
      title: studySetTitle || result.suggestedTitle || 'Generated Study Set',
      description: result.summary,
      aiGenerated: true,
      createdAt: new Date().toISOString(),
      cardCount: result.cards.length,
    };

    const cards = result.cards.map((card: {
      front: string;
      back: string;
      hint?: string;
      explanation?: string;
      tags?: string[];
      difficulty?: string;
    }, index: number) => ({
      id: `card_${Date.now()}_${index}`,
      studySetId: studySet.id,
      front: card.front,
      back: card.back,
      hint: card.hint,
      explanation: card.explanation,
      tags: card.tags || [],
      order: index,
      aiGenerated: true,
      confidence: 0.9,
      
      // SM-2 defaults
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      learningState: 'new',
      
      createdAt: new Date().toISOString(),
    }));

    res.json({
      success: true,
      data: {
        studySet,
        cards,
        summary: result.summary,
      },
    });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    res.status(500).json({ success: false, message: 'Failed to generate flashcards' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AI QUIZ GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

const generateQuizSchema = z.object({
  body: z.object({
    content: z.string().min(50).max(50000),
    type: z.enum(['multiple_choice', 'true_false', 'written', 'matching', 'mixed']).optional(),
    questionCount: z.number().min(3).max(30).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    title: z.string().max(200).optional(),
  }),
});

router.post('/generate/quiz', authMiddleware, validate(generateQuizSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { content, type = 'mixed', questionCount = 10, difficulty = 'medium', title } = req.body;

    const prompt = `Generate a ${questionCount}-question quiz from this content.

Content:
"""
${content.substring(0, 10000)}
"""

Quiz type: ${type}
Difficulty: ${difficulty}

Provide a JSON response:
{
  "title": "${title || 'Generated Quiz'}",
  "description": "Brief description of what this quiz tests",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice" | "true_false" | "written" | "fill_blank" | "matching",
      "question": "The question text",
      "options": ["A", "B", "C", "D"] (for multiple choice),
      "correctAnswer": "The correct answer" (or array for matching),
      "explanation": "Why this is correct",
      "points": 1-3 based on difficulty
    }
  ],
  "totalPoints": sum of all question points
}

For mixed type, include variety: ${type === 'mixed' ? '40% multiple choice, 30% true/false, 20% written, 10% fill blank' : ''}
Make questions clear, unambiguous, and test understanding not just memorization.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: STUDY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const result = JSON.parse(jsonMatch[0]);

    const quiz = {
      id: `quiz_${Date.now()}`,
      title: result.title,
      description: result.description,
      type,
      questions: result.questions,
      totalPoints: result.totalPoints,
      aiGenerated: true,
      createdAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: {
        quiz,
        summary: result.description,
      },
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ success: false, message: 'Failed to generate quiz' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ SUBMISSION & GRADING
// ═══════════════════════════════════════════════════════════════════════════════

const submitQuizSchema = z.object({
  body: z.object({
    quizId: z.string(),
    answers: z.array(z.object({
      questionId: z.string(),
      answer: z.union([z.string(), z.array(z.string())]),
      timeSpent: z.number().optional(),
    })),
    timeSpent: z.number().optional(),
  }),
});

router.post('/quiz/submit', authMiddleware, validate(submitQuizSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { quizId, answers, timeSpent } = req.body;
    const userId = req.user!.uid;

    // Mock quiz data (would fetch from DB)
    // In reality, you'd fetch the quiz and grade against actual answers

    // Mock grading
    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    const gradedAnswers = answers.map((answer: { questionId: string; answer: string | string[]; timeSpent?: number }) => {
      // Mock grading - in reality compare to stored correct answers
      const isCorrect = Math.random() > 0.3; // Random for demo
      const points = 1;
      totalPoints += points;
      if (isCorrect) {
        correctCount++;
        earnedPoints += points;
      }
      return {
        ...answer,
        correct: isCorrect,
      };
    });

    const score = (earnedPoints / totalPoints) * 100;

    // Calculate XP
    let xpEarned = Math.round(score / 10) * 5; // 5 XP per 10% score
    if (score >= 80) xpEarned += 20;
    if (score === 100) xpEarned += 30;

    const attempt = {
      id: `attempt_${Date.now()}`,
      quizId,
      userId,
      score,
      pointsEarned: earnedPoints,
      pointsTotal: totalPoints,
      answers: gradedAnswers,
      timeSpent,
      xpEarned,
      completedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: {
        attempt,
        summary: {
          score,
          correct: correctCount,
          total: answers.length,
          xpEarned,
          feedback: score >= 80 
            ? "Excellent work! You've mastered this material! 🎉"
            : score >= 60
            ? "Good job! Review the questions you missed and try again."
            : "Keep studying! Focus on the concepts you struggled with.",
        },
      },
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ success: false, message: 'Failed to submit quiz' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STUDY STATISTICS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Mock stats (would aggregate from DB)
    const stats = {
      totalSessions: 12,
      totalCardsReviewed: 156,
      totalCorrect: 128,
      averageAccuracy: 82.1,
      totalStudyTime: 245, // minutes
      currentStreak: 5,
      longestStreak: 12,
      cardsLearned: 45,
      cardsMastered: 23,
      quizzesTaken: 8,
      averageQuizScore: 78.5,
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

export default router;

