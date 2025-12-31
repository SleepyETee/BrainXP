// Mock Habits Service - Provides fallback responses when backend is unavailable

import {
  Habit,
  HabitLog,
  HabitWithLogs,
  HabitStats,
  FlexibleStreak,
} from '../../types/habit';

// Helper to simulate network delay
const simulateDelay = (ms: number = 300) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Mock data storage (in-memory for development)
let mockHabits: Habit[] = [];
let mockLogs: HabitLog[] = [];

export const mockGetHabits = async (): Promise<Habit[]> => {
  await simulateDelay();
  return mockHabits;
};

export const mockGetHabit = async (id: string): Promise<HabitWithLogs> => {
  await simulateDelay();
  const habit = mockHabits.find(h => h.id === id);
  if (!habit) {
    throw new Error('Habit not found');
  }
  const logs = mockLogs.filter(l => l.habitId === id);
  const today = new Date().toISOString().split('T')[0];
  const todayLog = logs.find(l => l.date === today);
  return { ...habit, logs, todayLog };
};

export const mockGetTodayHabits = async (): Promise<HabitWithLogs[]> => {
  await simulateDelay();
  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayStr = today.toISOString().split('T')[0];

  return mockHabits
    .filter(h => !h.archivedAt && h.daysOfWeek.includes(dayOfWeek))
    .map(habit => {
      const logs = mockLogs.filter(l => l.habitId === habit.id);
      const todayLog = logs.find(l => l.date === todayStr);
      return { ...habit, logs, todayLog };
    });
};

export const mockGetHabitStats = async (id: string): Promise<HabitStats> => {
  await simulateDelay();
  const habit = mockHabits.find(h => h.id === id);
  if (!habit) {
    throw new Error('Habit not found');
  }

  const logs = mockLogs.filter(l => l.habitId === id);
  const completedLogs = logs.filter(l => l.completed);
  const partialLogs = logs.filter(l => l.partialCredit && !l.completed);

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    const log = logs.find(l => l.date === dateStr);

    if (log?.completed) {
      currentStreak++;
    } else if (i > 0) {
      break;
    }
  }

  // Calculate flexible streak
  const windowDays = 14;
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - windowDays);
  const recentLogs = logs.filter(l => {
    const logDate = new Date(l.date);
    return logDate >= windowStart && logDate <= today && l.completed;
  });

  const flexibleStreak: FlexibleStreak = {
    completed: recentLogs.length,
    total: windowDays,
    percentage: Math.round((recentLogs.length / windowDays) * 100),
    windowDays,
  };

  return {
    habitId: id,
    totalCompletions: completedLogs.length,
    totalPartial: partialLogs.length,
    currentStreak,
    longestStreak: Math.max(currentStreak, 7), // Simplified calculation
    flexibleStreak,
    averageCompletionRate: logs.length > 0 ? completedLogs.length / logs.length : 0,
    bestDay: 1, // Monday
    worstDay: 0, // Sunday
  };
};

export const mockGetHabitSummary = async () => {
  await simulateDelay();
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = mockLogs.filter(l => l.date === today && l.completed);
  
  return {
    totalHabits: mockHabits.filter(h => !h.archivedAt).length,
    completedToday: todayLogs.length,
    longestStreak: 7,
    completionRate: 0.75,
  };
};

// Helper to set mock data (for testing)
export const setMockHabits = (habits: Habit[]) => {
  mockHabits = habits;
};

export const setMockLogs = (logs: HabitLog[]) => {
  mockLogs = logs;
};
