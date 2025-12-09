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
  defaultTimerMode: 'pomodoro' | 'short' | 'starter' | 'deep';

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

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESSIBILITY - Neurodivergent-Friendly Options
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Motion & Animation
  reduceMotion: boolean;           // Minimize animations for sensory sensitivity
  animationSpeed: 'slow' | 'normal' | 'fast' | 'none';  // Control animation speed
  
  // Visual
  largeText: boolean;              // Increase base font size
  textScaling: number;             // Font size multiplier (0.8 - 1.5)
  highContrast: boolean;           // Increase contrast ratios
  colorBlindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  
  // Reading & Focus
  dyslexiaFont: boolean;           // Use OpenDyslexic or similar font
  lineSpacing: 'compact' | 'normal' | 'relaxed' | 'loose';  // Line height
  letterSpacing: 'tight' | 'normal' | 'wide';  // Character spacing
  
  // Cognitive Load
  focusModeEnabled: boolean;       // Minimal UI mode
  hideNonEssential: boolean;       // Hide decorative elements
  simplifyNavigation: boolean;     // Reduce navigation options
  showTaskCounts: boolean;         // Show numbers on sections
  
  // Sensory
  dimBrightColors: boolean;        // Reduce color saturation
  disableAutoplay: boolean;        // No auto-playing media
  quietMode: boolean;              // Minimal notifications/sounds
  
  // Time & Reminders
  gentleReminders: boolean;        // Softer notification style
  reminderSnoozeMinutes: number;   // Default snooze duration
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
  defaultTimerMode: 'pomodoro',

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

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESSIBILITY DEFAULTS - Sensible for neurodivergent users
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Motion & Animation
  reduceMotion: false,
  animationSpeed: 'normal',
  
  // Visual
  largeText: false,
  textScaling: 1.0,
  highContrast: false,
  colorBlindMode: 'none',
  
  // Reading & Focus
  dyslexiaFont: false,
  lineSpacing: 'normal',
  letterSpacing: 'normal',
  
  // Cognitive Load
  focusModeEnabled: false,
  hideNonEssential: false,
  simplifyNavigation: false,
  showTaskCounts: true,
  
  // Sensory
  dimBrightColors: false,
  disableAutoplay: true,  // Default to true for ADHD-friendliness
  quietMode: false,
  
  // Time & Reminders
  gentleReminders: true,  // Default to true for less anxiety
  reminderSnoozeMinutes: 10,
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
