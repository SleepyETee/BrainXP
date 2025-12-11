import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserSettings, OnboardingData, LoginInput, RegisterInput } from '../types/user';
import { login as apiLogin, register as apiRegister, logout as apiLogout, updateUser as apiUpdateUser, completeOnboarding as apiCompleteOnboarding, getCurrentUser } from '../services/api/auth';
import { syncGoals, syncUser } from '../services/upshift';

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
          const { user } = await apiLogin(input);
          set({ user, isAuthenticated: true, isLoading: false });
          void syncUser(user);
          void syncGoals();
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      register: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const { user } = await apiRegister(input);
          set({ user, isAuthenticated: true, isLoading: false });
          void syncUser(user);
          void syncGoals();
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await apiLogout();
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
          const updatedUser = await apiUpdateUser(updates);
          set({ user: updatedUser });
          void syncUser(updatedUser);
          if (updates.primaryGoals) void syncGoals();
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      updateSettings: async (settings) => {
        const { user } = get();
        if (!user) return;

        try {
          const updatedUser = await apiUpdateUser({
            settings: { ...user.settings, ...settings },
          });
          set({ user: updatedUser });
          void syncUser(updatedUser);
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
          const updatedUser = await apiCompleteOnboarding(onboardingData);
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
          const freshUser = await getCurrentUser();
          set({ user: freshUser, isLoading: false });
          void syncUser(freshUser);
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
