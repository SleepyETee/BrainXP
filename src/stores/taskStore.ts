import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
  TaskFilters,
  TaskCompletionResult,
} from '../types/task';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  filters: TaskFilters;

  // Actions
  fetchTasks: (filters?: TaskFilters) => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, updates: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<TaskCompletionResult>;
  reorderTasks: (taskIds: string[]) => Promise<void>;
  setFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;

  // Selectors
  getTaskById: (id: string) => Task | undefined;
  getTodayTasks: () => Task[];
  getOverdueTasks: () => Task[];
  getInboxTasks: () => Task[];
  getUpcomingTasks: (days?: number) => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getSubtasks: (parentId: string) => Task[];
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      isLoading: false,
      error: null,
      filters: {},

      fetchTasks: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Implement actual API call
          // For now, just apply filters to existing tasks
          if (filters) {
            set({ filters });
          }
          set({ isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      createTask: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const now = new Date().toISOString();
          const task: Task = {
            id: generateId(),
            userId: '1', // TODO: Get from auth store
            title: input.title,
            description: input.description,
            parentTaskId: input.parentTaskId,
            order: get().tasks.length,
            status: input.parentTaskId ? 'todo' : 'inbox',
            dueDate: input.dueDate,
            dueTime: input.dueTime,
            scheduledDate: input.scheduledDate,
            scheduledTime: input.scheduledTime,
            estimatedMinutes: input.estimatedMinutes,
            priority: input.priority || 'none',
            energyRequired: input.energyRequired || 'medium',
            tags: input.tags || [],
            projectId: input.projectId,
            context: input.context,
            reminders: [],
            links: [],
            smallestFirstStep: input.smallestFirstStep,
            aiDecompositionUsed: false,
            source: input.source || 'manual',
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            tasks: [...state.tasks, task],
            isLoading: false,
          }));

          return task;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      updateTask: async (id, updates) => {
        try {
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id
                ? { ...t, ...updates, updatedAt: new Date().toISOString() }
                : t
            ),
          }));
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      deleteTask: async (id) => {
        try {
          set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id && t.parentTaskId !== id),
          }));
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      completeTask: async (id) => {
        try {
          const task = get().tasks.find((t) => t.id === id);
          if (!task) throw new Error('Task not found');

          const now = new Date().toISOString();

          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id
                ? { ...t, status: 'done' as TaskStatus, completedAt: now, updatedAt: now }
                : t
            ),
          }));

          // Calculate XP based on task properties
          let xpEarned = 10; // Base XP
          if (task.priority === 'urgent_important') xpEarned += 20;
          else if (task.priority === 'important' || task.priority === 'urgent') xpEarned += 10;
          if (task.estimatedMinutes && task.estimatedMinutes >= 30) xpEarned += 10;

          return {
            task: { ...task, status: 'done' as TaskStatus, completedAt: now },
            xpEarned,
            badgesUnlocked: [],
            streakUpdated: false,
          };
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      reorderTasks: async (taskIds) => {
        try {
          set((state) => ({
            tasks: state.tasks.map((t) => {
              const newOrder = taskIds.indexOf(t.id);
              return newOrder >= 0 ? { ...t, order: newOrder } : t;
            }),
          }));
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      setFilters: (filters) => set({ filters }),
      clearFilters: () => set({ filters: {} }),

      // Selectors
      getTaskById: (id) => get().tasks.find((t) => t.id === id),

      getTodayTasks: () => {
        const today = new Date().toISOString().split('T')[0];
        return get()
          .tasks.filter(
            (t) =>
              (t.dueDate === today || t.scheduledDate === today) &&
              t.status !== 'done' &&
              t.status !== 'abandoned'
          )
          .sort((a, b) => a.order - b.order);
      },

      getOverdueTasks: () => {
        const today = new Date().toISOString().split('T')[0];
        return get()
          .tasks.filter(
            (t) =>
              t.dueDate &&
              t.dueDate < today &&
              t.status !== 'done' &&
              t.status !== 'abandoned'
          )
          .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
      },

      getInboxTasks: () =>
        get()
          .tasks.filter((t) => t.status === 'inbox' && !t.parentTaskId)
          .sort((a, b) => a.order - b.order),

      getUpcomingTasks: (days = 7) => {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + days);
        const todayStr = today.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        return get()
          .tasks.filter(
            (t) =>
              t.dueDate &&
              t.dueDate > todayStr &&
              t.dueDate <= endDateStr &&
              t.status !== 'done' &&
              t.status !== 'abandoned'
          )
          .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
      },

      getTasksByStatus: (status) =>
        get()
          .tasks.filter((t) => t.status === status)
          .sort((a, b) => a.order - b.order),

      getSubtasks: (parentId) =>
        get()
          .tasks.filter((t) => t.parentTaskId === parentId)
          .sort((a, b) => a.order - b.order),
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tasks: state.tasks,
      }),
    }
  )
);
