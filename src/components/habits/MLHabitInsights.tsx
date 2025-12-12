// MLHabitInsights - Personalized ML-Powered Habit Recommendations
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  FadeInDown,
  FadeInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, shadows, gradients } from '../../theme/colors';
import { springConfigs } from '../../utils/animations';
import { useMLStore, UserPatterns } from '../../stores/mlStore';
import { Habit } from '../../types/habit';

interface HabitRecommendation {
  id: string;
  type: 'streak_boost' | 'optimal_time' | 'habit_stack' | 'consistency' | 'celebration';
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  actionLabel?: string;
  data?: {
    habitId?: string;
    suggestedTime?: string;
    stackWith?: string;
    streakGoal?: number;
  };
}

interface MLHabitInsightsProps {
  habits: Habit[];
  onRecommendationPress?: (recommendation: HabitRecommendation) => void;
  onDismiss?: (recommendationId: string) => void;
  maxRecommendations?: number;
  showHeader?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const MLHabitInsights: React.FC<MLHabitInsightsProps> = ({
  habits,
  onRecommendationPress,
  onDismiss,
  maxRecommendations = 3,
  showHeader = true,
}) => {
  const { patterns, fetchPatterns, isLoadingPatterns } = useMLStore();
  const [recommendations, setRecommendations] = useState<HabitRecommendation[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Fetch patterns on mount
  useEffect(() => {
    fetchPatterns().catch(console.error);
  }, []);

  // Generate ML-powered recommendations
  useEffect(() => {
    if (patterns && habits.length > 0) {
      const generated = generateRecommendations(habits, patterns);
      setRecommendations(generated.slice(0, maxRecommendations));
    }
  }, [patterns, habits, maxRecommendations]);

  const generateRecommendations = (
    habits: Habit[],
    patterns: UserPatterns
  ): HabitRecommendation[] => {
    const recs: HabitRecommendation[] = [];

    // Analyze habits for streak boost opportunities
    habits.forEach((habit) => {
      const streak = habit.currentStreak ?? 0;
      const bestStreak = habit.bestStreak ?? 0;

      // Streak milestone approaching
      if (streak > 0 && streak >= bestStreak - 2 && streak < bestStreak) {
        recs.push({
          id: `streak-${habit.id}`,
          type: 'streak_boost',
          title: `Almost a new record! 🔥`,
          description: `"${habit.name}" is ${bestStreak - streak} day${bestStreak - streak > 1 ? 's' : ''} away from your best streak of ${bestStreak}!`,
          icon: '🏆',
          priority: 'high',
          actionLabel: 'View Habit',
          data: { habitId: habit.id, streakGoal: bestStreak },
        });
      }

      // Celebrate milestone streaks
      if ([7, 14, 21, 30, 60, 90, 100].includes(streak)) {
        recs.push({
          id: `celebrate-${habit.id}-${streak}`,
          type: 'celebration',
          title: `${streak} Day Streak! 🎉`,
          description: `Amazing consistency with "${habit.name}"! You're building a powerful habit.`,
          icon: '⭐',
          priority: 'high',
          data: { habitId: habit.id },
        });
      }
    });

    // Optimal time suggestions based on peak energy
    const peakHour = patterns.bestHours?.[0]?.hour;
    if (peakHour !== undefined) {
      const habitsWithoutTime = habits.filter((h) => !h.preferredTime);
      if (habitsWithoutTime.length > 0) {
        const formatTime = (hour: number) => {
          const period = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
          return `${displayHour}:00 ${period}`;
        };

        recs.push({
          id: 'optimal-time-suggestion',
          type: 'optimal_time',
          title: `Best time for habits: ${formatTime(peakHour)}`,
          description: `Based on your patterns, you're most productive around ${patterns.peakEnergyTime}. Schedule important habits then!`,
          icon: '⏰',
          priority: 'medium',
          actionLabel: 'Set Reminders',
          data: { suggestedTime: formatTime(peakHour) },
        });
      }
    }

    // Habit stacking recommendation
    if (habits.length >= 2) {
      const consistentHabits = habits
        .filter((h) => (h.currentStreak ?? 0) >= 7)
        .sort((a, b) => (b.currentStreak ?? 0) - (a.currentStreak ?? 0));

      const strugglingHabits = habits
        .filter((h) => (h.currentStreak ?? 0) < 3 && (h.completionRate ?? 0) < 0.5);

      if (consistentHabits.length > 0 && strugglingHabits.length > 0) {
        recs.push({
          id: 'habit-stack-suggestion',
          type: 'habit_stack',
          title: 'Try Habit Stacking 📚',
          description: `Stack "${strugglingHabits[0].name}" with "${consistentHabits[0].name}" for better consistency!`,
          icon: '🔗',
          priority: 'medium',
          actionLabel: 'Learn More',
          data: {
            habitId: strugglingHabits[0].id,
            stackWith: consistentHabits[0].name,
          },
        });
      }
    }

    // Consistency improvement for struggling habits
    const lowConsistencyHabits = habits.filter(
      (h) => (h.completionRate ?? 0) < 0.4 && (h.currentStreak ?? 0) === 0
    );

    if (lowConsistencyHabits.length > 0) {
      const habit = lowConsistencyHabits[0];
      recs.push({
        id: `consistency-${habit.id}`,
        type: 'consistency',
        title: 'Small Steps Matter 🌱',
        description: `"${habit.name}" could use some love. Try doing just 2 minutes today to restart the streak!`,
        icon: '💪',
        priority: 'low',
        actionLabel: 'Start Now',
        data: { habitId: habit.id },
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  const handleDismiss = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDismissedIds((prev) => new Set(prev).add(id));
    onDismiss?.(id);
  };

  const visibleRecommendations = recommendations.filter(
    (r) => !dismissedIds.has(r.id)
  );

  if (visibleRecommendations.length === 0 && !isLoadingPatterns) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(100).springify()}
      style={styles.container}
    >
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>🤖</Text>
            <Text style={styles.headerTitle}>Smart Insights</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>AI Powered</Text>
          </View>
        </View>
      )}

      {isLoadingPatterns ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Analyzing your patterns...</Text>
        </View>
      ) : (
        <View style={styles.recommendationsList}>
          {visibleRecommendations.map((rec, index) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              index={index}
              onPress={() => onRecommendationPress?.(rec)}
              onDismiss={() => handleDismiss(rec.id)}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
};

interface RecommendationCardProps {
  recommendation: HabitRecommendation;
  index: number;
  onPress?: () => void;
  onDismiss?: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  index,
  onPress,
  onDismiss,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfigs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfigs.bouncy);
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getPriorityGradient = (): [string, string] => {
    switch (recommendation.priority) {
      case 'high':
        return [colors.accent[50], colors.accent[100]];
      case 'medium':
        return [colors.primary[50], colors.primary[100]];
      case 'low':
        return [colors.secondary[50], colors.secondary[100]];
    }
  };

  const getPriorityColor = () => {
    switch (recommendation.priority) {
      case 'high':
        return colors.accent[600];
      case 'medium':
        return colors.primary[600];
      case 'low':
        return colors.secondary[600];
    }
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 100).springify()}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, shadows.sm, cardStyle]}
      >
        <LinearGradient
          colors={getPriorityGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Dismiss button */}
          <Pressable
            onPress={onDismiss}
            style={styles.dismissButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.dismissText}>✕</Text>
          </Pressable>

          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{recommendation.icon}</Text>
            </View>

            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: getPriorityColor() }]}>
                {recommendation.title}
              </Text>
              <Text style={styles.description} numberOfLines={2}>
                {recommendation.description}
              </Text>
            </View>
          </View>

          {recommendation.actionLabel && (
            <View style={styles.actionContainer}>
              <LinearGradient
                colors={[colors.primary[500], colors.primary[600]]}
                style={styles.actionButton}
              >
                <Text style={styles.actionText}>{recommendation.actionLabel}</Text>
              </LinearGradient>
            </View>
          )}
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[800],
  },
  headerBadge: {
    backgroundColor: colors.primary[100],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[700],
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  recommendationsList: {
    gap: 10,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 14,
    position: 'relative',
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dismissText: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: '600',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingRight: 20,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 18,
  },
  actionContainer: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MLHabitInsights;
