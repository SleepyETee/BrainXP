import apiClient, { setAuthToken, clearAuthToken } from './client';
import { User, LoginInput, RegisterInput, OnboardingData } from '../../types/user';
import { ApiResponse } from '../../types';

export interface AuthResponse {
  user: User;
  token: string;
}

// Default settings for offline/mock users
const defaultSettings = {
  theme: 'auto' as const,
  notificationsEnabled: true,
  hapticFeedback: true,
  soundEffects: true,
  defaultFocusDuration: 25,
  defaultBreakDuration: 5,
  autoStartBreaks: false,
  focusDailyGoal: 120,
  defaultTaskView: 'list' as const,
  showCompletedTasks: false,
  taskSortBy: 'dueDate' as const,
  habitReminderTime: '09:00',
  flexibleStreakWindow: 14,
  progressMetaphor: 'minimal' as const,
  celebrationsEnabled: true,
  analyticsEnabled: true,
};

export const login = async (input: LoginInput): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', input);
    const { user, token } = response.data.data;
    await setAuthToken(token);
    return { user, token };
  } catch (error) {
    // Offline fallback - create local user for development
    console.warn('Login API failed, using offline mode');
    const mockUser: User = {
      id: `user_${Date.now()}`,
      email: input.email,
      name: input.email.split('@')[0] || 'User',
      settings: defaultSettings,
      createdAt: new Date().toISOString(),
    };
    const mockToken = `offline_token_${Date.now()}`;
    await setAuthToken(mockToken);
    return { user: mockUser, token: mockToken };
  }
};

export const register = async (input: RegisterInput): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', input);
    const { user, token } = response.data.data;
    await setAuthToken(token);
    return { user, token };
  } catch (error) {
    // Offline fallback - create local user for development
    console.warn('Register API failed, using offline mode');
    const mockUser: User = {
      id: `user_${Date.now()}`,
      email: input.email,
      name: input.name,
      settings: defaultSettings,
      createdAt: new Date().toISOString(),
    };
    const mockToken = `offline_token_${Date.now()}`;
    await setAuthToken(mockToken);
    return { user: mockUser, token: mockToken };
  }
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

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  await apiClient.post('/auth/change-password', {
    currentPassword,
    newPassword,
  });
};

export const setupTwoFactor = async (): Promise<{ qrCode: string; secret: string }> => {
  const response = await apiClient.post<ApiResponse<{ qrCode: string; secret: string }>>(
    '/auth/2fa/setup'
  );
  return response.data.data;
};

export const verifyTwoFactor = async (code: string): Promise<void> => {
  await apiClient.post('/auth/2fa/verify', { code });
};

export const disableTwoFactor = async (code: string): Promise<void> => {
  await apiClient.post('/auth/2fa/disable', { code });
};

export const getActiveSessions = async (): Promise<Array<{
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}>> => {
  const response = await apiClient.get<ApiResponse<Array<{
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
  }>>>('/auth/sessions');
  return response.data.data;
};

export const revokeSession = async (sessionId: string): Promise<void> => {
  await apiClient.delete(`/auth/sessions/${sessionId}`);
};
