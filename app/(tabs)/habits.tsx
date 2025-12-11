import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useHabitStore } from '../../src/stores/habitStore';
import { useProgressStore } from '../../src/stores/progressStore';
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

export default function HabitsScreen() {
  const router = useRouter();

  // Use ref for stable date values that don't cause re-renders
  const dateInfoRef = useRef(getDateInfo());
  const { todayStr, dayOfWeek } = dateInfoRef.current;

  // Select raw data from stores - use getState() for initial values to avoid subscription loops
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

  // Calculate flexible streak locally - memoize per habit
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

    // Use getState() to get action without selector subscription
    const result = await useHabitStore.getState().logHabit({
      habitId,
      date: todayStr,
      completed: !isCompleted,
    });

    if (!isCompleted && result.xpEarned > 0) {
      // Use getState() for addXP too to avoid subscription issues
      await useProgressStore.getState().addXP(result.xpEarned, 'habit_log', 'Logged a habit', habitId);
    }
  }, [todayStr]);

  // Memoize computed stats to prevent recalculation on each render
  const { completedCount, totalCount, completionPercentage } = useMemo(() => {
    const completed = todayHabits.filter((h) => h.todayLog?.completed).length;
    const total = todayHabits.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return { completedCount: completed, totalCount: total, completionPercentage: percentage };
  }, [todayHabits]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Habits</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/habit/create')}
          >
            <Text style={styles.addButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Today's Progress</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressCount}>
              {completedCount}/{totalCount}
            </Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${completionPercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressPercent}>
              {Math.round(completionPercentage)}%
            </Text>
          </View>
          {completedCount === totalCount && totalCount > 0 && (
            <Text style={styles.allDoneText}>
              All habits completed! Great job! 🎉
            </Text>
          )}
        </View>

        {/* Summary */}
        {summary && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Habits</Text>
              <Text style={styles.summaryValue}>{summary.totalHabits}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Done Today</Text>
              <Text style={styles.summaryValue}>{summary.completedToday}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Longest Streak</Text>
              <Text style={styles.summaryValue}>{summary.longestStreak}🔥</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Completion Rate</Text>
              <Text style={styles.summaryValue}>
                {Math.round(summary.completionRate * 100)}%
              </Text>
            </View>
          </View>
        )}

        {/* Today's Habits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          {todayHabits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>No habits for today</Text>
              <Text style={styles.emptyText}>
                Create a habit to start building your routine
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/habit/create')}
              >
                <Text style={styles.createButtonText}>Create Habit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.habitsList}>
              {todayHabits.map((habit) => {
                const flexStreak = getFlexibleStreak(habit.id);
                return (
                  <TouchableOpacity
                    key={habit.id}
                    style={[
                      styles.habitCard,
                      habit.todayLog?.completed && styles.habitCardCompleted,
                    ]}
                    onPress={() => handleHabitToggle(habit.id)}
                    onLongPress={() => router.push(`/habit/${habit.id}`)}
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
                              habit.todayLog?.completed && styles.habitNameDone,
                            ]}
                          >
                            {habit.name}
                          </Text>
                        </View>
                        {habit.anchorDescription && (
                          <Text style={styles.habitAnchor} numberOfLines={1}>
                            {habit.anchorDescription}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.habitStreak}>
                      <Text style={styles.streakText}>
                        {flexStreak.completed}/{flexStreak.total}
                      </Text>
                      <Text style={styles.streakLabel}>days</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* All Habits */}
        {habits.length > todayHabits.length && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Habits</Text>
            <View style={styles.habitsList}>
              {habits
                .filter(
                  (h) => !h.daysOfWeek.includes(dayOfWeek)
                )
                .map((habit) => (
                  <TouchableOpacity
                    key={habit.id}
                    style={styles.habitCardInactive}
                    onPress={() => router.push(`/habit/${habit.id}`)}
                  >
                    <Text style={styles.habitIcon}>{habit.icon || '⭐'}</Text>
                    <Text style={styles.habitNameInactive}>{habit.name}</Text>
                    <Text style={styles.habitDays}>
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
    alignItems: 'center',
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
    alignItems: 'center',
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
  habitStreak: {
    alignItems: 'center',
    marginLeft: 12,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  streakLabel: {
    fontSize: 10,
    color: colors.gray[400],
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
