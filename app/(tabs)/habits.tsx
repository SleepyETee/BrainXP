import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useHabitStore } from '../../src/stores/habitStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { colors } from '../../src/theme/colors';
import { getShortDayNames } from '../../src/utils/date';
import { HabitWithLogs } from '../../src/types/habit';
import { getHabitSummary } from '../../src/services/api/habits';

// Stable date values computed once per day
const getDateInfo = () => {
  const now = new Date();
  return {
    todayStr: now.toISOString().split('T')[0],
    dayOfWeek: now.getDay(),
  };
};

// Streak visualization component
const StreakBadge: React.FC<{
  completed: number;
  total: number;
  percentage: number;
  reduceMotion: boolean;
}> = ({ completed, total, percentage, reduceMotion }) => {
  const scale = useSharedValue(1);
  
  const getStreakColor = () => {
    if (percentage >= 80) return colors.success[500];
    if (percentage >= 50) return colors.warning[500];
    return colors.gray[400];
  };

  const getStreakEmoji = () => {
    if (percentage >= 80) return '🔥';
    if (percentage >= 50) return '⭐';
    return '💪';
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View 
      style={[styles.streakBadge, !reduceMotion && animatedStyle]}
      accessibilityLabel={`${completed} out of ${total} days completed, ${percentage}% success rate`}
    >
      <Text style={styles.streakEmoji}>{getStreakEmoji()}</Text>
      <View style={styles.streakInfo}>
        <Text style={[styles.streakText, { color: getStreakColor() }]}>
          {completed}/{total}
        </Text>
        <Text style={styles.streakLabel}>days</Text>
      </View>
      <View style={[styles.streakProgress, { backgroundColor: colors.gray[200] }]}>
        <View 
          style={[
            styles.streakProgressBar, 
            { width: `${percentage}%`, backgroundColor: getStreakColor() }
          ]} 
        />
      </View>
    </Animated.View>
  );
};

// Weekly calendar view
const WeeklyCalendar: React.FC<{
  habit: HabitWithLogs;
  logs: any[];
}> = ({ habit, logs }) => {
  const today = new Date();
  const weekDays = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const log = logs.find(l => l.date === dateStr);
    const isToday = i === 0;
    const isScheduled = habit.daysOfWeek.includes(date.getDay());
    
    weekDays.push({
      date,
      dateStr,
      dayName: getShortDayNames()[date.getDay()],
      isCompleted: log?.completed || false,
      isToday,
      isScheduled,
    });
  }

  return (
    <View 
      style={styles.weeklyCalendar}
      accessible
      accessibilityLabel="Weekly habit completion"
    >
      {weekDays.map((day, index) => (
        <View 
          key={day.dateStr} 
          style={[
            styles.calendarDay,
            day.isToday && styles.calendarDayToday,
          ]}
          accessibilityLabel={`${day.dayName}: ${day.isCompleted ? 'completed' : day.isScheduled ? 'not completed' : 'not scheduled'}`}
        >
          <Text style={[
            styles.calendarDayName,
            day.isToday && styles.calendarDayNameToday,
          ]}>
            {day.dayName}
          </Text>
          <View style={[
            styles.calendarDot,
            day.isCompleted && styles.calendarDotCompleted,
            !day.isScheduled && styles.calendarDotNotScheduled,
            day.isToday && styles.calendarDotToday,
          ]}>
            {day.isCompleted && <Text style={styles.calendarCheck}>✓</Text>}
          </View>
        </View>
      ))}
    </View>
  );
};

export default function HabitsScreen() {
  const router = useRouter();

  // Accessibility settings
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);
  const hapticFeedback = useSettingsStore((state) => state.settings.hapticFeedback);
  const largeText = useSettingsStore((state) => state.settings.largeText);

  // Use ref for stable date values that don't cause re-renders
  const dateInfoRef = useRef(getDateInfo());
  const { todayStr, dayOfWeek } = dateInfoRef.current;

  // Select raw data from stores
  const habitsData = useHabitStore((state) => state.habits);
  const logsData = useHabitStore((state) => state.logs);

  // Compute derived data locally with useMemo
  const habits = useMemo(() => {
    if (!habitsData) return [];
    return habitsData.filter((h) => !h.archivedAt);
  }, [habitsData]);

  const [summary, setSummary] = useState<{
    totalHabits: number;
    completedToday: number;
    longestStreak: number;
    completionRate: number;
  } | null>(null);

  useEffect(() => {
    getHabitSummary().then(setSummary).catch(() => {});
  }, []);

  const todayHabits = useMemo((): HabitWithLogs[] => {
    if (!habitsData || !logsData) return [];
    
    return habitsData
      .filter((h) => !h.archivedAt && h.daysOfWeek.includes(dayOfWeek))
      .map((habit) => {
        const habitLogs = logsData.filter((l) => l.habitId === habit.id);
        const todayLog = habitLogs.find((l) => l.date === todayStr);
        return { ...habit, logs: habitLogs, todayLog };
      });
  }, [habitsData, logsData, dayOfWeek, todayStr]);

  // Calculate flexible streak locally
  const getFlexibleStreak = useCallback((habitId: string, windowDays = 14) => {
    if (!logsData) return { completed: 0, total: windowDays, percentage: 0, windowDays };
    
    const today = new Date();
    const windowStart = new Date(today);
    windowStart.setDate(windowStart.getDate() - windowDays);

    const completedLogs = logsData.filter((l) => {
      if (l.habitId !== habitId) return false;
      const logDate = new Date(l.date);
      return logDate >= windowStart && logDate <= today && l.completed;
    });

    return {
      completed: completedLogs.length,
      total: windowDays,
      percentage: Math.round((completedLogs.length / windowDays) * 100),
      windowDays,
    };
  }, [logsData]);

  const handleHabitToggle = useCallback(async (habitId: string) => {
    // Get current state directly to avoid stale closure issues
    const currentHabits = useHabitStore.getState().habits;
    const currentLogs = useHabitStore.getState().logs;
    
    const habit = currentHabits.find((h) => h.id === habitId);
    if (!habit) return;

    const todayLog = currentLogs.find((l) => l.habitId === habitId && l.date === todayStr);
    const isCompleted = todayLog?.completed;

    // Haptic feedback
    if (hapticFeedback) {
      Haptics.impactAsync(
        isCompleted 
          ? Haptics.ImpactFeedbackStyle.Light 
          : Haptics.ImpactFeedbackStyle.Medium
      );
    }

    // Accessibility announcement
    AccessibilityInfo.announceForAccessibility(
      isCompleted 
        ? `${habit.name} marked as incomplete` 
        : `${habit.name} completed! Great job!`
    );

    const result = await useHabitStore.getState().logHabit({
      habitId,
      date: todayStr,
      completed: !isCompleted,
    });

    if (!isCompleted && result.xpEarned > 0) {
      await useProgressStore.getState().addXP(result.xpEarned, 'habit_log', 'Logged a habit', habitId);
      
      if (hapticFeedback) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [todayStr, hapticFeedback]);

  // Memoize computed stats
  const { completedCount, totalCount, completionPercentage } = useMemo(() => {
    const completed = todayHabits.filter((h) => h.todayLog?.completed).length;
    const total = todayHabits.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return { completedCount: completed, totalCount: total, completionPercentage: percentage };
  }, [todayHabits]);

  // Dynamic text sizing
  const textScale = largeText ? 1.15 : 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View 
          style={styles.header}
          entering={reduceMotion ? undefined : FadeIn.duration(300)}
        >
          <Text 
            style={[styles.title, { fontSize: 28 * textScale }]} 
            accessibilityRole="header"
          >
            Habits
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/habit/create')}
            accessibilityRole="button"
            accessibilityLabel="Create new habit"
          >
            <Text style={styles.addButtonText}>+ New</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Today's Progress */}
        <Animated.View 
          style={styles.progressCard}
          entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(300)}
          accessible
          accessibilityLabel={`Today's progress: ${completedCount} of ${totalCount} habits completed, ${Math.round(completionPercentage)}%`}
        >
          <Text style={[styles.progressTitle, { fontSize: 14 * textScale }]}>
            Today's Progress
          </Text>
          <View style={styles.progressRow}>
            <Text style={[styles.progressCount, { fontSize: 24 * textScale }]}>
              {completedCount}/{totalCount}
            </Text>
            <View 
              style={styles.progressBarContainer}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: Math.round(completionPercentage) }}
            >
              <View
                style={[
                  styles.progressBar,
                  { width: `${completionPercentage}%` },
                ]}
              />
            </View>
            <Text style={[styles.progressPercent, { fontSize: 16 * textScale }]}>
              {Math.round(completionPercentage)}%
            </Text>
          </View>
          {completedCount === totalCount && totalCount > 0 && (
            <Text style={[styles.allDoneText, { fontSize: 14 * textScale }]}>
              All habits completed! Great job! 🎉
            </Text>
          )}
        </Animated.View>

        {/* Summary */}
        {summary && (
          <Animated.View 
            style={styles.summaryCard}
            entering={reduceMotion ? undefined : FadeInDown.delay(150).duration(300)}
            accessible
            accessibilityLabel={`Summary: ${summary.totalHabits} total habits, ${summary.completedToday} done today, longest streak ${summary.longestStreak} days, ${Math.round(summary.completionRate * 100)}% completion rate`}
          >
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { fontSize: 12 * textScale }]}>Habits</Text>
              <Text style={[styles.summaryValue, { fontSize: 18 * textScale }]}>{summary.totalHabits}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { fontSize: 12 * textScale }]}>Done Today</Text>
              <Text style={[styles.summaryValue, { fontSize: 18 * textScale }]}>{summary.completedToday}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { fontSize: 12 * textScale }]}>Longest Streak</Text>
              <Text style={[styles.summaryValue, { fontSize: 18 * textScale }]}>{summary.longestStreak}🔥</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { fontSize: 12 * textScale }]}>Completion Rate</Text>
              <Text style={[styles.summaryValue, { fontSize: 18 * textScale }]}>
                {Math.round(summary.completionRate * 100)}%
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Today's Habits */}
        <View style={styles.section}>
          <Text 
            style={[styles.sectionTitle, { fontSize: 16 * textScale }]}
            accessibilityRole="header"
          >
            Today
          </Text>
          {todayHabits.length === 0 ? (
            <View 
              style={styles.emptyState}
              accessible
              accessibilityLabel="No habits scheduled for today. Create a habit to start building your routine."
            >
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={[styles.emptyTitle, { fontSize: 18 * textScale }]}>No habits for today</Text>
              <Text style={[styles.emptyText, { fontSize: 14 * textScale }]}>
                Create a habit to start building your routine
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/habit/create')}
                accessibilityRole="button"
                accessibilityLabel="Create Habit"
              >
                <Text style={styles.createButtonText}>Create Habit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.habitsList} accessibilityRole="list">
              {todayHabits.map((habit, index) => {
                const flexStreak = getFlexibleStreak(habit.id);
                return (
                  <Animated.View
                    key={habit.id}
                    entering={reduceMotion ? undefined : FadeInDown.delay(200 + index * 50).duration(300)}
                  >
                    <TouchableOpacity
                      style={[
                        styles.habitCard,
                        habit.todayLog?.completed && styles.habitCardCompleted,
                      ]}
                      onPress={() => handleHabitToggle(habit.id)}
                      onLongPress={() => router.push(`/habit/${habit.id}`)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: habit.todayLog?.completed || false }}
                      accessibilityLabel={`${habit.name}${habit.anchorDescription ? `, ${habit.anchorDescription}` : ''}`}
                      accessibilityHint="Tap to toggle completion, long press to view details"
                    >
                      <View style={styles.habitMain}>
                        <View
                          style={[
                            styles.habitCheckbox,
                            habit.todayLog?.completed && styles.habitCheckboxDone,
                          ]}
                        >
                          {habit.todayLog?.completed && (
                            <Text style={styles.habitCheck}>✓</Text>
                          )}
                        </View>
                        <View style={styles.habitInfo}>
                          <View style={styles.habitTitleRow}>
                            <Text style={styles.habitIcon}>
                              {habit.icon || '⭐'}
                            </Text>
                            <Text
                              style={[
                                styles.habitName,
                                { fontSize: 16 * textScale },
                                habit.todayLog?.completed && styles.habitNameDone,
                              ]}
                            >
                              {habit.name}
                            </Text>
                          </View>
                          {habit.anchorDescription && (
                            <Text 
                              style={[styles.habitAnchor, { fontSize: 12 * textScale }]} 
                              numberOfLines={1}
                            >
                              {habit.anchorDescription}
                            </Text>
                          )}
                          {/* Weekly calendar for each habit */}
                          <WeeklyCalendar 
                            habit={habit} 
                            logs={habit.logs || []} 
                          />
                        </View>
                      </View>
                      <StreakBadge 
                        completed={flexStreak.completed}
                        total={flexStreak.total}
                        percentage={flexStreak.percentage}
                        reduceMotion={reduceMotion}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>

        {/* All Habits */}
        {habits.length > todayHabits.length && (
          <View style={styles.section}>
            <Text 
              style={[styles.sectionTitle, { fontSize: 16 * textScale }]}
              accessibilityRole="header"
            >
              All Habits
            </Text>
            <View style={styles.habitsList} accessibilityRole="list">
              {habits
                .filter((h) => !h.daysOfWeek.includes(dayOfWeek))
                .map((habit) => (
                  <TouchableOpacity
                    key={habit.id}
                    style={styles.habitCardInactive}
                    onPress={() => router.push(`/habit/${habit.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`${habit.name}, scheduled for ${habit.daysOfWeek.map((d) => getShortDayNames()[d]).join(', ')}`}
                  >
                    <Text style={styles.habitIcon}>{habit.icon || '⭐'}</Text>
                    <Text style={[styles.habitNameInactive, { fontSize: 15 * textScale }]}>
                      {habit.name}
                    </Text>
                    <Text style={[styles.habitDays, { fontSize: 12 * textScale }]}>
                      {habit.daysOfWeek.map((d) => getShortDayNames()[d]).join(', ')}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[800],
  },
  addButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressCount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[800],
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.success[500],
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[600],
  },
  allDoneText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.success[600],
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  habitsList: {
    gap: 10,
  },
  habitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  habitCardCompleted: {
    backgroundColor: colors.success[50],
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  habitMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  habitCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  habitCheckboxDone: {
    backgroundColor: colors.success[500],
    borderColor: colors.success[500],
  },
  habitCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  habitInfo: {
    flex: 1,
  },
  habitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  habitIcon: {
    fontSize: 18,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray[800],
  },
  habitNameDone: {
    color: colors.success[700],
  },
  habitAnchor: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
    marginLeft: 26,
  },
  // New streak badge styles
  streakBadge: {
    alignItems: 'center',
    marginLeft: 12,
    minWidth: 60,
  },
  streakEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  streakInfo: {
    alignItems: 'center',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
  },
  streakLabel: {
    fontSize: 10,
    color: colors.gray[400],
  },
  streakProgress: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  streakProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  // Weekly calendar styles
  weeklyCalendar: {
    flexDirection: 'row',
    marginTop: 8,
    marginLeft: 26,
    gap: 6,
  },
  calendarDay: {
    alignItems: 'center',
    padding: 4,
    borderRadius: 6,
  },
  calendarDayToday: {
    backgroundColor: colors.primary[50],
  },
  calendarDayName: {
    fontSize: 9,
    color: colors.gray[400],
    fontWeight: '500',
    marginBottom: 2,
  },
  calendarDayNameToday: {
    color: colors.primary[600],
    fontWeight: '700',
  },
  calendarDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDotCompleted: {
    backgroundColor: colors.success[500],
  },
  calendarDotNotScheduled: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
  },
  calendarDotToday: {
    borderWidth: 2,
    borderColor: colors.primary[400],
  },
  calendarCheck: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  habitCardInactive: {
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  habitNameInactive: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[600],
  },
  habitDays: {
    fontSize: 12,
    color: colors.gray[400],
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  summaryCard: {
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray[100],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '45%',
  },
  summaryLabel: {
    color: colors.gray[500],
    fontSize: 12,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.gray[900],
  },
});
