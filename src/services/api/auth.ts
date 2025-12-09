import apiClient, { setAuthToken, clearAuthToken } from './client';
import { User, LoginInput, RegisterInput, OnboardingData } from '../../types/user';
import { ApiResponse } from '../../types';

export interface AuthResponse {
  user: User;
  token: string;
}

export const login = async (input: LoginInput): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', input);
  const { user, token } = response.data.data;
  await setAuthToken(token);
  return { user, token };
};

export const register = async (input: RegisterInput): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', input);
  const { user, token } = response.data.data;
  await setAuthToken(token);
  return { user, token };
};

export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    await clearAuthToken();
  }
};

export const refreshToken = async (): Promise<string> => {
  const response = await apiClient.post<ApiResponse<{ token: string }>>('/auth/refresh');
  const { token } = response.data.data;
  await setAuthToken(token);
  return token;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me');
  return response.data.data;
};

export const updateUser = async (updates: Partial<User>): Promise<User> => {
  const response = await apiClient.patch<ApiResponse<User>>('/auth/me', updates);
  return response.data.data;
};

export const completeOnboarding = async (data: OnboardingData): Promise<User> => {
  const response = await apiClient.post<ApiResponse<User>>('/auth/onboarding', data);
  return response.data.data;
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  await apiClient.post('/auth/forgot-password', { email });
};

export const resetPassword = async (token: string, password: string): Promise<void> => {
  await apiClient.post('/auth/reset-password', { token, password });
};

export const deleteAccount = async (): Promise<void> => {
  await apiClient.delete('/auth/me');
  await clearAuthToken();
};
