import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api';

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
          const response = await apiClient.get('/ml/patterns');
          const fetchedPatterns = response.data.data as UserPatterns;
          
          set({
            patterns: fetchedPatterns,
            patternsLastFetched: Date.now(),
            isLoadingPatterns: false,
          });
          
          return fetchedPatterns;
        } catch {
          // Return cached patterns or default patterns when offline
          set({ isLoadingPatterns: false });
          return patterns || {
            bestHours: [
              { hour: 9, productivity: 0.8 },
              { hour: 10, productivity: 0.9 },
              { hour: 14, productivity: 0.7 },
              { hour: 15, productivity: 0.75 },
            ],
            bestDaysOfWeek: [
              { day: 1, productivity: 0.8 },
              { day: 2, productivity: 0.85 },
              { day: 3, productivity: 0.9 },
              { day: 4, productivity: 0.8 },
              { day: 5, productivity: 0.7 },
            ],
            averageTaskDuration: 25,
            estimationAccuracy: 0.7,
            preferredTaskSize: 'small',
            peakEnergyTime: 'morning',
            averageSpoonCapacity: 10,
            insights: ['Your productivity tends to peak in the morning'],
          };
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
          const response = await apiClient.get('/ml/stats');
          const stats = response.data.data as LearningStats;
          
          set({
            learningStats: stats,
            statsLastFetched: Date.now(),
            isLoadingStats: false,
          });
          
          return stats;
        } catch {
          // Return cached stats when offline, or null
          set({ isLoadingStats: false });
          return learningStats || null as unknown as LearningStats;
        }
      },

      predictSpoons: async (taskTitle, _taskDescription, currentEnergy, _timeOfDay) => {
        set({ isLoadingPrediction: true });
        try {
          const response = await apiClient.post('/ml/predict-spoons', {
            taskTitle,
            taskDescription: _taskDescription,
            currentEnergy,
            timeOfDay: _timeOfDay,
          });
          
          set({ isLoadingPrediction: false });
          return response.data.data as SpoonPrediction;
        } catch {
          // Return default prediction when offline
          set({ isLoadingPrediction: false });
          const baseSpoons = 3; // Default medium energy spoons
          return {
            predictedSpoons: baseSpoons,
            confidence: 0.5,
            basedOnSimilarTasks: 0,
            adjustmentFactors: [],
            personalizedTips: ['Break the task into smaller steps if it feels overwhelming'],
            isPersonalized: false,
            source: 'default_estimate',
          } as SpoonPrediction;
        }
      },

      predictTime: async (taskTitle, _taskDescription, estimatedMinutes) => {
        set({ isLoadingPrediction: true });
        try {
          const response = await apiClient.post('/ml/predict-time', {
            taskTitle,
            taskDescription: _taskDescription,
            estimatedMinutes,
          });
          
          set({ isLoadingPrediction: false });
          return response.data.data as TimePrediction;
        } catch {
          // Return default prediction when offline
          set({ isLoadingPrediction: false });
          const predicted = estimatedMinutes || 25;
          return {
            predictedMinutes: predicted,
            confidence: 0.5,
            lowerBound: Math.round(predicted * 0.8),
            upperBound: Math.round(predicted * 1.5),
            userAccuracyFactor: 1,
            similarTasksAnalyzed: 0,
            personalizedBreakdown: [],
            context: ['Based on your estimate'],
            isPersonalized: false,
            source: 'default_estimate',
          } as TimePrediction;
        }
      },

      getRecommendations: async (taskTitle, estimatedMinutes, dueDate) => {
        try {
          const response = await apiClient.post('/ml/recommendations', {
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
          const response = await apiClient.post('/ml/optimal-time', {
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
          await apiClient.post('/ml/feedback', {
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
