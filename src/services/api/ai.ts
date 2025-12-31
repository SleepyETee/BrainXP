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

export interface ProjectCandidate {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  status?: 'active' | 'backlog' | 'on_hold' | 'completed';
}

export interface ProjectMatchResult {
  recommendedProject: {
    id: string;
    name: string;
    confidence: number;
    reason: string;
    suggestedTags?: string[];
  };
  alternatives: {
    id: string;
    name: string;
    reason: string;
    score?: number;
  }[];
  shouldCreateNewProject: boolean;
  newProjectIdea?: string | null;
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

export interface ProjectMatchRequest {
  taskTitle: string;
  taskDescription?: string;
  projects: ProjectCandidate[];
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

// Generate mock insights based on user data
const generateMockInsights = (userData: {
  tasksCompleted?: number;
  focusMinutes?: number;
  habitsCompleted?: number;
  currentStreak?: number;
  overdueTaskCount?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}): AIInsight[] => {
  const insights: AIInsight[] = [];
  const { tasksCompleted = 0, focusMinutes = 0, habitsCompleted = 0, currentStreak = 0, overdueTaskCount = 0, timeOfDay = 'morning' } = userData;

  // Time-based greeting
  if (timeOfDay === 'morning') {
    insights.push({
      id: 'morning-greeting',
      type: 'encouragement',
      icon: '🌅',
      title: 'Good morning!',
      message: 'A fresh start awaits. What\'s one small thing you can accomplish today?',
      priority: 1,
    });
  } else if (timeOfDay === 'evening') {
    insights.push({
      id: 'evening-reflection',
      type: 'encouragement',
      icon: '🌙',
      title: 'Evening wind-down',
      message: 'Great job today! Consider reviewing tomorrow\'s priorities before bed.',
      priority: 1,
    });
  }

  // Task completion insights
  if (tasksCompleted >= 3) {
    insights.push({
      id: 'task-streak',
      type: 'productivity',
      icon: '🔥',
      title: 'You\'re on fire!',
      message: `${tasksCompleted} tasks completed today. Keep the momentum going!`,
      priority: 2,
    });
  } else if (tasksCompleted === 0 && timeOfDay !== 'morning') {
    insights.push({
      id: 'task-nudge',
      type: 'suggestion',
      icon: '💡',
      title: 'Quick win opportunity',
      message: 'Try tackling one small task to build momentum.',
      actionLabel: 'View Tasks',
      actionType: 'view_tasks',
      priority: 3,
    });
  }

  // Focus insights
  if (focusMinutes >= 60) {
    insights.push({
      id: 'focus-champion',
      type: 'productivity',
      icon: '🧠',
      title: 'Deep focus achieved!',
      message: `${focusMinutes} minutes of focused work today. Your brain thanks you!`,
      priority: 2,
    });
  } else if (focusMinutes === 0 && timeOfDay !== 'morning') {
    insights.push({
      id: 'focus-suggestion',
      type: 'suggestion',
      icon: '⏱️',
      title: 'Ready for focus time?',
      message: 'A short 15-minute focus session can boost your productivity.',
      actionLabel: 'Start Focus',
      actionType: 'start_focus',
      priority: 3,
    });
  }

  // Habit insights
  if (habitsCompleted >= 3) {
    insights.push({
      id: 'habits-strong',
      type: 'pattern',
      icon: '✨',
      title: 'Habits are sticking!',
      message: `${habitsCompleted} habits completed. Building strong routines!`,
      priority: 2,
    });
  }

  // Streak insights
  if (currentStreak >= 7) {
    insights.push({
      id: 'streak-milestone',
      type: 'encouragement',
      icon: '🏆',
      title: `${currentStreak}-day streak!`,
      message: 'Consistency is your superpower. Keep it going!',
      priority: 1,
    });
  }

  // Overdue task warning
  if (overdueTaskCount > 0) {
    insights.push({
      id: 'overdue-tasks',
      type: 'suggestion',
      icon: '⚠️',
      title: `${overdueTaskCount} overdue task${overdueTaskCount > 1 ? 's' : ''}`,
      message: 'Consider rescheduling or breaking these down into smaller steps.',
      actionLabel: 'View Tasks',
      actionType: 'view_tasks',
      priority: 4,
    });
  }

  // Return top 3 insights sorted by priority
  return insights.sort((a, b) => (a.priority || 5) - (b.priority || 5)).slice(0, 3);
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
  try {
    const response = await apiClient.post<ApiResponse<{ insights: AIInsight[] }>>(
      '/ai/insights',
      userData
    );
    return response.data.data.insights;
  } catch (error) {
    // Fallback to mock insights when API is unavailable
    return generateMockInsights(userData);
  }
};

export const dismissInsight = async (id: string): Promise<void> => {
  await apiClient.post(`/ai/insights/${id}/dismiss`);
};

// Generate mock daily summary
const generateMockDailySummary = (summaryData: {
  tasksCompleted: number;
  totalTasks: number;
  focusMinutes: number;
  habitsCompleted: number;
  totalHabits: number;
  xpEarned: number;
  streak: number;
}): DailySummaryResponse => {
  const { tasksCompleted, totalTasks, focusMinutes, habitsCompleted, totalHabits, xpEarned, streak } = summaryData;
  const taskRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
  const habitRate = totalHabits > 0 ? Math.round((habitsCompleted / totalHabits) * 100) : 0;

  let headline = '';
  if (taskRate >= 80 && habitRate >= 80) {
    headline = '🌟 Outstanding day! You crushed it!';
  } else if (taskRate >= 50 || habitRate >= 50) {
    headline = '💪 Solid progress today!';
  } else if (tasksCompleted > 0 || habitsCompleted > 0) {
    headline = '🌱 Every step counts!';
  } else {
    headline = '🌅 A fresh start tomorrow awaits';
  }

  const highlights: string[] = [];
  if (tasksCompleted > 0) highlights.push(`✅ Completed ${tasksCompleted} task${tasksCompleted > 1 ? 's' : ''}`);
  if (focusMinutes > 0) highlights.push(`⏱️ ${focusMinutes} minutes of focused work`);
  if (habitsCompleted > 0) highlights.push(`🔄 ${habitsCompleted} habit${habitsCompleted > 1 ? 's' : ''} maintained`);
  if (xpEarned > 0) highlights.push(`⚡ Earned ${xpEarned} XP`);
  if (streak > 1) highlights.push(`🔥 ${streak}-day streak going strong`);

  return {
    headline,
    highlights: highlights.length > 0 ? highlights : ['Take it easy - rest is productive too!'],
    insights: focusMinutes >= 60 
      ? 'Your focus sessions are building strong concentration habits.'
      : 'Consider adding short focus blocks tomorrow to boost productivity.',
    suggestion: streak >= 3 
      ? 'Keep your streak alive with just one small win tomorrow!'
      : 'Start with your easiest task tomorrow morning to build momentum.',
    closingMessage: 'Rest well. Tomorrow is another opportunity to grow. 🌙',
  };
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
  try {
    const response = await apiClient.post<ApiResponse<DailySummaryResponse>>(
      '/ai/daily-summary',
      summaryData
    );
    return response.data.data;
  } catch (error) {
    return generateMockDailySummary(summaryData);
  }
};

// Generate mock encouragement
const generateMockEncouragement = (context?: {
  tasksCompleted?: number;
  streak?: number;
  justCompletedTask?: boolean;
  justCompletedHabit?: boolean;
  focusSessionCompleted?: boolean;
  focusDuration?: number;
}): EncouragementResponse => {
  if (context?.justCompletedTask) {
    return {
      message: '🎉 Task complete! Every finished task is a win.',
      bonusTip: 'Take a moment to celebrate before moving on.',
    };
  }
  if (context?.justCompletedHabit) {
    return {
      message: '✨ Habit logged! Consistency builds momentum.',
      bonusTip: context.streak && context.streak > 1 
        ? `You're on a ${context.streak}-day streak!` 
        : 'Keep it up tomorrow!',
    };
  }
  if (context?.focusSessionCompleted) {
    const duration = context.focusDuration || 25;
    return {
      message: `🧠 ${duration} minutes of deep work complete!`,
      bonusTip: 'Take a proper break - your brain earned it.',
    };
  }
  return {
    message: '💪 You\'re making progress. Keep going!',
    bonusTip: 'Small steps lead to big changes.',
  };
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
  try {
    const response = await apiClient.post<ApiResponse<EncouragementResponse>>(
      '/ai/encouragement',
      { context }
    );
    return response.data.data;
  } catch (error) {
    return generateMockEncouragement(context);
  }
};

// Generate mock first step suggestion
const generateMockFirstStep = (taskTitle: string, energyLevel?: 'low' | 'medium' | 'high'): FirstStepSuggestion => {
  const lowEnergySteps = [
    'Open the relevant app or document',
    'Write down just 3 words about it',
    'Set a 2-minute timer and just look at it',
  ];
  const mediumEnergySteps = [
    'Break it into 3 smaller parts',
    'Write the first sentence or bullet point',
    'Gather the materials you need',
  ];
  const highEnergySteps = [
    'Dive right in with the main action',
    'Start with the hardest part while you have energy',
    'Set a 25-minute focus session',
  ];

  const steps = energyLevel === 'low' ? lowEnergySteps : energyLevel === 'high' ? highEnergySteps : mediumEnergySteps;
  
  return {
    suggestion: `For "${taskTitle}": ${steps[0]}`,
    alternatives: steps.slice(1),
    encouragement: energyLevel === 'low' 
      ? 'Even tiny progress counts. You\'ve got this!'
      : 'Starting is often the hardest part. Once you begin, momentum builds.',
  };
};

// First step suggestion for overcoming task paralysis
export const suggestFirstStep = async (
  taskTitle: string,
  taskDescription?: string,
  energyLevel?: 'low' | 'medium' | 'high'
): Promise<FirstStepSuggestion> => {
  try {
    const response = await apiClient.post<ApiResponse<FirstStepSuggestion>>(
      '/ai/suggest-first-step',
      { taskTitle, taskDescription, energyLevel }
    );
    return response.data.data;
  } catch (error) {
    return generateMockFirstStep(taskTitle, energyLevel);
  }
};

// Generate mock AI coach response
const generateMockCoachResponse = (message: string): AICoachMessage => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('overwhelm') || lowerMessage.includes('too much')) {
    return {
      response: "I hear you - feeling overwhelmed is really common with ADHD. Let's break this down: pick just ONE thing that feels most urgent, and let's make it tiny. What's the smallest possible first step?",
      suggestions: ['Break your biggest task into 3 parts', 'Take a 5-minute breather first', 'Write down everything on your mind'],
    };
  }
  if (lowerMessage.includes('focus') || lowerMessage.includes('distract')) {
    return {
      response: "Staying focused can be tricky! Try the 'just 5 minutes' trick - commit to working on something for just 5 minutes. Often, starting is the hardest part.",
      suggestions: ['Start a short focus session', 'Remove phone from sight', 'Use body doubling (work alongside someone)'],
    };
  }
  if (lowerMessage.includes('procrastinat')) {
    return {
      response: "Procrastination often happens when tasks feel too big or unclear. What if we made the task so tiny it feels almost silly? What's the absolute smallest step you could take?",
      suggestions: ['Set a 2-minute timer', 'Just open the relevant document', 'Tell someone your plan'],
    };
  }
  if (lowerMessage.includes('motivat') || lowerMessage.includes('energy')) {
    return {
      response: "Low motivation is your brain's way of asking for something different. On low-energy days, focus on maintenance tasks rather than big projects. What's one tiny thing you could do right now?",
      suggestions: ['Do something physical for 2 minutes', 'Celebrate a recent small win', 'Lower the bar - what\'s good enough?'],
    };
  }
  
  return {
    response: "Thanks for sharing. Remember, ADHD brains work differently, not worse. What specific challenge are you facing right now? I'm here to help you break it down.",
    suggestions: ['Tell me about a specific task', 'Share what\'s on your mind', 'Ask about focus strategies'],
  };
};

// Chat with AI coach
export const chatWithCoach = async (
  message: string,
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
): Promise<AICoachMessage> => {
  try {
    const response = await apiClient.post<ApiResponse<AICoachMessage>>(
      '/ai/chat',
      { message, conversationHistory }
    );
    return response.data.data;
  } catch (error) {
    return generateMockCoachResponse(message);
  }
};

// Match a task to the best project
export const matchProject = async (
  request: ProjectMatchRequest
): Promise<ProjectMatchResult> => {
  const response = await apiClient.post<ApiResponse<ProjectMatchResult>>(
    '/ai/project-match',
    request
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
