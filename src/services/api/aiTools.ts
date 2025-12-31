import apiClient from './client';
import { ApiResponse } from '../../types';
import {
  SpoonEstimate,
  EstimateSpoonInput,
  RewriteResult,
  RewriteToneInput,
  ToneAnalysis,
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
} from '../../types/aiTools';
import {
  mockEstimateSpoons,
  mockRewriteTone,
  mockCompileNotes,
  mockEstimateTime,
  mockMagicBreakdown,
  mockGenerateFlashcards,
  mockGenerateQuiz,
} from './mockAiTools';

// Flag to control offline/mock mode
const USE_MOCK_FALLBACK = true;

// Helper to wrap API calls with mock fallback
async function withMockFallback<T>(
  apiCall: () => Promise<T>,
  mockCall: () => Promise<T>
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (USE_MOCK_FALLBACK) {
      console.log('API unavailable, using mock fallback');
      return await mockCall();
    }
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPOON/ENERGY ESTIMATOR
// ═══════════════════════════════════════════════════════════════════════════════

export const estimateSpoons = async (
  input: EstimateSpoonInput
): Promise<SpoonEstimate> => {
  return withMockFallback(
    async () => {
      const response = await apiClient.post<ApiResponse<SpoonEstimate>>(
        '/ai-tools/estimate-spoons',
        input
      );
      return response.data.data;
    },
    () => mockEstimateSpoons(input)
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TONE REWRITER
// ═══════════════════════════════════════════════════════════════════════════════

export const rewriteTone = async (
  input: RewriteToneInput
): Promise<RewriteResult> => {
  return withMockFallback(
    async () => {
      const response = await apiClient.post<ApiResponse<RewriteResult>>(
        '/ai-tools/rewrite-tone',
        input
      );
      return response.data.data;
    },
    () => mockRewriteTone(input)
  );
};

export const analyzeTone = async (text: string): Promise<ToneAnalysis> => {
  return withMockFallback(
    async () => {
      const response = await apiClient.post<ApiResponse<ToneAnalysis>>(
        '/ai-tools/analyze-tone',
        { text }
      );
      return response.data.data;
    },
    async () => ({
      tone: 'professional' as const,
      confidence: 0.7,
      suggestions: ['Consider the context when interpreting tone'],
    })
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOTE COMPILER
// ═══════════════════════════════════════════════════════════════════════════════

export const compileNotes = async (
  input: CompileInput
): Promise<CompileResult> => {
  return withMockFallback(
    async () => {
      const response = await apiClient.post<ApiResponse<CompileResult>>(
        '/ai-tools/compile-notes',
        input
      );
      return response.data.data;
    },
    () => mockCompileNotes(input)
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SMART TIME ESTIMATION
// ═══════════════════════════════════════════════════════════════════════════════

export const estimateTime = async (
  input: EstimateTimeInput
): Promise<TimeEstimate> => {
  return withMockFallback(
    async () => {
      const response = await apiClient.post<ApiResponse<TimeEstimate>>(
        '/ai-tools/estimate-time',
        input
      );
      return response.data.data;
    },
    () => mockEstimateTime(input)
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAGIC BREAKDOWN
// ═══════════════════════════════════════════════════════════════════════════════

export const magicBreakdown = async (
  input: MagicBreakdownInput
): Promise<MagicBreakdownResult> => {
  return withMockFallback(
    async () => {
      const response = await apiClient.post<ApiResponse<MagicBreakdownResult>>(
        '/ai-tools/magic-breakdown',
        input
      );
      return response.data.data;
    },
    () => mockMagicBreakdown(input)
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FLASHCARD GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export const generateFlashcards = async (
  input: FlashcardGeneratorInput
): Promise<FlashcardGeneratorOutput> => {
  return withMockFallback(
    async () => {
      const response = await apiClient.post<ApiResponse<FlashcardGeneratorOutput>>(
        '/ai-tools/generate-flashcards',
        input
      );
      return response.data.data;
    },
    () => mockGenerateFlashcards(input)
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export const generateQuiz = async (
  input: QuizGeneratorInput
): Promise<QuizGeneratorOutput> => {
  return withMockFallback(
    async () => {
      const response = await apiClient.post<ApiResponse<QuizGeneratorOutput>>(
        '/ai-tools/generate-quiz',
        input
      );
      return response.data.data;
    },
    () => mockGenerateQuiz(input)
  );
};

