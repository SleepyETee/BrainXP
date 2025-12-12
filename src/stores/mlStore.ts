// filepath: /Users/sleepyet/BrainXP/src/stores/mlStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

// ═══════════════════════════════════════════════════════════════════════════════
// ML STORE - Machine Learning State Management
// ═══════════════════════════════════════════════════════════════════════════════

export interface UserPatterns {
  bestHours: { hour: number; productivity: number }[];
  bestDaysOfWeek: { day: number; productivity: number }[];
  averageTaskDuration: number;
  estimationAccuracy: number;
  preferredTaskSize: 'micro' | 'small' | 'medium' | 'large';
  peakEnergyTime: 'morning' | 'afternoon' | 'evening' | 'night';
  averageSpoonCapacity: number;
  insights: string[];
}

export interface SpoonPrediction {
  predictedSpoons: number;
  confidence: number;
  basedOnSimilarTasks: number;
  adjustmentFactors: {
    factor: string;
    adjustment: number;
    reason: string;
  }[];
  personalizedTips: string[];
  isPersonalized: boolean;
  source: 'ml_prediction' | 'default_estimate';
}

export interface TimePrediction {
  predictedMinutes: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
  userAccuracyFactor: number;
  similarTasksAnalyzed: number;
  personalizedBreakdown: {
    phase: string;
    minutes: number;
    basedOn: string;
  }[];
  context: string[];
  isPersonalized: boolean;
  source: 'ml_prediction' | 'default_estimate';
}

export interface TaskRecommendation {
  type: 'optimal_time' | 'break_down' | 'energy_match' | 'batch_similar';
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  data?: Record<string, unknown>;
}

export interface LearningStats {
  totalInteractions: number;
  feedbackRate: number;
  improvementOverTime: number;
  mostUsedTools: { tool: string; count: number }[];
  personalizationLevel: 'low' | 'medium' | 'high' | 'expert';
  personalizationDescription: string;
  nextMilestone: { interactions: number } | null;
}

export interface OptimalTimeSuggestion {
  startHour: number;
  timeRange: string;
  productivityScore: number;
  reason: string;
}

interface MLState {
  // Cached data
  patterns: UserPatterns | null;
  learningStats: LearningStats | null;
  patternsLastFetched: number | null;
  statsLastFetched: number | null;

  // Loading states
  isLoadingPatterns: boolean;
  isLoadingPrediction: boolean;
  isLoadingStats: boolean;

  // Actions
  fetchPatterns: () => Promise<UserPatterns>;
  fetchLearningStats: () => Promise<LearningStats>;
  predictSpoons: (
    taskTitle: string,
    taskDescription?: string,
    currentEnergy?: number,
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
  ) => Promise<SpoonPrediction>;
  predictTime: (
    taskTitle: string,
    taskDescription?: string,
    estimatedMinutes?: number
  ) => Promise<TimePrediction>;
  getRecommendations: (
    taskTitle: string,
    estimatedMinutes?: number,
    dueDate?: string
  ) => Promise<TaskRecommendation[]>;
  getOptimalTime: (
    taskTitle: string,
    estimatedMinutes: number,
    energyRequired?: 'low' | 'medium' | 'high'
  ) => Promise<{ suggestions: OptimalTimeSuggestion[]; recommendation: string }>;
  submitFeedback: (
    toolUsageId: string,
    wasHelpful: boolean,
    feedback?: string,
    actualValues?: Record<string, unknown>
  ) => Promise<void>;
  clearCache: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useMLStore = create<MLState>()(
  persist(
    (set, get) => ({
      patterns: null,
      learningStats: null,
      patternsLastFetched: null,
      statsLastFetched: null,
      isLoadingPatterns: false,
      isLoadingPrediction: false,
      isLoadingStats: false,

      fetchPatterns: async () => {
        const { patterns, patternsLastFetched } = get();
        
        // Return cached if fresh
        if (patterns && patternsLastFetched && Date.now() - patternsLastFetched < CACHE_DURATION) {
          return patterns;
        }

        set({ isLoadingPatterns: true });
        try {
          const response = await api.get('/ml/patterns');
          const fetchedPatterns = response.data.data as UserPatterns;
          
          set({
            patterns: fetchedPatterns,
            patternsLastFetched: Date.now(),
            isLoadingPatterns: false,
          });
          
          return fetchedPatterns;
        } catch (error) {
          set({ isLoadingPatterns: false });
          throw error;
        }
      },

      fetchLearningStats: async () => {
        const { learningStats, statsLastFetched } = get();
        
        // Return cached if fresh
        if (learningStats && statsLastFetched && Date.now() - statsLastFetched < CACHE_DURATION) {
          return learningStats;
        }

        set({ isLoadingStats: true });
        try {
          const response = await api.get('/ml/stats');
          const stats = response.data.data as LearningStats;
          
          set({
            learningStats: stats,
            statsLastFetched: Date.now(),
            isLoadingStats: false,
          });
          
          return stats;
        } catch (error) {
          set({ isLoadingStats: false });
          throw error;
        }
      },

      predictSpoons: async (taskTitle, taskDescription, currentEnergy, timeOfDay) => {
        set({ isLoadingPrediction: true });
        try {
          const response = await api.post('/ml/predict-spoons', {
            taskTitle,
            taskDescription,
            currentEnergy,
            timeOfDay,
          });
          
          set({ isLoadingPrediction: false });
          return response.data.data as SpoonPrediction;
        } catch (error) {
          set({ isLoadingPrediction: false });
          throw error;
        }
      },

      predictTime: async (taskTitle, taskDescription, estimatedMinutes) => {
        set({ isLoadingPrediction: true });
        try {
          const response = await api.post('/ml/predict-time', {
            taskTitle,
            taskDescription,
            estimatedMinutes,
          });
          
          set({ isLoadingPrediction: false });
          return response.data.data as TimePrediction;
        } catch (error) {
          set({ isLoadingPrediction: false });
          throw error;
        }
      },

      getRecommendations: async (taskTitle, estimatedMinutes, dueDate) => {
        try {
          const response = await api.post('/ml/recommendations', {
            taskTitle,
            estimatedMinutes,
            dueDate,
          });
          
          return response.data.data.recommendations as TaskRecommendation[];
        } catch (error) {
          console.error('Failed to get recommendations:', error);
          return [];
        }
      },

      getOptimalTime: async (taskTitle, estimatedMinutes, energyRequired) => {
        try {
          const response = await api.post('/ml/optimal-time', {
            taskTitle,
            estimatedMinutes,
            energyRequired,
          });
          
          return response.data.data as { 
            suggestions: OptimalTimeSuggestion[]; 
            recommendation: string;
          };
        } catch (error) {
          console.error('Failed to get optimal time:', error);
          return { suggestions: [], recommendation: '' };
        }
      },

      submitFeedback: async (toolUsageId, wasHelpful, feedback, actualValues) => {
        try {
          await api.post('/ml/feedback', {
            toolUsageId,
            wasHelpful,
            feedback,
            actualValues,
          });
          
          // Invalidate caches to reflect new feedback
          set({ patternsLastFetched: null, statsLastFetched: null });
        } catch (error) {
          console.error('Failed to submit feedback:', error);
        }
      },

      clearCache: () => {
        set({
          patterns: null,
          learningStats: null,
          patternsLastFetched: null,
          statsLastFetched: null,
        });
      },
    }),
    {
      name: 'ml-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        patterns: state.patterns,
        learningStats: state.learningStats,
        patternsLastFetched: state.patternsLastFetched,
        statsLastFetched: state.statsLastFetched,
      }),
    }
  )
);
