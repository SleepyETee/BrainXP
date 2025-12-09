import React from 'react';
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

export default function HabitsScreen() {
  const router = useRouter();

  const habits = useHabitStore((state) => state.getActiveHabits());
  const todayHabits = useHabitStore((state) => state.getTodayHabits());
  const logHabit = useHabitStore((state) => state.logHabit);
  const calculateFlexibleStreak = useHabitStore(
    (state) => state.calculateFlexibleStreak
  );

  const addXP = useProgressStore((state) => state.addXP);

  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();

  const handleHabitToggle = async (habitId: string) => {
    const habit = todayHabits.find((h) => h.id === habitId);
    if (!habit) return;

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

  const completedCount = todayHabits.filter((h) => h.todayLog?.completed).length;
  const totalCount = todayHabits.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

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
                const flexStreak = calculateFlexibleStreak(habit.id);
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
});
