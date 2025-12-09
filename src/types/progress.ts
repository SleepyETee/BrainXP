export type ProgressMetaphor = 'minimal' | 'garden' | 'pet' | 'adventure';
export type BadgeCategory = 'tasks' | 'focus' | 'habits' | 'routines' | 'streaks' | 'special';

export interface UserProgress {
  id: string;
  userId: string;
  totalXp: number;
  level: number;
  xpToNextLevel: number;
  progressMetaphor: ProgressMetaphor;

  // Pet system (if using pet metaphor)
  petName?: string;
  petType?: string;
  petLevel?: number;
  petHappiness?: number;

  // Stats
  tasksCompleted: number;
  focusMinutes: number;
  habitsLogged: number;
  routinesCompleted: number;

  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  criteriaType: string;
  criteriaValue: number;
  criteriaMetric: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  earnedAt: string;
  isNew: boolean;
}

export interface XPEvent {
  id: string;
  userId: string;
  amount: number;
  source: XPSource;
  sourceId?: string;
  description: string;
  timestamp: string;
}

export type XPSource =
  | 'task_complete'
  | 'subtask_complete'
  | 'focus_session'
  | 'habit_log'
  | 'habit_partial'
  | 'routine_complete'
  | 'mood_checkin'
  | 'win_logged'
  | 'inbox_processed'
  | 'breathing_exercise'
  | 'bonus_first_task'
  | 'bonus_all_habits'
  | 'bonus_streak'
  | 'quiz_complete'
  | 'study_session';

export interface XPReward {
  source: XPSource;
  amount: number;
  description: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  perks: string[];
}

export interface ProgressStats {
  today: DailyStats;
  thisWeek: WeeklyStats;
  thisMonth: MonthlyStats;
  allTime: AllTimeStats;
}

export interface DailyStats {
  date: string;
  tasksCompleted: number;
  focusMinutes: number;
  habitsCompleted: number;
  xpEarned: number;
  moodAverage?: number;
}

export interface WeeklyStats {
  startDate: string;
  endDate: string;
  tasksCompleted: number;
  focusMinutes: number;
  habitsCompletionRate: number;
  xpEarned: number;
  bestDay: string;
  streakDays: number;
}

export interface MonthlyStats {
  month: number;
  year: number;
  tasksCompleted: number;
  focusMinutes: number;
  habitsCompletionRate: number;
  xpEarned: number;
  levelProgress: number;
  badgesEarned: number;
}

export interface AllTimeStats {
  totalTasks: number;
  totalFocusHours: number;
  totalHabitLogs: number;
  totalXp: number;
  currentLevel: number;
  badgesEarned: number;
  longestStreak: number;
  memberSince: string;
}

// XP Constants
export const XP_REWARDS = {
  completeTask: { min: 10, max: 50 },
  completeSubtask: 5,
  focusSession: { min: 15, max: 30 },
  logHabit: 10,
  partialHabit: 5,
  completeRoutine: 25,
  moodCheckIn: 5,
  logWin: 5,
  processInbox: 3,
  breathingExercise: 10,
  firstTaskBonus: 10,
  allHabitsBonus: 20,
  consistencyBonus3Day: 15,
  consistencyBonus7Day: 50,
} as const;

// Level thresholds
export const LEVEL_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200,
  4000, 5000, 6200, 7600, 9200, 11000, 13000, 15500, 18500, 22000,
] as const;
