// filepath: /Users/sleepyet/BrainXP/src/stores/routineStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Routine,
  RoutineStep,
  RoutineExecution,
  RoutineStepResult,
  CreateRoutineInput,
  UpdateRoutineInput,
  RoutineType,
} from '../types/routine';

interface RoutineState {
  routines: Routine[];
  executions: RoutineExecution[];
  activeExecution: RoutineExecution | null;
  isLoading: boolean;

  // Actions
  fetchRoutines: () => Promise<void>;
  createRoutine: (input: CreateRoutineInput) => Promise<Routine>;
  updateRoutine: (id: string, input: UpdateRoutineInput) => Promise<Routine>;
  deleteRoutine: (id: string) => Promise<void>;
  archiveRoutine: (id: string) => Promise<void>;

  // Execution actions
  startRoutine: (routineId: string) => Promise<RoutineExecution>;
  completeStep: (executionId: string, stepId: string) => Promise<void>;
  skipStep: (executionId: string, stepId: string) => Promise<void>;
  endRoutine: (executionId: string) => Promise<RoutineExecution>;
  cancelRoutine: (executionId: string) => Promise<void>;

  // Helpers
  getRoutineById: (id: string) => Routine | undefined;
  getTodayRoutines: () => Routine[];
  getActiveRoutines: () => Routine[];
}

const generateId = () => `routine_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const useRoutineStore = create<RoutineState>()(
  persist(
    (set, get) => ({
      routines: [],
      executions: [],
      activeExecution: null,
      isLoading: false,

      fetchRoutines: async () => {
        set({ isLoading: true });
        try {
          // In a real app, this would fetch from API
          // For now, data is persisted locally
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to fetch routines:', error);
          set({ isLoading: false });
        }
      },

      createRoutine: async (input: CreateRoutineInput) => {
        const now = new Date().toISOString();
        const routineId = generateId();

        const steps: RoutineStep[] = input.steps.map((step, index) => ({
          id: `${routineId}_step_${index}`,
          routineId,
          name: step.name,
          icon: step.icon,
          estimatedMinutes: step.estimatedMinutes || 5,
          order: index,
          isSkippable: step.isSkippable ?? true,
          linkedHabitId: step.linkedHabitId,
        }));

        const totalEstimatedMinutes = steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);

        const routine: Routine = {
          id: routineId,
          userId: 'current-user',
          name: input.name,
          icon: input.icon || '📋',
          type: input.type || 'custom',
          daysActive: input.daysActive || [0, 1, 2, 3, 4, 5, 6],
          triggerTime: input.triggerTime,
          strictOrder: input.strictOrder ?? false,
          allowSkips: input.allowSkips ?? true,
          createdAt: now,
          steps,
          totalEstimatedMinutes,
        };

        set((state) => ({
          routines: [...state.routines, routine],
        }));

        return routine;
      },

      updateRoutine: async (id: string, input: UpdateRoutineInput) => {
        const routine = get().routines.find((r) => r.id === id);
        if (!routine) {
          throw new Error('Routine not found');
        }

        // Handle archivedAt: convert null to undefined
        const { archivedAt, ...rest } = input;
        const updatedRoutine: Routine = {
          ...routine,
          ...rest,
          archivedAt: archivedAt === null ? undefined : archivedAt ?? routine.archivedAt,
        };

        set((state) => ({
          routines: state.routines.map((r) => (r.id === id ? updatedRoutine : r)),
        }));

        return updatedRoutine;
      },

      deleteRoutine: async (id: string) => {
        set((state) => ({
          routines: state.routines.filter((r) => r.id !== id),
          executions: state.executions.filter((e) => e.routineId !== id),
        }));
      },

      archiveRoutine: async (id: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === id ? { ...r, archivedAt: now } : r
          ),
        }));
      },

      startRoutine: async (routineId: string) => {
        const routine = get().routines.find((r) => r.id === routineId);
        if (!routine) {
          throw new Error('Routine not found');
        }

        const now = new Date().toISOString();
        const execution: RoutineExecution = {
          id: `exec_${Date.now()}`,
          routineId,
          startedAt: now,
          stepsCompleted: 0,
          stepsSkipped: 0,
          stepResults: routine.steps.map((step) => ({
            stepId: step.id,
            status: 'pending',
          })),
        };

        set((state) => ({
          executions: [...state.executions, execution],
          activeExecution: execution,
        }));

        return execution;
      },

      completeStep: async (executionId: string, stepId: string) => {
        const now = new Date().toISOString();

        set((state) => {
          const execution = state.executions.find((e) => e.id === executionId);
          if (!execution) return state;

          const updatedStepResults = execution.stepResults.map((sr) =>
            sr.stepId === stepId
              ? { ...sr, status: 'completed' as const, completedAt: now }
              : sr
          );

          const updatedExecution: RoutineExecution = {
            ...execution,
            stepsCompleted: updatedStepResults.filter((sr) => sr.status === 'completed').length,
            stepResults: updatedStepResults,
          };

          return {
            executions: state.executions.map((e) =>
              e.id === executionId ? updatedExecution : e
            ),
            activeExecution:
              state.activeExecution?.id === executionId
                ? updatedExecution
                : state.activeExecution,
          };
        });
      },

      skipStep: async (executionId: string, stepId: string) => {
        const now = new Date().toISOString();

        set((state) => {
          const execution = state.executions.find((e) => e.id === executionId);
          if (!execution) return state;

          const updatedStepResults = execution.stepResults.map((sr) =>
            sr.stepId === stepId
              ? { ...sr, status: 'skipped' as const, completedAt: now }
              : sr
          );

          const updatedExecution: RoutineExecution = {
            ...execution,
            stepsSkipped: updatedStepResults.filter((sr) => sr.status === 'skipped').length,
            stepResults: updatedStepResults,
          };

          return {
            executions: state.executions.map((e) =>
              e.id === executionId ? updatedExecution : e
            ),
            activeExecution:
              state.activeExecution?.id === executionId
                ? updatedExecution
                : state.activeExecution,
          };
        });
      },

      endRoutine: async (executionId: string) => {
        const now = new Date().toISOString();

        let completedExecution: RoutineExecution | null = null;

        set((state) => {
          const execution = state.executions.find((e) => e.id === executionId);
          if (!execution) return state;

          const startTime = new Date(execution.startedAt).getTime();
          const endTime = new Date(now).getTime();
          const totalDuration = Math.round((endTime - startTime) / 60000);

          completedExecution = {
            ...execution,
            completedAt: now,
            totalDuration,
          };

          return {
            executions: state.executions.map((e) =>
              e.id === executionId ? completedExecution! : e
            ),
            activeExecution: null,
          };
        });

        return completedExecution!;
      },

      cancelRoutine: async (executionId: string) => {
        set((state) => ({
          executions: state.executions.filter((e) => e.id !== executionId),
          activeExecution:
            state.activeExecution?.id === executionId ? null : state.activeExecution,
        }));
      },

      getRoutineById: (id: string) => {
        return get().routines.find((r) => r.id === id);
      },

      getTodayRoutines: () => {
        const today = new Date().getDay();
        return get().routines.filter(
          (r) => !r.archivedAt && r.daysActive.includes(today)
        );
      },

      getActiveRoutines: () => {
        return get().routines.filter((r) => !r.archivedAt);
      },
    }),
    {
      name: 'brainxp-routines',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        routines: state.routines,
        executions: state.executions.slice(-50), // Keep last 50 executions
      }),
    }
  )
);
