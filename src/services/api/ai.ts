import apiClient from './client';
import { AIDecompositionResult } from '../../types/task';
import { AISuggestion } from '../../types/capture';
import { ApiResponse } from '../../types';

export interface AIInsight {
  id: string;
  type: 'productivity' | 'pattern' | 'suggestion' | 'encouragement';
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionType?: 'navigate' | 'start_focus' | 'view_tasks';
  actionData?: Record<string, unknown>;
  priority?: number;
  createdAt?: string;
  expiresAt?: string;
  dismissed?: boolean;
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

export interface DecomposeTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  userContext?: {
    averageTimeRatio?: number;
    preferredTaskDuration?: number;
    energyLevel?: 'low' | 'medium' | 'high';
    currentMood?: number;
  };
}

export interface DecomposeTaskResponse {
  suggestedSteps: {
    title: string;
    estimatedMinutes: number;
    order: number;
    energyRequired?: 'low' | 'medium' | 'high';
    tip?: string;
  }[];
  smallestFirstStep: string;
  totalEstimatedMinutes: number;
  adjustedEstimate: number;
  userTimeRatio: number;
  motivationalNote?: string;
}

export interface FirstStepSuggestion {
  suggestion: string;
  alternatives: string[];
  encouragement: string;
}

export interface DailySummaryResponse {
  headline: string;
  highlights: string[];
  insights: string;
  suggestion: string;
  closingMessage: string;
}

export interface EncouragementResponse {
  message: string;
  bonusTip?: string;
}

export interface AICoachMessage {
  response: string;
  suggestions: string[];
}

// Task decomposition with Claude AI
export const decomposeTask = async (
  request: DecomposeTaskRequest
): Promise<DecomposeTaskResponse> => {
  const response = await apiClient.post<ApiResponse<DecomposeTaskResponse>>(
    '/ai/decompose',
    request
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

// Capture processing with AI categorization
export const processCaptureWithAI = async (
  captureData: {
    contentType: 'text' | 'voice' | 'photo' | 'link';
    textContent?: string;
    voiceTranscript?: string;
    linkUrl?: string;
  }
): Promise<AISuggestion> => {
  const response = await apiClient.post<ApiResponse<{ suggestion: AISuggestion }>>(
    '/ai/process-capture',
    captureData
  );
  return response.data.data.suggestion;
};

// Get personalized AI insights based on user data
export const getInsights = async (userData: {
  tasksCompleted?: number;
  focusMinutes?: number;
  habitsCompleted?: number;
  currentStreak?: number;
  averageFocusSession?: number;
  overdueTaskCount?: number;
  mood?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}): Promise<AIInsight[]> => {
  const response = await apiClient.post<ApiResponse<{ insights: AIInsight[] }>>(
    '/ai/insights',
    userData
  );
  return response.data.data.insights;
};

export const dismissInsight = async (id: string): Promise<void> => {
  await apiClient.post(`/ai/insights/${id}/dismiss`);
};

// Get AI-generated daily summary
export const getDailySummary = async (summaryData: {
  tasksCompleted: number;
  totalTasks: number;
  focusMinutes: number;
  habitsCompleted: number;
  totalHabits: number;
  xpEarned: number;
  streak: number;
  mood?: number;
}): Promise<DailySummaryResponse> => {
  const response = await apiClient.post<ApiResponse<DailySummaryResponse>>(
    '/ai/daily-summary',
    summaryData
  );
  return response.data.data;
};

// Get contextual encouragement messages
export const getEncouragement = async (context?: {
  tasksCompleted?: number;
  streak?: number;
  mood?: number;
  justCompletedTask?: boolean;
  justCompletedHabit?: boolean;
  focusSessionCompleted?: boolean;
  focusDuration?: number;
}): Promise<EncouragementResponse> => {
  const response = await apiClient.post<ApiResponse<EncouragementResponse>>(
    '/ai/encouragement',
    { context }
  );
  return response.data.data;
};

// First step suggestion for overcoming task paralysis
export const suggestFirstStep = async (
  taskTitle: string,
  taskDescription?: string,
  energyLevel?: 'low' | 'medium' | 'high'
): Promise<FirstStepSuggestion> => {
  const response = await apiClient.post<ApiResponse<FirstStepSuggestion>>(
    '/ai/suggest-first-step',
    { taskTitle, taskDescription, energyLevel }
  );
  return response.data.data;
};

// Chat with AI coach
export const chatWithCoach = async (
  message: string,
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
): Promise<AICoachMessage> => {
  const response = await apiClient.post<ApiResponse<AICoachMessage>>(
    '/ai/chat',
    { message, conversationHistory }
  );
  return response.data.data;
};

// Utility function to get time of day
export const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};
