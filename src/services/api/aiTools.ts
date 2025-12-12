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

// ═══════════════════════════════════════════════════════════════════════════════
// SPOON/ENERGY ESTIMATOR
// ═══════════════════════════════════════════════════════════════════════════════

export const estimateSpoons = async (
  input: EstimateSpoonInput
): Promise<SpoonEstimate> => {
  const response = await apiClient.post<ApiResponse<SpoonEstimate>>(
    '/ai-tools/estimate-spoons',
    input
  );
  return response.data.data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// TONE REWRITER
// ═══════════════════════════════════════════════════════════════════════════════

export const rewriteTone = async (
  input: RewriteToneInput
): Promise<RewriteResult> => {
  const response = await apiClient.post<ApiResponse<RewriteResult>>(
    '/ai-tools/rewrite-tone',
    input
  );
  return response.data.data;
};

export const analyzeTone = async (text: string): Promise<ToneAnalysis> => {
  const response = await apiClient.post<ApiResponse<ToneAnalysis>>(
    '/ai-tools/analyze-tone',
    { text }
  );
  return response.data.data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOTE COMPILER
// ═══════════════════════════════════════════════════════════════════════════════

export const compileNotes = async (
  input: CompileInput
): Promise<CompileResult> => {
  const response = await apiClient.post<ApiResponse<CompileResult>>(
    '/ai-tools/compile-notes',
    input
  );
  return response.data.data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SMART TIME ESTIMATION
// ═══════════════════════════════════════════════════════════════════════════════

export const estimateTime = async (
  input: EstimateTimeInput
): Promise<TimeEstimate> => {
  const response = await apiClient.post<ApiResponse<TimeEstimate>>(
    '/ai-tools/estimate-time',
    input
  );
  return response.data.data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAGIC BREAKDOWN
// ═══════════════════════════════════════════════════════════════════════════════

export const magicBreakdown = async (
  input: MagicBreakdownInput
): Promise<MagicBreakdownResult> => {
  const response = await apiClient.post<ApiResponse<MagicBreakdownResult>>(
    '/ai-tools/magic-breakdown',
    input
  );
  return response.data.data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// FLASHCARD GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export const generateFlashcards = async (
  input: FlashcardGeneratorInput
): Promise<FlashcardGeneratorOutput> => {
  const response = await apiClient.post<ApiResponse<FlashcardGeneratorOutput>>(
    '/ai-tools/generate-flashcards',
    input
  );
  return response.data.data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export const generateQuiz = async (
  input: QuizGeneratorInput
): Promise<QuizGeneratorOutput> => {
  const response = await apiClient.post<ApiResponse<QuizGeneratorOutput>>(
    '/ai-tools/generate-quiz',
    input
  );
  return response.data.data;
};
