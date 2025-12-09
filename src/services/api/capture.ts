import apiClient from './client';
import {
  CaptureItem,
  CreateTextCaptureInput,
  CreateVoiceCaptureInput,
  CreatePhotoCaptureInput,
  CreateLinkCaptureInput,
  ProcessCaptureInput,
  CaptureProcessResult,
  AISuggestion,
} from '../../types/capture';
import { ApiResponse } from '../../types';

export const getCaptures = async (status?: string): Promise<CaptureItem[]> => {
  const response = await apiClient.get<ApiResponse<CaptureItem[]>>('/captures', {
    params: { status },
  });
  return response.data.data;
};

export const getCapture = async (id: string): Promise<CaptureItem> => {
  const response = await apiClient.get<ApiResponse<CaptureItem>>(`/captures/${id}`);
  return response.data.data;
};

export const captureText = async (
  input: CreateTextCaptureInput
): Promise<CaptureItem> => {
  const response = await apiClient.post<ApiResponse<CaptureItem>>('/captures/text', input);
  return response.data.data;
};

export const captureVoice = async (
  input: CreateVoiceCaptureInput
): Promise<CaptureItem> => {
  const response = await apiClient.post<ApiResponse<CaptureItem>>('/captures/voice', input);
  return response.data.data;
};

export const capturePhoto = async (
  input: CreatePhotoCaptureInput
): Promise<CaptureItem> => {
  const response = await apiClient.post<ApiResponse<CaptureItem>>('/captures/photo', input);
  return response.data.data;
};

export const captureLink = async (
  input: CreateLinkCaptureInput
): Promise<CaptureItem> => {
  const response = await apiClient.post<ApiResponse<CaptureItem>>('/captures/link', input);
  return response.data.data;
};

export const uploadVoice = async (
  uri: string,
  duration: number
): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('audio', {
    uri,
    type: 'audio/m4a',
    name: 'voice-capture.m4a',
  } as unknown as Blob);
  formData.append('duration', String(duration));

  const response = await apiClient.post<ApiResponse<{ url: string }>>(
    '/captures/upload-voice',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data;
};

export const transcribeVoice = async (id: string): Promise<string> => {
  const response = await apiClient.post<ApiResponse<{ transcript: string }>>(
    `/captures/${id}/transcribe`
  );
  return response.data.data.transcript;
};

export const getSuggestion = async (id: string): Promise<AISuggestion> => {
  const response = await apiClient.get<ApiResponse<AISuggestion>>(
    `/captures/${id}/suggestion`
  );
  return response.data.data;
};

export const processCapture = async (
  input: ProcessCaptureInput
): Promise<CaptureProcessResult> => {
  const response = await apiClient.post<ApiResponse<CaptureProcessResult>>(
    `/captures/${input.captureId}/process`,
    input
  );
  return response.data.data;
};

export const dismissCapture = async (id: string): Promise<void> => {
  await apiClient.post(`/captures/${id}/dismiss`);
};

export const deleteCapture = async (id: string): Promise<void> => {
  await apiClient.delete(`/captures/${id}`);
};

export const getPendingCount = async (): Promise<number> => {
  const response = await apiClient.get<ApiResponse<{ count: number }>>(
    '/captures/pending-count'
  );
  return response.data.data.count;
};
