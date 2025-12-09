import apiClient from './client';
import {
  Habit,
  HabitLog,
  CreateHabitInput,
  UpdateHabitInput,
  LogHabitInput,
  HabitWithLogs,
  HabitStats,
} from '../../types/habit';
import { ApiResponse, DateRange } from '../../types';

export const getHabits = async (): Promise<Habit[]> => {
  const response = await apiClient.get<ApiResponse<Habit[]>>('/habits');
  return response.data.data;
};

export const getHabit = async (id: string): Promise<HabitWithLogs> => {
  const response = await apiClient.get<ApiResponse<HabitWithLogs>>(`/habits/${id}`);
  return response.data.data;
};

export const createHabit = async (input: CreateHabitInput): Promise<Habit> => {
  const response = await apiClient.post<ApiResponse<Habit>>('/habits', input);
  return response.data.data;
};

export const updateHabit = async (id: string, updates: UpdateHabitInput): Promise<Habit> => {
  const response = await apiClient.patch<ApiResponse<Habit>>(`/habits/${id}`, updates);
  return response.data.data;
};

export const deleteHabit = async (id: string): Promise<void> => {
  await apiClient.delete(`/habits/${id}`);
};

export const archiveHabit = async (id: string): Promise<Habit> => {
  const response = await apiClient.post<ApiResponse<Habit>>(`/habits/${id}/archive`);
  return response.data.data;
};

export const unarchiveHabit = async (id: string): Promise<Habit> => {
  const response = await apiClient.post<ApiResponse<Habit>>(`/habits/${id}/unarchive`);
  return response.data.data;
};

export const logHabit = async (
  input: LogHabitInput
): Promise<{ log: HabitLog; xpEarned: number }> => {
  const response = await apiClient.post<
    ApiResponse<{ log: HabitLog; xpEarned: number }>
  >(`/habits/${input.habitId}/log`, {
    date: input.date,
    completed: input.completed,
    partialCredit: input.partialCredit,
    note: input.note,
  });
  return response.data.data;
};

export const unlogHabit = async (habitId: string, date: string): Promise<void> => {
  await apiClient.delete(`/habits/${habitId}/log/${date}`);
};

export const getHabitLogs = async (
  habitId: string,
  dateRange?: DateRange
): Promise<HabitLog[]> => {
  const response = await apiClient.get<ApiResponse<HabitLog[]>>(
    `/habits/${habitId}/logs`,
    { params: dateRange }
  );
  return response.data.data;
};

export const getTodayHabits = async (): Promise<HabitWithLogs[]> => {
  const response = await apiClient.get<ApiResponse<HabitWithLogs[]>>('/habits/today');
  return response.data.data;
};

export const getHabitStats = async (id: string): Promise<HabitStats> => {
  const response = await apiClient.get<ApiResponse<HabitStats>>(`/habits/${id}/stats`);
  return response.data.data;
};

export const getHabitCalendar = async (
  id: string,
  month: number,
  year: number
): Promise<HabitLog[]> => {
  const response = await apiClient.get<ApiResponse<HabitLog[]>>(
    `/habits/${id}/calendar`,
    { params: { month, year } }
  );
  return response.data.data;
};

export const reorderHabits = async (habitIds: string[]): Promise<void> => {
  await apiClient.post('/habits/reorder', { habitIds });
};
