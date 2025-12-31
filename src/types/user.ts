export type Theme = 'light' | 'dark' | 'auto';
export type ADHDExperience = 'newly_diagnosed' | 'diagnosed_years' | 'self_identified' | 'exploring';

export interface User {
  id: string;
  firebaseUid?: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;

  // Guest mode
  isGuest?: boolean;

  // Onboarding
  adhdExperience?: ADHDExperience;
  primaryGoals?: string[];
  biggestChallenge?: string;
  onboardingComplete?: boolean;

  // Settings
  settings: UserSettings;
}

export interface UserSettings {
  theme: Theme;
  notificationsEnabled: boolean;
  hapticFeedback: boolean;
  soundEffects: boolean;

  // Focus settings
  defaultFocusDuration: number;
  defaultBreakDuration: number;
  autoStartBreaks: boolean;
  focusDailyGoal: number;

  // Task settings
  defaultTaskView: 'list' | 'board';
  showCompletedTasks: boolean;
  taskSortBy: 'dueDate' | 'priority' | 'createdAt';

  // Habit settings
  habitReminderTime: string;
  flexibleStreakWindow: number;

  // Gamification
  progressMetaphor: 'minimal' | 'garden' | 'pet' | 'adventure';
  celebrationsEnabled: boolean;

  // Privacy
  analyticsEnabled: boolean;
}

export interface OnboardingData {
  adhdExperience?: ADHDExperience;
  primaryGoals?: string[];
  biggestChallenge?: string;
  notificationsEnabled?: boolean;
  theme?: Theme;
  selectedFeatures?: string[];
}

export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string;
  settings?: Partial<UserSettings>;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}
