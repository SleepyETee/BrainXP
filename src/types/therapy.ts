// ═══════════════════════════════════════════════════════════════════════════════
// NON-DRUG ADHD TREATMENT TYPES
// CBT, Cognitive Remediation, Mindfulness, Psychoeducation, tDCS Tracking
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────────
// A. CBT (Cognitive Behavioral Therapy) Types
// ─────────────────────────────────────────────────────────────────────────────────

export type AvoidanceReason =
  | 'fear_of_failure'
  | 'too_overwhelming'
  | 'dont_know_where_to_start'
  | 'perfectionism'
  | 'fear_of_criticism'
  | 'boredom'
  | 'fear_of_success'
  | 'analysis_paralysis'
  | 'other';

export type ThoughtPatternTag =
  | 'perfectionism'
  | 'fear_of_criticism'
  | 'boredom'
  | 'overwhelm'
  | 'imposter_syndrome'
  | 'black_and_white_thinking'
  | 'catastrophizing'
  | 'should_statements';

export interface NegativeThought {
  id: string;
  text: string;
  presetKey?: AvoidanceReason;
}

export interface BalancedThought {
  id: string;
  text: string;
}

export interface CBTIntervention {
  id: string;
  taskId: string;
  userId: string;
  triggeredAt: string;
  triggerType: 'user_flagged' | 'overdue_nudge' | 'pattern_detected';
  
  // The mini-flow data
  negativeThoughts: NegativeThought[];
  balancedThoughts: BalancedThought[];
  twoMinuteAction?: string;
  
  // Outcome
  outcome: 'completed_action' | 'broke_down_task' | 'lowered_bar' | 'dropped_task' | 'skipped' | null;
  outcomeNotes?: string;
  
  completedAt?: string;
}

export interface ThoughtLogEntry {
  id: string;
  userId: string;
  taskId?: string;
  patternTags: ThoughtPatternTag[];
  situation: string;
  automaticThought: string;
  emotion: string;
  emotionIntensity: number; // 1-10
  balancedThought?: string;
  outcomeEmotion?: string;
  outcomeIntensity?: number;
  createdAt: string;
}

export interface CBTPatternInsight {
  pattern: ThoughtPatternTag;
  count: number;
  percentage: number;
  lastOccurrence: string;
  suggestedTrick?: CBTTrick;
}

export interface CBTTrick {
  id: string;
  pattern: ThoughtPatternTag;
  title: string;
  description: string;
  duration: string; // e.g., "2 min"
  steps: string[];
}

// Procrastination loop intervention for tasks overdue 3+ times
export interface ProcrastinationNudge {
  taskId: string;
  overdueCount: number;
  options: {
    breakDown: boolean;
    lowerBar: boolean;
    dropTask: boolean;
  };
  selectedOption?: 'break_down' | 'lower_bar' | 'drop' | 'renegotiate';
  newDeadline?: string;
  goodEnoughVersion?: string;
}

// ─────────────────────────────────────────────────────────────────────────────────
// B. Cognitive Remediation Types
// ─────────────────────────────────────────────────────────────────────────────────

export type CognitiveSkill =
  | 'working_memory'
  | 'attention_switching'
  | 'planning'
  | 'inhibition'
  | 'processing_speed';

export interface WorkingMemoryStep {
  id: string;
  text: string;
  completed: boolean;
  forgotten: boolean;
}

export interface FocusSessionPlan {
  id: string;
  sessionId: string;
  userId: string;
  steps: WorkingMemoryStep[];
  maxStepsRecommended: number;
  stepsRemembered: number;
  stepsForgotten: number;
  createdAt: string;
  completedAt?: string;
}

export interface CognitiveProfile {
  userId: string;
  workingMemoryCapacity: number; // Recommended number of steps (2-5)
  lastAssessed: string;
  assessmentHistory: {
    date: string;
    stepsAttempted: number;
    stepsRemembered: number;
    successRate: number;
  }[];
}

export interface CognitiveTrainingSession {
  id: string;
  userId: string;
  skill: CognitiveSkill;
  exerciseType: string;
  difficulty: number; // 1-5
  duration: number; // in seconds
  score: number;
  accuracy: number;
  startedAt: string;
  completedAt: string;
}

export interface CognitiveExercise {
  id: string;
  skill: CognitiveSkill;
  name: string;
  description: string;
  duration: string;
  realLifeConnection: string;
  instructions: string[];
}

// ─────────────────────────────────────────────────────────────────────────────────
// C. Mindfulness Types
// ─────────────────────────────────────────────────────────────────────────────────

export type MindfulnessType =
  | 'grounding_5_4_3_2_1'
  | 'grounding_3_2_1'
  | 'mindful_breathing'
  | 'body_scan'
  | 'come_back_to_task'
  | 'end_of_day_reset'
  | 'pre_task_calm';

export type MindfulnessTrigger =
  | 'focus_session_start'
  | 'overwhelm_button'
  | 'focus_session_end'
  | 'before_scary_task'
  | 'manual'
  | 'scheduled';

export interface GroundingExercise {
  id: string;
  type: 'grounding_5_4_3_2_1' | 'grounding_3_2_1';
  prompts: {
    see: number;
    touch: number;
    hear: number;
    smell?: number;
    taste?: number;
  };
  duration: number; // in seconds
}

export interface MindfulBreathing {
  id: string;
  breaths: number;
  inhaleSeconds: number;
  holdSeconds?: number;
  exhaleSeconds: number;
  animationType: 'circle' | 'wave' | 'square';
}

export interface MindfulnessSession {
  id: string;
  userId: string;
  type: MindfulnessType;
  trigger: MindfulnessTrigger;
  contextTaskId?: string;
  contextFocusSessionId?: string;
  duration: number; // in seconds
  completed: boolean;
  moodBefore?: number; // 1-5
  moodAfter?: number;
  startedAt: string;
  completedAt?: string;
}

export interface MindfulnessPractice {
  id: string;
  type: MindfulnessType;
  name: string;
  description: string;
  duration: string;
  category: 'quick' | 'standard' | 'deep';
  bestFor: string[];
  instructions: string[];
}

// ─────────────────────────────────────────────────────────────────────────────────
// D. Psychoeducation Types
// ─────────────────────────────────────────────────────────────────────────────────

export type ADHDCardCategory =
  | 'understanding_adhd'
  | 'time_management'
  | 'focus_strategies'
  | 'emotional_regulation'
  | 'organization'
  | 'relationships'
  | 'self_care'
  | 'medication'
  | 'coping_strategies';

export type EducationTrigger =
  | 'reminder_fatigue'
  | 'repeated_snoozing'
  | 'task_abandonment'
  | 'focus_interruptions'
  | 'mood_patterns'
  | 'manual';

export interface ADHDCard {
  id: string;
  title: string;
  category: ADHDCardCategory;
  content: string; // Markdown content
  readTimeSeconds: number;
  keyTakeaway: string;
  practicalTips: string[];
  relatedCards: string[];
  tags: string[];
}

export interface TriggeredEducation {
  id: string;
  userId: string;
  cardId: string;
  trigger: EducationTrigger;
  triggerContext?: {
    taskId?: string;
    snoozeCount?: number;
    interruptionCount?: number;
    pattern?: string;
  };
  viewed: boolean;
  dismissed: boolean;
  helpfulRating?: number; // 1-5
  shownAt: string;
  viewedAt?: string;
}

export interface UserEducationProgress {
  userId: string;
  cardsViewed: string[];
  cardsBookmarked: string[];
  categoriesExplored: ADHDCardCategory[];
  lastCardAt?: string;
  streakDays: number;
}

// Parent/Partner mode content
export interface SupporterCard {
  id: string;
  title: string;
  audience: 'parent' | 'partner' | 'friend' | 'colleague';
  content: string;
  dos: string[];
  donts: string[];
  conversationStarters: string[];
}

// ─────────────────────────────────────────────────────────────────────────────────
// E. tDCS Tracking Types (Education & Tracking Only)
// ─────────────────────────────────────────────────────────────────────────────────

export interface TDCSSession {
  id: string;
  userId: string;
  
  // Session details (logged by user in supervised study)
  sessionDate: string;
  sessionTime: string;
  duration: number; // in minutes
  intensity?: number; // in mA, if known
  montage?: string; // electrode placement, if known
  studyProtocol?: string;
  
  // Pre-session ratings
  preFocusRating: number; // 1-5
  preMoodRating: number; // 1-5
  preEnergyRating: number; // 1-5
  
  // Post-session ratings
  postFocusRating?: number;
  postMoodRating?: number;
  postEnergyRating?: number;
  
  // Side effects
  sideEffects: TDCSSideEffect[];
  
  // Notes
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface TDCSSideEffect {
  id: string;
  type: 'tingling' | 'itching' | 'burning' | 'headache' | 'fatigue' | 'dizziness' | 'skin_irritation' | 'other';
  severity: 'mild' | 'moderate' | 'severe';
  duration?: string;
  notes?: string;
}

export interface TDCSEducationContent {
  id: string;
  title: string;
  content: string;
  safetyWarnings: string[];
  keyPoints: string[];
}

// ─────────────────────────────────────────────────────────────────────────────────
// Therapy Disclaimer
// ─────────────────────────────────────────────────────────────────────────────────

export const THERAPY_DISCLAIMER = {
  cbt: "This is CBT-inspired coaching, not therapy. For deeper work, please consult a mental health professional.",
  mindfulness: "These mindfulness exercises are for general wellness. They are not a substitute for professional mental health treatment.",
  education: "This information is for educational purposes only and does not constitute medical advice.",
  tdcs: "tDCS is a medical/research treatment. Do not attempt DIY tDCS. If you're interested, speak with a clinician or research team."
} as const;
