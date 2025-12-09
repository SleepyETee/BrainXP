import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Header } from '../../src/components/common/Header';
import { Button } from '../../src/components/ui/Button';
import { WeeklyProgress } from '../../src/components/habits/WeeklyProgress';
import { StreakDisplay } from '../../src/components/habits/StreakDisplay';
import { useHabitStore } from '../../src/stores/habitStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { colors } from '../../src/theme/colors';
import { calculateFlexibleStreak } from '../../src/utils/streaks';

export default function HabitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // Only select raw data to avoid selector issues
  const habits = useHabitStore((state) => state.habits);
  const logs = useHabitStore((state) => state.logs);
  const addXP = useProgressStore((state) => state.addXP);

  // Compute derived data locally to avoid infinite re-renders
  const habit = useMemo(() => {
    const foundHabit = habits.find((h) => h.id === id);
    if (!foundHabit) return undefined;

    const habitLogs = logs.filter((l) => l.habitId === id);
    const today = new Date().toISOString().split('T')[0];
    const todayLog = habitLogs.find((l) => l.date === today);

    return { ...foundHabit, logs: habitLogs, todayLog };
  }, [habits, logs, id]);

  if (!habit) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Habit Not Found" showBack />
        <View style={styles.notFound}>
          <Text style={styles.notFoundEmoji}>🔍</Text>
          <Text style={styles.notFoundText}>This habit could not be found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCompletedToday = habit.todayLog?.completed;
  const flexibleStreak = calculateFlexibleStreak(
    habit.logs?.map((l) => l.date) || [],
    14
  );

  const handleToggle = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    await Haptics.impactAsync(
      isCompletedToday
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium
    );

    // Use getState() to get action without selector subscription
    const result = await useHabitStore.getState().logHabit({
      habitId: habit.id,
      date: today,
      completed: !isCompletedToday,
    });

    if (!isCompletedToday) {
      await addXP(result.xpEarned, 'habit_log', `Completed: ${habit.name}`, habit.id);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Archive Habit?',
      `Are you sure you want to archive "${habit.name}"? You can restore it later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            // Use getState() to get action without selector subscription
            await useHabitStore.getState().deleteHabit(habit.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={habit.name}
        showBack
        rightAction={{
          icon: '⚙️',
          onPress: () => {
            // TODO: Navigate to edit screen
          },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={[styles.heroCard, { backgroundColor: habit.color || colors.primary[500] }]}>
          <Text style={styles.heroIcon}>{habit.icon || '⭐'}</Text>
          <Text style={styles.heroTitle}>{habit.name}</Text>
          
          <TouchableOpacity
            style={[
              styles.toggleButton,
              isCompletedToday && styles.toggleButtonCompleted,
            ]}
            onPress={handleToggle}
          >
            <Text style={[
              styles.toggleButtonText,
              isCompletedToday && styles.toggleButtonTextCompleted,
            ]}>
              {isCompletedToday ? '✓ Completed Today' : 'Mark Complete'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <StreakDisplay
            currentStreak={habit.currentStreak || 0}
            flexibleStreak={flexibleStreak}
            showFlexible
            size="lg"
          />
        </View>

        {/* Weekly Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Week</Text>
          <WeeklyProgress
            logs={habit.logs || []}
            color={habit.color}
          />
        </View>

        {/* Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Frequency</Text>
            <Text style={styles.detailValue}>
              {habit.frequencyType === 'daily' 
                ? 'Every day' 
                : `${habit.daysOfWeek?.length || 0} days/week`}
            </Text>
          </View>

          {habit.anchorDescription && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Linked to</Text>
              <Text style={styles.detailValue}>{habit.anchorDescription}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Started</Text>
            <Text style={styles.detailValue}>
              {new Date(habit.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {habit.completionRate !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Completion rate</Text>
              <Text style={styles.detailValue}>
                {Math.round(habit.completionRate * 100)}%
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Archive Habit"
            variant="outline"
            onPress={handleDelete}
            fullWidth
          />
        </View>
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
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  notFoundEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.gray[500],
  },
  heroCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  toggleButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  toggleButtonCompleted: {
    backgroundColor: '#FFFFFF',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toggleButtonTextCompleted: {
    color: colors.success[600],
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  detailLabel: {
    fontSize: 14,
    color: colors.gray[500],
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[800],
  },
  actions: {
    marginTop: 8,
  },
});

