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

// ADHD-focused system prompt for AI tools
const AI_TOOLS_SYSTEM_PROMPT = `You are an AI assistant specialized in helping people with ADHD. 
Your responses should be:
- Practical and actionable
- Non-judgmental and encouraging
- Clear and well-organized
- ADHD-friendly (scannable, not overwhelming)

Always provide structured JSON responses as specified in the prompts.`;

const findTextContent = (message: { content: { type: string; text?: string }[] }) =>
  message.content.find((block) => block.type === 'text' && block.text && block.text.trim().length > 0);

const parseJsonFromText = <T>(text: string | undefined, fallback: T): T => {
  if (!text) return fallback;
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) return fallback;
  try {
    return JSON.parse(match[0]) as T;
  } catch (error) {
    console.warn('Failed to parse AI JSON response, using fallback:', error);
    return fallback;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SPOON/ENERGY ESTIMATOR (Goblin.tools Judge)
// ═══════════════════════════════════════════════════════════════════════════════

const estimateSpoonSchema = z.object({
  body: z.object({
    taskTitle: z.string().min(1).max(500),
    taskDescription: z.string().max(2000).optional(),
    currentEnergy: z.number().min(1).max(5).optional(),
    currentMood: z.number().min(1).max(5).optional(),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
    context: z.object({
      recentTasks: z.array(z.string()).optional(),
      sleepQuality: z.number().min(1).max(5).optional(),
      medicationTaken: z.boolean().optional(),
    }).optional(),
  }),
});

router.post('/estimate-spoons', authMiddleware, validate(estimateSpoonSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskTitle, taskDescription, currentEnergy, currentMood, timeOfDay, context } = req.body;

    const prompt = `Estimate the "spoon cost" (energy/difficulty) for this task for someone with ADHD.

Task: "${taskTitle}"
${taskDescription ? `Description: ${taskDescription}` : ''}
${currentEnergy ? `Current energy level: ${currentEnergy}/5` : ''}
${currentMood ? `Current mood: ${currentMood}/5` : ''}
${timeOfDay ? `Time of day: ${timeOfDay}` : ''}
${context?.recentTasks ? `Recent tasks completed: ${context.recentTasks.join(', ')}` : ''}
${context?.sleepQuality ? `Sleep quality: ${context.sleepQuality}/5` : ''}
${context?.medicationTaken !== undefined ? `Medication taken: ${context.medicationTaken}` : ''}

Provide a JSON response:
{
  "spoons": 1-5 (1=very easy, 5=very hard),
  "label": "Very Easy" | "Easy" | "Moderate" | "Hard" | "Very Hard",
  "emoji": "🥄" to "🥄🥄🥄🥄🥄" (repeat spoon emoji based on difficulty),
  "explanation": "Brief explanation of why this difficulty (max 100 chars)",
  "factors": [
    {
      "name": "Factor name (e.g., Cognitive Load, Physical Effort, Emotional Demand, Time Pressure, Decision Making, Task Initiation)",
      "impact": "low" | "medium" | "high",
      "description": "Brief description"
    }
  ],
  "suggestions": ["2-3 specific suggestions for making this task easier"],
  "feasibility": "easy" | "manageable" | "challenging" | "difficult" (only if currentEnergy provided),
  "adjustedSuggestion": "Personalized suggestion based on current energy (only if currentEnergy provided)"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: AI_TOOLS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const fallbackResult = {
      spoons: 3,
      label: 'Moderate',
      emoji: '🥄🥄🥄',
      explanation: 'Unable to fully analyze - estimated as moderate difficulty',
      factors: [
        { name: 'Task Complexity', impact: 'medium', description: 'Standard task complexity' }
      ],
      suggestions: [
        'Break the task into smaller steps',
        'Set a timer to create urgency',
        'Remove distractions before starting'
      ],
    };

    const textContent = findTextContent(message);
    const result = parseJsonFromText(textContent?.text, fallbackResult);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error estimating spoons:', error);
    
    // Fallback response
    res.json({
      success: true,
      data: {
        spoons: 3,
        label: 'Moderate',
        emoji: '🥄🥄🥄',
        explanation: 'Unable to fully analyze - estimated as moderate difficulty',
        factors: [
          { name: 'Task Complexity', impact: 'medium', description: 'Standard task complexity' }
        ],
        suggestions: [
          'Break the task into smaller steps',
          'Set a timer to create urgency',
          'Remove distractions before starting'
        ],
      },
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// TONE REWRITER (Goblin.tools Formalizer)
// ═══════════════════════════════════════════════════════════════════════════════

const rewriteToneSchema = z.object({
  body: z.object({
    text: z.string().min(1).max(5000),
    targetTone: z.enum([
      'formal', 'casual', 'friendly', 'professional', 'gentle',
      'direct', 'enthusiastic', 'empathetic', 'assertive', 'simplified', 'elaborate'
    ]),
    context: z.enum(['email', 'message', 'document', 'social', 'general']).optional(),
    preserveLength: z.boolean().optional(),
  }),
});

router.post('/rewrite-tone', authMiddleware, validate(rewriteToneSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { text, targetTone, context, preserveLength } = req.body;

    const toneDescriptions: Record<string, string> = {
      formal: 'Professional, polished, suitable for business',
      casual: 'Relaxed, conversational, everyday language',
      friendly: 'Warm, approachable, personable',
      professional: 'Clear, competent, business-appropriate',
      gentle: 'Soft, considerate, non-confrontational',
      direct: 'Straightforward, clear, to-the-point',
      enthusiastic: 'Energetic, excited, positive',
      empathetic: 'Understanding, compassionate, supportive',
      assertive: 'Confident, clear boundaries, respectful but firm',
      simplified: 'Simple words, shorter sentences, easy to understand',
      elaborate: 'Detailed, thorough, comprehensive',
    };

    const prompt = `Rewrite this text in a ${targetTone} tone.

Original text:
"${text}"

Target tone: ${targetTone} (${toneDescriptions[targetTone]})
${context ? `Context: This is for a ${context}` : ''}
${preserveLength ? 'Keep the length similar to the original.' : ''}

Provide a JSON response:
{
  "original": "The original text",
  "rewritten": "The rewritten text in the target tone",
  "tone": "${targetTone}",
  "changes": [
    {
      "original": "Original phrase/sentence",
      "changed": "How it was changed",
      "reason": "Brief reason for the change"
    }
  ],
  "readabilityScore": number 1-100 (Flesch reading ease score estimate)
}

Make 2-4 notable changes to highlight.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: AI_TOOLS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const fallbackResult = {
      original: text,
      rewritten: text,
      tone: targetTone,
      changes: [],
      readabilityScore: 60,
    };

    const textContent = findTextContent(message);
    const result = parseJsonFromText(textContent?.text, fallbackResult);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error rewriting tone:', error);
    res.status(500).json({ success: false, message: 'Failed to rewrite text' });
  }
});

// POST /ai-tools/analyze-tone - Detect current tone
router.post('/analyze-tone', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { text } = req.body;

    const prompt = `Analyze the tone of this text:

"${text}"

Provide a JSON response:
{
  "detectedTone": "formal" | "casual" | "friendly" | "professional" | "gentle" | "direct" | "enthusiastic" | "empathetic" | "assertive",
  "confidence": 0.0-1.0,
  "suggestions": [
    {
      "tone": "Suggested alternative tone",
      "reason": "Why this tone might work well"
    }
  ]
}

Provide 2-3 suggestions.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: AI_TOOLS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const fallbackResult = {
      detectedTone: 'friendly',
      confidence: 0.5,
      suggestions: [],
    };

    const textContent = findTextContent(message);
    const result = parseJsonFromText(textContent?.text, fallbackResult);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error analyzing tone:', error);
    res.status(500).json({ success: false, message: 'Failed to analyze tone' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// NOTE COMPILER (Goblin.tools Compiler)
// ═══════════════════════════════════════════════════════════════════════════════

const compileNotesSchema = z.object({
  body: z.object({
    texts: z.array(z.string()).min(1).max(20),
    format: z.enum([
      'outline', 'essay', 'bullets', 'study_guide',
      'summary', 'action_items', 'meeting_notes', 'blog_post'
    ]),
    title: z.string().max(200).optional(),
    instructions: z.string().max(500).optional(),
  }),
});

router.post('/compile-notes', authMiddleware, validate(compileNotesSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { texts, format, title, instructions } = req.body;

    const formatDescriptions: Record<string, string> = {
      outline: 'Hierarchical outline with main points and sub-points',
      essay: 'Flowing prose with introduction, body, and conclusion',
      bullets: 'Organized bullet points grouped by theme',
      study_guide: 'Study guide with key concepts, definitions, and review questions',
      summary: 'Concise summary of main ideas',
      action_items: 'Extracted action items and to-dos',
      meeting_notes: 'Formatted meeting notes with attendees, discussion, and action items',
      blog_post: 'Engaging blog post format with headers and sections',
    };

    const numberedTexts = texts.map((t: string, i: number) => `[Note ${i + 1}]:\n${t}`).join('\n\n---\n\n');

    const prompt = `Compile these scattered notes into a well-organized ${format}.

${numberedTexts}

${title ? `Title: ${title}` : ''}
${instructions ? `Additional instructions: ${instructions}` : ''}

Format: ${format} (${formatDescriptions[format]})

Provide a JSON response:
{
  "compiled": "The compiled text in the requested format (use markdown formatting)",
  "format": "${format}",
  "title": "Generated or provided title",
  "wordCount": number,
  "keyTopics": ["Main topics covered"],
  "actionItems": ["Extracted action items if any"],
  "questions": ["Any unanswered questions found in the notes"],
  "sourceMapping": [
    {
      "section": "Section name in compiled output",
      "sourceIndices": [0, 2] // Which note numbers contributed
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: AI_TOOLS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const fallbackResult = {
      compiled: texts.join('\n\n'),
      format,
      title: title || 'Compiled Notes',
      wordCount: texts.join(' ').split(/\s+/).length,
      keyTopics: [],
      actionItems: [],
      questions: [],
    };

    const textContent = findTextContent(message);
    const result = parseJsonFromText(textContent?.text, fallbackResult);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error compiling notes:', error);
    res.status(500).json({ success: false, message: 'Failed to compile notes' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SMART TIME ESTIMATION
// ═══════════════════════════════════════════════════════════════════════════════

const estimateTimeSchema = z.object({
  body: z.object({
    taskTitle: z.string().min(1).max(500),
    taskDescription: z.string().max(2000).optional(),
    subtasks: z.array(z.string()).optional(),
    userHistory: z.object({
      averageRatio: z.number().optional(),
      similarTasks: z.array(z.object({
        title: z.string(),
        estimated: z.number(),
        actual: z.number(),
      })).optional(),
    }).optional(),
    complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
    familiarity: z.enum(['new', 'familiar', 'expert']).optional(),
  }),
});

router.post('/estimate-time', authMiddleware, validate(estimateTimeSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskTitle, taskDescription, subtasks, userHistory, complexity, familiarity } = req.body;

    const prompt = `Estimate time needed for this task, considering ADHD factors like task initiation, transitions, and potential for hyperfocus or distraction.

Task: "${taskTitle}"
${taskDescription ? `Description: ${taskDescription}` : ''}
${subtasks?.length ? `Subtasks: ${subtasks.join(', ')}` : ''}
${complexity ? `Complexity: ${complexity}` : ''}
${familiarity ? `Familiarity: ${familiarity}` : ''}
${userHistory?.averageRatio ? `User typically takes ${Math.round(userHistory.averageRatio * 100)}% of estimated time` : ''}
${userHistory?.similarTasks?.length ? `Similar past tasks: ${userHistory.similarTasks.map((t: { title: string; estimated: number; actual: number }) => `${t.title}: estimated ${t.estimated}min, actual ${t.actual}min`).join('; ')}` : ''}

Provide a JSON response:
{
  "estimatedMinutes": number (realistic estimate),
  "confidence": "low" | "medium" | "high",
  "minMinutes": number (optimistic estimate),
  "maxMinutes": number (pessimistic estimate with ADHD factors),
  "personalizedMinutes": number (adjusted for user's history if provided),
  "personalRatio": number (user's typical ratio if calculable),
  "breakdown": [
    {
      "phase": "Phase name",
      "minutes": number,
      "description": "What happens in this phase"
    }
  ],
  "tips": ["2-3 ADHD-friendly tips for staying on track"]
}

Include phases like: Setup/Transition, Main Work, Breaks, Review/Cleanup.
Account for ADHD-typical challenges: task switching, hyperfocus potential, decision fatigue.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: AI_TOOLS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const fallbackResult = {
      estimatedMinutes: 30,
      confidence: 'low',
      minMinutes: 20,
      maxMinutes: 60,
      breakdown: [
        { phase: 'Setup', minutes: 5, description: 'Getting started and gathering materials' },
        { phase: 'Main Work', minutes: 20, description: 'Core task execution' },
        { phase: 'Review', minutes: 5, description: 'Checking work and wrapping up' },
      ],
      tips: [
        'Set a timer to create time awareness',
        'Break into 15-minute chunks with short breaks',
        'Remove phone and other distractions',
      ],
    };

    const textContent = findTextContent(message);
    const result = parseJsonFromText(textContent?.text, fallbackResult);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error estimating time:', error);
    
    // Fallback
    res.json({
      success: true,
      data: {
        estimatedMinutes: 30,
        confidence: 'low',
        minMinutes: 20,
        maxMinutes: 60,
        breakdown: [
          { phase: 'Setup', minutes: 5, description: 'Getting started and gathering materials' },
          { phase: 'Main Work', minutes: 20, description: 'Core task execution' },
          { phase: 'Review', minutes: 5, description: 'Checking work and wrapping up' },
        ],
        tips: [
          'Set a timer to create time awareness',
          'Break into 15-minute chunks with short breaks',
          'Remove phone and other distractions',
        ],
      },
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAGIC BREAKDOWN (Enhanced Task Decomposition)
// ═══════════════════════════════════════════════════════════════════════════════

const magicBreakdownSchema = z.object({
  body: z.object({
    task: z.string().min(1).max(500),
    context: z.string().max(1000).optional(),
    granularity: z.enum(['coarse', 'medium', 'fine', 'micro']).optional(),
    currentEnergy: z.number().min(1).max(5).optional(),
    maxSteps: z.number().min(2).max(20).optional(),
  }),
});

router.post('/magic-breakdown', authMiddleware, validate(magicBreakdownSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { task, context, granularity = 'medium', currentEnergy, maxSteps = 7 } = req.body;

    const granularityGuide: Record<string, string> = {
      coarse: '3-4 high-level steps, 15-30 min each',
      medium: '5-7 manageable steps, 10-20 min each',
      fine: '7-10 detailed steps, 5-15 min each',
      micro: '10-15 tiny steps, 2-10 min each (for overwhelm/low energy)',
    };

    const prompt = `Break down this task into ADHD-friendly steps.

Task: "${task}"
${context ? `Context: ${context}` : ''}
${currentEnergy ? `Current energy: ${currentEnergy}/5 spoons` : ''}
Granularity: ${granularity} (${granularityGuide[granularity] || granularityGuide['medium']})
Max steps: ${maxSteps}

Provide a JSON response:
{
  "originalTask": "${task}",
  "steps": [
    {
      "id": "step_1",
      "title": "Clear action verb + specific outcome",
      "description": "Optional helpful details",
      "estimatedMinutes": number,
      "spoons": 1-5 (energy cost),
      "order": 1,
      "emoji": "Relevant emoji",
      "tip": "Optional ADHD-friendly tip",
      "substeps": ["Optional micro-steps for complex steps"]
    }
  ],
  "totalEstimatedMinutes": number,
  "totalSpoons": number,
  "smallestFirstStep": "The absolute tiniest action to start (1-2 min max)",
  "firstStepTime": number,
  "encouragement": "Brief motivating message",
  "progressCheckpoints": ["Milestone 1", "Milestone 2"] (2-3 celebration points)
}

ADHD-friendly principles:
- Start with the easiest/most dopamine-friendly step
- Each step should be clear and actionable (start with a verb)
- Include transition time between steps
- ${currentEnergy && currentEnergy <= 2 ? 'User has low energy - make steps extra small and easy' : ''}
- Add fun emojis to make it feel less overwhelming`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: AI_TOOLS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const fallbackResult = {
      originalTask: task,
      steps: [
        { id: 'step_1', title: `Start: ${task.substring(0, 30)}`, order: 1, estimatedMinutes: 10, spoons: 2, emoji: '🪄' },
      ],
      totalEstimatedMinutes: 10,
      totalSpoons: 2,
      smallestFirstStep: `Write down the first action for "${task.substring(0, 30)}"`,
      encouragement: 'You can do this—start small and keep moving!',
      progressCheckpoints: [],
    };

    const textContent = findTextContent(message);
    const result = parseJsonFromText(textContent?.text, fallbackResult);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in magic breakdown:', error);
    res.status(500).json({ success: false, message: 'Failed to break down task' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// FLASHCARD GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

const generateFlashcardsSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(10000),
    cardCount: z.number().min(1).max(30).optional().default(10),
    includeExplanations: z.boolean().optional().default(true),
    focusAreas: z.array(z.string()).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
  }),
});

router.post('/generate-flashcards', authMiddleware, validate(generateFlashcardsSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { content, cardCount, includeExplanations, focusAreas, difficulty } = req.body;

    const difficultyGuide: Record<string, string> = {
      easy: 'Focus on basic definitions, simple concepts, and straightforward recall',
      medium: 'Include application questions, connections between concepts, and moderate complexity',
      hard: 'Include analysis, synthesis, edge cases, and nuanced understanding',
    };

    const prompt = `Generate ${cardCount} high-quality flashcards from this content for studying.

Content:
"""
${content}
"""

${focusAreas?.length ? `Focus areas: ${focusAreas.join(', ')}` : ''}
Difficulty: ${difficulty} (${difficultyGuide[difficulty || 'medium']})
${includeExplanations ? 'Include explanations for each answer.' : ''}

Create flashcards that:
- Cover the most important concepts
- Are ADHD-friendly (clear, concise, not overwhelming)
- Use varied question types (definitions, applications, comparisons)
- Progress from fundamental to more complex concepts

Provide a JSON response:
{
  "flashcards": [
    {
      "id": "card_1",
      "front": "Clear, specific question or prompt",
      "back": "Concise, accurate answer",
      "explanation": "Optional deeper explanation (only if includeExplanations is true)",
      "difficulty": "easy" | "medium" | "hard",
      "tags": ["relevant", "topic", "tags"],
      "hint": "Optional helpful hint"
    }
  ],
  "metadata": {
    "totalCards": number,
    "topicsCount": number,
    "topics": ["List of main topics covered"],
    "estimatedStudyTime": number (minutes for one review session),
    "difficulty": "${difficulty}"
  },
  "studyTips": ["2-3 ADHD-friendly study tips for these flashcards"]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: AI_TOOLS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const fallbackResult = {
      flashcards: [
        {
          id: 'card_1',
          front: 'What are the key concepts from this content?',
          back: 'Unable to generate specific flashcards. Please try again.',
          difficulty: 'medium',
          tags: ['general'],
        },
      ],
      metadata: {
        totalCards: 1,
        topicsCount: 1,
        topics: ['General'],
        estimatedStudyTime: 5,
        difficulty: difficulty || 'medium',
      },
      studyTips: [
        'Review cards in short 10-15 minute sessions',
        'Use spaced repetition for better retention',
        'Take breaks between study sessions',
      ],
    };

    const textContent = findTextContent(message);
    const result = parseJsonFromText(textContent?.text, fallbackResult);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    res.status(500).json({ success: false, message: 'Failed to generate flashcards' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

const generateQuizSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(10000),
    questionCount: z.number().min(1).max(20).optional().default(10),
    questionTypes: z.array(z.enum(['multiple_choice', 'true_false', 'short_answer'])).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
    includeExplanations: z.boolean().optional().default(true),
  }),
});

router.post('/generate-quiz', authMiddleware, validate(generateQuizSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { content, questionCount, questionTypes, difficulty, includeExplanations } = req.body;

    const types = questionTypes?.length ? questionTypes : ['multiple_choice'];
    const difficultyGuide: Record<string, string> = {
      easy: 'Basic recall, straightforward questions, obvious correct answers',
      medium: 'Application-based, requires understanding, plausible distractors',
      hard: 'Analysis and synthesis, tricky distractors, nuanced understanding required',
    };

    const prompt = `Generate a ${questionCount}-question quiz from this content.

Content:
"""
${content}
"""

Question types: ${types.join(', ')}
Difficulty: ${difficulty} (${difficultyGuide[difficulty || 'medium']})
${includeExplanations ? 'Include explanations for each correct answer.' : ''}

Create quiz questions that:
- Test understanding, not just memorization
- Have clear, unambiguous correct answers
- Include plausible but clearly incorrect distractors for multiple choice
- Are ADHD-friendly (concise, clear formatting)
- Cover the most important concepts

Provide a JSON response:
{
  "questions": [
    {
      "id": "q_1",
      "type": "multiple_choice" | "true_false" | "short_answer",
      "question": "Clear, well-formatted question",
      "options": ["Option A", "Option B", "Option C", "Option D"] (only for multiple_choice, 4 options),
      "correctIndex": 0 (index of correct option for multiple_choice, 0 or 1 for true_false),
      "correctAnswer": "The correct answer text (for all types)",
      "explanation": "Why this is correct and why other options are wrong",
      "difficulty": "easy" | "medium" | "hard",
      "topic": "The topic this question covers",
      "hint": "Optional helpful hint"
    }
  ],
  "metadata": {
    "totalQuestions": number,
    "byDifficulty": { "easy": number, "medium": number, "hard": number },
    "byType": { "multiple_choice": number, "true_false": number, "short_answer": number },
    "topics": ["List of topics covered"],
    "estimatedTime": number (minutes to complete),
    "passingScore": number (recommended percentage to pass)
  },
  "instructions": "Brief ADHD-friendly instructions for taking the quiz"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: AI_TOOLS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const fallbackResult = {
      questions: [
        {
          id: 'q_1',
          type: 'multiple_choice',
          question: 'What is the main concept from this content?',
          options: ['Unable to generate', 'Please try again', 'Check your content', 'Retry'],
          correctIndex: 0,
          correctAnswer: 'Unable to generate',
          explanation: 'Unable to generate quiz questions. Please try again with different content.',
          difficulty: 'medium',
          topic: 'General',
        },
      ],
      metadata: {
        totalQuestions: 1,
        byDifficulty: { easy: 0, medium: 1, hard: 0 },
        byType: { multiple_choice: 1, true_false: 0, short_answer: 0 },
        topics: ['General'],
        estimatedTime: 5,
        passingScore: 70,
      },
      instructions: 'Read each question carefully and select the best answer.',
    };

    const textContent = findTextContent(message);
    const result = parseJsonFromText(textContent?.text, fallbackResult);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ success: false, message: 'Failed to generate quiz' });
  }
});

export default router;
