// filepath: /Users/sleepyet/BrainXP/src/stores/__tests__/habitStore.test.ts
import { useHabitStore } from '../habitStore';
import { CreateHabitInput } from '../../types/habit';
import { act, renderHook } from '@testing-library/react-native';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock upshift sync
jest.mock('../../services/upshift', () => ({
  syncHabit: jest.fn(() => Promise.resolve()),
  syncHabitLog: jest.fn(() => Promise.resolve()),
}));

// Mock auth store
jest.mock('../authStore', () => ({
  useAuthStore: {
    getState: () => ({ user: { id: 'test-user-id' } }),
  },
}));

describe('habitStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useHabitStore.setState({
      habits: [],
      logs: [],
      isLoading: false,
      error: null,
    });
  });

  describe('createHabit', () => {
    it('should create a new habit with default values', async () => {
      const input: CreateHabitInput = {
        name: 'Morning Exercise',
        icon: '🏃',
        color: '#4CAF50',
      };

      const habit = await useHabitStore.getState().createHabit(input);

      expect(habit).toBeDefined();
      expect(habit.name).toBe('Morning Exercise');
      expect(habit.icon).toBe('🏃');
      expect(habit.color).toBe('#4CAF50');
      expect(habit.frequencyType).toBe('daily');
      expect(habit.daysOfWeek).toEqual([0, 1, 2, 3, 4, 5, 6]);
      expect(habit.targetCount).toBe(1);
      expect(habit.allowPartialCredit).toBe(true);
      expect(habit.userId).toBe('test-user-id');
      expect(useHabitStore.getState().habits).toHaveLength(1);
    });

    it('should create a habit with custom frequency', async () => {
      const input: CreateHabitInput = {
        name: 'Gym',
        icon: '💪',
        color: '#2196F3',
        frequencyType: 'weekly',
        daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
        targetCount: 3,
      };

      const habit = await useHabitStore.getState().createHabit(input);

      expect(habit.frequencyType).toBe('weekly');
      expect(habit.daysOfWeek).toEqual([1, 3, 5]);
      expect(habit.targetCount).toBe(3);
    });

    it('should create a habit with reminder settings', async () => {
      const input: CreateHabitInput = {
        name: 'Take Medication',
        icon: '💊',
        color: '#E91E63',
        reminderEnabled: true,
        reminderTime: '08:00',
        preferredTime: 'morning',
      };

      const habit = await useHabitStore.getState().createHabit(input);

      expect(habit.reminderEnabled).toBe(true);
      expect(habit.reminderTime).toBe('08:00');
      expect(habit.preferredTime).toBe('morning');
    });
  });

  describe('updateHabit', () => {
    it('should update an existing habit', async () => {
      const input: CreateHabitInput = {
        name: 'Original Name',
        icon: '📝',
        color: '#9C27B0',
      };

      const habit = await useHabitStore.getState().createHabit(input);
      await useHabitStore.getState().updateHabit(habit.id, {
        name: 'Updated Name',
        icon: '✨',
      });

      const updated = useHabitStore.getState().getHabitById(habit.id);
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.icon).toBe('✨');
      expect(updated?.color).toBe('#9C27B0'); // Unchanged
    });
  });

  describe('deleteHabit', () => {
    it('should delete a habit and its logs', async () => {
      const habit = await useHabitStore.getState().createHabit({
        name: 'To Delete',
        icon: '🗑️',
        color: '#607D8B',
      });

      // Add a log
      await useHabitStore.getState().logHabit({
        habitId: habit.id,
        date: '2025-12-10',
        completed: true,
      });

      expect(useHabitStore.getState().habits).toHaveLength(1);
      expect(useHabitStore.getState().logs).toHaveLength(1);

      await useHabitStore.getState().deleteHabit(habit.id);

      expect(useHabitStore.getState().habits).toHaveLength(0);
      expect(useHabitStore.getState().logs).toHaveLength(0);
    });
  });

  describe('archiveHabit', () => {
    it('should archive a habit', async () => {
      const habit = await useHabitStore.getState().createHabit({
        name: 'To Archive',
        icon: '📦',
        color: '#795548',
      });

      expect(habit.archivedAt).toBeUndefined();

      await useHabitStore.getState().archiveHabit(habit.id);

      const archived = useHabitStore.getState().getHabitById(habit.id);
      expect(archived?.archivedAt).toBeDefined();
    });

    it('should exclude archived habits from active habits', async () => {
      const habit1 = await useHabitStore.getState().createHabit({
        name: 'Active Habit',
        icon: '✅',
        color: '#4CAF50',
      });

      const habit2 = await useHabitStore.getState().createHabit({
        name: 'Archived Habit',
        icon: '📦',
        color: '#795548',
      });

      await useHabitStore.getState().archiveHabit(habit2.id);

      const activeHabits = useHabitStore.getState().getActiveHabits();
      expect(activeHabits).toHaveLength(1);
      expect(activeHabits[0].id).toBe(habit1.id);
    });
  });

  describe('logHabit', () => {
    it('should log a completed habit', async () => {
      const habit = await useHabitStore.getState().createHabit({
        name: 'Test Habit',
        icon: '📝',
        color: '#2196F3',
      });

      const result = await useHabitStore.getState().logHabit({
        habitId: habit.id,
        date: '2025-12-10',
        completed: true,
      });

      expect(result.xpEarned).toBe(10);
      expect(useHabitStore.getState().logs).toHaveLength(1);
      expect(useHabitStore.getState().logs[0].completed).toBe(true);
    });

    it('should log partial credit', async () => {
      const habit = await useHabitStore.getState().createHabit({
        name: 'Test Habit',
        icon: '📝',
        color: '#2196F3',
      });

      const result = await useHabitStore.getState().logHabit({
        habitId: habit.id,
        date: '2025-12-10',
        completed: false,
        partialCredit: 0.5,
      });

      expect(result.xpEarned).toBe(5);
      expect(useHabitStore.getState().logs[0].partialCredit).toBe(0.5);
    });

    it('should update existing log for same date', async () => {
      const habit = await useHabitStore.getState().createHabit({
        name: 'Test Habit',
        icon: '📝',
        color: '#2196F3',
      });

      await useHabitStore.getState().logHabit({
        habitId: habit.id,
        date: '2025-12-10',
        completed: false,
      });

      await useHabitStore.getState().logHabit({
        habitId: habit.id,
        date: '2025-12-10',
        completed: true,
      });

      expect(useHabitStore.getState().logs).toHaveLength(1);
      expect(useHabitStore.getState().logs[0].completed).toBe(true);
    });
  });

  describe('unlogHabit', () => {
    it('should remove a habit log', async () => {
      const habit = await useHabitStore.getState().createHabit({
        name: 'Test Habit',
        icon: '📝',
        color: '#2196F3',
      });

      await useHabitStore.getState().logHabit({
        habitId: habit.id,
        date: '2025-12-10',
        completed: true,
      });

      expect(useHabitStore.getState().logs).toHaveLength(1);

      await useHabitStore.getState().unlogHabit(habit.id, '2025-12-10');

      expect(useHabitStore.getState().logs).toHaveLength(0);
    });
  });

  describe('getHabitWithLogs', () => {
    it('should return habit with all its logs', async () => {
      const habit = await useHabitStore.getState().createHabit({
        name: 'Test Habit',
        icon: '📝',
        color: '#2196F3',
      });

      await useHabitStore.getState().logHabit({
        habitId: habit.id,
        date: '2025-12-08',
        completed: true,
      });

      await useHabitStore.getState().logHabit({
        habitId: habit.id,
        date: '2025-12-09',
        completed: true,
      });

      const habitWithLogs = useHabitStore.getState().getHabitWithLogs(habit.id);

      expect(habitWithLogs).toBeDefined();
      expect(habitWithLogs?.logs).toHaveLength(2);
    });

    it('should return undefined for non-existent habit', () => {
      const habitWithLogs = useHabitStore.getState().getHabitWithLogs('non-existent');
      expect(habitWithLogs).toBeUndefined();
    });
  });

  describe('getHabitStats', () => {
    it('should calculate habit statistics', async () => {
      const habit = await useHabitStore.getState().createHabit({
        name: 'Test Habit',
        icon: '📝',
        color: '#2196F3',
      });

      // Log completions for consecutive days
      const today = new Date();
      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        await useHabitStore.getState().logHabit({
          habitId: habit.id,
          date: date.toISOString().split('T')[0],
          completed: true,
        });
      }

      const stats = useHabitStore.getState().getHabitStats(habit.id);

      expect(stats).toBeDefined();
      expect(stats?.totalCompletions).toBe(5);
      expect(stats?.currentStreak).toBe(5);
      expect(stats?.longestStreak).toBe(5);
      expect(stats?.averageCompletionRate).toBe(1);
    });

    it('should return undefined for non-existent habit', () => {
      const stats = useHabitStore.getState().getHabitStats('non-existent');
      expect(stats).toBeUndefined();
    });
  });

  describe('calculateFlexibleStreak', () => {
    it('should calculate flexible streak allowing for missed days', async () => {
      const habit = await useHabitStore.getState().createHabit({
        name: 'Test Habit',
        icon: '📝',
        color: '#2196F3',
      });

      const today = new Date();
      
      // Log with some gaps
      await useHabitStore.getState().logHabit({
        habitId: habit.id,
        date: today.toISOString().split('T')[0],
        completed: true,
      });

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      await useHabitStore.getState().logHabit({
        habitId: habit.id,
        date: yesterday.toISOString().split('T')[0],
        completed: true,
      });

      // Skip a day, then log again
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      await useHabitStore.getState().logHabit({
        habitId: habit.id,
        date: threeDaysAgo.toISOString().split('T')[0],
        completed: true,
      });

      const flexibleStreak = useHabitStore.getState().calculateFlexibleStreak(habit.id, 7);

      expect(flexibleStreak).toBeDefined();
      expect(flexibleStreak.completed).toBe(3);
    });

    it('should calculate streak with window tolerance', async () => {
      const { result } = renderHook(() => useHabitStore());

      let habit: any;
      await act(async () => {
        habit = await result.current.createHabit({
          name: 'Streak Test',
          icon: '🔥',
          color: '#FF4500',
        });
      });

      // Add logs for last 5 days
      const today = new Date();
      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        await act(async () => {
          await result.current.logHabit({
            habitId: habit.id,
            date: date.toISOString().split('T')[0],
            completed: true,
          });
        });
      }

      const streak = result.current.calculateFlexibleStreak(habit.id);
      expect(streak.completed).toBeGreaterThanOrEqual(5);
      expect(streak.total).toBe(14); // default window
      expect(streak.percentage).toBeGreaterThan(0);
    });
  });
});
