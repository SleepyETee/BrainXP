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
  TaskPriority,
  Subtask,
} from '../types/task';
import {
  quickAddTask as apiQuickAdd,
  getSmartListTasks,
  getSmartLists,
  getTaskLists,
  getTaskWidgetSummary,
} from '../services/api/tasks';
import { syncTask } from '../services/upshift';
import { useAuthStore } from './authStore';

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
  uncompleteTask: (id: string) => Promise<void>;
  reorderTasks: (taskIds: string[]) => Promise<void>;
  setFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;
  quickAdd: (text: string, defaults?: Partial<CreateTaskInput>) => Promise<Task>;
  fetchSmartLists: () => Promise<void>;
  smartLists: { id: string; slug: string; name: string; color?: string; icon?: string; taskCount?: number }[];
  fetchSmartListTasks: (slug: string) => Promise<Task[]>;
  taskLists: { id: string; name: string; color?: string; icon?: string; isPinned?: boolean }[];
  fetchTaskLists: () => Promise<void>;
  widgetSummary: {
    today: { count: number; tasks: Task[] };
    next7Days: { count: number; tasks: Task[] };
    pinnedLists: any[];
  } | null;
  fetchTaskWidgets: () => Promise<void>;

  // Subtask actions
  addSubtask: (taskId: string, subtask: { title: string; completed?: boolean }) => Promise<Subtask>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;

  // Bulk actions
  bulkComplete: (taskIds: string[]) => Promise<{ completed: number; xpEarned: number }>;
  bulkDelete: (taskIds: string[]) => Promise<{ deleted: number }>;

  // Selectors
  getTaskById: (id: string) => Task | undefined;
  getTodayTasks: () => Task[];
  getOverdueTasks: () => Task[];
  getInboxTasks: () => Task[];
  getUpcomingTasks: (days?: number) => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getSubtasks: (parentId: string) => Task[];
  getTasksByPriority: (priority: TaskPriority) => Task[];
  getCompletedTasks: () => Task[];
  getIncompleteTasks: () => Task[];
  searchTasks: (query: string) => Task[];
  getTasksByTag: (tag: string) => Task[];
}

const generateId = () => Math.random().toString(36).substring(2, 15);
const toIsoDate = (date: Date) => date.toISOString().split('T')[0];
const getUserId = () => useAuthStore.getState().user?.id || 'local-user';

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
};

const parseQuickAdd = (text: string): Partial<CreateTaskInput> & { priority?: TaskPriority; tags?: string[] } => {
  const now = new Date();
  let clean = text;
  const tags = Array.from(text.matchAll(/#([\w-]+)/g)).map((m) => m[1]);
  clean = clean.replace(/#([\w-]+)/g, '').trim();

  let priority: TaskPriority | undefined;
  if (text.includes('!!!')) priority = 'urgent_important';
  else if (text.includes('!!')) priority = 'important';
  else if (text.includes('!')) priority = 'urgent';
  clean = clean.replace(/!+/g, '').trim();

  let dueDate: string | undefined;
  let scheduledDate: string | undefined;
  const lower = text.toLowerCase();
  if (lower.includes('today')) {
    dueDate = toIsoDate(now);
    clean = clean.replace(/today/gi, '').trim();
  } else if (lower.includes('tomorrow')) {
    dueDate = toIsoDate(addDays(now, 1));
    clean = clean.replace(/tomorrow/gi, '').trim();
  } else if (lower.includes('next week')) {
    dueDate = toIsoDate(addDays(now, 7));
    clean = clean.replace(/next week/gi, '').trim();
  } else if (lower.includes('next 7')) {
    dueDate = toIsoDate(addDays(now, 7));
    clean = clean.replace(/next 7( days)?/gi, '').trim();
  }

  if (lower.includes('later')) {
    scheduledDate = toIsoDate(addDays(now, 2));
    clean = clean.replace(/later/gi, '').trim();
  }

  return {
    title: clean.trim(),
    tags,
    priority,
    dueDate,
    scheduledDate,
  };
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      isLoading: false,
      error: null,
      filters: {},
      smartLists: [],
      taskLists: [],
      widgetSummary: null,

      fetchTasks: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          if (filters) set({ filters });
          set({ isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      createTask: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const now = new Date().toISOString();
          const subtasks: Subtask[] = (input.subtasks || []).map((s) => ({
            id: generateId(),
            title: s.title,
            completed: s.completed ?? false,
          }));
          const task: Task = {
            id: generateId(),
            userId: getUserId(),
            title: input.title,
            description: input.description,
            parentTaskId: input.parentTaskId,
            subtasks,
            order: get().tasks.length,
            status: 'todo',
            completed: false,
            dueDate: input.dueDate,
            dueTime: input.dueTime,
            scheduledDate: input.scheduledDate,
            scheduledTime: input.scheduledTime,
            startDate: input.startDate,
            startTime: input.startTime,
            snoozedUntil: input.snoozedUntil,
            estimatedMinutes: input.estimatedMinutes,
            priority: input.priority || 'medium',
            energyRequired: input.energyRequired || input.energyLevel || 'medium',
            energyLevel: input.energyLevel || input.energyRequired || 'medium',
            tags: input.tags || [],
            projectId: input.projectId,
            listId: input.listId,
            context: input.context,
            reminders: [],
            links: [],
            smallestFirstStep: input.smallestFirstStep,
            aiDecompositionUsed: false,
            source: input.source || 'manual',
            createdAt: now,
            updatedAt: now,
            completedAt: null,
            checklist: input.checklist || [],
          };

          set((state) => ({
            tasks: [...state.tasks, task],
            isLoading: false,
          }));

          void syncTask(task);

          return task;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      updateTask: async (id, updates) => {
        try {
          let updated: Task | undefined;
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id
                ? ({ ...t, ...updates, updatedAt: new Date().toISOString() } as Task)
                : t
            ),
          }));

          if (updated) void syncTask(updated);
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

          const now = new Date();
          const nowIso = now.toISOString();

          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id
                ? { ...t, status: 'done' as TaskStatus, completed: true, completedAt: nowIso, updatedAt: nowIso }
                : t
            ),
          }));

          void syncTask({ ...task, status: 'done' as TaskStatus, completed: true, completedAt: nowIso, updatedAt: nowIso });

          // Calculate XP based on task properties
          let xpEarned = 10; // Base XP
          if (task.priority === 'urgent_important') xpEarned += 20;
          else if (task.priority === 'important' || task.priority === 'urgent' || task.priority === 'high') xpEarned += 10;
          if (task.estimatedMinutes && task.estimatedMinutes >= 30) xpEarned += 10;

          // Early completion bonus: if completed before due date
          if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const daysDiff = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff >= 1) {
              xpEarned += 5; // Early completion bonus
            }
          }

          return {
            task: { ...task, status: 'done' as TaskStatus, completed: true, completedAt: nowIso },
            xpEarned,
            badgesUnlocked: [],
            streakUpdated: false,
          };
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      uncompleteTask: async (id) => {
        try {
          const task = get().tasks.find((t) => t.id === id);
          if (!task) throw new Error('Task not found');

          const now = new Date().toISOString();

          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id
                ? { ...t, status: 'todo' as TaskStatus, completed: false, completedAt: null, updatedAt: now }
                : t
            ),
          }));

          void syncTask({ ...task, status: 'todo' as TaskStatus, completed: false, completedAt: null, updatedAt: now });
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

      quickAdd: async (text, defaults) => {
        const parsed = parseQuickAdd(text);
        const title = parsed.title || text.trim();
        const taskInput: CreateTaskInput = {
          title,
          dueDate: parsed.dueDate,
          scheduledDate: parsed.scheduledDate,
          tags: parsed.tags,
          priority: parsed.priority,
          energyRequired: defaults?.energyRequired || 'medium',
          listId: defaults?.listId,
          projectId: defaults?.projectId,
          source: 'manual',
        };
        try {
          const created = await apiQuickAdd(text, taskInput.listId);
          set((state) => ({
            tasks: [...state.tasks, created],
          }));
          void syncTask(created);
          return created;
        } catch (error) {
          // fallback to local create
          return get().createTask(taskInput);
        }
      },

      fetchSmartLists: async () => {
        try {
          const { smartLists } = await getSmartLists();
          set({ smartLists });
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      fetchSmartListTasks: async (slug) => {
        const { tasks } = await getSmartListTasks(slug);
        return tasks;
      },

      fetchTaskLists: async () => {
        try {
          const { lists } = await getTaskLists();
          set({ taskLists: lists });
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      fetchTaskWidgets: async () => {
        try {
          const summary = await getTaskWidgetSummary();
          set({ widgetSummary: summary });
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

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

      // Subtask actions
      addSubtask: async (taskId, subtask) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) throw new Error('Task not found');

        const newSubtask: Subtask = {
          id: generateId(),
          title: subtask.title,
          completed: subtask.completed ?? false,
        };

        const updatedSubtasks = [...(task.subtasks || []), newSubtask];

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() }
              : t
          ),
        }));

        void syncTask({ ...task, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() });

        return newSubtask;
      },

      toggleSubtask: async (taskId, subtaskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) throw new Error('Task not found');

        const updatedSubtasks = (task.subtasks || []).map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() }
              : t
          ),
        }));

        void syncTask({ ...task, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() });
      },

      deleteSubtask: async (taskId, subtaskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) throw new Error('Task not found');

        const updatedSubtasks = (task.subtasks || []).filter((s) => s.id !== subtaskId);

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() }
              : t
          ),
        }));

        void syncTask({ ...task, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() });
      },

      // Bulk actions
      bulkComplete: async (taskIds) => {
        const now = new Date();
        const nowIso = now.toISOString();
        let totalXp = 0;

        const tasksToComplete = get().tasks.filter((t) => taskIds.includes(t.id));

        for (const task of tasksToComplete) {
          let xp = 10;
          if (task.priority === 'urgent_important') xp += 20;
          else if (task.priority === 'important' || task.priority === 'urgent' || task.priority === 'high') xp += 10;
          if (task.estimatedMinutes && task.estimatedMinutes >= 30) xp += 10;
          if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const daysDiff = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff >= 1) xp += 5;
          }
          totalXp += xp;
        }

        set((state) => ({
          tasks: state.tasks.map((t) =>
            taskIds.includes(t.id)
              ? { ...t, status: 'done' as TaskStatus, completed: true, completedAt: nowIso, updatedAt: nowIso }
              : t
          ),
        }));

        return { completed: tasksToComplete.length, xpEarned: totalXp };
      },

      bulkDelete: async (taskIds) => {
        const count = get().tasks.filter((t) => taskIds.includes(t.id)).length;

        set((state) => ({
          tasks: state.tasks.filter((t) => !taskIds.includes(t.id)),
        }));

        return { deleted: count };
      },

      // Additional selectors
      getTasksByPriority: (priority) =>
        get()
          .tasks.filter((t) => t.priority === priority && t.status !== 'done' && t.status !== 'abandoned')
          .sort((a, b) => a.order - b.order),

      getCompletedTasks: () =>
        get()
          .tasks.filter((t) => t.status === 'done' || t.completed === true)
          .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()),

      getIncompleteTasks: () =>
        get()
          .tasks.filter((t) => t.status !== 'done' && t.status !== 'abandoned' && t.completed !== true)
          .sort((a, b) => a.order - b.order),

      searchTasks: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(lowerQuery) ||
            (t.description && t.description.toLowerCase().includes(lowerQuery)) ||
            (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)))
        );
      },

      getTasksByTag: (tag) =>
        get()
          .tasks.filter((t) => t.tags && t.tags.includes(tag))
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
