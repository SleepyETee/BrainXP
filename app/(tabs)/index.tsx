// BrainXP Home Screen - Notion-inspired, ADHD-Friendly Visual Experience
// Clean, efficient, minimal cognitive load design
import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTaskStore } from '../../src/stores/taskStore';
import { useHabitStore } from '../../src/stores/habitStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { useFocusStore } from '../../src/stores/focusStore';
import { useTimelineStore } from '../../src/stores/timelineStore';
import { TimelineBlockWithTask } from '../../src/types/timeline';
import { Task } from '../../src/types/task';
import { HabitWithLogs } from '../../src/types/habit';
import { InsightItem } from '../../src/components/ai/AIInsightsCard';
import { ParticleExplosion } from '../../src/components/gamification/ParticleExplosion';
import { colors, gradients, adhdPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme';
import { getTimeOfDayGreeting } from '../../src/utils/date';

// Dashboard preview components
import {
  NextUpCard,
  NextUpItem,
  TimelinePreview,
  TasksPreview,
  HabitsPreview,
  InsightsPreview,
  QuickActionsBar,
} from '../../src/components/dashboard';

import { getInsights } from '../../src/services/api/ai';

const formatDuration = (totalSeconds: number | null | undefined) => {
  if (totalSeconds == null) return '--:--';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const scrollY = useSharedValue(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [aiInsights, setAiInsights] = useState<InsightItem[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Store data
  const tasks = useTaskStore((state) => state.tasks);
  const completeTask = useTaskStore((state) => state.completeTask);

  // Habit store
  const habits = useHabitStore((state) => state.habits);
  const habitLogs = useHabitStore((state) => state.logs);
  const logHabit = useHabitStore((state) => state.logHabit);

  // Progress store
  const progress = useProgressStore((state) => state.progress);
  const addXP = useProgressStore((state) => state.addXP);

  // Focus store
  const startFocusSession = useFocusStore((state) => state.startSession);
  const endFocusSession = useFocusStore((state) => state.endSession);
  const currentFocusSession = useFocusStore((state) => state.currentSession);
  const getTodayFocusMinutes = useFocusStore((state) => state.getTodayFocusMinutes);

  // Timeline store
  const timelineBlocks = useTimelineStore((state) => state.blocks);
  const selectedTimelineDay = useTimelineStore((state) => state.selectedDay);
  const fetchTimelineBlocks = useTimelineStore((state) => state.fetchBlocks);
  const setTimelineDay = useTimelineStore((state) => state.setSelectedDay);

  // Current time for timeline
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // Fetch timeline blocks on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (!selectedTimelineDay) {
      setTimelineDay(today);
    }
    fetchTimelineBlocks(selectedTimelineDay || today);
  }, [fetchTimelineBlocks, selectedTimelineDay, setTimelineDay]);

  // Derived data: today's habits with logs (defined early because used in useEffect below)
  const todayHabits = useMemo((): HabitWithLogs[] => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const todayStr = today.toISOString().split('T')[0];

    return habits
      .filter((h) => !h.archivedAt && h.daysOfWeek.includes(dayOfWeek))
      .map((habit) => {
        const logs = habitLogs.filter((l) => l.habitId === habit.id);
        const todayLog = logs.find((l) => l.date === todayStr);
        return { ...habit, logs, todayLog };
      });
  }, [habits, habitLogs]);

  // Derived data: today's tasks
  const pendingTasks = useMemo((): Task[] => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return tasks.filter((t) => {
      if (t.status === 'done') return false;
      if (!t.dueDate && !t.scheduledDate) return false;
      const dateStr = (t.dueDate || t.scheduledDate || '').split('T')[0];
      return dateStr === todayStr || dateStr < todayStr; // Include overdue
    });
  }, [tasks]);

  // Fetch AI insights
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoadingInsights(true);
        
        // Calculate user stats
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const completedTasksToday = tasks.filter(
          (t) => t.status === 'done' && t.completedAt?.startsWith(todayStr)
        ).length;
        
        const habitsCompletedToday = todayHabits.filter(
          (h) => h.todayLog?.completed
        ).length;
        
        const overdueTasks = tasks.filter(
          (t) => t.dueDate && new Date(t.dueDate) < today && t.status !== 'done'
        ).length;
        
        const currentStreak = progress?.currentStreak || 0;
        
        // Get focus minutes from focus store
        const focusMinutes = getTodayFocusMinutes();
        
        // Determine time of day
        const hour = today.getHours();
        const timeOfDay =
          hour >= 5 && hour < 12
            ? 'morning'
            : hour >= 12 && hour < 17
            ? 'afternoon'
            : hour >= 17 && hour < 21
            ? 'evening'
            : 'night';

        const insights = await getInsights({
          tasksCompleted: completedTasksToday,
          focusMinutes,
          habitsCompleted: habitsCompletedToday,
          currentStreak,
          overdueTaskCount: overdueTasks,
          timeOfDay,
        });

        setAiInsights(insights);
      } catch {
        // Silently handle - getInsights has its own fallback
        // Keep empty array if even fallback fails
        setAiInsights([]);
      } finally {
        setIsLoadingInsights(false);
      }
    };

    // Fetch insights when tasks or habits change
    fetchInsights();
  }, [tasks, todayHabits, progress, getTodayFocusMinutes]);

  // Derived data: timeline blocks with tasks
  const blocksForSelectedDay = useMemo((): TimelineBlockWithTask[] => {
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const day = selectedTimelineDay || new Date().toISOString().split('T')[0];
    return [...timelineBlocks]
      .filter((b) => b.day === day)
      .sort((a, b) => a.order - b.order || a.startTime.localeCompare(b.startTime))
      .map((block) => ({
        ...block,
        task: block.taskId ? taskMap.get(block.taskId) : undefined,
      }));
  }, [timelineBlocks, tasks, selectedTimelineDay]);

  // Current timeline block
  const currentTimelineBlock = useMemo(() => {
    return blocksForSelectedDay.find((block) => {
      const start = new Date(block.startTime).getTime();
      const end = new Date(block.endTime).getTime();
      const current = now.getTime();
      return start <= current && current <= end;
    });
  }, [blocksForSelectedDay, now]);

  // Next up item: current block, next block, or top task
  const nextUpItem = useMemo((): NextUpItem => {
    // If there's a current block, show it
    if (currentTimelineBlock) {
      const start = new Date(currentTimelineBlock.startTime);
      const end = new Date(currentTimelineBlock.endTime);
      const timeLabel = `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
      return {
        kind: 'block',
        title: currentTimelineBlock.title,
        subtitle: currentTimelineBlock.task?.title,
        timeLabel,
        isCurrent: true,
        color: currentTimelineBlock.color,
      };
    }

    // If there's a next block coming up, show it
    const upcomingBlock = blocksForSelectedDay.find((block) => {
      const start = new Date(block.startTime).getTime();
      return start > now.getTime();
    });

    if (upcomingBlock) {
      const start = new Date(upcomingBlock.startTime);
      const end = new Date(upcomingBlock.endTime);
      const timeLabel = `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
      return {
        kind: 'block',
        title: upcomingBlock.title,
        subtitle: upcomingBlock.task?.title,
        timeLabel,
        isCurrent: false,
        color: upcomingBlock.color,
      };
    }

    // Fall back to top task
    const topTask = pendingTasks[0];
    if (topTask) {
      return {
        kind: 'task',
        title: topTask.title,
        priority: topTask.priority,
        subtaskCount: topTask.subtasks?.length,
        estimateMinutes: topTask.estimatedMinutes,
        dueLabel: topTask.dueDate ? 'Due today' : undefined,
        isCompleted: topTask.status === 'done',
      };
    }

    // Empty state
    return {
      kind: 'empty',
      title: 'All caught up!',
      message: 'Add a task or plan some time blocks.',
    };
  }, [currentTimelineBlock, blocksForSelectedDay, pendingTasks, now]);

  // Focus timer remaining
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  useEffect(() => {
    if (!currentFocusSession) {
      setRemainingSeconds(null);
      return;
    }

    const tick = () => {
      const start = new Date(currentFocusSession.startTime).getTime();
      const planned = (currentFocusSession.plannedDuration || 0) * 60;
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setRemainingSeconds(Math.max(planned - elapsed, 0));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [currentFocusSession]);

  // Handlers
  const handleTaskComplete = useCallback(async (taskId: string) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const result = await completeTask(taskId);
    await addXP(result.xpEarned, 'task_complete', 'Completed a task', taskId);
    setShowCelebration(true);
  }, [completeTask, addXP]);

  const handleHabitToggle = useCallback(async (habitId: string) => {
    const habit = todayHabits.find((h) => h.id === habitId);
    if (!habit) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const today = new Date().toISOString().split('T')[0];
    const isCompleted = habit.todayLog?.completed;

    const result = await logHabit({
      habitId,
      date: today,
      completed: !isCompleted,
    });

    if (!isCompleted) {
      await addXP(result.xpEarned, 'habit_log', 'Logged a habit', habitId);
      setShowCelebration(true);
    }
  }, [todayHabits, logHabit, addXP]);

  const handleStartFocusForBlock = useCallback((block: TimelineBlockWithTask) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const durationMinutes = Math.max(
      1,
      Math.round(
        (new Date(block.endTime).getTime() - new Date(block.startTime).getTime()) / 60000
      )
    );
    startFocusSession({
      taskId: block.taskId,
      taskDescription: block.title,
      plannedDuration: durationMinutes,
      timelineBlockId: block.id,
      sessionType: block.type === 'focus' ? 'deep_work' : 'pomodoro',
      breakDuration: 5,
      longBreakDuration: 15,
    });
  }, [startFocusSession]);

  const handleStartFocusForNextUp = useCallback(() => {
    if (nextUpItem.kind === 'block') {
      const block = currentTimelineBlock || blocksForSelectedDay.find(b => b.title === nextUpItem.title);
      if (block) handleStartFocusForBlock(block);
    } else if (nextUpItem.kind === 'task') {
      router.push('/focus/setup');
    }
  }, [nextUpItem, currentTimelineBlock, blocksForSelectedDay, handleStartFocusForBlock, router]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const backgroundGradient = theme.isDark
    ? [theme.palette.gray[900], theme.palette.gray[800], theme.palette.gray[700]] as const
    : [adhdPalette.grayNurse, '#F0F7F6', colors.gray[100]] as const;

  const dayLabel = new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Celebration particles */}
      <ParticleExplosion
        visible={showCelebration}
        onComplete={() => setShowCelebration(false)}
        type="stars"
        particleCount={25}
      />

      {/* Background gradient */}
      <LinearGradient colors={backgroundGradient} style={styles.backgroundGradient} />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.text.secondary }]}>
              {getTimeOfDayGreeting()}
            </Text>
            <Text style={[styles.title, { color: theme.text.primary }]}>
              Let's focus
            </Text>
          </View>
          <TouchableOpacity
            style={styles.levelBadge}
            onPress={() => router.push('/analytics')}
            activeOpacity={0.8}
            accessibilityLabel={`Level ${progress?.level || 1}`}
          >
            <LinearGradient
              colors={[...gradients.focus] as [string, string, ...string[]]}
              style={styles.levelGradient}
            >
              <Text style={styles.levelText}>{progress?.level || 1}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Next Up Card */}
        <View style={styles.nextUpSection}>
          <NextUpCard
            item={nextUpItem}
            onPressItem={() => {
              if (nextUpItem.kind === 'task') {
                const task = pendingTasks[0];
                if (task) router.push(`/task/${task.id}`);
              } else if (nextUpItem.kind === 'block') {
                router.push('/planning');
              }
            }}
            onToggleComplete={() => {
              if (nextUpItem.kind === 'task') {
                const task = pendingTasks[0];
                if (task) handleTaskComplete(task.id);
              }
            }}
            onStartFocus={handleStartFocusForNextUp}
            onLater={() => router.push('/tasks')}
          />
        </View>

        {/* Timeline Preview */}
        <TimelinePreview
          dayLabel={dayLabel}
          blocks={blocksForSelectedDay}
          now={now}
          currentBlockId={currentTimelineBlock?.id}
          maxItems={3}
          onPressBlock={handleStartFocusForBlock}
          onPressEdit={() => router.push('/planning')}
          onPressAdd={() => router.push('/planning')}
        />

        {/* Tasks Preview */}
        <TasksPreview
          tasks={pendingTasks.slice(0, 4)}
          totalCount={pendingTasks.length}
          onPressTask={(task) => router.push(`/task/${task.id}`)}
          onCompleteTask={handleTaskComplete}
          onSeeAll={() => router.push('/tasks')}
          onAddTask={() => router.push('/task/create')}
        />

        {/* Habits Preview */}
        <HabitsPreview
          habits={todayHabits}
          windowDays={7}
          onToggleHabit={handleHabitToggle}
          onSeeAll={() => router.push('/habits')}
          onAddHabit={() => router.push('/habit/create')}
        />

        {/* AI Insights Preview */}
        {!isLoadingInsights && aiInsights.length > 0 && (
          <InsightsPreview
            insights={aiInsights}
            maxItems={2}
            onPressInsight={(insight) => {
              // Handle insight actions
              if (insight.actionType === 'start_focus') {
                router.push('/focus/setup');
              } else if (insight.actionType === 'view_tasks') {
                router.push('/tasks');
              } else {
                console.log('Insight:', insight);
              }
            }}
            onSeeAll={() => router.push('/analytics')}
          />
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>

      {/* Quick Actions Bar */}
      <View style={styles.quickActionsContainer}>
        <QuickActionsBar
          onQuickCapture={() => router.push('/inbox')}
          onCreateTask={() => router.push('/task/create')}
          onPlanDay={() => router.push('/planning')}
          onBreakDown={() => router.push('/tools/magic')}
          onOpenTools={() => router.push('/tools')}
        />
      </View>

      {/* Focus timer overlay */}
      {currentFocusSession && (
        <View style={styles.focusOverlay}>
          <View style={styles.focusOverlayContent}>
            <Text style={[styles.focusOverlayLabel, { color: theme.text.muted }]}>Focusing on</Text>
            <Text style={[styles.focusOverlayTitle, { color: theme.text.primary }]} numberOfLines={1}>
              {currentFocusSession.taskDescription}
            </Text>
            <Text style={[styles.focusOverlayTime, { color: theme.palette.primary[500] }]}>
              {formatDuration(remainingSeconds)}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.focusOverlayButton, { backgroundColor: theme.palette.danger[500] }]}
            onPress={async () => {
              await endFocusSession({ completedTask: currentFocusSession.completedTask });
            }}
          >
            <Text style={styles.focusOverlayButtonText}>End</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adhdPalette.grayNurse,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 56,
    paddingBottom: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  levelBadge: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  levelGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nextUpSection: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  quickActionsContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
  },
  focusOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  focusOverlayContent: {
    flex: 1,
    marginRight: 12,
  },
  focusOverlayLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  focusOverlayTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  focusOverlayTime: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  focusOverlayButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  focusOverlayButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  bottomSpacing: {
    height: 60,
  },
});
