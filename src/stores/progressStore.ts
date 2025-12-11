import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './authStore';
import {
  UserProgress,
  Badge,
  UserBadge,
  XPEvent,
  XPSource,
  ProgressStats,
  DailyStats,
  LEVEL_THRESHOLDS,
  XP_REWARDS,
} from '../types/progress';

interface ProgressState {
  progress: UserProgress | null;
  badges: Badge[];
  userBadges: UserBadge[];
  xpEvents: XPEvent[];
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeProgress: () => void;
  addXP: (amount: number, source: XPSource, description: string, sourceId?: string) => Promise<{ leveledUp: boolean; newLevel?: number }>;
  checkBadges: () => Promise<UserBadge[]>;
  updateStreak: () => Promise<void>;
  setProgressMetaphor: (metaphor: UserProgress['progressMetaphor']) => void;
  setPetInfo: (name: string, type: string) => void;

  // Selectors
  getLevel: () => number;
  getXPToNextLevel: () => number;
  getLevelProgress: () => number;
  getNewBadges: () => UserBadge[];
  getTodayStats: () => DailyStats;
  getRecentXPEvents: (limit?: number) => XPEvent[];
}

const generateId = () => Math.random().toString(36).substring(2, 15);
const getUserId = () => useAuthStore.getState().user?.id || 'local-user';

const calculateLevel = (totalXp: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
};

const getXPForLevel = (level: number): number => {
  if (level <= 0) return 0;
  if (level > LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return LEVEL_THRESHOLDS[level - 1];
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: null,
      badges: [],
      userBadges: [],
      xpEvents: [],
      isLoading: false,
      error: null,

      initializeProgress: () => {
        if (get().progress) return;

        const initialProgress: UserProgress = {
          id: generateId(),
          userId: getUserId(),
          totalXp: 0,
          level: 1,
          xpToNextLevel: LEVEL_THRESHOLDS[1],
          progressMetaphor: 'minimal',
          tasksCompleted: 0,
          focusMinutes: 0,
          habitsLogged: 0,
          routinesCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
        };

        set({ progress: initialProgress });
      },

      addXP: async (amount, source, description, sourceId) => {
        const { progress } = get();
        if (!progress) {
          get().initializeProgress();
        }

        const currentProgress = get().progress!;
        const newTotalXp = currentProgress.totalXp + amount;
        const newLevel = calculateLevel(newTotalXp);
        const leveledUp = newLevel > currentProgress.level;

        const xpEvent: XPEvent = {
          id: generateId(),
          userId: currentProgress.userId,
          amount,
          source,
          sourceId,
          description,
          timestamp: new Date().toISOString(),
        };

        // Update stats based on source
        const statsUpdate: Partial<UserProgress> = {};
        if (source === 'task_complete' || source === 'subtask_complete') {
          statsUpdate.tasksCompleted = currentProgress.tasksCompleted + 1;
        } else if (source === 'focus_session') {
          // Focus minutes updated separately
        } else if (source === 'habit_log' || source === 'habit_partial') {
          statsUpdate.habitsLogged = currentProgress.habitsLogged + 1;
        } else if (source === 'routine_complete') {
          statsUpdate.routinesCompleted = currentProgress.routinesCompleted + 1;
        }

        set((state) => ({
          progress: {
            ...currentProgress,
            ...statsUpdate,
            totalXp: newTotalXp,
            level: newLevel,
            xpToNextLevel: getXPForLevel(newLevel + 1) - newTotalXp,
          },
          xpEvents: [xpEvent, ...state.xpEvents].slice(0, 100), // Keep last 100 events
        }));

        return { leveledUp, newLevel: leveledUp ? newLevel : undefined };
      },

      checkBadges: async () => {
        // TODO: Implement badge checking logic
        // Would check progress against badge criteria and award new badges
        return [];
      },

      updateStreak: async () => {
        const { progress } = get();
        if (!progress) return;

        const today = new Date().toISOString().split('T')[0];
        const lastActive = progress.lastActiveDate;

        if (!lastActive) {
          set({
            progress: {
              ...progress,
              currentStreak: 1,
              lastActiveDate: today,
            },
          });
          return;
        }

        const lastDate = new Date(lastActive);
        const todayDate = new Date(today);
        const diffDays = Math.floor(
          (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) {
          // Same day, no change
          return;
        } else if (diffDays === 1) {
          // Consecutive day
          const newStreak = progress.currentStreak + 1;
          set({
            progress: {
              ...progress,
              currentStreak: newStreak,
              longestStreak: Math.max(progress.longestStreak, newStreak),
              lastActiveDate: today,
            },
          });
        } else {
          // Streak broken
          set({
            progress: {
              ...progress,
              currentStreak: 1,
              lastActiveDate: today,
            },
          });
        }
      },

      setProgressMetaphor: (metaphor) => {
        const { progress } = get();
        if (!progress) return;

        set({
          progress: { ...progress, progressMetaphor: metaphor },
        });
      },

      setPetInfo: (name, type) => {
        const { progress } = get();
        if (!progress) return;

        set({
          progress: {
            ...progress,
            petName: name,
            petType: type,
            petLevel: 1,
            petHappiness: 100,
          },
        });
      },

      // Selectors
      getLevel: () => get().progress?.level || 1,

      getXPToNextLevel: () => get().progress?.xpToNextLevel || LEVEL_THRESHOLDS[1],

      getLevelProgress: () => {
        const { progress } = get();
        if (!progress) return 0;

        const currentLevelXP = getXPForLevel(progress.level);
        const nextLevelXP = getXPForLevel(progress.level + 1);
        const xpInCurrentLevel = progress.totalXp - currentLevelXP;
        const xpNeededForLevel = nextLevelXP - currentLevelXP;

        return (xpInCurrentLevel / xpNeededForLevel) * 100;
      },

      getNewBadges: () =>
        get().userBadges.filter((ub) => ub.isNew),

      getTodayStats: () => {
        const today = new Date().toISOString().split('T')[0];
        const todayEvents = get().xpEvents.filter((e) =>
          e.timestamp.startsWith(today)
        );

        return {
          date: today,
          tasksCompleted: todayEvents.filter(
            (e) => e.source === 'task_complete'
          ).length,
          focusMinutes: 0, // Would calculate from focus store
          habitsCompleted: todayEvents.filter(
            (e) => e.source === 'habit_log'
          ).length,
          xpEarned: todayEvents.reduce((sum, e) => sum + e.amount, 0),
        };
      },

      getRecentXPEvents: (limit = 10) =>
        get().xpEvents.slice(0, limit),
    }),
    {
      name: 'progress-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        progress: state.progress,
        userBadges: state.userBadges,
        xpEvents: state.xpEvents.slice(0, 50), // Only persist last 50 events
      }),
    }
  )
);
