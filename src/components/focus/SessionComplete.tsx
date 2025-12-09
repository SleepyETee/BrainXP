import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Button } from '../ui/Button';
import { colors } from '../../theme/colors';
import { formatDuration } from '../../utils/date';

interface SessionCompleteProps {
  duration: number; // in minutes
  taskDescription: string;
  xpEarned: number;
  onComplete: () => void;
  onTaskComplete?: () => void;
  showTaskComplete?: boolean;
}

export const SessionComplete: React.FC<SessionCompleteProps> = ({
  duration,
  taskDescription,
  xpEarned,
  onComplete,
  onTaskComplete,
  showTaskComplete = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Trigger success haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate in
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Animate XP counter
    Animated.timing(xpAnim, {
      toValue: xpEarned,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Celebration icon */}
        <View style={styles.celebrationContainer}>
          <Text style={styles.celebration}>🎉</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Focus Session Complete!</Text>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Animated.Text style={styles.statValueXP}>
              +{xpAnim.interpolate({
                inputRange: [0, xpEarned],
                outputRange: ['0', xpEarned.toString()],
              })}
            </Animated.Text>
            <Text style={styles.statLabel}>XP Earned</Text>
          </View>
        </View>

        {/* Task */}
        <View style={styles.taskContainer}>
          <Text style={styles.taskLabel}>You focused on:</Text>
          <Text style={styles.taskDescription} numberOfLines={2}>
            {taskDescription}
          </Text>
        </View>

        {/* Encouragement */}
        <Text style={styles.encouragement}>
          Great focus session! You're building momentum. 💪
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          {showTaskComplete && onTaskComplete && (
            <Button
              title="Mark Task Complete"
              variant="outline"
              onPress={onTaskComplete}
              fullWidth
            />
          )}
          <Button
            title="Done"
            onPress={onComplete}
            fullWidth
          />
        </View>
      </Animated.View>
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
        {ratings.map((r) => (
          <View key={r.value} style={styles.ratingOption}>
            <Animated.View
              style={[
                styles.ratingButton,
                rating === r.value && styles.ratingButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.ratingEmoji,
                  rating === r.value && styles.ratingEmojiSelected,
                ]}
                onPress={() => handleRate(r.value)}
              >
                {r.emoji}
              </Text>
            </Animated.View>
            <Text style={styles.ratingLabel}>{r.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.gray[50],
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  celebrationContainer: {
    marginBottom: 16,
  },
  celebration: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 24,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[800],
  },
  statValueXP: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary[500],
  },
  statLabel: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[200],
  },
  taskContainer: {
    width: '100%',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  taskLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray[700],
  },
  encouragement: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  ratingContainer: {
    width: '100%',
    marginBottom: 24,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '500',
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  ratingButtonSelected: {
    backgroundColor: colors.primary[100],
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  ratingEmoji: {
    fontSize: 24,
  },
  ratingEmojiSelected: {
    fontSize: 28,
  },
  ratingLabel: {
    fontSize: 11,
    color: colors.gray[500],
  },
});

export default SessionComplete;
