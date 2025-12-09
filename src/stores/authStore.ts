import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserSettings, OnboardingData, LoginInput, RegisterInput } from '../types/user';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  onboardingData: OnboardingData;

  // Actions
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  setOnboardingData: (data: Partial<OnboardingData>) => void;
  completeOnboarding: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const defaultSettings: UserSettings = {
  theme: 'auto',
  notificationsEnabled: true,
  hapticFeedback: true,
  soundEffects: true,
  defaultFocusDuration: 25,
  defaultBreakDuration: 5,
  autoStartBreaks: false,
  focusDailyGoal: 120,
  defaultTaskView: 'list',
  showCompletedTasks: false,
  taskSortBy: 'dueDate',
  habitReminderTime: '09:00',
  flexibleStreakWindow: 14,
  progressMetaphor: 'minimal',
  celebrationsEnabled: true,
  analyticsEnabled: true,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      onboardingData: {},

      login: async (input) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Implement actual Firebase auth
          // For now, simulate a login
          const mockUser: User = {
            id: '1',
            firebaseUid: 'mock-uid',
            email: input.email,
            name: input.email.split('@')[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            primaryGoals: [],
            onboardingComplete: false,
            settings: defaultSettings,
          };
          set({ user: mockUser, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      register: async (input) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Implement actual Firebase auth
          const mockUser: User = {
            id: '1',
            firebaseUid: 'mock-uid',
            email: input.email,
            name: input.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            primaryGoals: [],
            onboardingComplete: false,
            settings: defaultSettings,
          };
          set({ user: mockUser, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          // TODO: Implement actual Firebase sign out
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            onboardingData: {},
          });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      updateUser: async (updates) => {
        const { user } = get();
        if (!user) return;

        try {
          // TODO: Implement API call
          const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
          set({ user: updatedUser });
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      updateSettings: async (settings) => {
        const { user } = get();
        if (!user) return;

        try {
          // TODO: Implement API call
          const updatedUser = {
            ...user,
            settings: { ...user.settings, ...settings },
            updatedAt: new Date().toISOString(),
          };
          set({ user: updatedUser });
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      setOnboardingData: (data) => {
        set((state) => ({
          onboardingData: { ...state.onboardingData, ...data },
        }));
      },

      completeOnboarding: async () => {
        const { user, onboardingData } = get();
        if (!user) return;

        try {
          // TODO: Implement API call
          const updatedUser = {
            ...user,
            ...onboardingData,
            onboardingComplete: true,
            updatedAt: new Date().toISOString(),
          };
          set({ user: updatedUser, onboardingData: {} });
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      refreshUser: async () => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });
        try {
          // TODO: Implement API call to refresh user data
          set({ isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
