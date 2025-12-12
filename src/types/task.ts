export type TaskStatus = 'inbox' | 'todo' | 'in_progress' | 'waiting' | 'done' | 'abandoned';
export type TaskPriority = 'urgent_important' | 'important' | 'urgent' | 'high' | 'medium' | 'low' | 'none';
export type EnergyLevel = 'low' | 'medium' | 'high';

export type TaskSource = 'manual' | 'voice' | 'ai' | 'share';

export interface Reminder {
  id: string;
  time: string;
  type: 'notification' | 'alarm';
  sent?: boolean;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: string;
  occurrences?: number;
}

export interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
  estimatedMinutes?: number;
  completedAt?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  notes?: string;
  parentTaskId?: string;
  subtasks?: Subtask[];
  order: number;
  status: TaskStatus;
  completed: boolean;
  dueDate?: string;
  dueTime?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  priority: TaskPriority;
  energyRequired: EnergyLevel;
  energyLevel?: EnergyLevel;
  tags: string[];
  projectId?: string;
  listId?: string;
  context?: string;
  reminders: Reminder[];
  recurrence?: RecurrenceRule;
  links: string[];
  startDate?: string;
  startTime?: string;
  snoozedUntil?: string;
  smallestFirstStep?: string;
  aiDecompositionUsed: boolean;
  source: TaskSource;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  checklist?: ChecklistItem[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  startDate?: string;
  startTime?: string;
  snoozedUntil?: string;
  estimatedMinutes?: number;
  priority?: TaskPriority;
  energyRequired?: EnergyLevel;
  energyLevel?: EnergyLevel;
  tags?: string[];
  parentTaskId?: string;
  projectId?: string;
  listId?: string;
  context?: string;
  smallestFirstStep?: string;
  source?: TaskSource;
  checklist?: ChecklistItem[];
  subtasks?: { title: string; completed: boolean }[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  startDate?: string;
  startTime?: string;
  snoozedUntil?: string;
  estimatedMinutes?: number;
  priority?: TaskPriority;
  energyRequired?: EnergyLevel;
  energyLevel?: EnergyLevel;
  tags?: string[];
  parentTaskId?: string;
  projectId?: string;
  listId?: string;
  context?: string;
  smallestFirstStep?: string;
  source?: TaskSource;
  checklist?: ChecklistItem[];
  status?: TaskStatus;
  actualMinutes?: number;
  notes?: string;
  links?: string[];
  reminders?: Reminder[];
  recurrence?: RecurrenceRule;
  subtasks?: Subtask[];
}

export interface AIDecompositionResult {
  suggestedSteps: {
    title: string;
    estimatedMinutes: number;
    suggestedDate?: string;
    order: number;
  }[];
  totalEstimatedMinutes: number;
  adjustedEstimate: number;
  userTimeRatio: number;
  smallestFirstStep?: string;
}

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  dueDate?: string;
  dueBefore?: string;
  dueAfter?: string;
  tags?: string[];
  projectId?: string;
  energyRequired?: EnergyLevel;
  search?: string;
}

export interface TaskCompletionResult {
  task: Task;
  xpEarned: number;
  badgesUnlocked: string[];
  streakUpdated: boolean;
  newStreak?: number;
}
