export type BackgroundSound =
  | 'none'
  | 'white_noise'
  | 'brown_noise'
  | 'rain'
  | 'forest'
  | 'cafe'
  | 'ocean'
  | 'fireplace'
  | 'lo_fi';

export type FocusSessionStatus = 'active' | 'completed' | 'cancelled' | 'interrupted' | 'extended';

export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string;
  timelineBlockId?: string;
  taskDescription: string;
  sessionType?: 'pomodoro' | 'deep_work' | 'sprint';
  breakDuration?: number;
  longBreakDuration?: number;
  autoContinue?: boolean;
  plannedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  startTime: string;
  endTime?: string;
  interruptions: FocusInterruption[];
  backgroundSound: BackgroundSound;
  qualityRating?: number; // 1-5
  completedTask: boolean;
  xpEarned: number;
  isActive?: boolean; // legacy flag, prefer status
  status?: FocusSessionStatus;
  outcome?: string;
}

export interface FocusInterruption {
  id: string;
  timestamp: string;
  duration: number; // in seconds
  reason?: string;
}

export interface StartFocusSessionInput {
  taskDescription: string;
  plannedDuration: number;
  taskId?: string;
  backgroundSound?: BackgroundSound;
  sessionType?: 'pomodoro' | 'deep_work' | 'sprint';
  breakDuration?: number;
  longBreakDuration?: number;
  autoContinue?: boolean;
  timelineBlockId?: string;
}

export interface EndFocusSessionInput {
  qualityRating?: number;
  completedTask?: boolean;
  actualDuration?: number;
  interruptions?: FocusInterruption[];
  outcome?: string;
}

export interface FocusSessionResult {
  session: FocusSession;
  xpEarned: number;
  badgesUnlocked: string[];
  totalFocusMinutesToday: number;
  dailyGoalReached: boolean;
}

export interface FocusStats {
  totalSessions: number;
  totalMinutes: number;
  averageSessionLength: number;
  averageQualityRating: number;
  completionRate: number;
  favoriteBackgroundSound: BackgroundSound;
  mostProductiveHour: number;
  longestSession: number;
  currentDayStreak: number;
}

export interface FocusPreferences {
  defaultDuration: number;
  defaultSound: BackgroundSound;
  showTimerInNotification: boolean;
  vibrationEnabled: boolean;
  autoStartBreaks: boolean;
  breakDuration: number;
  dailyGoalMinutes: number;
}

export interface FocusTimerPreset {
  id: string;
  label: string;
  work: number;
  shortBreak: number;
  longBreak: number;
  sessions: number;
}

export interface FocusWidgetSummary {
  presets: FocusTimerPreset[];
  activeSession?: FocusSession | null;
  todayMinutes: number;
  todaySessions: number;
}
