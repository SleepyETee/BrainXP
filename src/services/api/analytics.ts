import apiClient from './client';
import { ProgressStats, DailyStats, WeeklyStats, MonthlyStats } from '../../types/progress';
import { ApiResponse, DateRange } from '../../types';

export interface ProductivityTrend {
  date: string;
  tasksCompleted: number;
  focusMinutes: number;
  habitsCompletionRate: number;
  xpEarned: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TimeDistribution {
  hour: number;
  focusMinutes: number;
  tasksCompleted: number;
}

export interface WeekdayStats {
  dayOfWeek: number;
  dayName: string;
  averageTasks: number;
  averageFocusMinutes: number;
  averageHabitCompletion: number;
}

export interface MoodEntry {
  id: string;
  moodLevel: number;
  energyLevel: number;
  descriptor?: string;
  timestamp: string;
}

// Overview stats
export const getStats = async (): Promise<ProgressStats> => {
  const response = await apiClient.get<ApiResponse<ProgressStats>>('/analytics/stats');
  return response.data.data;
};

export const getDailyStats = async (date: string): Promise<DailyStats> => {
  const response = await apiClient.get<ApiResponse<DailyStats>>(
    `/analytics/daily/${date}`
  );
  return response.data.data;
};

export const getWeeklyStats = async (weekStart?: string): Promise<WeeklyStats> => {
  const response = await apiClient.get<ApiResponse<WeeklyStats>>('/analytics/weekly', {
    params: { weekStart },
  });
  return response.data.data;
};

export const getMonthlyStats = async (
  month: number,
  year: number
): Promise<MonthlyStats> => {
  const response = await apiClient.get<ApiResponse<MonthlyStats>>('/analytics/monthly', {
    params: { month, year },
  });
  return response.data.data;
};

// Trends
export const getProductivityTrend = async (
  dateRange: DateRange
): Promise<ProductivityTrend[]> => {
  const response = await apiClient.get<ApiResponse<ProductivityTrend[]>>(
    '/analytics/productivity-trend',
    { params: dateRange }
  );
  return response.data.data;
};

// Breakdowns
export const getTaskCategoryBreakdown = async (
  dateRange?: DateRange
): Promise<CategoryBreakdown[]> => {
  const response = await apiClient.get<ApiResponse<CategoryBreakdown[]>>(
    '/analytics/task-categories',
    { params: dateRange }
  );
  return response.data.data;
};

export const getTimeDistribution = async (
  dateRange?: DateRange
): Promise<TimeDistribution[]> => {
  const response = await apiClient.get<ApiResponse<TimeDistribution[]>>(
    '/analytics/time-distribution',
    { params: dateRange }
  );
  return response.data.data;
};

export const getWeekdayStats = async (): Promise<WeekdayStats[]> => {
  const response = await apiClient.get<ApiResponse<WeekdayStats[]>>(
    '/analytics/weekday-stats'
  );
  return response.data.data;
};

export const recordMood = async (
  moodLevel: number,
  energyLevel: number,
  descriptor?: string
): Promise<{ entry: MoodEntry; xpEarned: number }> => {
  const response = await apiClient.post<ApiResponse<{ entry: MoodEntry; xpEarned: number }>>(
    '/analytics/mood',
    { moodLevel, energyLevel, descriptor }
  );
  return response.data.data;
};

// Comparisons
export const getWeekOverWeekComparison = async (): Promise<{
  current: WeeklyStats;
  previous: WeeklyStats;
  changes: {
    tasksCompleted: number;
    focusMinutes: number;
    habitsCompletionRate: number;
    xpEarned: number;
  };
}> => {
  const response = await apiClient.get<ApiResponse<{
    current: WeeklyStats;
    previous: WeeklyStats;
    changes: {
      tasksCompleted: number;
      focusMinutes: number;
      habitsCompletionRate: number;
      xpEarned: number;
    };
  }>>('/analytics/week-comparison');
  return response.data.data;
};

// Streaks
export const getStreakHistory = async (): Promise<{
  currentStreak: number;
  longestStreak: number;
  streakHistory: Array<{
    startDate: string;
    endDate: string;
    length: number;
  }>;
}> => {
  const response = await apiClient.get<ApiResponse<{
    currentStreak: number;
    longestStreak: number;
    streakHistory: Array<{
      startDate: string;
      endDate: string;
      length: number;
    }>;
  }>>('/analytics/streak-history');
  return response.data.data;
};

// Export data
export const exportData = async (
  format: 'json' | 'csv',
  dateRange?: DateRange
): Promise<string> => {
  const response = await apiClient.get<ApiResponse<{ url: string }>>(
    '/analytics/export',
    { params: { format, ...dateRange } }
  );
  return response.data.data.url;
};
