import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Button } from '../ui/Button';
import { colors } from '../../theme/colors';
import { formatDuration } from '../../utils/date';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SessionCompleteProps {
  duration: number; // in minutes
  taskDescription: string;
  xpEarned: number;
  onComplete: () => void;
  onTaskComplete?: () => void;
  showTaskComplete?: boolean;
}

// Confetti particle component
const ConfettiParticle: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const randomX = (Math.random() - 0.5) * 200;
    translateY.value = withDelay(delay, withTiming(300, { duration: 2000 }));
    translateX.value = withDelay(delay, withTiming(randomX, { duration: 2000 }));
    rotate.value = withDelay(delay, withTiming(720, { duration: 2000 }));
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(1, { duration: 1500 }),
      withTiming(0, { duration: 300 })
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.confetti, { backgroundColor: color }, animatedStyle]} />
  );
};

// Animated XP counter
const AnimatedXPCounter: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      setDisplayValue(Math.round(value * easedProgress));
      
      if (currentStep >= steps) {
        clearInterval(interval);
        setDisplayValue(value);
        scale.value = withSequence(
          withSpring(1.2, { damping: 10 }),
          withSpring(1, { damping: 15 })
        );
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.xpValue, animatedStyle]}>
      +{displayValue}
    </Animated.Text>
  );
};

export const SessionComplete: React.FC<SessionCompleteProps> = ({
  duration,
  taskDescription,
  xpEarned,
  onComplete,
  onTaskComplete,
  showTaskComplete = true,
}) => {
  const [rating, setRating] = useState<number | undefined>();

  useEffect(() => {
    // Trigger success haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const confettiColors = [
    colors.primary[400],
    colors.success[400],
    colors.warning[400],
    '#FFD700',
    '#FF69B4',
    '#00CED1',
  ];

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[colors.primary[50], '#FFFFFF', colors.success[50]]}
        style={styles.backgroundGradient}
      />

      {/* Confetti */}
      <View style={styles.confettiContainer}>
        {confettiColors.map((color, i) => (
          <ConfettiParticle key={`${i}-1`} delay={i * 100} color={color} />
        ))}
        {confettiColors.map((color, i) => (
          <ConfettiParticle key={`${i}-2`} delay={i * 100 + 50} color={color} />
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Celebration icon */}
        <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.celebrationContainer}>
          <LinearGradient
            colors={[colors.primary[100], colors.success[100]]}
            style={styles.celebrationGradient}
          >
            <Text style={styles.celebration}>🎉</Text>
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.Text entering={FadeInDown.delay(300)} style={styles.title}>
          Focus Session Complete!
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(400)} style={styles.subtitle}>
          Amazing work! You stayed focused.
        </Animated.Text>

        {/* Stats Card */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.statsCard}>
          <LinearGradient
            colors={['#FFFFFF', colors.gray[50]]}
            style={styles.statsCardGradient}
          >
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>⏱️</Text>
                </View>
                <Text style={styles.statValue}>{formatDuration(duration)}</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, styles.xpIconContainer]}>
                  <Text style={styles.statIcon}>⭐</Text>
                </View>
                <AnimatedXPCounter value={xpEarned} />
                <Text style={styles.statLabel}>XP Earned</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Task Card */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.taskCard}>
          <Text style={styles.taskLabel}>You focused on:</Text>
          <Text style={styles.taskDescription} numberOfLines={3}>
            {taskDescription}
          </Text>
        </Animated.View>

        {/* Rating Section */}
        <Animated.View entering={FadeInUp.delay(700)} style={styles.ratingSection}>
          <RatingPicker rating={rating} onRate={setRating} />
        </Animated.View>

        {/* Encouragement */}
        <Animated.View entering={FadeInUp.delay(800)} style={styles.encouragementCard}>
          <Text style={styles.encouragementEmoji}>💪</Text>
          <Text style={styles.encouragementText}>
            Great focus session! You're building momentum and strengthening your focus muscle.
          </Text>
        </Animated.View>

        {/* Tips */}
        <Animated.View entering={FadeInUp.delay(900)} style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Quick Tips</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>💧</Text>
            <Text style={styles.tipText}>Stay hydrated before your next session</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>🚶</Text>
            <Text style={styles.tipText}>Take a short walk to refresh your mind</Text>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInUp.delay(1000)} style={styles.actions}>
          {showTaskComplete && onTaskComplete && (
            <Button
              title="✅ Mark Task Complete"
              variant="outline"
              onPress={onTaskComplete}
              fullWidth
              size="lg"
            />
          )}
          <Button
            title="🏠 Done"
            onPress={onComplete}
            fullWidth
            size="lg"
            gradient
          />
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

interface RatingPickerProps {
  rating: number | undefined;
  onRate: (rating: number) => void;
}

export const RatingPicker: React.FC<RatingPickerProps> = ({ rating, onRate }) => {
  const ratings = [
    { value: 1, emoji: '😫', label: 'Struggled' },
    { value: 2, emoji: '😕', label: 'Difficult' },
    { value: 3, emoji: '😐', label: 'Okay' },
    { value: 4, emoji: '🙂', label: 'Good' },
    { value: 5, emoji: '🤩', label: 'Great' },
  ];

  const handleRate = async (value: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRate(value);
  };

  return (
    <View style={styles.ratingContainer}>
      <Text style={styles.ratingTitle}>How was your focus?</Text>
      <View style={styles.ratingOptions}>
        {ratings.map((r) => {
          const isSelected = rating === r.value;
          return (
            <Animated.View 
              key={r.value} 
              style={styles.ratingOption}
              entering={FadeIn.delay(r.value * 100)}
            >
              <Animated.View
                style={[
                  styles.ratingButton,
                  isSelected && styles.ratingButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.ratingEmoji,
                    isSelected && styles.ratingEmojiSelected,
                  ]}
                  onPress={() => handleRate(r.value)}
                >
                  {r.emoji}
                </Text>
              </Animated.View>
              <Text style={[styles.ratingLabel, isSelected && styles.ratingLabelSelected]}>
                {r.label}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 10,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  celebrationContainer: {
    marginBottom: 20,
  },
  celebrationGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebration: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray[800],
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    color: colors.gray[500],
    marginBottom: 28,
    textAlign: 'center',
  },
  statsCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  statsCardGradient: {
    padding: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  xpIconContainer: {
    backgroundColor: colors.warning[100],
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray[800],
  },
  xpValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.success[600],
  },
  statLabel: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.gray[200],
  },
  taskCard: {
    width: '100%',
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  taskLabel: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 6,
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[800],
    lineHeight: 24,
  },
  ratingSection: {
    width: '100%',
    marginBottom: 20,
  },
  encouragementCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[50],
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.success[100],
  },
  encouragementEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  encouragementText: {
    flex: 1,
    fontSize: 15,
    color: colors.success[700],
    lineHeight: 22,
    fontWeight: '500',
  },
  tipsSection: {
    width: '100%',
    marginBottom: 28,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[700],
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[600],
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  bottomSpacer: {
    height: 40,
  },
  ratingContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
    textAlign: 'center',
    marginBottom: 16,
  },
  ratingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingOption: {
    alignItems: 'center',
  },
  ratingButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  ratingButtonSelected: {
    backgroundColor: colors.primary[100],
    borderWidth: 2,
    borderColor: colors.primary[500],
    transform: [{ scale: 1.1 }],
  },
  ratingEmoji: {
    fontSize: 26,
  },
  ratingEmojiSelected: {
    fontSize: 28,
  },
  ratingLabel: {
    fontSize: 11,
    color: colors.gray[500],
    fontWeight: '500',
  },
  ratingLabelSelected: {
    color: colors.primary[600],
    fontWeight: '600',
  },
});

export default SessionComplete;
