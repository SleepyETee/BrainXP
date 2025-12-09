import { Router, Response } from 'express';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// ADHD-focused system prompt for AI tools
const AI_TOOLS_SYSTEM_PROMPT = `You are an AI assistant specialized in helping people with ADHD. 
Your responses should be:
- Practical and actionable
- Non-judgmental and encouraging
- Clear and well-organized
- ADHD-friendly (scannable, not overwhelming)

Always provide structured JSON responses as specified in the prompts.`;

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

    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const result = JSON.parse(jsonMatch[0]);
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

    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const result = JSON.parse(jsonMatch[0]);
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

    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const result = JSON.parse(jsonMatch[0]);
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

    const numberedTexts = texts.map((t, i) => `[Note ${i + 1}]:\n${t}`).join('\n\n---\n\n');

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

    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const result = JSON.parse(jsonMatch[0]);
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
${userHistory?.similarTasks?.length ? `Similar past tasks: ${userHistory.similarTasks.map(t => `${t.title}: estimated ${t.estimated}min, actual ${t.actual}min`).join('; ')}` : ''}

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

    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const result = JSON.parse(jsonMatch[0]);
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

    const granularityGuide = {
      coarse: '3-4 high-level steps, 15-30 min each',
      medium: '5-7 manageable steps, 10-20 min each',
      fine: '7-10 detailed steps, 5-15 min each',
      micro: '10-15 tiny steps, 2-10 min each (for overwhelm/low energy)',
    };

    const prompt = `Break down this task into ADHD-friendly steps.

Task: "${task}"
${context ? `Context: ${context}` : ''}
${currentEnergy ? `Current energy: ${currentEnergy}/5 spoons` : ''}
Granularity: ${granularity} (${granularityGuide[granularity]})
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

    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const result = JSON.parse(jsonMatch[0]);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in magic breakdown:', error);
    res.status(500).json({ success: false, message: 'Failed to break down task' });
  }
});

export default router;
