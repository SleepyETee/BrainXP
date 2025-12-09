import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  // Appearance
  theme: 'light' | 'dark' | 'auto';
  accentColor: string;
  compactMode: boolean;

  // Notifications
  notificationsEnabled: boolean;
  taskReminders: boolean;
  habitReminders: boolean;
  focusReminders: boolean;
  dailySummary: boolean;
  dailySummaryTime: string;

  // Haptics & Sound
  hapticFeedback: boolean;
  soundEffects: boolean;
  celebrationSounds: boolean;

  // Focus
  defaultFocusDuration: number;
  defaultBreakDuration: number;
  autoStartBreaks: boolean;
  focusDailyGoal: number;
  defaultBackgroundSound: string;

  // Tasks
  defaultTaskView: 'list' | 'board';
  showCompletedTasks: boolean;
  taskSortBy: 'dueDate' | 'priority' | 'createdAt' | 'custom';
  autoScheduleSuggestions: boolean;

  // Habits
  habitReminderTime: string;
  flexibleStreakWindow: number;
  showHabitStreak: boolean;

  // Gamification
  progressMetaphor: 'minimal' | 'garden' | 'pet' | 'adventure';
  celebrationsEnabled: boolean;
  showXPPopups: boolean;
  showLevelBadge: boolean;

  // Privacy & Data
  analyticsEnabled: boolean;
  crashReportsEnabled: boolean;

  // Accessibility
  reduceMotion: boolean;
  largeText: boolean;
  highContrast: boolean;
}

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;

  // Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  toggleTheme: () => void;
}

const defaultSettings: AppSettings = {
  // Appearance
  theme: 'auto',
  accentColor: '#3B82F6',
  compactMode: false,

  // Notifications
  notificationsEnabled: true,
  taskReminders: true,
  habitReminders: true,
  focusReminders: true,
  dailySummary: false,
  dailySummaryTime: '20:00',

  // Haptics & Sound
  hapticFeedback: true,
  soundEffects: true,
  celebrationSounds: true,

  // Focus
  defaultFocusDuration: 25,
  defaultBreakDuration: 5,
  autoStartBreaks: false,
  focusDailyGoal: 120,
  defaultBackgroundSound: 'none',

  // Tasks
  defaultTaskView: 'list',
  showCompletedTasks: false,
  taskSortBy: 'dueDate',
  autoScheduleSuggestions: true,

  // Habits
  habitReminderTime: '09:00',
  flexibleStreakWindow: 14,
  showHabitStreak: true,

  // Gamification
  progressMetaphor: 'minimal',
  celebrationsEnabled: true,
  showXPPopups: true,
  showLevelBadge: true,

  // Privacy & Data
  analyticsEnabled: true,
  crashReportsEnabled: true,

  // Accessibility
  reduceMotion: false,
  largeText: false,
  highContrast: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      isLoading: false,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },

      toggleTheme: () => {
        const currentTheme = get().settings.theme;
        const nextTheme =
          currentTheme === 'light'
            ? 'dark'
            : currentTheme === 'dark'
            ? 'auto'
            : 'light';

        set((state) => ({
          settings: { ...state.settings, theme: nextTheme },
        }));
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
