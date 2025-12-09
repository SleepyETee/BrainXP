export type TaskStatus = 'inbox' | 'todo' | 'in_progress' | 'waiting' | 'done' | 'abandoned';
export type TaskPriority = 'urgent_important' | 'important' | 'urgent' | 'low' | 'none';
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

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  notes?: string;
  parentTaskId?: string;
  subtasks?: Task[];
  order: number;
  status: TaskStatus;
  dueDate?: string;
  dueTime?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  priority: TaskPriority;
  energyRequired: EnergyLevel;
  tags: string[];
  projectId?: string;
  context?: string;
  reminders: Reminder[];
  recurrence?: RecurrenceRule;
  links: string[];
  smallestFirstStep?: string;
  aiDecompositionUsed: boolean;
  source: TaskSource;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  estimatedMinutes?: number;
  priority?: TaskPriority;
  energyRequired?: EnergyLevel;
  tags?: string[];
  parentTaskId?: string;
  projectId?: string;
  context?: string;
  smallestFirstStep?: string;
  source?: TaskSource;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: TaskStatus;
  actualMinutes?: number;
  notes?: string;
  links?: string[];
  reminders?: Reminder[];
  recurrence?: RecurrenceRule;
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
