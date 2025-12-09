export type RoutineType = 'morning' | 'evening' | 'work' | 'custom';

export interface RoutineStep {
  id: string;
  routineId: string;
  name: string;
  icon?: string;
  estimatedMinutes: number;
  order: number;
  isSkippable: boolean;
  linkedHabitId?: string;
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  type: RoutineType;
  daysActive: number[]; // 0 = Sunday, 6 = Saturday
  triggerTime?: string;
  strictOrder: boolean;
  allowSkips: boolean;
  createdAt: string;
  archivedAt?: string;
  steps: RoutineStep[];
  // Computed
  totalEstimatedMinutes?: number;
  completionRate?: number;
}

export interface RoutineExecution {
  id: string;
  routineId: string;
  startedAt: string;
  completedAt?: string;
  stepsCompleted: number;
  stepsSkipped: number;
  totalDuration?: number; // in minutes
  stepResults: RoutineStepResult[];
}

export interface RoutineStepResult {
  stepId: string;
  status: 'completed' | 'skipped' | 'pending';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
}

export interface CreateRoutineInput {
  name: string;
  icon?: string;
  type?: RoutineType;
  daysActive?: number[];
  triggerTime?: string;
  strictOrder?: boolean;
  allowSkips?: boolean;
  steps: CreateRoutineStepInput[];
}

export interface CreateRoutineStepInput {
  name: string;
  icon?: string;
  estimatedMinutes?: number;
  isSkippable?: boolean;
  linkedHabitId?: string;
}

export interface UpdateRoutineInput extends Partial<Omit<CreateRoutineInput, 'steps'>> {
  archivedAt?: string | null;
}

export interface RoutineWithExecutions extends Routine {
  recentExecutions: RoutineExecution[];
  lastExecution?: RoutineExecution;
}
