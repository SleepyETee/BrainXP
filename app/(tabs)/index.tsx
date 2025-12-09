import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../src/stores/taskStore';
import { useHabitStore } from '../../src/stores/habitStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { useFocusStore } from '../../src/stores/focusStore';
import { TaskCard } from '../../src/components/tasks/TaskCard';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { colors } from '../../src/theme/colors';
import { getTimeOfDayGreeting } from '../../src/utils/date';

export default function HomeScreen() {
  const router = useRouter();

  // Store data
  const todayTasks = useTaskStore((state) => state.getTodayTasks());
  const overdueTasks = useTaskStore((state) => state.getOverdueTasks());
  const completeTask = useTaskStore((state) => state.completeTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);

  const todayHabits = useHabitStore((state) => state.getTodayHabits());
  const logHabit = useHabitStore((state) => state.logHabit);

  const progress = useProgressStore((state) => state.progress);
  const levelProgress = useProgressStore((state) => state.getLevelProgress());
  const addXP = useProgressStore((state) => state.addXP);

  const todayFocusMinutes = useFocusStore((state) => state.getTodayFocusMinutes());
  const focusGoal = useFocusStore((state) => state.preferences.dailyGoalMinutes);

  const completedHabitsCount = todayHabits.filter((h) => h.todayLog?.completed).length;
  const focusProgress = Math.min((todayFocusMinutes / focusGoal) * 100, 100);

  const handleTaskComplete = async (taskId: string) => {
    const result = await completeTask(taskId);
    await addXP(result.xpEarned, 'task_complete', 'Completed a task', taskId);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getTimeOfDayGreeting()}</Text>
            <Text style={styles.name}>Ready to focus?</Text>
          </View>
          <TouchableOpacity
            style={styles.levelBadge}
            onPress={() => router.push('/analytics')}
          >
            <Text style={styles.levelText}>Lv {progress?.level || 1}</Text>
          </TouchableOpacity>
        </View>

        {/* XP Progress */}
        <View style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpTitle}>Level {progress?.level || 1}</Text>
            <Text style={styles.xpAmount}>{progress?.totalXp || 0} XP</Text>
          </View>
          <ProgressBar
            progress={levelProgress}
            variant="primary"
            size="md"
          />
          <Text style={styles.xpToNext}>
            {progress?.xpToNextLevel || 100} XP to next level
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={styles.statValue}>
              {todayTasks.filter((t) => t.status === 'done').length}/{todayTasks.length}
            </Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔄</Text>
            <Text style={styles.statValue}>
              {completedHabitsCount}/{todayHabits.length}
            </Text>
            <Text style={styles.statLabel}>Habits</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⏱️</Text>
            <Text style={styles.statValue}>{todayFocusMinutes}m</Text>
            <Text style={styles.statLabel}>Focus</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{progress?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        {/* Focus Button */}
        <TouchableOpacity
          style={styles.focusButton}
          onPress={() => router.push('/focus/setup')}
        >
          <View style={styles.focusContent}>
            <Text style={styles.focusEmoji}>🎯</Text>
            <View>
              <Text style={styles.focusTitle}>Start Focus Session</Text>
              <Text style={styles.focusSubtitle}>
                {focusProgress >= 100
                  ? 'Daily goal reached! 🎉'
                  : `${Math.round(focusProgress)}% of daily goal`}
              </Text>
            </View>
          </View>
          <Text style={styles.focusArrow}>→</Text>
        </TouchableOpacity>

        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚠️ Needs Attention</Text>
              <Text style={styles.sectionCount}>{overdueTasks.length}</Text>
            </View>
            {overdueTasks.slice(0, 3).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => router.push(`/task/${task.id}`)}
                onComplete={() => handleTaskComplete(task.id)}
                onDelete={() => deleteTask(task.id)}
                compact
              />
            ))}
          </View>
        )}

        {/* Today's Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 Today's Tasks</Text>
            <TouchableOpacity onPress={() => router.push('/tasks')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {todayTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No tasks for today</Text>
              <TouchableOpacity onPress={() => router.push('/task/create')}>
                <Text style={styles.addTaskLink}>+ Add a task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            todayTasks.slice(0, 5).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => router.push(`/task/${task.id}`)}
                onComplete={() => handleTaskComplete(task.id)}
                onDelete={() => deleteTask(task.id)}
                compact
              />
            ))
          )}
        </View>

        {/* Today's Habits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔄 Today's Habits</Text>
            <TouchableOpacity onPress={() => router.push('/habits')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {todayHabits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No habits scheduled</Text>
              <TouchableOpacity onPress={() => router.push('/habit/create')}>
                <Text style={styles.addTaskLink}>+ Create a habit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.habitsGrid}>
              {todayHabits.map((habit) => (
                <TouchableOpacity
                  key={habit.id}
                  style={[
                    styles.habitCard,
                    habit.todayLog?.completed && styles.habitCardCompleted,
                  ]}
                  onPress={() => handleHabitToggle(habit.id)}
                >
                  <Text style={styles.habitIcon}>{habit.icon || '⭐'}</Text>
                  <Text
                    style={[
                      styles.habitName,
                      habit.todayLog?.completed && styles.habitNameCompleted,
                    ]}
                    numberOfLines={1}
                  >
                    {habit.name}
                  </Text>
                  {habit.todayLog?.completed && (
                    <Text style={styles.habitCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB for Quick Capture */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/inbox')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: colors.gray[500],
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[800],
  },
  levelBadge: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  xpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  xpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  xpAmount: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '600',
  },
  xpToNext: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[800],
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray[500],
  },
  focusButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  focusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  focusEmoji: {
    fontSize: 32,
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  focusSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  focusArrow: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[800],
  },
  sectionCount: {
    backgroundColor: colors.danger[100],
    color: colors.danger[600],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 8,
  },
  addTaskLink: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '500',
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  habitCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  habitIcon: {
    fontSize: 20,
  },
  habitName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
  },
  habitNameCompleted: {
    color: colors.success[700],
  },
  habitCheck: {
    fontSize: 16,
    color: colors.success[500],
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});
