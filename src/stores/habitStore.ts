import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Habit,
  HabitLog,
  CreateHabitInput,
  UpdateHabitInput,
  LogHabitInput,
  HabitWithLogs,
  FlexibleStreak,
  HabitStats,
} from '../types/habit';

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchHabits: () => Promise<void>;
  createHabit: (input: CreateHabitInput) => Promise<Habit>;
  updateHabit: (id: string, updates: UpdateHabitInput) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  logHabit: (input: LogHabitInput) => Promise<{ xpEarned: number }>;
  unlogHabit: (habitId: string, date: string) => Promise<void>;

  // Selectors
  getHabitById: (id: string) => Habit | undefined;
  getActiveHabits: () => Habit[];
  getHabitWithLogs: (id: string) => HabitWithLogs | undefined;
  getTodayHabits: () => HabitWithLogs[];
  getHabitStats: (id: string) => HabitStats | undefined;
  calculateFlexibleStreak: (habitId: string, windowDays?: number) => FlexibleStreak;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      isLoading: false,
      error: null,

      fetchHabits: async () => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Implement actual API call
          set({ isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      createHabit: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const habit: Habit = {
            id: generateId(),
            userId: '1', // TODO: Get from auth store
            name: input.name,
            icon: input.icon,
            color: input.color,
            frequencyType: input.frequencyType || 'daily',
            daysOfWeek: input.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
            targetCount: input.targetCount || 1,
            anchorDescription: input.anchorDescription,
            preferredTime: input.preferredTime,
            reminderEnabled: input.reminderEnabled || false,
            reminderTime: input.reminderTime,
            allowPartialCredit: input.allowPartialCredit ?? true,
            createdAt: new Date().toISOString(),
          };

          set((state) => ({
            habits: [...state.habits, habit],
            isLoading: false,
          }));

          return habit;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      updateHabit: async (id, updates) => {
        try {
          set((state) => ({
            habits: state.habits.map((h) =>
              h.id === id ? { ...h, ...updates } : h
            ),
          }));
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      deleteHabit: async (id) => {
        try {
          set((state) => ({
            habits: state.habits.filter((h) => h.id !== id),
            logs: state.logs.filter((l) => l.habitId !== id),
          }));
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      archiveHabit: async (id) => {
        try {
          set((state) => ({
            habits: state.habits.map((h) =>
              h.id === id ? { ...h, archivedAt: new Date().toISOString() } : h
            ),
          }));
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      logHabit: async (input) => {
        try {
          const existingLog = get().logs.find(
            (l) => l.habitId === input.habitId && l.date === input.date
          );

          const log: HabitLog = {
            id: existingLog?.id || generateId(),
            habitId: input.habitId,
            date: input.date,
            completed: input.completed,
            partialCredit: input.partialCredit,
            note: input.note,
            createdAt: existingLog?.createdAt || new Date().toISOString(),
          };

          set((state) => ({
            logs: existingLog
              ? state.logs.map((l) => (l.id === existingLog.id ? log : l))
              : [...state.logs, log],
          }));

          // Calculate XP
          const xpEarned = input.completed ? 10 : input.partialCredit ? 5 : 0;

          return { xpEarned };
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      unlogHabit: async (habitId, date) => {
        try {
          set((state) => ({
            logs: state.logs.filter(
              (l) => !(l.habitId === habitId && l.date === date)
            ),
          }));
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      // Selectors
      getHabitById: (id) => get().habits.find((h) => h.id === id),

      getActiveHabits: () =>
        get().habits.filter((h) => !h.archivedAt),

      getHabitWithLogs: (id) => {
        const habit = get().habits.find((h) => h.id === id);
        if (!habit) return undefined;

        const logs = get().logs.filter((l) => l.habitId === id);
        const today = new Date().toISOString().split('T')[0];
        const todayLog = logs.find((l) => l.date === today);

        return { ...habit, logs, todayLog };
      },

      getTodayHabits: () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const todayStr = today.toISOString().split('T')[0];

        return get()
          .habits.filter((h) => !h.archivedAt && h.daysOfWeek.includes(dayOfWeek))
          .map((habit) => {
            const logs = get().logs.filter((l) => l.habitId === habit.id);
            const todayLog = logs.find((l) => l.date === todayStr);
            return { ...habit, logs, todayLog };
          });
      },

      getHabitStats: (id) => {
        const habit = get().habits.find((h) => h.id === id);
        if (!habit) return undefined;

        const logs = get().logs.filter((l) => l.habitId === id);
        const completedLogs = logs.filter((l) => l.completed);
        const partialLogs = logs.filter((l) => l.partialCredit && !l.completed);

        // Calculate current streak
        let currentStreak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];
          const log = logs.find((l) => l.date === dateStr);

          if (log?.completed) {
            currentStreak++;
          } else if (i > 0) {
            break;
          }
        }

        // Calculate longest streak
        let longestStreak = 0;
        let tempStreak = 0;
        const sortedLogs = [...completedLogs].sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        for (let i = 0; i < sortedLogs.length; i++) {
          if (i === 0) {
            tempStreak = 1;
          } else {
            const prevDate = new Date(sortedLogs[i - 1].date);
            const currDate = new Date(sortedLogs[i].date);
            const diffDays = Math.floor(
              (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (diffDays === 1) {
              tempStreak++;
            } else {
              longestStreak = Math.max(longestStreak, tempStreak);
              tempStreak = 1;
            }
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        return {
          habitId: id,
          totalCompletions: completedLogs.length,
          totalPartial: partialLogs.length,
          currentStreak,
          longestStreak,
          flexibleStreak: get().calculateFlexibleStreak(id),
          averageCompletionRate: logs.length > 0
            ? completedLogs.length / logs.length
            : 0,
          bestDay: 0, // TODO: Calculate
          worstDay: 0, // TODO: Calculate
        };
      },

      calculateFlexibleStreak: (habitId, windowDays = 14) => {
        const today = new Date();
        const windowStart = new Date(today);
        windowStart.setDate(windowStart.getDate() - windowDays);

        const logs = get().logs.filter((l) => {
          if (l.habitId !== habitId) return false;
          const logDate = new Date(l.date);
          return logDate >= windowStart && logDate <= today && l.completed;
        });

        return {
          completed: logs.length,
          total: windowDays,
          percentage: Math.round((logs.length / windowDays) * 100),
          windowDays,
        };
      },
    }),
    {
      name: 'habit-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        habits: state.habits,
        logs: state.logs,
      }),
    }
  )
);
