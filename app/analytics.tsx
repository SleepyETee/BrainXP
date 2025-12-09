import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Header } from '../src/components/common/Header';
import { ProgressBar } from '../src/components/ui/ProgressBar';
import { BadgeGrid, Badge } from '../src/components/gamification/BadgeGrid';
import { useProgressStore } from '../src/stores/progressStore';
import { useTaskStore } from '../src/stores/taskStore';
import { useHabitStore } from '../src/stores/habitStore';
import { useFocusStore } from '../src/stores/focusStore';
import { colors } from '../src/theme/colors';

// Mock badges for now
const ALL_BADGES: Badge[] = [
  { id: '1', name: 'First Task', description: 'Complete your first task', icon: '🎯', category: 'tasks', rarity: 'common' },
  { id: '2', name: 'Focus Master', description: 'Complete 10 focus sessions', icon: '⏰', category: 'focus', rarity: 'uncommon' },
  { id: '3', name: 'Habit Hero', description: 'Build a 7-day streak', icon: '🔥', category: 'habits', rarity: 'rare' },
  { id: '4', name: 'Early Bird', description: 'Complete a task before 9am', icon: '🌅', category: 'tasks', rarity: 'common' },
  { id: '5', name: 'Deep Work', description: 'Complete a 60+ min session', icon: '🧠', category: 'focus', rarity: 'uncommon' },
  { id: '6', name: 'Consistency King', description: '30-day streak', icon: '👑', category: 'streaks', rarity: 'epic' },
  { id: '7', name: 'Inbox Zero', description: 'Clear your inbox 10 times', icon: '📭', category: 'tasks', rarity: 'uncommon' },
  { id: '8', name: 'Zen Master', description: '50 breathing exercises', icon: '🧘', category: 'wellness', rarity: 'rare' },
  { id: '9', name: 'Legendary Focus', description: '100 hours of focus time', icon: '⚡', category: 'focus', rarity: 'legendary' },
];

// Level thresholds to calculate XP for each level
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000];
const getXPForLevel = (level: number): number => {
  if (level <= 0) return 0;
  if (level <= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[level - 1];
  return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (level - LEVEL_THRESHOLDS.length) * 10000;
};

export default function AnalyticsScreen() {
  // Only select raw data to avoid selector issues
  const progress = useProgressStore((state) => state.progress);
  const tasks = useTaskStore((state) => state.tasks);
  const habits = useHabitStore((state) => state.habits);
  const sessions = useFocusStore((state) => state.sessions);

  // Compute level progress locally
  const levelProgress = useMemo(() => {
    if (!progress) return 0;
    const currentLevelXP = getXPForLevel(progress.level);
    const nextLevelXP = getXPForLevel(progress.level + 1);
    const xpInCurrentLevel = progress.totalXp - currentLevelXP;
    const xpNeededForLevel = nextLevelXP - currentLevelXP;
    return xpNeededForLevel > 0 ? (xpInCurrentLevel / xpNeededForLevel) * 100 : 0;
  }, [progress]);

  // Compute focus stats locally
  const focusStats = useMemo(() => {
    const completedSessions = sessions.filter((s) => s.endTime);
    if (completedSessions.length === 0) {
      return {
        totalSessions: 0,
        totalMinutes: 0,
        averageSessionLength: 0,
        averageQualityRating: 0,
        completionRate: 0,
      };
    }
    const totalMinutes = completedSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0);
    const avgLength = totalMinutes / completedSessions.length;
    const ratings = completedSessions.filter((s) => s.qualityRating).map((s) => s.qualityRating || 0);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const completed = completedSessions.filter((s) => s.completedTask).length;
    return {
      totalSessions: completedSessions.length,
      totalMinutes,
      averageSessionLength: avgLength,
      averageQualityRating: avgRating,
      completionRate: (completed / completedSessions.length) * 100,
    };
  }, [sessions]);

  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const activeHabits = habits.filter((h) => !h.archivedAt).length;
  
  // Mock earned badges based on progress
  const earnedBadgeIds = progress?.tasksCompleted && progress.tasksCompleted > 0 ? ['1'] : [];
  if (progress?.focusMinutes && progress.focusMinutes >= 60) earnedBadgeIds.push('5');
  if (progress?.currentStreak && progress.currentStreak >= 7) earnedBadgeIds.push('3');

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Your Progress" showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Level Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>{progress?.level || 1}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Level {progress?.level || 1}</Text>
              <Text style={styles.xpText}>
                {progress?.totalXp || 0} total XP
              </Text>
            </View>
          </View>
          <View style={styles.progressSection}>
            <ProgressBar
              progress={levelProgress}
              variant="primary"
              size="lg"
            />
            <Text style={styles.progressText}>
              {progress?.xpToNextLevel || 100} XP to next level
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={styles.statValue}>{completedTasks}</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⏱️</Text>
            <Text style={styles.statValue}>{focusStats.totalMinutes || 0}</Text>
            <Text style={styles.statLabel}>Focus Minutes</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔄</Text>
            <Text style={styles.statValue}>{activeHabits}</Text>
            <Text style={styles.statLabel}>Active Habits</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{progress?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📊</Text>
            <Text style={styles.statValue}>{focusStats.totalSessions || 0}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statValue}>{earnedBadgeIds.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>

        {/* Weekly Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>📅 This Week</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {focusStats.totalMinutes || 0}
              </Text>
              <Text style={styles.summaryLabel}>minutes focused</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {completedTasks}
              </Text>
              <Text style={styles.summaryLabel}>tasks completed</Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badgesSection}>
          <BadgeGrid
            badges={ALL_BADGES}
            earnedBadgeIds={earnedBadgeIds}
            onBadgePress={(badge) => {
              console.log('Badge pressed:', badge.name);
            }}
          />
        </View>

        {/* Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.cardTitle}>💡 Insights</Text>
          <View style={styles.insight}>
            <Text style={styles.insightText}>
              {progress?.currentStreak && progress.currentStreak >= 3
                ? `You're on a ${progress.currentStreak}-day streak! Keep it up! 🔥`
                : 'Start a streak by completing tasks or habits daily!'}
            </Text>
          </View>
          <View style={styles.insight}>
            <Text style={styles.insightText}>
              {focusStats.averageSessionLength && focusStats.averageSessionLength > 0
                ? `Your average focus session is ${focusStats.averageSessionLength} minutes.`
                : 'Start a focus session to see your stats!'}
            </Text>
          </View>
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
  levelCard: {
    backgroundColor: colors.primary[500],
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  levelNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  xpText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  progressSection: {
    gap: 8,
  },
  progressText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[800],
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 4,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary[500],
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[200],
    marginHorizontal: 16,
  },
  badgesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
  },
  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  insight: {
    backgroundColor: colors.primary[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: colors.primary[700],
    lineHeight: 20,
  },
});

