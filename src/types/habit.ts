export type FrequencyType = 'daily' | 'weekly' | 'specific_days';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  frequencyType: FrequencyType;
  daysOfWeek: number[]; // 0 = Sunday, 6 = Saturday
  targetCount: number;
  anchorHabitId?: string;
  anchorDescription?: string;
  preferredTime?: string;
  reminderEnabled: boolean;
  reminderTime?: string;
  allowPartialCredit: boolean;
  createdAt: string;
  archivedAt?: string;
  // Computed fields
  currentStreak?: number;
  longestStreak?: number;
  completionRate?: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  partialCredit?: number; // 0-1 for partial completion
  note?: string;
  createdAt: string;
}

export interface CreateHabitInput {
  name: string;
  icon?: string;
  color?: string;
  frequencyType?: FrequencyType;
  daysOfWeek?: number[];
  targetCount?: number;
  anchorDescription?: string;
  preferredTime?: string;
  reminderEnabled?: boolean;
  reminderTime?: string;
  allowPartialCredit?: boolean;
}

export interface UpdateHabitInput extends Partial<CreateHabitInput> {
  archivedAt?: string | null;
}

export interface LogHabitInput {
  habitId: string;
  date: string;
  completed: boolean;
  partialCredit?: number;
  note?: string;
}

export interface HabitWithLogs extends Habit {
  logs: HabitLog[];
  todayLog?: HabitLog;
}

export interface FlexibleStreak {
  completed: number;
  total: number;
  percentage: number;
  windowDays: number;
}

export interface HabitStats {
  habitId: string;
  totalCompletions: number;
  totalPartial: number;
  currentStreak: number;
  longestStreak: number;
  flexibleStreak: FlexibleStreak;
  averageCompletionRate: number;
  bestDay: number; // Day of week with highest completion
  worstDay: number; // Day of week with lowest completion
}
