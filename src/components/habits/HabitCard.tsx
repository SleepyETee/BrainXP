// Premium Habit Card with Stunning Animations and ML Integration
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Habit } from '../../types/habit';
import { colors, shadows, gradients } from '../../theme/colors';
import { springConfigs } from '../../utils/animations';
import { useMLStore, UserPatterns } from '../../stores/mlStore';

interface MLHabitInsight {
  streakPrediction: number;
  optimalTime: string;
  successProbability: number;
  tip: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  nextMilestone: number | null;
  daysToMilestone: number | null;
}

interface HabitCardProps {
  habit: Habit & { todayLog?: { completed: boolean }; currentStreak?: number };
  todayCompleted?: boolean;
  currentStreak?: number;
  onToggle: () => void;
  onPress: () => void;
  index?: number;
  showStreak?: boolean;
  showMLInsights?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  todayCompleted: todayCompletedProp,
  currentStreak: currentStreakProp,
  onToggle,
  onPress,
  index = 0,
  showStreak = true,
  showMLInsights = true,
}) => {
  // ML Store integration
  const { patterns, isLoadingPatterns } = useMLStore();
  const [mlInsight, setMLInsight] = useState<MLHabitInsight | null>(null);

  // Support both prop patterns
  const todayCompleted = todayCompletedProp ?? habit.todayLog?.completed ?? false;
  const currentStreak = currentStreakProp ?? habit.currentStreak ?? 0;
  const cardScale = useSharedValue(1);
  const checkScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const mlBadgeScale = useSharedValue(0);

  // Animate ML badge when insights are ready
  useEffect(() => {
    if (mlInsight && showMLInsights) {
      mlBadgeScale.value = withSpring(1, springConfigs.bouncy);
    }
  }, [mlInsight, showMLInsights]);

  const handleToggle = async () => {
    await Haptics.impactAsync(
      todayCompleted 
        ? Haptics.ImpactFeedbackStyle.Light 
        : Haptics.ImpactFeedbackStyle.Medium
    );

    if (!todayCompleted) {
      // Celebration animation
      checkScale.value = withSequence(
        withSpring(1.4, springConfigs.wobbly),
        withSpring(1, springConfigs.gentle)
      );
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 500 })
      );
    } else {
      checkScale.value = withSequence(
        withSpring(0.8, springConfigs.snappy),
        withSpring(1, springConfigs.gentle)
      );
    }

    onToggle();
  };

  const handlePressIn = () => {
    cardScale.value = withSpring(0.98, springConfigs.snappy);
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, springConfigs.bouncy);
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const mlBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mlBadgeScale.value }],
  }));

  const getStreakGradient = () => {
    if (currentStreak >= 30) return ['#FFD700', '#FFA500'];
    if (currentStreak >= 14) return ['#8B5CF6', '#A78BFA'];
    if (currentStreak >= 7) return ['#10B981', '#34D399'];
    return ['#06B6D4', '#22D3EE'];
  };

  // Calculate next milestone
  const getNextMilestone = useMemo(() => {
    const milestones = [7, 14, 21, 30, 60, 90, 100, 150, 200, 365];
    for (const milestone of milestones) {
      if (currentStreak < milestone) {
        return { milestone, daysAway: milestone - currentStreak };
      }
    }
    return null;
  }, [currentStreak]);

  // Enhanced ML-powered insights generation
  useEffect(() => {
    if (showMLInsights && patterns) {
      const generateInsight = () => {
        // Calculate streak prediction based on patterns and habit history
        const completionRate = habit.completionRate ?? 0.5;
        const bestStreak = habit.bestStreak ?? currentStreak;
        
        // ML-based streak prediction
        const consistencyFactor = patterns.estimationAccuracy > 0.7 ? 1.3 : 1.0;
        const historicalFactor = bestStreak > currentStreak ? 1.2 : 1.0;
        const baseProjection = currentStreak + Math.ceil(7 * completionRate * consistencyFactor);
        const streakPrediction = Math.min(
          Math.round(baseProjection * historicalFactor),
          bestStreak + 14 // Cap at best streak + 2 weeks
        );

        // Get optimal time based on user patterns
        const peakHour = patterns.bestHours?.[0]?.hour ?? 9;
        const formatHour = (h: number) => {
          const period = h >= 12 ? 'PM' : 'AM';
          const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
          return `${displayHour}:00 ${period}`;
        };
        const optimalTime = formatHour(peakHour);

        // Calculate success probability with multiple factors
        const baseProb = todayCompleted ? 0.9 : 0.6;
        const streakBonus = Math.min(currentStreak * 0.015, 0.15);
        const timeOfDayBonus = getTimeOfDayBonus(patterns.peakEnergyTime);
        const consistencyBonus = completionRate * 0.1;
        const successProbability = Math.min(
          baseProb + streakBonus + timeOfDayBonus + consistencyBonus,
          0.98
        );

        // Determine confidence level
        const dataPoints = patterns.bestHours?.length ?? 0;
        const confidenceLevel: 'high' | 'medium' | 'low' = 
          dataPoints >= 10 && patterns.estimationAccuracy > 0.75 ? 'high' :
          dataPoints >= 5 && patterns.estimationAccuracy > 0.5 ? 'medium' : 'low';

        // Generate personalized, contextual tip
        const tip = generatePersonalizedTip(
          patterns,
          currentStreak,
          todayCompleted,
          successProbability,
          habit.name
        );

        // Next milestone tracking
        const nextMilestone = getNextMilestone?.milestone ?? null;
        const daysToMilestone = getNextMilestone?.daysAway ?? null;

        setMLInsight({
          streakPrediction,
          optimalTime,
          successProbability,
          tip,
          confidenceLevel,
          nextMilestone,
          daysToMilestone,
        });
      };

      generateInsight();
    }
  }, [patterns, currentStreak, todayCompleted, showMLInsights, habit, getNextMilestone]);

  // Helper function for time of day bonus
  const getTimeOfDayBonus = (peakTime: string): number => {
    const hour = new Date().getHours();
    const timeMap: Record<string, number[]> = {
      morning: [6, 7, 8, 9, 10, 11],
      afternoon: [12, 13, 14, 15, 16],
      evening: [17, 18, 19, 20],
      night: [21, 22, 23],
    };
    const peakHours = timeMap[peakTime] ?? [];
    return peakHours.includes(hour) ? 0.08 : 0;
  };

  // Generate contextual personalized tips
  const generatePersonalizedTip = (
    patterns: UserPatterns | null,
    streak: number,
    completed: boolean,
    probability: number,
    habitName: string
  ): string => {
    if (completed) {
      if (streak >= 21) return "Habit is becoming automatic! 🧠 Keep reinforcing.";
      if (streak >= 7) return "Great momentum! You're 3x more likely to continue.";
      return "Nice work today! One day closer to making it stick.";
    }

    if (probability > 0.8) {
      return `High chance of success! Best time: ${patterns?.peakEnergyTime ?? 'morning'}`;
    }
    
    if (streak === 0) {
      return "Start small - even 2 minutes counts toward rebuilding.";
    }
    
    if (streak >= 5) {
      return `Don't break the chain! ${streak} days is worth protecting.`;
    }

    const tips = [
      `Stack this with an existing routine for better consistency`,
      `Set a specific trigger to remind yourself`,
      `Your peak energy is ${patterns?.peakEnergyTime ?? 'morning'} - try then!`,
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  // Get confidence indicator color
  const getConfidenceColor = () => {
    if (!mlInsight) return colors.gray[400];
    switch (mlInsight.confidenceLevel) {
      case 'high': return colors.success[500];
      case 'medium': return colors.warning[500];
      case 'low': return colors.gray[400];
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.container, shadows.md, cardStyle]}
      >
        {/* Completed state background */}
        {todayCompleted && (
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.08)', 'rgba(52, 211, 153, 0.12)']}
            style={styles.completedBg}
          />
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{habit.icon || '⭐'}</Text>
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {habit.name}
            </Text>
            {habit.description && (
              <Text style={styles.description} numberOfLines={1}>
                {habit.description}
              </Text>
            )}
          </View>

          {/* Toggle */}
          <Pressable onPress={handleToggle} style={styles.toggleContainer}>
            {/* Glow effect */}
            <Animated.View style={[styles.toggleGlow, glowStyle]}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.6)', 'transparent']}
                style={styles.glowGradient}
              />
            </Animated.View>

            <Animated.View style={checkStyle}>
              <View
                style={[
                  styles.toggle,
                  todayCompleted && styles.toggleCompleted,
                ]}
              >
                {todayCompleted && (
                  <LinearGradient
                    colors={[colors.success[500], colors.success[400]]}
                    style={styles.toggleFill}
                  >
                    <Text style={styles.toggleCheck}>✓</Text>
                  </LinearGradient>
                )}
              </View>
            </Animated.View>
          </Pressable>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Streak */}
          {currentStreak > 0 && (
            <View style={styles.streakContainer}>
              <LinearGradient
                colors={getStreakGradient() as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.streakGradient}
              >
                <Text style={styles.streakIcon}>🔥</Text>
                <Text style={styles.streakText}>{currentStreak} day streak</Text>
              </LinearGradient>
            </View>
          )}

          {/* Frequency */}
          <View style={styles.frequencyBadge}>
            <Text style={styles.frequencyText}>
              {habit.frequency === 'daily' && '📅 Daily'}
              {habit.frequency === 'weekly' && '📆 Weekly'}
              {habit.frequency === 'custom' && `🗓️ ${habit.targetDaysPerWeek}x/week`}
            </Text>
          </View>

          {/* Best streak indicator */}
          {habit.bestStreak && habit.bestStreak > currentStreak && (
            <View style={styles.bestStreakBadge}>
              <Text style={styles.bestStreakText}>
                🏆 Best: {habit.bestStreak}
              </Text>
            </View>
          )}
        </View>

        {/* Enhanced ML Insights Row */}
        {showMLInsights && mlInsight && (
          <Animated.View style={[styles.mlInsightsRow, mlBadgeStyle]}>
            <View style={styles.mlInsightBadge}>
              <View style={[styles.confidenceIndicator, { backgroundColor: getConfidenceColor() }]} />
              <Text style={styles.mlInsightIcon}>🤖</Text>
              <Text style={styles.mlInsightText}>
                {Math.round(mlInsight.successProbability * 100)}% likely
              </Text>
            </View>
            
            {mlInsight.streakPrediction > currentStreak && (
              <View style={styles.mlPredictionBadge}>
                <Text style={styles.mlPredictionIcon}>📈</Text>
                <Text style={styles.mlPredictionText}>
                  {mlInsight.streakPrediction}d potential
                </Text>
              </View>
            )}

            {/* Optimal time badge */}
            <View style={styles.optimalTimeBadge}>
              <Text style={styles.optimalTimeIcon}>⏰</Text>
              <Text style={styles.optimalTimeText}>{mlInsight.optimalTime}</Text>
            </View>
          </Animated.View>
        )}

        {/* Milestone tracker */}
        {showMLInsights && mlInsight?.nextMilestone && currentStreak > 0 && (
          <Animated.View 
            entering={FadeIn.delay(200)}
            style={styles.milestoneContainer}
          >
            <View style={styles.milestoneProgress}>
              <View 
                style={[
                  styles.milestoneProgressFill,
                  { width: `${((currentStreak / mlInsight.nextMilestone) * 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.milestoneText}>
              🎯 {mlInsight.daysToMilestone} days to {mlInsight.nextMilestone}-day milestone
            </Text>
          </Animated.View>
        )}

        {/* ML Tip */}
        {showMLInsights && mlInsight && !todayCompleted && (
          <View style={styles.mlTipContainer}>
            <Text style={styles.mlTipText}>💡 {mlInsight.tip}</Text>
          </View>
        )}

        {/* Weekly progress dots */}
        <View style={styles.weekProgress}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
            const isToday = i === (new Date().getDay() + 6) % 7;
            const isCompleted = i <= (new Date().getDay() + 6) % 7; // Simplified
            
            return (
              <View key={i} style={styles.dayContainer}>
                <View
                  style={[
                    styles.dayDot,
                    isCompleted && todayCompleted && styles.dayDotCompleted,
                    isToday && styles.dayDotToday,
                  ]}
                >
                  {isCompleted && todayCompleted && (
                    <Text style={styles.dayCheck}>✓</Text>
                  )}
                </View>
                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
  },
  completedBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 28,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: colors.gray[500],
  },
  toggleContainer: {
    position: 'relative',
    padding: 4,
  },
  toggleGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    left: -14,
    top: -14,
    borderRadius: 30,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 30,
  },
  toggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  toggleCompleted: {
    borderWidth: 0,
  },
  toggleFill: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCheck: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  streakContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  streakGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
  },
  streakIcon: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  frequencyBadge: {
    backgroundColor: colors.gray[100],
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[600],
  },
  bestStreakBadge: {
    backgroundColor: colors.warning[50],
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  bestStreakText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.warning[700],
  },
  weekProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  dayContainer: {
    alignItems: 'center',
    gap: 4,
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotCompleted: {
    backgroundColor: colors.success[500],
  },
  dayDotToday: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  dayCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray[400],
  },
  dayLabelToday: {
    color: colors.primary[600],
    fontWeight: '700',
  },
  // Enhanced ML Insights styles
  mlInsightsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  mlInsightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
  },
  confidenceIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mlInsightIcon: {
    fontSize: 12,
  },
  mlInsightText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[700],
  },
  mlPredictionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[50],
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
  },
  mlPredictionIcon: {
    fontSize: 12,
  },
  mlPredictionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success[700],
  },
  optimalTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary[50],
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
  },
  optimalTimeIcon: {
    fontSize: 12,
  },
  optimalTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary[700],
  },
  milestoneContainer: {
    marginBottom: 10,
  },
  milestoneProgress: {
    height: 4,
    backgroundColor: colors.gray[100],
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  milestoneProgressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
  milestoneText: {
    fontSize: 11,
    color: colors.gray[600],
    textAlign: 'center',
  },
  mlTipContainer: {
    backgroundColor: colors.warning[50],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  mlTipText: {
    fontSize: 12,
    color: colors.warning[800],
    fontWeight: '500',
  },
});

export default HabitCard;
