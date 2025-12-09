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

// ADHD-focused system prompt for the AI coach
const ADHD_COACH_SYSTEM_PROMPT = `You are BrainXP Coach, a friendly and supportive AI companion specifically designed to help people with ADHD. 

Your personality:
- Warm, encouraging, and never judgmental
- You celebrate small wins and progress
- You understand executive function challenges
- You use gentle, motivating language
- You're practical and action-oriented
- You break things down into tiny, manageable steps

Key ADHD-friendly principles you follow:
1. **Small Steps**: Always suggest the smallest possible first step
2. **Time Blindness**: Help with time estimation and awareness
3. **Dopamine-Friendly**: Make tasks feel rewarding and achievable
4. **Overwhelm Prevention**: Never give too many options at once
5. **Body Doubling**: Suggest working alongside others when helpful
6. **Hyperfocus Awareness**: Help balance focus and breaks
7. **Emotional Regulation**: Acknowledge frustration without dwelling

When breaking down tasks:
- Create 3-7 clear, actionable subtasks
- Each subtask should take 5-30 minutes max
- Start with the easiest/most dopamine-friendly step
- Include specific time estimates
- Add encouraging notes

Keep responses concise, scannable, and action-focused. Use emojis sparingly but warmly.`;

// Validation schemas
const decomposeTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    dueDate: z.string().optional(),
    userContext: z.object({
      averageTimeRatio: z.number().optional(),
      preferredTaskDuration: z.number().optional(),
      energyLevel: z.enum(['low', 'medium', 'high']).optional(),
      currentMood: z.number().min(1).max(5).optional(),
    }).optional(),
  }),
});

const processCaptureSchema = z.object({
  body: z.object({
    contentType: z.enum(['text', 'voice', 'photo', 'link']),
    textContent: z.string().max(2000).optional(),
    voiceTranscript: z.string().max(2000).optional(),
    linkUrl: z.string().url().optional(),
  }),
});

const insightsSchema = z.object({
  body: z.object({
    tasksCompleted: z.number().default(0),
    focusMinutes: z.number().default(0),
    habitsCompleted: z.number().default(0),
    currentStreak: z.number().default(0),
    averageFocusSession: z.number().default(0),
    overdueTaskCount: z.number().default(0),
    mood: z.number().min(1).max(5).optional(),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
  }),
});

const encouragementSchema = z.object({
  body: z.object({
    context: z.object({
      tasksCompleted: z.number().optional(),
      streak: z.number().optional(),
      mood: z.number().optional(),
      justCompletedTask: z.boolean().optional(),
      justCompletedHabit: z.boolean().optional(),
      focusSessionCompleted: z.boolean().optional(),
      focusDuration: z.number().optional(),
    }).optional(),
  }),
});

// POST /ai/decompose - AI task decomposition with Claude
router.post('/decompose', authMiddleware, validate(decomposeTaskSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, dueDate, userContext } = req.body;
    
    const energyContext = userContext?.energyLevel 
      ? `The user's current energy level is ${userContext.energyLevel}.` 
      : '';
    
    const timeContext = userContext?.averageTimeRatio 
      ? `Based on history, this user typically takes ${Math.round(userContext.averageTimeRatio * 100)}% of estimated time to complete tasks.` 
      : '';

    const prompt = `Break down this task into ADHD-friendly subtasks:

Task: "${title}"
${description ? `Description: ${description}` : ''}
${dueDate ? `Due: ${dueDate}` : ''}
${energyContext}
${timeContext}

Please provide a JSON response with this exact structure:
{
  "suggestedSteps": [
    {
      "title": "Step title (clear, actionable verb)",
      "estimatedMinutes": number (5-30),
      "order": number,
      "energyRequired": "low" | "medium" | "high",
      "tip": "Optional ADHD-friendly tip"
    }
  ],
  "smallestFirstStep": "The absolute tiniest thing they could do right now to start (1-2 minutes max)",
  "totalEstimatedMinutes": number,
  "motivationalNote": "Brief encouraging message"
}

Remember: Start with the easiest, most dopamine-friendly step. Make each step feel achievable.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: ADHD_COACH_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    // Extract text content from the response
    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse JSON from the response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const result = JSON.parse(jsonMatch[0]);
    
    // Calculate adjusted estimate based on user's time ratio
    const userTimeRatio = userContext?.averageTimeRatio || 1.0;
    const adjustedEstimate = Math.round(result.totalEstimatedMinutes * userTimeRatio);

    res.json({
      ...result,
      adjustedEstimate,
      userTimeRatio,
    });
  } catch (error) {
    console.error('Error decomposing task:', error);
    
    // Fallback to basic decomposition if AI fails
    const { title } = req.body;
    res.json({
      suggestedSteps: [
        { title: `Research and gather info for: ${title.substring(0, 30)}`, estimatedMinutes: 15, order: 1 },
        { title: 'Create a basic outline or plan', estimatedMinutes: 10, order: 2 },
        { title: 'Work on the main content', estimatedMinutes: 25, order: 3 },
        { title: 'Review and polish', estimatedMinutes: 10, order: 4 },
      ],
      smallestFirstStep: `Open your notes and write down 3 things you already know about this task`,
      totalEstimatedMinutes: 60,
      adjustedEstimate: 60,
      userTimeRatio: 1.0,
      motivationalNote: "You've got this! Remember: starting is the hardest part. 💪",
    });
  }
});

// POST /ai/process-capture - Process captured content with AI
router.post('/process-capture', authMiddleware, validate(processCaptureSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { contentType, textContent, voiceTranscript, linkUrl } = req.body;
    
    const content = textContent || voiceTranscript || linkUrl || '';

    const prompt = `Analyze this captured thought/note and suggest how to organize it:

Content: "${content}"
Type: ${contentType}

Please provide a JSON response:
{
  "type": "task" | "habit" | "note" | "idea",
  "confidence": number (0-1),
  "extractedTitle": "Clear, actionable title",
  "suggestedDueDate": "YYYY-MM-DD or null",
  "suggestedPriority": "urgent_important" | "important" | "urgent" | "low" | "none",
  "suggestedTags": ["tag1", "tag2"],
  "isRecurring": boolean,
  "recurringPattern": "daily" | "weekly" | null,
  "aiNotes": "Brief explanation of your categorization"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: ADHD_COACH_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    const textBlock = message.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const suggestion = JSON.parse(jsonMatch[0]);
    res.json({ suggestion });
  } catch (error) {
    console.error('Error processing capture:', error);
    
    // Fallback
    const content = req.body.textContent || req.body.voiceTranscript || '';
    res.json({
      suggestion: {
        type: 'task',
        confidence: 0.7,
        extractedTitle: content.substring(0, 50),
        suggestedDueDate: null,
        suggestedPriority: 'none',
        suggestedTags: [],
        isRecurring: false,
        recurringPattern: null,
        aiNotes: 'Auto-categorized as task',
      },
    });
  }
});

// POST /ai/suggest-first-step - Suggest smallest first step
router.post('/suggest-first-step', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskTitle, taskDescription, energyLevel } = req.body;

    const prompt = `For this task, suggest the absolute SMALLEST first step someone with ADHD could take right now (should take less than 2 minutes and require minimal executive function):

Task: "${taskTitle}"
${taskDescription ? `Details: ${taskDescription}` : ''}
${energyLevel ? `Current energy: ${energyLevel}` : ''}

Provide JSON:
{
  "suggestion": "The tiniest possible first step",
  "alternatives": ["Alternative 1", "Alternative 2"],
  "encouragement": "Brief motivating message"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: ADHD_COACH_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    const textBlock = message.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error('Error suggesting first step:', error);
    
    res.json({
      suggestion: `Open a new note and write the title: "${req.body.taskTitle}"`,
      alternatives: [
        'Set a 2-minute timer and just think about the task',
        'Find one thing related to this task you can look at',
      ],
      encouragement: 'Remember: you just need to start, not finish! 🌟',
    });
  }
});

// POST /ai/insights - Get personalized AI insights
router.post('/insights', authMiddleware, validate(insightsSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { 
      tasksCompleted, 
      focusMinutes, 
      habitsCompleted, 
      currentStreak,
      averageFocusSession,
      overdueTaskCount,
      mood,
      timeOfDay 
    } = req.body;

    const prompt = `Generate 3-4 personalized, actionable insights for an ADHD user based on their data:

User Stats:
- Tasks completed today: ${tasksCompleted}
- Focus minutes today: ${focusMinutes}
- Habits completed: ${habitsCompleted}
- Current streak: ${currentStreak} days
- Average focus session: ${averageFocusSession} minutes
- Overdue tasks: ${overdueTaskCount}
${mood ? `- Current mood: ${mood}/5` : ''}
${timeOfDay ? `- Time of day: ${timeOfDay}` : ''}

Provide JSON array:
[
  {
    "id": "unique-id",
    "type": "productivity" | "pattern" | "suggestion" | "encouragement",
    "icon": "emoji",
    "title": "Short catchy title",
    "message": "Actionable insight (max 100 chars)",
    "actionLabel": "Button text (optional)",
    "actionType": "navigate" | "start_focus" | "view_tasks" (optional)
  }
]

Make insights specific, encouraging, and ADHD-friendly. Celebrate progress!`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: ADHD_COACH_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    const textBlock = message.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const insights = JSON.parse(jsonMatch[0]);
    res.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    
    // Fallback insights
    res.json({
      insights: [
        {
          id: '1',
          type: 'encouragement',
          icon: '💪',
          title: 'Keep Going!',
          message: "Every small step counts. You're making progress!",
        },
        {
          id: '2',
          type: 'suggestion',
          icon: '💡',
          title: 'Try a Short Session',
          message: 'A 15-minute focus session might be perfect right now.',
          actionLabel: 'Start Focus',
          actionType: 'start_focus',
        },
      ],
    });
  }
});

// POST /ai/encouragement - Get contextual encouragement
router.post('/encouragement', authMiddleware, validate(encouragementSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { context } = req.body;

    let situationContext = 'General check-in';
    if (context?.justCompletedTask) situationContext = 'Just completed a task';
    if (context?.justCompletedHabit) situationContext = 'Just completed a habit';
    if (context?.focusSessionCompleted) situationContext = `Just finished a ${context.focusDuration || 25} minute focus session`;

    const prompt = `Generate a short, warm encouragement message for an ADHD user.

Context: ${situationContext}
${context?.tasksCompleted ? `Tasks done today: ${context.tasksCompleted}` : ''}
${context?.streak ? `Current streak: ${context.streak} days` : ''}
${context?.mood ? `Mood: ${context.mood}/5` : ''}

Respond with JSON:
{
  "message": "Encouraging message (max 150 chars, warm and specific)",
  "emoji": "Relevant emoji",
  "bonusTip": "Optional quick ADHD-friendly tip (max 100 chars)"
}`;

    const aiMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: ADHD_COACH_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    const textBlock = aiMessage.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const result = JSON.parse(jsonMatch[0]);
    res.json({ message: `${result.emoji} ${result.message}`, bonusTip: result.bonusTip });
  } catch (error) {
    console.error('Error generating encouragement:', error);
    
    // Fallback messages based on context
    const messages = [
      "🌟 You're doing amazing! Every step forward counts.",
      "💪 Look at you go! Keep that momentum!",
      "🎉 Awesome work! You should be proud of yourself.",
      "✨ You've got this! One thing at a time.",
    ];
    
    res.json({
      message: messages[Math.floor(Math.random() * messages.length)],
    });
  }
});

// POST /ai/daily-summary - Generate AI-powered daily summary
router.post('/daily-summary', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { 
      tasksCompleted, 
      focusMinutes, 
      habitsCompleted,
      totalTasks,
      totalHabits,
      mood,
      streak,
      xpEarned 
    } = req.body;

    const prompt = `Generate a friendly daily summary for an ADHD user's productivity app.

Today's Stats:
- Tasks completed: ${tasksCompleted}/${totalTasks || '?'}
- Focus time: ${focusMinutes} minutes
- Habits done: ${habitsCompleted}/${totalHabits || '?'}
- XP earned: ${xpEarned || 0}
- Current streak: ${streak || 0} days
${mood ? `- Mood logged: ${mood}/5` : ''}

Provide JSON:
{
  "headline": "Catchy, encouraging headline (max 50 chars)",
  "highlights": ["Achievement 1", "Achievement 2", "Achievement 3"],
  "insights": "One personalized observation about their day",
  "suggestion": "One gentle suggestion for tomorrow",
  "closingMessage": "Warm, supportive closing (max 100 chars)"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: ADHD_COACH_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    const textBlock = message.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error('Error generating daily summary:', error);
    
    res.json({
      headline: "Another Day, Another Win! 🏆",
      highlights: [
        "You showed up today",
        "You made progress",
        "You're building momentum",
      ],
      insights: "Consistency matters more than perfection. You're doing great!",
      suggestion: "Try starting tomorrow with your most challenging task when your energy is fresh.",
      closingMessage: "Rest well! Tomorrow is a fresh start. 🌟",
    });
  }
});

// POST /ai/chat - General AI coaching chat
router.post('/chat', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { message, conversationHistory } = req.body;

    const messages = [
      ...(conversationHistory || []).slice(-10), // Keep last 10 messages for context
      { role: 'user' as const, content: message },
    ];

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: ADHD_COACH_SYSTEM_PROMPT + `

Additional context: You're in a chat conversation with the user. Keep responses concise (2-3 short paragraphs max), warm, and actionable. Use formatting sparingly. Always end with a clear next step or question.`,
      messages,
    });

    const textBlock = aiResponse.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    res.json({
      response: textBlock.text,
      suggestions: [
        "Tell me about your current task",
        "I'm feeling overwhelmed",
        "Help me get started",
      ],
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    
    res.json({
      response: "I'm here to help! What's on your mind today? We can work through any task or challenge together. 💪",
      suggestions: [
        "I need help with a task",
        "I'm having trouble focusing",
        "I feel stuck",
      ],
    });
  }
});

export default router;
