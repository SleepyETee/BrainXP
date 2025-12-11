import apiClient from './client';
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  TaskCompletionResult,
  AIDecompositionResult,
} from '../../types/task';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../../types';

export const getTasks = async (
  filters?: TaskFilters,
  pagination?: PaginationParams
): Promise<Task[]> => {
  const response = await apiClient.get<ApiResponse<Task[]>>('/tasks', {
    params: { ...filters, ...pagination },
  });
  return response.data.data;
};

export const getTask = async (id: string): Promise<Task> => {
  const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
  return response.data.data;
};

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  const response = await apiClient.post<ApiResponse<Task>>('/tasks', input);
  return response.data.data;
};

export const updateTask = async (id: string, updates: UpdateTaskInput): Promise<Task> => {
  const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}`, updates);
  return response.data.data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await apiClient.delete(`/tasks/${id}`);
};

export const completeTask = async (id: string): Promise<TaskCompletionResult> => {
  const response = await apiClient.post<ApiResponse<TaskCompletionResult>>(
    `/tasks/${id}/complete`
  );
  return response.data.data;
};

export const uncompleteTask = async (id: string): Promise<Task> => {
  const response = await apiClient.post<ApiResponse<Task>>(`/tasks/${id}/uncomplete`);
  return response.data.data;
};

export const reorderTasks = async (taskIds: string[]): Promise<void> => {
  await apiClient.post('/tasks/reorder', { taskIds });
};

export const getSubtasks = async (parentId: string): Promise<Task[]> => {
  const response = await apiClient.get<ApiResponse<Task[]>>(`/tasks/${parentId}/subtasks`);
  return response.data.data;
};

export const createSubtask = async (
  parentId: string,
  input: CreateTaskInput
): Promise<Task> => {
  const response = await apiClient.post<ApiResponse<Task>>(
    `/tasks/${parentId}/subtasks`,
    input
  );
  return response.data.data;
};

export const decomposeTask = async (id: string): Promise<AIDecompositionResult> => {
  const response = await apiClient.post<ApiResponse<AIDecompositionResult>>(
    `/tasks/${id}/decompose`
  );
  return response.data.data;
};

export const applyDecomposition = async (
  id: string,
  steps: AIDecompositionResult['suggestedSteps']
): Promise<Task[]> => {
  const response = await apiClient.post<ApiResponse<Task[]>>(
    `/tasks/${id}/apply-decomposition`,
    { steps }
  );
  return response.data.data;
};

export const snoozeTask = async (
  id: string,
  snoozeUntil: string
): Promise<Task> => {
  const response = await apiClient.post<ApiResponse<Task>>(`/tasks/${id}/snooze`, {
    snoozeUntil,
  });
  return response.data.data;
};

export const getTodayTasks = async (): Promise<Task[]> => {
  const response = await apiClient.get<ApiResponse<Task[]>>('/tasks/today');
  return response.data.data;
};

export const getOverdueTasks = async (): Promise<Task[]> => {
  const response = await apiClient.get<ApiResponse<Task[]>>('/tasks/overdue');
  return response.data.data;
};

export const getInboxTasks = async (): Promise<Task[]> => {
  const response = await apiClient.get<ApiResponse<Task[]>>('/tasks/inbox');
  return response.data.data;
};

export const searchTasks = async (query: string): Promise<Task[]> => {
  const response = await apiClient.get<ApiResponse<Task[]>>('/tasks/search', {
    params: { q: query },
  });
  return response.data.data;
};

export const getTaskLists = async (): Promise<{ lists: any[] }> => {
  const response = await apiClient.get<ApiResponse<{ lists: any[] }>>('/tasks/lists');
  return response.data.data;
};

export const getSmartLists = async (): Promise<{ smartLists: any[] }> => {
  const response = await apiClient.get<ApiResponse<{ smartLists: any[] }>>('/tasks/smart-lists');
  return response.data.data;
};

export const getSmartListTasks = async (slug: string): Promise<{ smartList: any; tasks: Task[] }> => {
  const response = await apiClient.get<ApiResponse<{ smartList: any; tasks: Task[] }>>(
    `/tasks/smart-lists/${slug}`
  );
  return response.data.data;
};

export const quickAddTask = async (text: string, listId?: string): Promise<Task> => {
  const response = await apiClient.post<ApiResponse<{ task: Task }>>('/tasks/quick-add', {
    text,
    listId,
  });
  return response.data.data.task;
};

export const getTaskWidgetSummary = async (): Promise<{
  widgets: any[];
  today: { count: number; tasks: Task[] };
  next7Days: { count: number; tasks: Task[] };
  pinnedLists: any[];
}> => {
  const response = await apiClient.get<
    ApiResponse<{
      widgets: any[];
      today: { count: number; tasks: Task[] };
      next7Days: { count: number; tasks: Task[] };
      pinnedLists: any[];
    }>
  >('/tasks/widgets/summary');
  return response.data.data;
};
