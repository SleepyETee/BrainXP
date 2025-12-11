import {
  UpshiftEnvelope,
  UpshiftEvent,
  UpshiftFocusSessionPayload,
  UpshiftGoalPayload,
  UpshiftHabitLogPayload,
  UpshiftHabitPayload,
  UpshiftTaskPayload,
  UpshiftUser,
} from '../types/upshift';
import { Task } from '../types/task';
import { Habit, HabitLog } from '../types/habit';
import { FocusSession } from '../types/focus';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';

// Env configuration:
// - EXPO_PUBLIC_UPSHIFT_API_URL / EXPO_PUBLIC_UPSHIFT_API_KEY: public Upshift gateway
// - EXPO_PUBLIC_UPSHIFT_ENABLED: optional toggle (set to "false" to disable)
// - EXPO_PUBLIC_UPSHIFT_TIMEOUT_MS / EXPO_PUBLIC_UPSHIFT_MAX_RETRIES / EXPO_PUBLIC_UPSHIFT_RETRY_DELAY_MS: resiliency tuning
// - EXPO_PUBLIC_UPSHIFT_DEBUG: turn on verbose logging in non-prod builds
const API_URL = process.env.EXPO_PUBLIC_UPSHIFT_API_URL;
const API_KEY = process.env.EXPO_PUBLIC_UPSHIFT_API_KEY;
const ENV_ENABLED = process.env.EXPO_PUBLIC_UPSHIFT_ENABLED !== 'false';
const TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_UPSHIFT_TIMEOUT_MS || 4000);
const MAX_RETRIES = Number(process.env.EXPO_PUBLIC_UPSHIFT_MAX_RETRIES || 1);
const RETRY_DELAY_MS = Number(process.env.EXPO_PUBLIC_UPSHIFT_RETRY_DELAY_MS || 150);

const shouldLog =
  __DEV__ || process.env.NODE_ENV !== 'production' || process.env.EXPO_PUBLIC_UPSHIFT_DEBUG === 'true';

type SendResult = { ok: boolean; skipped?: boolean; error?: unknown; status?: number };
type ApiResult<T> = SendResult & { data?: T };

const isConfigured = (): boolean => {
  const { upshiftSyncEnabled } = useSettingsStore.getState().settings;
  return Boolean(API_URL && API_KEY && ENV_ENABLED && upshiftSyncEnabled);
};

const buildEnvelope = <TPayload>(event: UpshiftEvent, payload: TPayload): UpshiftEnvelope<TPayload> => ({
  event,
  payload,
  sentAt: new Date().toISOString(),
});

const getUserContext = (): UpshiftUser | null => {
  const user = useAuthStore.getState().user;
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const callUpshift = async <T>(
  path: string,
  init?: RequestInit & { ignoreConfig?: boolean }
): Promise<ApiResult<T>> => {
  if (!API_URL || !API_KEY) {
    if (shouldLog) console.info('[Upshift] Missing API env, skipping');
    return { ok: false, skipped: true };
  }

  if (!init?.ignoreConfig && !isConfigured()) {
    if (shouldLog) console.info('[Upshift] Skipped call (not configured)');
    return { ok: false, skipped: true };
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${API_URL}${path}`, {
        method: init?.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          ...(init?.headers || {}),
        },
        body: init?.body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const maybeJson = (await response.json().catch(() => undefined)) as T | undefined;

      if (!response.ok && shouldLog) {
        console.warn('[Upshift] Call failed', response.status, `attempt ${attempt + 1}`);
      }

      if (response.ok || response.status < 500 || attempt === MAX_RETRIES) {
        return { ok: response.ok, status: response.status, data: maybeJson };
      }
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (shouldLog) console.warn('[Upshift] Call error', `attempt ${attempt + 1}`, error);
    }

    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  return { ok: false, error: lastError };
};

const postEnvelope = async <TPayload>(envelope: UpshiftEnvelope<TPayload>): Promise<SendResult> => {
  const result = await callUpshift('/events', {
    method: 'POST',
    body: JSON.stringify(envelope),
  });

  return { ok: result.ok, skipped: result.skipped, status: result.status, error: result.error };
};

const mapGoal = (title: string, userId: string, idx: number): UpshiftGoalPayload => ({
  id: `goal-${idx + 1}`,
  userId,
  title,
  status: 'active',
  updatedAt: new Date().toISOString(),
});

const mapUserProfile = (user: UpshiftUser): UpshiftUser => ({
  ...user,
  timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
});

const devSelfTest = async (): Promise<void> => {
  const user = getUserContext();
  const payload =
    user || { id: 'dev-anonymous', name: 'dev', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  const envelope = buildEnvelope('user_sync', payload);
  const result = await postEnvelope(envelope);
  if (shouldLog) {
    console.info('[Upshift] Self-test result', result);
  }
};

const apiClient = {
  callUpshift,
  devSelfTest,
  status: () => callUpshift<{ configured: boolean }>('/status', { method: 'GET', ignoreConfig: true }),
  ping: () => postEnvelope(buildEnvelope('user_sync', { id: 'ping' })),
};

const mapTask = (task: Task, userId: string): UpshiftTaskPayload => ({
  id: task.id,
  userId,
  title: task.title,
  status: task.status,
  dueDate: task.dueDate,
  scheduledDate: task.scheduledDate,
  priority: task.priority,
  tags: task.tags,
  updatedAt: task.updatedAt,
  completedAt: task.completedAt,
});

const mapHabit = (habit: Habit, userId: string): UpshiftHabitPayload => ({
  id: habit.id,
  userId,
  name: habit.name,
  frequencyType: habit.frequencyType,
  daysOfWeek: habit.daysOfWeek,
  targetCount: habit.targetCount,
  reminderTime: habit.reminderTime,
  archivedAt: habit.archivedAt,
});

const mapHabitLog = (log: HabitLog, userId: string): UpshiftHabitLogPayload => ({
  habitId: log.habitId,
  userId,
  date: log.date,
  completed: Boolean(log.completed),
  partialCredit: log.partialCredit !== undefined ? log.partialCredit > 0 : undefined,
  note: log.note,
});

const mapFocusSession = (session: FocusSession, userId: string): UpshiftFocusSessionPayload => ({
  id: session.id,
  userId,
  startTime: session.startTime,
  endTime: session.endTime,
  actualDuration: session.actualDuration,
  plannedDuration: session.plannedDuration,
  completedTask: session.completedTask,
  interruptions: session.interruptions?.length ?? 0,
  taskId: session.taskId,
});

export const syncUser = async (user?: UpshiftUser): Promise<SendResult> => {
  const payload = mapUserProfile(user || getUserContext() || { id: 'unknown' });
  return postEnvelope(buildEnvelope('user_sync', payload));
};

export const syncTask = async (task: Task): Promise<SendResult> => {
  const user = getUserContext();
  if (!user) return { ok: false, skipped: true };
  return postEnvelope(buildEnvelope('task_sync', mapTask(task, user.id)));
};

export const syncHabit = async (habit: Habit): Promise<SendResult> => {
  const user = getUserContext();
  if (!user) return { ok: false, skipped: true };
  return postEnvelope(buildEnvelope('habit_sync', mapHabit(habit, user.id)));
};

export const syncHabitLog = async (log: HabitLog): Promise<SendResult> => {
  const user = getUserContext();
  if (!user) return { ok: false, skipped: true };
  return postEnvelope(buildEnvelope('habit_sync', mapHabitLog(log, user.id)));
};

export const syncFocusSession = async (session: FocusSession): Promise<SendResult> => {
  const user = getUserContext();
  if (!user) return { ok: false, skipped: true };
  return postEnvelope(buildEnvelope('focus_session_sync', mapFocusSession(session, user.id)));
};

export const syncGoals = async (): Promise<SendResult> => {
  const user = getUserContext();
  if (!user) return { ok: false, skipped: true };

  const goals = useAuthStore.getState().user?.primaryGoals || [];
  const payload = goals.map((goal, idx) => mapGoal(goal, user.id, idx));
  return postEnvelope(buildEnvelope('goal_sync', { userId: user.id, goals: payload }));
};

export const fetchRemoteTasks = async (): Promise<ApiResult<UpshiftTaskPayload[]>> => {
  const user = getUserContext();
  if (!user) return { ok: false, skipped: true };
  return callUpshift<UpshiftTaskPayload[]>(`/tasks?userId=${encodeURIComponent(user.id)}`);
};

export const upsertRemoteTask = async (task: Task): Promise<ApiResult<unknown>> => {
  const user = getUserContext();
  if (!user) return { ok: false, skipped: true };
  return callUpshift('/tasks', {
    method: 'PUT',
    body: JSON.stringify(mapTask(task, user.id)),
  });
};

export const fetchRemoteHabits = async (): Promise<ApiResult<UpshiftHabitPayload[]>> => {
  const user = getUserContext();
  if (!user) return { ok: false, skipped: true };
  return callUpshift<UpshiftHabitPayload[]>(`/habits?userId=${encodeURIComponent(user.id)}`);
};

export const upsertRemoteHabit = async (habit: Habit): Promise<ApiResult<unknown>> => {
  const user = getUserContext();
  if (!user) return { ok: false, skipped: true };
  return callUpshift('/habits', {
    method: 'PUT',
    body: JSON.stringify(mapHabit(habit, user.id)),
  });
};

export const fetchRemoteGoals = async (): Promise<ApiResult<UpshiftGoalPayload[]>> => {
  const user = getUserContext();
  if (!user) return { ok: false, skipped: true };
  return callUpshift<UpshiftGoalPayload[]>(`/goals?userId=${encodeURIComponent(user.id)}`);
};

export const upsertRemoteGoals = async (): Promise<ApiResult<unknown>> => {
  const user = getUserContext();
  if (!user) return { ok: false, skipped: true };
  const goals = useAuthStore.getState().user?.primaryGoals || [];
  return callUpshift('/goals', {
    method: 'PUT',
    body: JSON.stringify(goals.map((goal, idx) => mapGoal(goal, user.id, idx))),
  });
};

export const upshiftStatus = {
  isConfigured,
  getUserContext,
  callUpshift,
  devSelfTest,
  api: apiClient,
};
