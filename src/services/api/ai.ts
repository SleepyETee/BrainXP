import apiClient from './client';
import { AIDecompositionResult } from '../../types/task';
import { AISuggestion } from '../../types/capture';
import { ApiResponse } from '../../types';

export interface AIInsight {
  id: string;
  type: 'productivity' | 'pattern' | 'suggestion' | 'encouragement';
  title: string;
  message: string;
  actionLabel?: string;
  actionType?: string;
  actionData?: Record<string, unknown>;
  priority: number;
  createdAt: string;
  expiresAt?: string;
  dismissed: boolean;
}

export interface SmartScheduleSuggestion {
  taskId: string;
  suggestedDate: string;
  suggestedTime?: string;
  reason: string;
  confidence: number;
}

export interface TaskEstimateAdjustment {
  taskId: string;
  originalEstimate: number;
  adjustedEstimate: number;
  userTimeRatio: number;
  reasoning: string;
}

// Task decomposition
export const decomposeTask = async (
  taskId: string,
  context?: string
): Promise<AIDecompositionResult> => {
  const response = await apiClient.post<ApiResponse<AIDecompositionResult>>(
    '/ai/decompose-task',
    { taskId, context }
  );
  return response.data.data;
};

// Smart scheduling
export const getSmartScheduleSuggestions = async (
  taskIds: string[]
): Promise<SmartScheduleSuggestion[]> => {
  const response = await apiClient.post<ApiResponse<SmartScheduleSuggestion[]>>(
    '/ai/smart-schedule',
    { taskIds }
  );
  return response.data.data;
};

// Time estimation
export const adjustTimeEstimate = async (
  taskId: string
): Promise<TaskEstimateAdjustment> => {
  const response = await apiClient.post<ApiResponse<TaskEstimateAdjustment>>(
    '/ai/adjust-estimate',
    { taskId }
  );
  return response.data.data;
};

// Capture processing
export const processCaptureWithAI = async (
  captureId: string
): Promise<AISuggestion> => {
  const response = await apiClient.post<ApiResponse<AISuggestion>>(
    '/ai/process-capture',
    { captureId }
  );
  return response.data.data;
};

// Insights
export const getInsights = async (): Promise<AIInsight[]> => {
  const response = await apiClient.get<ApiResponse<AIInsight[]>>('/ai/insights');
  return response.data.data;
};

export const dismissInsight = async (id: string): Promise<void> => {
  await apiClient.post(`/ai/insights/${id}/dismiss`);
};

// Daily summary
export const getDailySummary = async (date?: string): Promise<{
  tasksCompleted: number;
  focusMinutes: number;
  habitsCompleted: number;
  xpEarned: number;
  highlights: string[];
  suggestions: string[];
}> => {
  const response = await apiClient.get<ApiResponse<{
    tasksCompleted: number;
    focusMinutes: number;
    habitsCompleted: number;
    xpEarned: number;
    highlights: string[];
    suggestions: string[];
  }>>('/ai/daily-summary', { params: { date } });
  return response.data.data;
};

// Encouragement messages
export const getEncouragement = async (context?: {
  tasksCompleted?: number;
  streak?: number;
  mood?: number;
}): Promise<string> => {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(
    '/ai/encouragement',
    context
  );
  return response.data.data.message;
};

// First step suggestion
export const suggestFirstStep = async (taskTitle: string): Promise<string> => {
  const response = await apiClient.post<ApiResponse<{ firstStep: string }>>(
    '/ai/suggest-first-step',
    { taskTitle }
  );
  return response.data.data.firstStep;
};
