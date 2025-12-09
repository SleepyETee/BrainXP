import apiClient from './client';
import { ApiResponse } from '../../types';
import {
  StudySet,
  CreateStudySetInput,
  UpdateStudySetInput,
  Flashcard,
  CreateFlashcardInput,
  UpdateFlashcardInput,
  ReviewCardInput,
  ReviewCardResult,
  ReviewQuality,
  Quiz,
  CreateQuizInput,
  QuizAttempt,
  SubmitQuizInput,
  StudySession,
  StartStudySessionInput,
  StudySessionStats,
  GenerateFlashcardsInput,
  GenerateFlashcardsResult,
  GenerateQuizInput,
  GenerateQuizResult,
} from '../../types/study';

// ═══════════════════════════════════════════════════════════════════════════════
// STUDY SETS
// ═══════════════════════════════════════════════════════════════════════════════

export const getStudySets = async (): Promise<StudySet[]> => {
  const response = await apiClient.get<ApiResponse<StudySet[]>>('/study/sets');
  return response.data.data;
};

export const getStudySet = async (id: string): Promise<StudySet> => {
  const response = await apiClient.get<ApiResponse<StudySet>>(`/study/sets/${id}`);
  return response.data.data;
};

export const createStudySet = async (input: CreateStudySetInput): Promise<StudySet> => {
  const response = await apiClient.post<ApiResponse<StudySet>>('/study/sets', input);
  return response.data.data;
};

export const updateStudySet = async (
  id: string,
  input: UpdateStudySetInput
): Promise<StudySet> => {
  const response = await apiClient.patch<ApiResponse<StudySet>>(
    `/study/sets/${id}`,
    input
  );
  return response.data.data;
};

export const deleteStudySet = async (id: string): Promise<void> => {
  await apiClient.delete(`/study/sets/${id}`);
};

// ═══════════════════════════════════════════════════════════════════════════════
// FLASHCARDS
// ═══════════════════════════════════════════════════════════════════════════════

export const getFlashcards = async (studySetId: string): Promise<Flashcard[]> => {
  const response = await apiClient.get<ApiResponse<Flashcard[]>>(
    `/study/sets/${studySetId}/cards`
  );
  return response.data.data;
};

export const createFlashcard = async (input: CreateFlashcardInput): Promise<Flashcard> => {
  const response = await apiClient.post<ApiResponse<Flashcard>>('/study/cards', input);
  return response.data.data;
};

export const updateFlashcard = async (
  id: string,
  input: UpdateFlashcardInput
): Promise<Flashcard> => {
  const response = await apiClient.patch<ApiResponse<Flashcard>>(
    `/study/cards/${id}`,
    input
  );
  return response.data.data;
};

export const deleteFlashcard = async (id: string): Promise<void> => {
  await apiClient.delete(`/study/cards/${id}`);
};

// ═══════════════════════════════════════════════════════════════════════════════
// SPACED REPETITION
// ═══════════════════════════════════════════════════════════════════════════════

export const getDueCards = async (
  studySetId: string,
  limit?: number
): Promise<{
  cards: Flashcard[];
  newCount: number;
  learningCount: number;
  reviewCount: number;
}> => {
  const response = await apiClient.get<
    ApiResponse<{
      cards: Flashcard[];
      newCount: number;
      learningCount: number;
      reviewCount: number;
    }>
  >(`/study/due/${studySetId}`, { params: { limit } });
  return response.data.data;
};

export const reviewCard = async (input: ReviewCardInput): Promise<ReviewCardResult> => {
  const response = await apiClient.post<ApiResponse<ReviewCardResult>>(
    '/study/review',
    input
  );
  return response.data.data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZZES
// ═══════════════════════════════════════════════════════════════════════════════

export const getQuizzes = async (studySetId?: string): Promise<Quiz[]> => {
  const response = await apiClient.get<ApiResponse<Quiz[]>>('/study/quizzes', {
    params: studySetId ? { studySetId } : undefined,
  });
  return response.data.data;
};

export const getQuiz = async (id: string): Promise<Quiz> => {
  const response = await apiClient.get<ApiResponse<Quiz>>(`/study/quizzes/${id}`);
  return response.data.data;
};

export const createQuiz = async (input: CreateQuizInput): Promise<Quiz> => {
  const response = await apiClient.post<ApiResponse<Quiz>>('/study/quizzes', input);
  return response.data.data;
};

export const submitQuiz = async (
  input: SubmitQuizInput
): Promise<{
  attempt: QuizAttempt;
  summary: {
    score: number;
    correct: number;
    total: number;
    xpEarned: number;
    feedback: string;
  };
}> => {
  const response = await apiClient.post<
    ApiResponse<{
      attempt: QuizAttempt;
      summary: {
        score: number;
        correct: number;
        total: number;
        xpEarned: number;
        feedback: string;
      };
    }>
  >('/study/quiz/submit', input);
  return response.data.data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// AI GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

export const generateFlashcards = async (
  input: GenerateFlashcardsInput
): Promise<GenerateFlashcardsResult> => {
  const response = await apiClient.post<ApiResponse<GenerateFlashcardsResult>>(
    '/study/generate/flashcards',
    input
  );
  return response.data.data;
};

export const generateQuiz = async (
  input: GenerateQuizInput
): Promise<GenerateQuizResult> => {
  const response = await apiClient.post<ApiResponse<GenerateQuizResult>>(
    '/study/generate/quiz',
    input
  );
  return response.data.data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// STUDY SESSIONS & STATS
// ═══════════════════════════════════════════════════════════════════════════════

export const startStudySession = async (
  input: StartStudySessionInput
): Promise<StudySession> => {
  const response = await apiClient.post<ApiResponse<StudySession>>(
    '/study/sessions',
    input
  );
  return response.data.data;
};

export const endStudySession = async (
  sessionId: string,
  results: {
    cardsReviewed: number;
    cardsCorrect: number;
    cardsIncorrect: number;
    cardsSkipped: number;
  }
): Promise<StudySession> => {
  const response = await apiClient.patch<ApiResponse<StudySession>>(
    `/study/sessions/${sessionId}`,
    { ...results, endedAt: new Date().toISOString() }
  );
  return response.data.data;
};

export const getStudyStats = async (): Promise<StudySessionStats> => {
  const response = await apiClient.get<ApiResponse<StudySessionStats>>('/study/stats');
  return response.data.data;
};
