// BrainXP Home Screen - ADHD-Friendly Visual Experience
// Colors optimized for: calm focus, reduced overstimulation, clear organization
import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  FadeInDown,
  FadeInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTaskStore } from '../../src/stores/taskStore';
import { useHabitStore } from '../../src/stores/habitStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { useFocusStore } from '../../src/stores/focusStore';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientCard } from '../../src/components/ui/GradientCard';
import { AnimatedButton } from '../../src/components/ui/AnimatedButton';
import { AICoach } from '../../src/components/ai/AICoach';
import { AIInsightsCard, InsightItem } from '../../src/components/ai/AIInsightsCard';
import { ParticleExplosion } from '../../src/components/gamification/ParticleExplosion';
import { colors, gradients, shadows, semanticColors, adhdPalette } from '../../src/theme/colors';
import { springConfigs } from '../../src/utils/animations';
import { getTimeOfDayGreeting } from '../../src/utils/date';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mock AI insights - will be replaced with real API data
const MOCK_INSIGHTS: InsightItem[] = [
  {
    id: '1',
    type: 'productivity',
    icon: '📊',
    title: 'Peak Focus Time',
    message: 'Your best focus hours are 9-11 AM. Consider scheduling important tasks then!',
    actionLabel: 'Schedule Now',
  },
  {
    id: '2',
    type: 'encouragement',
    icon: '💪',
    title: "You're On Fire!",
    message: "3-day streak! You're building great momentum. Keep it up!",
  },
  {
    id: '3',
    type: 'suggestion',
    icon: '💡',
    title: 'Try Body Doubling',
    message: 'Working alongside others can boost focus. Try a virtual coworking session!',
    actionLabel: 'Learn More',
  },
];

const StatCard: React.FC<{
  emoji: string;
  value: string | number;
  label: string;
  gradient: keyof typeof gradients;
  delay: number;
  onPress?: () => void;
}> = ({ emoji, value, label, gradient, delay, onPress }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, springConfigs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfigs.bouncy);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={[styles.statCard, animatedStyle]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.statCardInner}
      >
        <LinearGradient
          colors={[`${gradients[gradient][0]}15`, `${gradients[gradient][1]}25`]}
          style={styles.statGradient}
        >
          <Text style={styles.statEmoji}>{emoji}</Text>
          <Text style={[styles.statValue, { color: gradients[gradient][0] }]}>
            {value}
          </Text>
          <Text style={styles.statLabel}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const TaskPreviewCard: React.FC<{
  task: { id: string; title: string; priority: string; dueDate?: string };
  onPress: () => void;
  onComplete: () => void;
  index: number;
}> = ({ task, onPress, onComplete, index }) => {
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(1);

  const priorityColor = semanticColors.priority[task.priority as keyof typeof semanticColors.priority] || colors.gray[400];

  const handleComplete = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    checkScale.value = withSpring(1.3, springConfigs.wobbly);
    setTimeout(() => {
      checkScale.value = withSpring(1, springConfigs.gentle);
      onComplete();
    }, 200);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <Animated.View entering={FadeInRight.delay(index * 80).springify()}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, springConfigs.snappy);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, springConfigs.bouncy);
        }}
        activeOpacity={1}
      >
        <Animated.View style={[styles.taskCard, shadows.md, animatedStyle]}>
          <TouchableOpacity onPress={handleComplete}>
            <Animated.View style={[styles.taskCheckbox, checkAnimatedStyle]}>
              <View
                style={[styles.taskCheckboxInner, { borderColor: priorityColor }]}
              />
            </Animated.View>
          </TouchableOpacity>
          <View style={styles.taskContent}>
            <Text style={styles.taskTitle} numberOfLines={1}>
              {task.title}
            </Text>
            {task.dueDate && (
              <Text style={styles.taskDue}>Due today</Text>
            )}
          </View>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const HabitChip: React.FC<{
  habit: { id: string; name: string; icon?: string; todayLog?: { completed: boolean } };
  onToggle: () => void;
  index: number;
}> = ({ habit, onToggle, index }) => {
  const scale = useSharedValue(1);
  const isCompleted = habit.todayLog?.completed;

  const handleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(1.1, springConfigs.wobbly);
    setTimeout(() => {
      scale.value = withSpring(1, springConfigs.gentle);
      onToggle();
    }, 150);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 60).springify()}>
      <TouchableOpacity onPress={handleToggle} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.habitChip,
            isCompleted && styles.habitChipCompleted,
            animatedStyle,
          ]}
        >
          <Text style={styles.habitIcon}>{habit.icon || '⭐'}</Text>
          <Text
            style={[styles.habitName, isCompleted && styles.habitNameCompleted]}
            numberOfLines={1}
          >
            {habit.name}
          </Text>
          {isCompleted && <Text style={styles.habitCheck}>✓</Text>}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const [showCoach, setShowCoach] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  // Store data - only select raw data to avoid selector issues
  const tasks = useTaskStore((state) => state.tasks);
  const completeTask = useTaskStore((state) => state.completeTask);

  // Compute derived task data locally
  const todayTasks = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return tasks.filter((t) => {
      if (t.status === 'done') return false;
      if (!t.dueDate) return false;
      const dueDate = t.dueDate.split('T')[0];
      return dueDate === todayStr;
    });
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return tasks.filter((t) => {
      if (t.status === 'done') return false;
      if (!t.dueDate) return false;
      const dueDate = t.dueDate.split('T')[0];
      return dueDate < todayStr;
    });
  }, [tasks]);

  // Memoize pendingTasks to prevent unnecessary re-renders
  const pendingTasks = useMemo(() => {
    return todayTasks.filter((t) => t.status !== 'done');
  }, [todayTasks]);

  // Habit store - only select raw data
  const habits = useHabitStore((state) => state.habits);
  const habitLogs = useHabitStore((state) => state.logs);
  const logHabit = useHabitStore((state) => state.logHabit);

  // Compute derived habit data locally
  const todayHabits = useMemo(() => {
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

  const completedHabitsCount = todayHabits.filter((h) => h.todayLog?.completed).length;

  // Progress store - only select raw data
  const progress = useProgressStore((state) => state.progress);
  const addXP = useProgressStore((state) => state.addXP);

  // Compute level progress locally
  const levelProgress = useMemo(() => {
    const xpForCurrentLevel = (level: number) => Math.floor(100 * Math.pow(1.5, level - 1));
    const totalXP = progress?.totalXp ?? 0;
    let level = 1;
    let xpRemaining = totalXP;
    while (xpRemaining >= xpForCurrentLevel(level)) {
      xpRemaining -= xpForCurrentLevel(level);
      level++;
    }
    const currentLevelXP = xpForCurrentLevel(level);
    return {
      level,
      currentXP: xpRemaining,
      requiredXP: currentLevelXP,
      progress: currentLevelXP > 0 ? (xpRemaining / currentLevelXP) * 100 : 0,
    };
  }, [progress]);

  // Focus store - only select raw data
  const focusSessions = useFocusStore((state) => state.sessions);
  const focusPreferences = useFocusStore((state) => state.preferences);

  // Compute today's focus minutes locally
  const todayFocusMinutes = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return focusSessions
      .filter((s) => {
        const sessionDate = s.startTime?.split('T')[0];
        return sessionDate === today && !s.isActive && s.endTime;
      })
      .reduce((sum, s) => sum + (s.actualDuration || 0), 0);
  }, [focusSessions]);

  const focusGoal = focusPreferences.dailyGoalMinutes;
  const focusProgress = Math.min((todayFocusMinutes / focusGoal) * 100, 100);

  // Generate greeting message
  const getCoachMessage = useCallback(() => {
    const greeting = getTimeOfDayGreeting();
    const pendingCount = pendingTasks.length;
    const overdueCount = overdueTasks.length;

    if (overdueCount > 0) {
      return `${greeting}! You have ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}. Let's tackle them together - pick the smallest one first!`;
    }
    if (pendingCount === 0) {
      return `${greeting}! All caught up! 🎉 Great job staying on top of things. How about starting a focus session or reviewing your habits?`;
    }
    if (pendingCount <= 3) {
      return `${greeting}! You have ${pendingCount} task${pendingCount > 1 ? 's' : ''} for today. Totally manageable! Which one feels easiest to start with?`;
    }
    return `${greeting}! ${pendingCount} tasks on your plate. Remember: you don't have to do them all at once. Start with just one! 💪`;
  }, [pendingTasks, overdueTasks]);

  const handleTaskComplete = async (taskId: string) => {
    const result = await completeTask(taskId);
    await addXP(result.xpEarned, 'task_complete', 'Completed a task', taskId);
    setShowCelebration(true);
  };

  const handleHabitToggle = async (habitId: string) => {
    const habit = todayHabits.find((h) => h.id === habitId);
    if (!habit) return;

    const today = new Date().toISOString().split('T')[0];
    const isCompleted = habit.todayLog?.completed;

    const result = await logHabit({
      habitId,
      date: today,
      completed: !isCompleted,
    });

    if (!isCompleted) {
      await addXP(result.xpEarned, 'habit_log', 'Logged a habit', habitId);
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.95],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Celebration particles */}
      <ParticleExplosion
        visible={showCelebration}
        onComplete={() => setShowCelebration(false)}
        type="stars"
        particleCount={25}
      />

      {/* Background gradient - ADHD-friendly calming tones */}
      <LinearGradient
        colors={[adhdPalette.grayNurse, '#F0F7F6', colors.gray[100]] as const}
        style={styles.backgroundGradient}
      />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <View>
            <Text style={styles.greeting}>{getTimeOfDayGreeting()}</Text>
            <Text style={styles.title}>Ready to crush it? 🚀</Text>
          </View>
          <TouchableOpacity
            style={styles.levelBadge}
            onPress={() => router.push('/analytics')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[...gradients.focus] as [string, string, ...string[]]}
              style={styles.levelGradient}
            >
              <Text style={styles.levelText}>Lv {progress?.level || 1}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* AI Coach Card */}
        {showCoach && (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <AICoach
              message={getCoachMessage()}
              type={overdueTasks.length > 0 ? 'encouragement' : 'greeting'}
              actionLabel={overdueTasks.length > 0 ? 'View Tasks' : undefined}
              onAction={() => router.push('/tasks')}
              onDismiss={() => setShowCoach(false)}
            />
          </Animated.View>
        )}

        {/* Daily Planning Quick Access - ADHD-friendly morning routine */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <TouchableOpacity
            style={styles.planningCard}
            onPress={() => router.push('/planning')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Plan your day"
            accessibilityHint="Opens the 1-3-5 daily planning screen"
          >
            <LinearGradient
              colors={[colors.secondary[50], colors.secondary[100]] as const}
              style={styles.planningGradient}
            >
              <View style={styles.planningIcon}>
                <Text style={styles.planningEmoji}>📝</Text>
              </View>
              <View style={styles.planningContent}>
                <Text style={styles.planningTitle}>Plan Your Day</Text>
                <Text style={styles.planningSubtitle}>
                  1 big + 3 medium + 5 small tasks
                </Text>
              </View>
              <Text style={styles.planningArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* XP Progress Card - Uses calming Shadow Green */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <GradientCard
            gradient="focus"
            style={styles.xpCard}
            onPress={() => router.push('/analytics')}
            animated={false}
          >
            <View style={styles.xpHeader}>
              <View>
                <Text style={styles.xpLabel}>Level {progress?.level || 1}</Text>
                <Text style={styles.xpValue}>{progress?.totalXp || 0} XP</Text>
              </View>
              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>⭐</Text>
              </View>
            </View>
            <View style={styles.xpProgressContainer}>
              <View style={styles.xpProgressBg}>
                <Animated.View
                  style={[
                    styles.xpProgressFill,
                    { width: `${levelProgress.progress}%` as const },
                  ]}
                />
              </View>
              <Text style={styles.xpToNext}>
                {levelProgress.requiredXP - levelProgress.currentXP} XP to level {levelProgress.level + 1}
              </Text>
            </View>
          </GradientCard>
        </Animated.View>

        {/* Quick Stats - Color-coded for easy recognition */}
        <View style={styles.statsGrid}>
          <StatCard
            emoji="✅"
            value={`${todayTasks.filter((t) => t.status === 'done').length}/${todayTasks.length}`}
            label="Tasks"
            gradient="growth"
            delay={300}
            onPress={() => router.push('/tasks')}
          />
          <StatCard
            emoji="🔄"
            value={`${completedHabitsCount}/${todayHabits.length}`}
            label="Habits"
            gradient="balance"
            delay={350}
            onPress={() => router.push('/habits')}
          />
          <StatCard
            emoji="⏱️"
            value={`${todayFocusMinutes}m`}
            label="Focus"
            gradient="focus"
            delay={400}
            onPress={() => router.push('/focus/setup')}
          />
          <StatCard
            emoji="🔥"
            value={progress?.currentStreak || 0}
            label="Streak"
            gradient="streak"
            delay={450}
            onPress={() => router.push('/analytics')}
          />
        </View>

        {/* Focus Button - Calming teal for sustained attention */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <GradientCard
            gradient="focus"
            style={styles.focusCard}
            onPress={() => router.push('/focus/setup')}
            animated={false}
          >
            <View style={styles.focusContent}>
              <View style={styles.focusIcon}>
                <Text style={styles.focusEmoji}>🎯</Text>
              </View>
              <View style={styles.focusText}>
                <Text style={styles.focusTitle}>Start Focus Session</Text>
                <Text style={styles.focusSubtitle}>
                  {focusProgress >= 100
                    ? 'Daily goal reached! 🎉'
                    : `${Math.round(focusProgress)}% of daily goal`}
                </Text>
              </View>
              <Text style={styles.focusArrow}>→</Text>
            </View>
          </GradientCard>
        </Animated.View>

        {/* AI Insights */}
        <AIInsightsCard
          insights={MOCK_INSIGHTS}
          onInsightAction={(insight) => {
            console.log('Insight action:', insight);
          }}
          onSeeAll={() => router.push('/analytics')}
        />

        {/* Quick Tools - AI-powered productivity */}
        <Animated.View
          entering={FadeInDown.delay(550).springify()}
          style={styles.quickToolsSection}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🤖 Quick Tools</Text>
            <TouchableOpacity onPress={() => router.push('/tools')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.quickToolsRow}>
            <TouchableOpacity
              style={styles.quickTool}
              onPress={() => router.push('/tools/magic')}
            >
              <View style={[styles.quickToolIcon, { backgroundColor: '#764BA215' }]}>
                <Text style={styles.quickToolEmoji}>🪄</Text>
              </View>
              <Text style={styles.quickToolLabel}>Break Down</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickTool}
              onPress={() => router.push('/tools/spoons')}
            >
              <View style={[styles.quickToolIcon, { backgroundColor: colors.primary[50] }]}>
                <Text style={styles.quickToolEmoji}>🥄</Text>
              </View>
              <Text style={styles.quickToolLabel}>Estimate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickTool}
              onPress={() => router.push('/study')}
            >
              <View style={[styles.quickToolIcon, { backgroundColor: colors.success[50] }]}>
                <Text style={styles.quickToolEmoji}>📚</Text>
              </View>
              <Text style={styles.quickToolLabel}>Study</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickTool}
              onPress={() => router.push('/tools/tone')}
            >
              <View style={[styles.quickToolIcon, { backgroundColor: colors.warning[50] }]}>
                <Text style={styles.quickToolEmoji}>✍️</Text>
              </View>
              <Text style={styles.quickToolLabel}>Rewrite</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Overdue Tasks Alert - Soft Zinnwaldite for gentle urgency */}
        {overdueTasks.length > 0 && (
          <Animated.View entering={FadeInDown.delay(600).springify()}>
            <GlassCard
              style={styles.overdueCard}
              backgroundColor={`${adhdPalette.zinnwaldite}15`}
              borderColor={`${adhdPalette.zinnwaldite}40`}
              animated={false}
            >
              <View style={styles.overdueHeader}>
                <Text style={styles.overdueTitle}>⚠️ Needs Attention</Text>
                <View style={styles.overdueBadge}>
                  <Text style={styles.overdueBadgeText}>{overdueTasks.length}</Text>
                </View>
              </View>
              {overdueTasks.slice(0, 2).map((task, index) => (
                <TaskPreviewCard
                  key={task.id}
                  task={task}
                  onPress={() => router.push(`/task/${task.id}`)}
                  onComplete={() => handleTaskComplete(task.id)}
                  index={index}
                />
              ))}
              {overdueTasks.length > 2 && (
                <TouchableOpacity
                  style={styles.viewMore}
                  onPress={() => router.push('/tasks')}
                >
                  <Text style={styles.viewMoreText}>
                    View {overdueTasks.length - 2} more →
                  </Text>
                </TouchableOpacity>
              )}
            </GlassCard>
          </Animated.View>
        )}

        {/* Today's Tasks */}
        <Animated.View
          entering={FadeInDown.delay(700).springify()}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 Today's Tasks</Text>
            <TouchableOpacity onPress={() => router.push('/tasks')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {pendingTasks.length === 0 ? (
            <GlassCard style={styles.emptyCard} animated={false}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>No pending tasks for today</Text>
              <AnimatedButton
                title="+ Add Task"
                variant="outline"
                size="sm"
                onPress={() => router.push('/task/create')}
                style={styles.addButton}
              />
            </GlassCard>
          ) : (
            <View style={styles.tasksList}>
              {pendingTasks.slice(0, 4).map((task, index) => (
                <TaskPreviewCard
                  key={task.id}
                  task={task}
                  onPress={() => router.push(`/task/${task.id}`)}
                  onComplete={() => handleTaskComplete(task.id)}
                  index={index}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* Today's Habits */}
        <Animated.View
          entering={FadeInDown.delay(800).springify()}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔄 Today's Habits</Text>
            <TouchableOpacity onPress={() => router.push('/habits')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {todayHabits.length === 0 ? (
            <GlassCard style={styles.emptyCard} animated={false}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>Start a habit</Text>
              <Text style={styles.emptyText}>Build routines that stick</Text>
              <AnimatedButton
                title="+ Create Habit"
                variant="outline"
                size="sm"
                onPress={() => router.push('/habit/create')}
                style={styles.addButton}
              />
            </GlassCard>
          ) : (
            <View style={styles.habitsGrid}>
              {todayHabits.map((habit, index) => (
                <HabitChip
                  key={habit.id}
                  habit={habit}
                  onToggle={() => handleHabitToggle(habit.id)}
                  index={index}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>

      {/* Floating Action Button */}
      <Animated.View entering={FadeInDown.delay(900).springify()}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/inbox')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[...gradients.focus] as [string, string, ...string[]]}
            style={styles.fabGradient}
          >
            <Text style={styles.fabIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adhdPalette.grayNurse, // Calming neutral base
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 60,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[500],
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray[900],
    letterSpacing: -0.5,
  },
  levelBadge: {
    borderRadius: 24,
    overflow: 'hidden',
    ...shadows.focus, // Calming focus shadow
  },
  levelGradient: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  levelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Planning Card - ADHD-friendly quick access
  planningCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.sm,
  },
  planningGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.secondary[200],
  },
  planningIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  planningEmoji: {
    fontSize: 22,
  },
  planningContent: {
    flex: 1,
  },
  planningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[800],
  },
  planningSubtitle: {
    fontSize: 13,
    color: colors.gray[600],
    marginTop: 2,
  },
  planningArrow: {
    fontSize: 20,
    color: colors.secondary[500],
    fontWeight: '300',
  },

  // XP Card
  xpCard: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  xpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  xpValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  xpBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpBadgeText: {
    fontSize: 28,
  },
  xpProgressContainer: {
    gap: 8,
  },
  xpProgressBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  xpToNext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
  },
  statCardInner: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 14,
    alignItems: 'center',
    borderRadius: 16,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray[500],
    marginTop: 2,
  },

  // Focus Card
  focusCard: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  focusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  focusEmoji: {
    fontSize: 28,
  },
  focusText: {
    flex: 1,
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  focusSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  focusArrow: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },

  // Overdue Card
  overdueCard: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  overdueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  overdueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.danger[600],
    flex: 1,
  },
  overdueBadge: {
    backgroundColor: colors.danger[500],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewMore: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger[500],
  },

  // Section
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[500],
  },

  // Quick Tools
  quickToolsSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  quickToolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickTool: {
    flex: 1,
    alignItems: 'center',
  },
  quickToolIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickToolEmoji: {
    fontSize: 22,
  },
  quickToolLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[600],
    textAlign: 'center',
  },

  // Task Card
  tasksList: {
    gap: 8,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  taskCheckbox: {
    padding: 2,
  },
  taskCheckboxInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
  },
  taskDue: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Habits Grid
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  habitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 8,
    ...shadows.sm,
  },
  habitChipCompleted: {
    backgroundColor: colors.success[50],
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  habitIcon: {
    fontSize: 18,
  },
  habitName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    maxWidth: 100,
  },
  habitNameCompleted: {
    color: colors.success[700],
  },
  habitCheck: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success[500],
  },

  // Empty State
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 16,
  },
  addButton: {
    marginTop: 4,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    ...shadows.xl,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },

  bottomSpacing: {
    height: 40,
  },
});
