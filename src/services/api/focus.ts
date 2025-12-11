import apiClient from './client';
import {
  FocusSession,
  StartFocusSessionInput,
  EndFocusSessionInput,
  FocusSessionResult,
  FocusStats,
  FocusTimerPreset,
  FocusWidgetSummary,
} from '../../types/focus';
import { ApiResponse, DateRange } from '../../types';

export const startSession = async (
  input: StartFocusSessionInput
): Promise<FocusSession> => {
  const response = await apiClient.post<ApiResponse<FocusSession>>(
    '/focus/sessions',
    input
  );
  return response.data.data;
};

export const endSession = async (
  id: string,
  input?: EndFocusSessionInput
): Promise<FocusSessionResult> => {
  const response = await apiClient.post<ApiResponse<FocusSessionResult>>(
    `/focus/sessions/${id}/end`,
    input
  );
  return response.data.data;
};

export const pauseSession = async (id: string): Promise<FocusSession> => {
  const response = await apiClient.post<ApiResponse<FocusSession>>(
    `/focus/sessions/${id}/pause`
  );
  return response.data.data;
};

export const resumeSession = async (id: string): Promise<FocusSession> => {
  const response = await apiClient.post<ApiResponse<FocusSession>>(
    `/focus/sessions/${id}/resume`
  );
  return response.data.data;
};

export const extendSession = async (
  id: string,
  minutes: number
): Promise<FocusSession> => {
  const response = await apiClient.post<ApiResponse<FocusSession>>(
    `/focus/sessions/${id}/extend`,
    { minutes }
  );
  return response.data.data;
};

export const addInterruption = async (
  id: string,
  reason?: string
): Promise<FocusSession> => {
  const response = await apiClient.post<ApiResponse<FocusSession>>(
    `/focus/sessions/${id}/interruption`,
    { reason }
  );
  return response.data.data;
};

export const getSession = async (id: string): Promise<FocusSession> => {
  const response = await apiClient.get<ApiResponse<FocusSession>>(
    `/focus/sessions/${id}`
  );
  return response.data.data;
};

export const getSessions = async (dateRange?: DateRange): Promise<FocusSession[]> => {
  const response = await apiClient.get<ApiResponse<FocusSession[]>>(
    '/focus/sessions',
    { params: dateRange }
  );
  return response.data.data;
};

export const getTodaySessions = async (): Promise<FocusSession[]> => {
  const response = await apiClient.get<ApiResponse<FocusSession[]>>(
    '/focus/sessions/today'
  );
  return response.data.data;
};

export const getStats = async (dateRange?: DateRange): Promise<FocusStats> => {
  const response = await apiClient.get<ApiResponse<FocusStats>>('/focus/stats', {
    params: dateRange,
  });
  return response.data.data;
};

export const getTodayMinutes = async (): Promise<number> => {
  const response = await apiClient.get<ApiResponse<{ minutes: number }>>(
    '/focus/today-minutes'
  );
  return response.data.data.minutes;
};

export const deleteSession = async (id: string): Promise<void> => {
  await apiClient.delete(`/focus/sessions/${id}`);
};

export const getPresets = async (): Promise<FocusTimerPreset[]> => {
  const response = await apiClient.get<ApiResponse<{ presets: FocusTimerPreset[] }>>('/focus/presets');
  return response.data.data.presets;
};

export const getFocusWidgetSummary = async (): Promise<FocusWidgetSummary> => {
  const response = await apiClient.get<ApiResponse<FocusWidgetSummary>>('/focus/widgets/summary');
  return response.data.data;
};
