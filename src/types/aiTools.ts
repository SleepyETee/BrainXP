// ═══════════════════════════════════════════════════════════════════════════════
// AI TOOLS TYPES (Goblin.tools-inspired)
// Task Breaking, Tone Rewriting, Spoon Estimation, etc.
// ═══════════════════════════════════════════════════════════════════════════════

export type AIToolType =
  | 'magic_todo'        // Break tasks into steps
  | 'formalizer'        // Rewrite text in different tones
  | 'spoon_estimator'   // Estimate energy/spoons required
  | 'judge'             // Rate how well something meets criteria
  | 'compiler'          // Summarize notes/text
  | 'quiz_generator'    // Generate quiz from content
  | 'flashcard_generator' // Generate flashcards from content
  | 'explainer'         // Explain concepts simply
  | 'decision_helper';  // Help make decisions

// Spoon Level for energy estimation (can be string or number)
export type SpoonLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high' | 1 | 2 | 3 | 4 | 5;

// Tone Style for text rewriting
export type ToneStyle = 'professional' | 'casual' | 'friendly' | 'assertive' | 'diplomatic' | 'enthusiastic' | 'empathetic' | 'formal' | 'simple' | 'gentle' | 'direct' | 'simplified';

// Compile Format for note compilation
export type CompileFormat = 'summary' | 'bullet_points' | 'bullets' | 'outline' | 'key_takeaways' | 'questions' | 'flashcards' | 'study_guide' | 'action_items' | 'essay' | 'meeting_notes' | 'blog_post';

export type TextTone =
  | 'professional'
  | 'casual'
  | 'friendly'
  | 'assertive'
  | 'diplomatic'
  | 'enthusiastic'
  | 'empathetic'
  | 'formal'
  | 'simple'
  | 'gentle'
  | 'direct'
  | 'simplified';

export interface MagicTodoInput {
  task: string;
  context?: string;
  maxSteps?: number;
  includeEstimates?: boolean;
}

export interface MagicTodoOutput {
  originalTask: string;
  steps: {
    title: string;
    estimatedMinutes?: number;
    energyLevel?: 'low' | 'medium' | 'high';
    order: number;
    tips?: string;
  }[];
  totalEstimatedMinutes: number;
  smallestFirstStep: string;
}

export interface FormalizerInput {
  text: string;
  targetTone: TextTone;
  context?: string;
}

export interface FormalizerOutput {
  originalText: string;
  rewrittenText: string;
  original?: string; // Alias for originalText
  rewritten?: string; // Alias for rewrittenText
  tone: TextTone;
  changes: (string | { original?: string; changed?: string; reason?: string })[];
  readabilityScore?: number;
}

export interface SpoonEstimatorInput {
  task: string;
  taskTitle?: string; // Alias for task
  taskDescription?: string; // Another alias
  context?: string;
  currentEnergyLevel?: number; // 1-5
  currentEnergy?: number; // Alias for currentEnergyLevel
  userEnergyLevel?: number; // Alias for currentEnergyLevel
}

export interface SpoonEstimatorOutput {
  task: string;
  spoonsCost: number; // 1-5
  spoons?: number; // Alias for spoonsCost
  label?: string;
  emoji?: string;
  explanation?: string;
  energyBreakdown: {
    physical: number;
    mental: number;
    emotional: number;
  };
  factors?: { name: string; impact: 'low' | 'medium' | 'high'; description?: string }[];
  tips: string[];
  suggestions?: string[];
  bestTimeOfDay?: 'morning' | 'afternoon' | 'evening';
  canBeSimplified?: string;
  feasibility?: string | {
    possible: boolean;
    recommendation: string;
    alternativeTasks?: string[];
    bestApproach?: string;
  };
  adjustedSuggestion?: string;
  // ML-enhanced properties
  mlEnhanced?: boolean;
  confidence?: number;
  basedOnHistory?: number;
  mlAdjustments?: {
    factor: string;
    adjustment: number;
    reason: string;
  }[];
}

export interface CompilerInput {
  content?: string;
  texts?: string[];
  title?: string;
  instructions?: string;
  outputFormat?: CompileFormat;
  format?: CompileFormat; // Alias for outputFormat
  maxLength?: number;
  targetLength?: number;
}

export interface CompilerOutput {
  originalLength: number;
  compiledContent: string;
  compiled?: string; // Alias for compiledContent
  title?: string;
  wordCount?: number;
  format: string;
  keyTopics: string[];
  actionItems?: string[];
  questions?: string[];
}

export interface QuizGeneratorInput {
  content: string;
  questionCount?: number;
  questionTypes?: ('multiple_choice' | 'true_false' | 'short_answer')[];
  difficulty?: 'easy' | 'medium' | 'hard';
  includeExplanations?: boolean;
}

export interface GeneratedQuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  hint?: string;
}

export interface QuizGeneratorOutput {
  questions: GeneratedQuizQuestion[];
  metadata: {
    totalQuestions: number;
    byDifficulty: { easy: number; medium: number; hard: number };
    byType: { multiple_choice: number; true_false: number; short_answer: number };
    topics: string[];
    estimatedTime: number;
    passingScore: number;
  };
  instructions: string;
}

export interface FlashcardGeneratorInput {
  content: string;
  cardCount?: number;
  includeExplanations?: boolean;
  focusAreas?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface GeneratedFlashcard {
  id: string;
  front: string;
  back: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  hint?: string;
}

export interface FlashcardGeneratorOutput {
  flashcards: GeneratedFlashcard[];
  metadata: {
    totalCards: number;
    topicsCount: number;
    topics: string[];
    estimatedStudyTime: number;
    difficulty: string;
  };
  studyTips: string[];
}

export interface ExplainerInput {
  concept: string;
  targetAudience?: 'child' | 'teen' | 'adult' | 'expert';
  includeExamples?: boolean;
  includeAnalogies?: boolean;
}

export interface ExplainerOutput {
  concept: string;
  explanation: string;
  examples?: string[];
  analogies?: string[];
  relatedConcepts?: string[];
}

export interface DecisionHelperInput {
  decision: string;
  options: string[];
  criteria?: string[];
  context?: string;
}

export interface DecisionHelperOutput {
  decision: string;
  analysis: {
    option: string;
    pros: string[];
    cons: string[];
    score?: number;
  }[];
  recommendation?: string;
  questions?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI Tool Usage Tracking
// ═══════════════════════════════════════════════════════════════════════════════

export interface AIToolUsage {
  id: string;
  userId: string;
  tool: AIToolType;
  input: Record<string, any>;
  output: Record<string, any>;
  wasHelpful?: boolean;
  feedback?: string;
  processingTime?: number;
  tokensUsed?: number;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Additional type aliases for component compatibility
// ═══════════════════════════════════════════════════════════════════════════════

// Spoon Estimator types
export type SpoonEstimate = SpoonEstimatorOutput;
export type EstimateSpoonInput = SpoonEstimatorInput;

// Tone Rewriter types
export type RewriteResult = FormalizerOutput;
export type RewriteToneInput = FormalizerInput;

// Note Compiler types
export type CompileResult = CompilerOutput;
export type CompileInput = CompilerInput;

// Magic Breakdown (Task Breaking) types
export interface MagicBreakdownInput {
  task: string;
  context?: string;
  maxSteps?: number;
  granularity?: 'coarse' | 'medium' | 'fine' | 'micro';
  currentEnergy?: SpoonLevel;
  includeEstimates?: boolean;
}

export interface MagicBreakdownResult {
  originalTask: string;
  steps: {
    id: string;
    title: string;
    description?: string;
    emoji?: string;
    estimatedMinutes?: number;
    energyLevel?: 'low' | 'medium' | 'high';
    spoonCost?: number;
    spoons?: number; // Alias for spoonCost
    order: number;
    tip?: string;
    tips?: string;
    isCheckpoint?: boolean;
  }[];
  totalEstimatedMinutes: number;
  totalSpoons: number;
  smallestFirstStep: string;
  encouragement?: string;
  checkpoints?: {
    step: number;
    description: string;
  }[];
  progressCheckpoints?: {
    afterStep: number;
    message: string;
    emoji: string;
  }[];
  // ML-enhanced properties
  mlEnhanced?: boolean;
  personalizedInsights?: string[];
}

// Tone Analysis types
export interface ToneAnalysis {
  tone: TextTone;
  confidence: number;
  suggestions?: string[];
}

// Time Estimation types
export interface TimeEstimate {
  estimatedMinutes: number;
  confidence: 'low' | 'medium' | 'high';
  minMinutes: number;
  maxMinutes: number;
  personalizedMinutes?: number;
  personalRatio?: number;
  breakdown?: { phase: string; minutes: number; description: string }[];
  tips?: string[];
  // ML-enhanced properties
  mlEnhanced?: boolean;
  mlConfidence?: number;
  basedOnHistory?: number;
  mlAdjustedMinutes?: number;
  accuracyFactor?: number;
  mlBreakdown?: {
    phase: string;
    minutes: number;
    basedOn: string;
  }[];
}

export interface EstimateTimeInput {
  taskTitle: string;
  taskDescription?: string;
  subtasks?: string[];
  userHistory?: {
    averageRatio?: number;
    similarTasks?: {
      title: string;
      estimated: number;
      actual: number;
    }[];
  };
  complexity?: 'simple' | 'moderate' | 'complex';
  familiarity?: 'new' | 'familiar' | 'expert';
}
