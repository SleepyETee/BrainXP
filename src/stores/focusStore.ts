import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FocusSession,
  FocusInterruption,
  StartFocusSessionInput,
  EndFocusSessionInput,
  FocusSessionResult,
  BackgroundSound,
  FocusStats,
  FocusPreferences,
} from '../types/focus';

interface FocusState {
  currentSession: FocusSession | null;
  sessions: FocusSession[];
  preferences: FocusPreferences;
  isLoading: boolean;
  error: string | null;

  // Actions
  startSession: (input: StartFocusSessionInput) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  addInterruption: (reason?: string) => void;
  extendSession: (minutes: number) => void;
  endSession: (input?: EndFocusSessionInput) => Promise<FocusSessionResult>;
  setBackgroundSound: (sound: BackgroundSound) => void;
  updatePreferences: (prefs: Partial<FocusPreferences>) => void;

  // Selectors
  getSessionById: (id: string) => FocusSession | undefined;
  getTodaySessions: () => FocusSession[];
  getTodayFocusMinutes: () => number;
  getStats: () => FocusStats;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const defaultPreferences: FocusPreferences = {
  defaultDuration: 25,
  defaultSound: 'none',
  showTimerInNotification: true,
  vibrationEnabled: true,
  autoStartBreaks: false,
  breakDuration: 5,
  dailyGoalMinutes: 120,
};

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      sessions: [],
      preferences: defaultPreferences,
      isLoading: false,
      error: null,

      startSession: (input) => {
        const session: FocusSession = {
          id: generateId(),
          userId: '1', // TODO: Get from auth store
          taskId: input.taskId,
          taskDescription: input.taskDescription,
          plannedDuration: input.plannedDuration,
          startTime: new Date().toISOString(),
          interruptions: [],
          backgroundSound: input.backgroundSound || get().preferences.defaultSound,
          completedTask: false,
          xpEarned: 0,
          isActive: true,
        };

        set({ currentSession: session });
      },

      pauseSession: () => {
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, isActive: false }
            : null,
        }));
      },

      resumeSession: () => {
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, isActive: true }
            : null,
        }));
      },

      addInterruption: (reason) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const interruption: FocusInterruption = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          duration: 0,
          reason,
        };

        set({
          currentSession: {
            ...currentSession,
            interruptions: [...currentSession.interruptions, interruption],
          },
        });
      },

      extendSession: (minutes) => {
        set((state) => ({
          currentSession: state.currentSession
            ? {
                ...state.currentSession,
                plannedDuration: state.currentSession.plannedDuration + minutes,
              }
            : null,
        }));
      },

      endSession: async (input) => {
        const { currentSession, preferences } = get();
        if (!currentSession) throw new Error('No active session');

        const endTime = new Date();
        const startTime = new Date(currentSession.startTime);
        const actualDuration = Math.floor(
          (endTime.getTime() - startTime.getTime()) / 1000 / 60
        );

        // Calculate XP
        let xpEarned = 15; // Base XP
        if (actualDuration >= currentSession.plannedDuration) {
          xpEarned += 10; // Bonus for completing planned duration
        }
        if (currentSession.interruptions.length === 0) {
          xpEarned += 5; // Bonus for no interruptions
        }
        if (input?.completedTask) {
          xpEarned += 10; // Bonus for completing associated task
        }

        const completedSession: FocusSession = {
          ...currentSession,
          endTime: endTime.toISOString(),
          actualDuration,
          qualityRating: input?.qualityRating,
          completedTask: input?.completedTask || false,
          xpEarned,
          isActive: false,
        };

        set((state) => ({
          currentSession: null,
          sessions: [...state.sessions, completedSession],
        }));

        const todayMinutes = get().getTodayFocusMinutes();

        return {
          session: completedSession,
          xpEarned,
          badgesUnlocked: [],
          totalFocusMinutesToday: todayMinutes,
          dailyGoalReached: todayMinutes >= preferences.dailyGoalMinutes,
        };
      },

      setBackgroundSound: (sound) => {
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, backgroundSound: sound }
            : null,
        }));
      },

      updatePreferences: (prefs) => {
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        }));
      },

      // Selectors
      getSessionById: (id) => get().sessions.find((s) => s.id === id),

      getTodaySessions: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().sessions.filter((s) => s.startTime.startsWith(today));
      },

      getTodayFocusMinutes: () => {
        const todaySessions = get().getTodaySessions();
        return todaySessions.reduce(
          (total, s) => total + (s.actualDuration || 0),
          0
        );
      },

      getStats: () => {
        const { sessions } = get();
        const completedSessions = sessions.filter((s) => s.endTime);

        if (completedSessions.length === 0) {
          return {
            totalSessions: 0,
            totalMinutes: 0,
            averageSessionLength: 0,
            averageQualityRating: 0,
            completionRate: 0,
            favoriteBackgroundSound: 'none' as BackgroundSound,
            mostProductiveHour: 9,
            longestSession: 0,
            currentDayStreak: 0,
          };
        }

        const totalMinutes = completedSessions.reduce(
          (sum, s) => sum + (s.actualDuration || 0),
          0
        );

        const sessionsWithRating = completedSessions.filter(
          (s) => s.qualityRating !== undefined
        );
        const avgRating =
          sessionsWithRating.length > 0
            ? sessionsWithRating.reduce((sum, s) => sum + (s.qualityRating || 0), 0) /
              sessionsWithRating.length
            : 0;

        const completedPlanned = completedSessions.filter(
          (s) => (s.actualDuration || 0) >= s.plannedDuration
        );

        // Find favorite sound
        const soundCounts: Record<string, number> = {};
        completedSessions.forEach((s) => {
          soundCounts[s.backgroundSound] = (soundCounts[s.backgroundSound] || 0) + 1;
        });
        const favoriteSound = Object.entries(soundCounts).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0] as BackgroundSound || 'none';

        // Find most productive hour
        const hourCounts: Record<number, number> = {};
        completedSessions.forEach((s) => {
          const hour = new Date(s.startTime).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + (s.actualDuration || 0);
        });
        const mostProductiveHour = Number(
          Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 9
        );

        const longestSession = Math.max(
          ...completedSessions.map((s) => s.actualDuration || 0)
        );

        return {
          totalSessions: completedSessions.length,
          totalMinutes,
          averageSessionLength: totalMinutes / completedSessions.length,
          averageQualityRating: avgRating,
          completionRate: completedPlanned.length / completedSessions.length,
          favoriteBackgroundSound: favoriteSound,
          mostProductiveHour,
          longestSession,
          currentDayStreak: 0, // TODO: Calculate
        };
      },
    }),
    {
      name: 'focus-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        preferences: state.preferences,
      }),
    }
  )
);
