// Mock AI Tools Service - Provides fallback responses when backend is unavailable
// This allows the app to function offline or during development

import {
  SpoonEstimate,
  EstimateSpoonInput,
  RewriteResult,
  RewriteToneInput,
  CompileResult,
  CompileInput,
  TimeEstimate,
  EstimateTimeInput,
  MagicBreakdownResult,
  MagicBreakdownInput,
  FlashcardGeneratorInput,
  FlashcardGeneratorOutput,
  QuizGeneratorInput,
  QuizGeneratorOutput,
  GeneratedQuizQuestion,
  GeneratedFlashcard,
} from '../../types/aiTools';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Helper to simulate network delay
const simulateDelay = (ms: number = 800) => 
  new Promise(resolve => setTimeout(resolve, ms));

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK SPOON ESTIMATOR
// ═══════════════════════════════════════════════════════════════════════════════

export const mockEstimateSpoons = async (
  input: EstimateSpoonInput
): Promise<SpoonEstimate> => {
  await simulateDelay();
  
  const task = input.task || input.taskTitle || input.taskDescription || '';
  const wordCount = task.split(/\s+/).length;
  
  // Simple heuristic based on task complexity
  let spoonsCost = 2;
  if (wordCount > 20) spoonsCost = 4;
  else if (wordCount > 10) spoonsCost = 3;
  else if (wordCount < 5) spoonsCost = 1;
  
  const labels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
  const emojis = ['🥄', '🥄🥄', '🥄🥄🥄', '🥄🥄🥄🥄', '🥄🥄🥄🥄🥄'];
  
  return {
    task,
    spoonsCost,
    spoons: spoonsCost,
    label: labels[spoonsCost - 1],
    emoji: emojis[spoonsCost - 1],
    explanation: `This task requires approximately ${spoonsCost} spoons based on its complexity.`,
    energyBreakdown: {
      physical: Math.ceil(spoonsCost * 0.3),
      mental: Math.ceil(spoonsCost * 0.5),
      emotional: Math.ceil(spoonsCost * 0.2),
    },
    factors: [
      { name: 'Task Complexity', impact: spoonsCost > 3 ? 'high' : 'medium', description: 'Based on task description length' },
    ],
    tips: [
      'Break this into smaller steps if it feels overwhelming',
      'Consider doing this during your peak energy time',
      'Take breaks as needed',
    ],
    suggestions: [
      'Start with just 2 minutes to build momentum',
      'Pair this with a reward after completion',
    ],
    bestTimeOfDay: spoonsCost > 3 ? 'morning' : 'afternoon',
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK TONE REWRITER
// ═══════════════════════════════════════════════════════════════════════════════

export const mockRewriteTone = async (
  input: RewriteToneInput
): Promise<RewriteResult> => {
  await simulateDelay();
  
  const { text, targetTone } = input;
  
  // Simple mock transformations
  let rewritten = text;
  const changes: { original: string; changed: string; reason: string }[] = [];
  
  switch (targetTone) {
    case 'professional':
      rewritten = text.replace(/hey|hi/gi, 'Hello').replace(/!/g, '.');
      changes.push({ original: 'Casual greeting', changed: 'Formal greeting', reason: 'More professional' });
      break;
    case 'casual':
      rewritten = text.replace(/Hello|Greetings/gi, 'Hey').replace(/\./g, '!');
      changes.push({ original: 'Formal tone', changed: 'Casual tone', reason: 'More approachable' });
      break;
    case 'friendly':
      rewritten = `${text} 😊`;
      changes.push({ original: 'Neutral', changed: 'Added warmth', reason: 'More friendly' });
      break;
    default:
      rewritten = text;
  }
  
  return {
    originalText: text,
    rewrittenText: rewritten,
    original: text,
    rewritten: rewritten,
    tone: targetTone,
    changes,
    readabilityScore: 75,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK NOTE COMPILER
// ═══════════════════════════════════════════════════════════════════════════════

export const mockCompileNotes = async (
  input: CompileInput
): Promise<CompileResult> => {
  await simulateDelay();
  
  const texts = input.texts || (input.content ? [input.content] : []);
  const combined = texts.join('\n\n');
  const words = combined.split(/\s+/);
  
  // Extract key topics (simple word frequency)
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length > 4) {
      wordFreq[clean] = (wordFreq[clean] || 0) + 1;
    }
  });
  
  const keyTopics = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
  
  // Generate compiled content based on format
  let compiled = '';
  const format = input.format || input.outputFormat || 'summary';
  
  switch (format) {
    case 'bullets':
    case 'bullet_points':
      compiled = texts.map(t => `• ${t.substring(0, 100)}...`).join('\n');
      break;
    case 'outline':
      compiled = `# ${input.title || 'Compiled Notes'}\n\n${texts.map((t, i) => `## Section ${i + 1}\n${t.substring(0, 200)}...`).join('\n\n')}`;
      break;
    case 'action_items':
      compiled = `Action Items:\n${texts.map((t, i) => `□ Review: ${t.substring(0, 50)}...`).join('\n')}`;
      break;
    default:
      compiled = `Summary: ${combined.substring(0, 500)}...`;
  }
  
  return {
    originalLength: combined.length,
    compiledContent: compiled,
    compiled,
    title: input.title || 'Compiled Notes',
    wordCount: words.length,
    format,
    keyTopics,
    actionItems: ['Review the compiled notes', 'Identify key action items', 'Share with team if needed'],
    questions: ['What are the main takeaways?', 'Are there any gaps in the information?'],
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK TIME ESTIMATOR
// ═══════════════════════════════════════════════════════════════════════════════

export const mockEstimateTime = async (
  input: EstimateTimeInput
): Promise<TimeEstimate> => {
  await simulateDelay();
  
  const { taskTitle, taskDescription, subtasks, complexity, familiarity } = input;
  
  // Base estimate on task complexity
  let baseMinutes = 30;
  if (complexity === 'simple') baseMinutes = 15;
  if (complexity === 'complex') baseMinutes = 60;
  
  // Adjust for familiarity
  if (familiarity === 'expert') baseMinutes *= 0.7;
  if (familiarity === 'new') baseMinutes *= 1.5;
  
  // Add time for subtasks
  const subtaskTime = (subtasks?.length || 0) * 10;
  const estimatedMinutes = Math.round(baseMinutes + subtaskTime);
  
  return {
    estimatedMinutes,
    confidence: complexity === 'moderate' ? 'medium' : complexity === 'simple' ? 'high' : 'low',
    minMinutes: Math.round(estimatedMinutes * 0.7),
    maxMinutes: Math.round(estimatedMinutes * 1.5),
    breakdown: [
      { phase: 'Setup', minutes: Math.round(estimatedMinutes * 0.1), description: 'Getting started' },
      { phase: 'Main Work', minutes: Math.round(estimatedMinutes * 0.7), description: 'Core task execution' },
      { phase: 'Review', minutes: Math.round(estimatedMinutes * 0.2), description: 'Final checks' },
    ],
    tips: [
      'Add 20% buffer time for unexpected issues',
      'Break into smaller chunks if over 45 minutes',
      'Schedule during your peak energy hours',
    ],
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK MAGIC BREAKDOWN
// ═══════════════════════════════════════════════════════════════════════════════

export const mockMagicBreakdown = async (
  input: MagicBreakdownInput
): Promise<MagicBreakdownResult> => {
  await simulateDelay(1000);
  
  const { task, maxSteps = 5, granularity = 'medium' } = input;
  
  // Generate steps based on granularity
  let stepCount = maxSteps;
  if (granularity === 'coarse') stepCount = Math.min(3, maxSteps);
  if (granularity === 'fine') stepCount = Math.min(7, maxSteps);
  if (granularity === 'micro') stepCount = Math.min(10, maxSteps);
  
  const stepTemplates = [
    { title: 'Gather what you need', emoji: '📦', energyLevel: 'low' as const },
    { title: 'Set up your workspace', emoji: '🖥️', energyLevel: 'low' as const },
    { title: 'Start with the easiest part', emoji: '🎯', energyLevel: 'medium' as const },
    { title: 'Work on the main section', emoji: '⚡', energyLevel: 'high' as const },
    { title: 'Take a quick break', emoji: '☕', energyLevel: 'low' as const },
    { title: 'Continue with details', emoji: '🔍', energyLevel: 'medium' as const },
    { title: 'Review your work', emoji: '✅', energyLevel: 'medium' as const },
    { title: 'Make final adjustments', emoji: '✨', energyLevel: 'low' as const },
    { title: 'Wrap up and save', emoji: '💾', energyLevel: 'low' as const },
    { title: 'Celebrate completion!', emoji: '🎉', energyLevel: 'low' as const },
  ];
  
  const steps = stepTemplates.slice(0, stepCount).map((template, i) => ({
    id: generateId(),
    title: `${template.title} for: ${task.substring(0, 30)}...`,
    emoji: template.emoji,
    estimatedMinutes: 5 + Math.floor(Math.random() * 15),
    energyLevel: template.energyLevel,
    spoonCost: template.energyLevel === 'high' ? 3 : template.energyLevel === 'medium' ? 2 : 1,
    order: i + 1,
    tip: `Focus on just this step before moving to the next`,
    isCheckpoint: i === Math.floor(stepCount / 2),
  }));
  
  const totalMinutes = steps.reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0);
  const totalSpoons = steps.reduce((sum, s) => sum + (s.spoonCost || 0), 0);
  
  return {
    originalTask: task,
    steps,
    totalEstimatedMinutes: totalMinutes,
    totalSpoons,
    smallestFirstStep: steps[0]?.title || 'Get started',
    encouragement: "You've got this! Just focus on one step at a time. 💪",
    progressCheckpoints: [
      { afterStep: Math.floor(stepCount / 2), message: "Halfway there! Great progress!", emoji: '🌟' },
      { afterStep: stepCount, message: "You did it! Amazing work!", emoji: '🎉' },
    ],
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK FLASHCARD GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export const mockGenerateFlashcards = async (
  input: FlashcardGeneratorInput
): Promise<FlashcardGeneratorOutput> => {
  await simulateDelay(1500);
  
  const { content, cardCount = 10, difficulty = 'medium' } = input;
  
  // Extract sentences from content for flashcards
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const actualCardCount = Math.min(cardCount, sentences.length, 20);
  
  const flashcards: GeneratedFlashcard[] = [];
  
  for (let i = 0; i < actualCardCount; i++) {
    const sentence = sentences[i % sentences.length]?.trim() || `Key concept ${i + 1}`;
    const words = sentence.split(/\s+/);
    const keyWord = words.find(w => w.length > 5) || words[0] || 'concept';
    
    flashcards.push({
      id: generateId(),
      front: `What is "${keyWord}"?`,
      back: sentence,
      explanation: `This relates to the main topic discussed in the content.`,
      difficulty,
      tags: ['generated', `card-${i + 1}`],
      hint: `Think about: ${words.slice(0, 3).join(' ')}...`,
    });
  }
  
  return {
    flashcards,
    metadata: {
      totalCards: flashcards.length,
      topicsCount: Math.ceil(flashcards.length / 3),
      topics: ['Main Topic', 'Sub-topic A', 'Sub-topic B'],
      estimatedStudyTime: flashcards.length * 2,
      difficulty,
    },
    studyTips: [
      'Review cards daily for best retention',
      'Focus on cards you find difficult',
      'Try to explain the answers in your own words',
      'Use spaced repetition for optimal learning',
    ],
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK QUIZ GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export const mockGenerateQuiz = async (
  input: QuizGeneratorInput
): Promise<QuizGeneratorOutput> => {
  await simulateDelay(1500);
  
  const { content, questionCount = 10, difficulty = 'medium', includeExplanations = true } = input;
  
  // Extract key phrases from content
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 15);
  const actualCount = Math.min(questionCount, sentences.length, 15);
  
  const questions: GeneratedQuizQuestion[] = [];
  
  for (let i = 0; i < actualCount; i++) {
    const sentence = sentences[i % sentences.length]?.trim() || `Concept ${i + 1}`;
    const words = sentence.split(/\s+/).filter(w => w.length > 3);
    const keyWord = words[Math.floor(Math.random() * words.length)] || 'concept';
    
    questions.push({
      id: generateId(),
      type: 'multiple_choice',
      question: `Based on the content, what best describes "${keyWord}"?`,
      options: [
        sentence.substring(0, 60) + '...',
        'An unrelated concept',
        'The opposite of what was stated',
        'None of the above',
      ],
      correctIndex: 0,
      correctAnswer: sentence.substring(0, 60) + '...',
      explanation: includeExplanations ? `This is correct because it directly relates to the source material.` : undefined,
      difficulty,
      topic: `Topic ${Math.ceil((i + 1) / 3)}`,
      hint: `Review the section about ${keyWord}`,
    });
  }
  
  return {
    questions,
    metadata: {
      totalQuestions: questions.length,
      byDifficulty: { 
        easy: difficulty === 'easy' ? questions.length : 0,
        medium: difficulty === 'medium' ? questions.length : 0,
        hard: difficulty === 'hard' ? questions.length : 0,
      },
      byType: { multiple_choice: questions.length, true_false: 0, short_answer: 0 },
      topics: ['Topic 1', 'Topic 2', 'Topic 3'],
      estimatedTime: questions.length * 2,
      passingScore: 70,
    },
    instructions: 'Read each question carefully and select the best answer. You can review your answers before submitting.',
  };
};
