// Premium Habit Card with Stunning Animations
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Habit } from '../../types/habit';
import { colors, shadows, gradients } from '../../theme/colors';
import { springConfigs } from '../../utils/animations';

interface HabitCardProps {
  habit: Habit & { todayLog?: { completed: boolean }; currentStreak?: number };
  todayCompleted?: boolean;
  currentStreak?: number;
  onToggle: () => void;
  onPress: () => void;
  index?: number;
  showStreak?: boolean;
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
}) => {
  // Support both prop patterns
  const todayCompleted = todayCompletedProp ?? habit.todayLog?.completed ?? false;
  const currentStreak = currentStreakProp ?? habit.currentStreak ?? 0;
  const cardScale = useSharedValue(1);
  const checkScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

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

  const getStreakGradient = () => {
    if (currentStreak >= 30) return ['#FFD700', '#FFA500'];
    if (currentStreak >= 14) return ['#8B5CF6', '#A78BFA'];
    if (currentStreak >= 7) return ['#10B981', '#34D399'];
    return ['#06B6D4', '#22D3EE'];
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
});

export default HabitCard;
