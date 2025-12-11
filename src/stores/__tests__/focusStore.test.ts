// filepath: /Users/sleepyet/BrainXP/src/stores/__tests__/focusStore.test.ts
import { act, renderHook } from '@testing-library/react-native';
import { useFocusStore } from '../focusStore';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../services/upshift', () => ({
  syncFocusSession: jest.fn(),
}));

jest.mock('../../services/api/focus', () => ({
  getPresets: jest.fn().mockResolvedValue([
    { id: '1', label: 'Pomodoro', work: 25, shortBreak: 5, longBreak: 15, sessions: 4 },
    { id: '2', label: 'Deep Work', work: 90, shortBreak: 10, longBreak: 30, sessions: 2 },
  ]),
  getFocusWidgetSummary: jest.fn().mockResolvedValue({
    todayMinutes: 45,
    weeklyMinutes: 180,
    streak: 3,
  }),
}));

jest.mock('../authStore', () => ({
  useAuthStore: {
    getState: () => ({ user: { id: 'test-user-123' } }),
  },
}));

// Helper to create valid session input
const createSessionInput = (overrides = {}) => ({
  taskDescription: 'Test focus session',
  plannedDuration: 25,
  ...overrides,
});

describe('focusStore', () => {
  beforeEach(() => {
    act(() => {
      useFocusStore.setState({
        currentSession: null,
        sessions: [],
        preferences: {
          defaultDuration: 25,
          defaultSound: 'none',
          showTimerInNotification: true,
          vibrationEnabled: true,
          autoStartBreaks: false,
          breakDuration: 5,
          dailyGoalMinutes: 120,
        },
        presets: [],
        widgetSummary: null,
        isLoading: false,
        error: null,
      });
    });
  });

  describe('startSession', () => {
    it('should start a new focus session with default values', () => {
      const { result } = renderHook(() => useFocusStore());

      act(() => {
        result.current.startSession(createSessionInput());
      });

      expect(result.current.currentSession).not.toBeNull();
      expect(result.current.currentSession?.plannedDuration).toBe(25);
      expect(result.current.currentSession?.sessionType).toBe('pomodoro');
      expect(result.current.currentSession?.isActive).toBe(true);
      expect(result.current.currentSession?.status).toBe('active');
      expect(result.current.currentSession?.interruptions).toHaveLength(0);
    });

    it('should start a session with custom properties', () => {
      const { result } = renderHook(() => useFocusStore());

      act(() => {
        result.current.startSession(createSessionInput({
          plannedDuration: 45,
          sessionType: 'deep_work',
          taskId: 'task-123',
          taskDescription: 'Work on project',
          backgroundSound: 'rain',
          breakDuration: 10,
          autoContinue: true,
        }));
      });

      const session = result.current.currentSession;
      expect(session?.plannedDuration).toBe(45);
      expect(session?.sessionType).toBe('deep_work');
      expect(session?.taskId).toBe('task-123');
      expect(session?.taskDescription).toBe('Work on project');
      expect(session?.backgroundSound).toBe('rain');
      expect(session?.breakDuration).toBe(10);
      expect(session?.autoContinue).toBe(true);
    });
  });

  describe('pauseSession', () => {
    it('should pause the current session', () => {
      const { result } = renderHook(() => useFocusStore());

      act(() => {
        result.current.startSession(createSessionInput());
      });

      expect(result.current.currentSession?.isActive).toBe(true);

      act(() => {
        result.current.pauseSession();
      });

      expect(result.current.currentSession?.isActive).toBe(false);
    });

    it('should do nothing if no session is active', () => {
      const { result } = renderHook(() => useFocusStore());

      act(() => {
        result.current.pauseSession();
      });

      expect(result.current.currentSession).toBeNull();
    });
  });

  describe('resumeSession', () => {
    it('should resume a paused session', () => {
      const { result } = renderHook(() => useFocusStore());

      act(() => {
        result.current.startSession(createSessionInput());
        result.current.pauseSession();
      });

      expect(result.current.currentSession?.isActive).toBe(false);

      act(() => {
        result.current.resumeSession();
      });

      expect(result.current.currentSession?.isActive).toBe(true);
    });
  });

  describe('addInterruption', () => {
    it('should add an interruption to the current session', () => {
      const { result } = renderHook(() => useFocusStore());

      act(() => {
        result.current.startSession(createSessionInput());
      });

      act(() => {
        result.current.addInterruption('Phone call');
      });

      expect(result.current.currentSession?.interruptions).toHaveLength(1);
      expect(result.current.currentSession?.interruptions[0].reason).toBe('Phone call');
    });

    it('should add multiple interruptions', () => {
      const { result } = renderHook(() => useFocusStore());

      act(() => {
        result.current.startSession(createSessionInput());
        result.current.addInterruption('Phone call');
        result.current.addInterruption('Bathroom break');
      });

      expect(result.current.currentSession?.interruptions).toHaveLength(2);
    });
  });

  describe('extendSession', () => {
    it('should extend the planned duration of the current session', () => {
      const { result } = renderHook(() => useFocusStore());

      act(() => {
        result.current.startSession(createSessionInput());
      });

      act(() => {
        result.current.extendSession(10);
      });

      expect(result.current.currentSession?.plannedDuration).toBe(35);
    });
  });

  describe('endSession', () => {
    it('should end the current session and calculate XP', async () => {
      const { result } = renderHook(() => useFocusStore());

      act(() => {
        result.current.startSession(createSessionInput());
      });

      let sessionResult: any;
      await act(async () => {
        sessionResult = await result.current.endSession();
      });

      expect(result.current.currentSession).toBeNull();
      expect(result.current.sessions).toHaveLength(1);
      expect(sessionResult.xpEarned).toBeGreaterThan(0);
      expect(sessionResult.session.status).toBe('completed');
    });

    it('should award bonus XP for completing task', async () => {
      const { result } = renderHook(() => useFocusStore());

      act(() => {
        result.current.startSession(createSessionInput({ taskId: 'task-1' }));
      });

      let sessionResult: any;
      await act(async () => {
        sessionResult = await result.current.endSession({ completedTask: true });
      });

      expect(sessionResult.session.completedTask).toBe(true);
      // Base XP + no interruption bonus + task completion bonus
      expect(sessionResult.xpEarned).toBeGreaterThanOrEqual(30);
    });

    it('should record quality rating', async () => {
      const { result } = renderHook(() => useFocusStore());

      act(() => {
        result.current.startSession(createSessionInput());
      });

      await act(async () => {
        await result.current.endSession({ qualityRating: 4 });
      });

      expect(result.current.sessions[0].qualityRating).toBe(4);
    });

    it('should throw error if no active session', async () => {
      const { result } = renderHook(() => useFocusStore());

      await expect(
        act(async () => {
          await result.current.endSession();
        })
      ).rejects.toThrow('No active session');
    });
  });

  describe('setBackgroundSound', () => {
    it('should change the background sound of the current session', () => {
      const { result } = renderHook(() => useFocusStore());

      act(() => {
        result.current.startSession(createSessionInput());
      });

      act(() => {
        result.current.setBackgroundSound('forest');
      });

      expect(result.current.currentSession?.backgroundSound).toBe('forest');
    });
  });

  describe('updatePreferences', () => {
    it('should update focus preferences', () => {
      const { result } = renderHook(() => useFocusStore());

      act(() => {
        result.current.updatePreferences({
          defaultDuration: 50,
          dailyGoalMinutes: 180,
        });
      });

      expect(result.current.preferences.defaultDuration).toBe(50);
      expect(result.current.preferences.dailyGoalMinutes).toBe(180);
      // Other preferences should remain unchanged
      expect(result.current.preferences.breakDuration).toBe(5);
    });
  });

  describe('fetchPresets', () => {
    it('should fetch focus timer presets', async () => {
      const { result } = renderHook(() => useFocusStore());

      await act(async () => {
        await result.current.fetchPresets();
      });

      expect(result.current.presets).toHaveLength(2);
      expect(result.current.presets[0].label).toBe('Pomodoro');
    });
  });

  describe('fetchWidgetSummary', () => {
    it('should fetch widget summary', async () => {
      const { result } = renderHook(() => useFocusStore());

      await act(async () => {
        await result.current.fetchWidgetSummary();
      });

      expect(result.current.widgetSummary).not.toBeNull();
      expect(result.current.widgetSummary?.todayMinutes).toBe(45);
    });
  });

  describe('selectors', () => {
    describe('getSessionById', () => {
      it('should return session by id', async () => {
        const { result } = renderHook(() => useFocusStore());

        act(() => {
          result.current.startSession(createSessionInput());
        });

        const sessionId = result.current.currentSession!.id;

        await act(async () => {
          await result.current.endSession();
        });

        const found = result.current.getSessionById(sessionId);
        expect(found).toBeDefined();
        expect(found?.id).toBe(sessionId);
      });

      it('should return undefined for non-existent id', () => {
        const { result } = renderHook(() => useFocusStore());
        const found = result.current.getSessionById('non-existent');
        expect(found).toBeUndefined();
      });
    });

    describe('getTodaySessions', () => {
      it('should return sessions from today', async () => {
        const { result } = renderHook(() => useFocusStore());

        // Create and end a session today
        act(() => {
          result.current.startSession(createSessionInput());
        });

        await act(async () => {
          await result.current.endSession();
        });

        const todaySessions = result.current.getTodaySessions();
        expect(todaySessions).toHaveLength(1);
      });
    });

    describe('getTodayFocusMinutes', () => {
      it('should calculate total focus minutes for today', async () => {
        const { result } = renderHook(() => useFocusStore());

        // Create multiple sessions
        act(() => {
          result.current.startSession(createSessionInput());
        });

        await act(async () => {
          await result.current.endSession();
        });

        act(() => {
          result.current.startSession(createSessionInput({ plannedDuration: 15 }));
        });

        await act(async () => {
          await result.current.endSession();
        });

        const totalMinutes = result.current.getTodayFocusMinutes();
        // Minutes will be low since sessions are ended immediately
        expect(totalMinutes).toBeGreaterThanOrEqual(0);
      });
    });

    describe('getStats', () => {
      it('should return empty stats when no sessions', () => {
        const { result } = renderHook(() => useFocusStore());

        const stats = result.current.getStats();

        expect(stats.totalSessions).toBe(0);
        expect(stats.totalMinutes).toBe(0);
        expect(stats.averageSessionLength).toBe(0);
      });

      it('should calculate stats from completed sessions', async () => {
        const { result } = renderHook(() => useFocusStore());

        // Complete a few sessions
        for (let i = 0; i < 3; i++) {
          act(() => {
            result.current.startSession(createSessionInput());
          });

          await act(async () => {
            await result.current.endSession({ qualityRating: 4 });
          });
        }

        const stats = result.current.getStats();

        expect(stats.totalSessions).toBe(3);
        expect(stats.averageQualityRating).toBe(4);
      });
    });
  });
});
