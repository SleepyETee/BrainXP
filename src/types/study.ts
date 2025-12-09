// ═══════════════════════════════════════════════════════════════════════════════
// STUDY & FLASHCARD TYPES (Quizlet-inspired)
// Spaced Repetition, Study Sets, Quizzes
// ═══════════════════════════════════════════════════════════════════════════════

export type LearningState = 'new' | 'learning' | 'review' | 'relearning';

// Review quality for SM-2 algorithm (0-5 scale)
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export const REVIEW_QUALITY = {
  COMPLETE_BLACKOUT: 0 as ReviewQuality, // Alias for BLACKOUT
  BLACKOUT: 0 as ReviewQuality,      // Complete blackout
  INCORRECT: 1 as ReviewQuality,     // Incorrect, but upon seeing correct answer, remembered
  INCORRECT_EASY: 2 as ReviewQuality,// Incorrect, but correct answer was easily recalled
  CORRECT_HARD: 3 as ReviewQuality,  // Correct with serious difficulty
  CORRECT_DIFFICULT: 3 as ReviewQuality, // Alias for CORRECT_HARD
  CORRECT: 4 as ReviewQuality,       // Correct after hesitation
  CORRECT_HESITATION: 4 as ReviewQuality, // Alias for CORRECT
  PERFECT: 5 as ReviewQuality,       // Perfect response
} as const;

export interface CreateFlashcardInput {
  studySetId: string;
  front: string;
  back: string;
  hint?: string;
  explanation?: string;
  tags?: string[];
}

export interface UpdateFlashcardInput extends Partial<CreateFlashcardInput> {
  id?: string;
}

export interface CreateStudySetInput {
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  isPublic?: boolean;
}

export interface UpdateStudySetInput extends Partial<CreateStudySetInput> {
  id?: string;
}

export interface ReviewCardInput {
  cardId: string;
  quality: ReviewQuality;
  responseTime?: number;
}

export interface ReviewCardResult {
  success: boolean;
  newInterval: number;
  newEaseFactor: number;
  nextReview: string;
}

export interface CreateQuizInput {
  studySetId?: string;
  title: string;
  description?: string;
  type: QuizType;
  questionCount?: number;
  timeLimit?: number;
}

export interface SubmitQuizInput {
  quizId: string;
  answers: { questionId: string; answer: string | string[] }[];
  timeSpent?: number;
}

export interface StartStudySessionInput {
  studySetId: string;
  mode: StudyMode;
  cardLimit?: number;
}

export interface StudySessionStats {
  totalCards: number;
  masteredCards: number;
  dueToday: number;
  averageAccuracy: number;
}

export interface GenerateFlashcardsInput {
  content: string;
  studySetId?: string;
  cardCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface GenerateFlashcardsResult {
  cards: { front: string; back: string; explanation?: string }[];
  success: boolean;
}

export interface GenerateQuizInput {
  content: string;
  questionCount?: number;
  types?: ('multiple_choice' | 'true_false' | 'written')[];
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface GenerateQuizResult {
  questions: QuizQuestion[];
  success: boolean;
}

export interface Flashcard {
  id: string;
  studySetId: string;
  front: string;
  back: string;
  hint?: string;
  explanation?: string;
  imageUrlFront?: string;
  imageUrlBack?: string;
  audioUrl?: string;
  
  // Spaced Repetition (SM-2 Algorithm)
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview?: string;
  lastReview?: string;
  learningState: LearningState;
  lapses: number;
  
  tags: string[];
  order: number;
  aiGenerated: boolean;
  confidence?: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface StudySet {
  id: string;
  userId: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  isPublic: boolean;
  isFavorite: boolean;
  aiGenerated: boolean;
  sourceDocId?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  cards: Flashcard[];
  // Computed counts
  cardCount?: number;
  dueCount?: number;
  masteredCount?: number;
}

export interface FlashcardReview {
  id: string;
  flashcardId: string;
  userId: string;
  quality: number; // 0-5 (SM-2)
  responseTime?: number;
  prevEaseFactor: number;
  prevInterval: number;
  newEaseFactor: number;
  newInterval: number;
  reviewedAt: string;
}

export type StudyMode = 'review' | 'learn' | 'cram' | 'test';

export interface StudySession {
  id: string;
  studySetId: string;
  userId: string;
  mode: StudyMode;
  cardsTotal: number;
  cardsReviewed: number;
  cardsCorrect: number;
  cardsIncorrect: number;
  cardsSkipped: number;
  cardResults?: {
    cardId: string;
    quality: number;
    responseTime?: number;
  }[];
  duration?: number;
  xpEarned: number;
  startedAt: string;
  endedAt?: string;
}

export type QuizType = 'multiple_choice' | 'true_false' | 'written' | 'matching' | 'mixed';

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'written' | 'matching' | 'fill_blank';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  imageUrl?: string;
  points: number;
}

export interface Quiz {
  id: string;
  studySetId?: string;
  userId: string;
  title: string;
  description?: string;
  type: QuizType;
  questions: QuizQuestion[];
  totalPoints: number;
  timeLimit?: number;
  aiGenerated: boolean;
  sourceContent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  pointsEarned: number;
  pointsTotal: number;
  answers: {
    questionId: string;
    answer: string | string[];
    correct: boolean;
    timeSpent?: number;
  }[];
  timeSpent?: number;
  xpEarned: number;
  completedAt: string;
}

// SM-2 Algorithm helpers
export interface SM2Response {
  newEaseFactor: number;
  newInterval: number;
  newRepetitions: number;
  nextReview: Date;
}

export function calculateSM2(
  quality: number,
  easeFactor: number,
  interval: number,
  repetitions: number
): SM2Response {
  // Quality: 0-5 where 3+ is successful recall
  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;
  
  if (quality >= 3) {
    // Successful recall
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions = repetitions + 1;
  } else {
    // Failed recall
    newRepetitions = 0;
    newInterval = 1;
  }
  
  // Update ease factor
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;
  
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);
  
  return {
    newEaseFactor,
    newInterval,
    newRepetitions,
    nextReview,
  };
}
