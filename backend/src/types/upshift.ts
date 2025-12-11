export type UpshiftEvent =
  | 'user_sync'
  | 'task_sync'
  | 'habit_sync'
  | 'focus_session_sync'
  | 'goal_sync'
  | 'ai_event';

export interface UpshiftEnvelope<TPayload> {
  event: UpshiftEvent;
  payload: TPayload;
  sentAt: string;
}

export interface UpshiftUser {
  id: string;
  email?: string;
  name?: string;
  timezone?: string;
}

export interface UpshiftTaskPayload {
  id: string;
  userId: string;
  title: string;
  status?: string;
  dueDate?: string;
  scheduledDate?: string;
  priority?: string;
  tags?: string[];
  updatedAt?: string;
  completedAt?: string;
}

export interface UpshiftHabitPayload {
  id: string;
  userId: string;
  name: string;
  frequencyType?: string;
  daysOfWeek?: number[];
  targetCount?: number;
  reminderTime?: string | null;
  archivedAt?: string;
}

export interface UpshiftHabitLogPayload {
  habitId: string;
  userId: string;
  date: string;
  completed: boolean;
  partialCredit?: boolean;
  note?: string;
}

export interface UpshiftFocusSessionPayload {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  actualDuration?: number;
  plannedDuration?: number;
  completedTask?: boolean;
  interruptions?: number;
  taskId?: string;
}

export interface UpshiftGoalPayload {
  id: string;
  userId: string;
  title: string;
  status?: string;
  category?: string;
  targetDate?: string;
  progress?: number;
  updatedAt?: string;
  completedAt?: string;
}
