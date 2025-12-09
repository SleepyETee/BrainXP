// Premium Task Card with Micro-interactions and Animations
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeInRight,
  FadeOutRight,
  Layout,
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Task } from '../../types/task';
import { colors, semanticColors, shadows, gradients } from '../../theme/colors';
import { formatRelativeDate, formatTime } from '../../utils/date';
import { springConfigs } from '../../utils/animations';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onSnooze?: () => void;
  showSubtasks?: boolean;
  compact?: boolean;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onComplete,
  onDelete,
  onSnooze,
  showSubtasks = true,
  compact = false,
  index = 0,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const swipeableRef = useRef<Swipeable>(null);

  // Animation values
  const cardScale = useSharedValue(1);
  const checkboxScale = useSharedValue(1);
  const checkmarkOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const pressedOpacity = useSharedValue(0);

  const handleComplete = async () => {
    if (isCompleting) return;

    setIsCompleting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Celebration animation sequence
    checkboxScale.value = withSequence(
      withSpring(1.4, springConfigs.wobbly),
      withSpring(1, springConfigs.gentle)
    );
    
    checkmarkOpacity.value = withTiming(1, { duration: 200 });
    glowOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 600 })
    );

    // Card completion animation
    cardScale.value = withSequence(
      withSpring(1.02, springConfigs.snappy),
      withSpring(1, springConfigs.gentle)
    );

    await onComplete();
    setIsCompleting(false);
  };

  const handleDelete = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swipeableRef.current?.close();
    onDelete();
  };

  const handleSnooze = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    swipeableRef.current?.close();
    onSnooze?.();
  };

  const handlePressIn = () => {
    cardScale.value = withSpring(0.98, springConfigs.snappy);
    pressedOpacity.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, springConfigs.bouncy);
    pressedOpacity.value = withTiming(0, { duration: 200 });
  };

  // Animated styles
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const checkboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkboxScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const pressedStyle = useAnimatedStyle(() => ({
    opacity: pressedOpacity.value,
  }));

  const renderRightActions = () => (
    <View style={styles.rightActions}>
      {onSnooze && (
        <TouchableOpacity
          style={[styles.actionButton, styles.snoozeButton]}
          onPress={handleSnooze}
        >
          <Text style={styles.actionIcon}>⏰</Text>
          <Text style={styles.actionText}>Snooze</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={handleDelete}
      >
        <Text style={styles.actionIcon}>🗑️</Text>
        <Text style={styles.actionText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const priorityColor = semanticColors.priority[task.priority] || colors.gray[400];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isDone = task.status === 'done';
  const subtaskCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.status === 'done').length || 0;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50).springify()}
      layout={Layout.springify()}
    >
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        friction={2}
        overshootRight={false}
      >
        <AnimatedPressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.container,
            compact && styles.containerCompact,
            isDone && styles.containerDone,
            shadows.md,
            cardStyle,
          ]}
        >
          {/* Pressed overlay */}
          <Animated.View style={[styles.pressedOverlay, pressedStyle]} />

          {/* Priority accent line */}
          <View style={[styles.priorityAccent, { backgroundColor: priorityColor }]} />

          {/* Checkbox with glow effect */}
          <View style={styles.checkboxContainer}>
            {/* Glow */}
            <Animated.View style={[styles.checkboxGlow, glowStyle]}>
              <LinearGradient
                colors={[`${colors.success[400]}80`, 'transparent']}
                style={styles.glowGradient}
              />
            </Animated.View>

            <TouchableOpacity
              onPress={handleComplete}
              disabled={isCompleting || isDone}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.checkbox,
                  isDone && styles.checkboxDone,
                  checkboxStyle,
                ]}
              >
                {isDone && (
                  <LinearGradient
                    colors={[colors.success[500], colors.success[400]]}
                    style={styles.checkboxFill}
                  >
                    <Text style={styles.checkmark}>✓</Text>
                  </LinearGradient>
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  isDone && styles.titleDone,
                  compact && styles.titleCompact,
                ]}
                numberOfLines={compact ? 1 : 2}
              >
                {task.title}
              </Text>
            </View>

            {/* Metadata Row */}
            {!compact && (
              <View style={styles.metadata}>
                {task.dueDate && (
                  <View style={[styles.metaChip, isOverdue && styles.metaChipOverdue]}>
                    <Text style={styles.metaIcon}>📅</Text>
                    <Text style={[styles.metaText, isOverdue && styles.overdueText]}>
                      {formatRelativeDate(task.dueDate)}
                      {task.dueTime && ` • ${formatTime(task.dueTime)}`}
                    </Text>
                  </View>
                )}

                {task.estimatedMinutes && (
                  <View style={styles.metaChip}>
                    <Text style={styles.metaIcon}>⏱️</Text>
                    <Text style={styles.metaText}>~{task.estimatedMinutes}m</Text>
                  </View>
                )}

                {task.energyRequired !== 'medium' && (
                  <View
                    style={[
                      styles.energyBadge,
                      { backgroundColor: `${semanticColors.energy[task.energyRequired]}15` },
                    ]}
                  >
                    <Text style={styles.energyIcon}>
                      {task.energyRequired === 'low' ? '🔋' : '⚡'}
                    </Text>
                    <Text
                      style={[
                        styles.energyText,
                        { color: semanticColors.energy[task.energyRequired] },
                      ]}
                    >
                      {task.energyRequired === 'low' ? 'Low' : 'High'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Tags */}
            {!compact && task.tags.length > 0 && (
              <View style={styles.tags}>
                {task.tags.slice(0, 3).map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
                {task.tags.length > 3 && (
                  <Text style={styles.moreText}>+{task.tags.length - 3}</Text>
                )}
              </View>
            )}

            {/* Subtasks indicator */}
            {showSubtasks && subtaskCount > 0 && (
              <View style={styles.subtaskIndicator}>
                <View style={styles.subtaskProgress}>
                  <Animated.View
                    style={[
                      styles.subtaskProgressFill,
                      { width: `${(completedSubtasks / subtaskCount) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.subtaskText}>
                  {completedSubtasks}/{subtaskCount} steps
                </Text>
              </View>
            )}

            {/* Smallest first step */}
            {!compact && task.smallestFirstStep && !isDone && (
              <View style={styles.firstStep}>
                <LinearGradient
                  colors={[`${colors.primary[500]}08`, `${colors.primary[500]}15`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.firstStepGradient}
                >
                  <Text style={styles.firstStepLabel}>💡 Start with:</Text>
                  <Text style={styles.firstStepText} numberOfLines={1}>
                    {task.smallestFirstStep}
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Priority indicator */}
          <View style={styles.priorityIndicator}>
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
          </View>
        </AnimatedPressable>
      </Swipeable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    overflow: 'hidden',
  },
  containerCompact: {
    padding: 12,
    marginVertical: 2,
    borderRadius: 12,
  },
  containerDone: {
    backgroundColor: colors.gray[50],
  },
  pressedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary[50],
    borderRadius: 16,
  },
  priorityAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  checkboxContainer: {
    position: 'relative',
    marginRight: 12,
  },
  checkboxGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    left: -12,
    top: -12,
    borderRadius: 24,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  checkboxDone: {
    borderWidth: 0,
  },
  checkboxFill: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    flex: 1,
    lineHeight: 22,
  },
  titleCompact: {
    fontSize: 15,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: colors.gray[400],
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gray[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaChipOverdue: {
    backgroundColor: colors.danger[50],
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: '500',
  },
  overdueText: {
    color: colors.danger[600],
    fontWeight: '600',
  },
  energyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  energyIcon: {
    fontSize: 12,
  },
  energyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '500',
  },
  moreText: {
    fontSize: 12,
    color: colors.gray[400],
    alignSelf: 'center',
  },
  subtaskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  subtaskProgress: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 3,
    overflow: 'hidden',
  },
  subtaskProgressFill: {
    height: '100%',
    backgroundColor: colors.success[500],
    borderRadius: 3,
  },
  subtaskText: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: '500',
  },
  firstStep: {
    marginTop: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  firstStepGradient: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  firstStepLabel: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '600',
  },
  firstStepText: {
    fontSize: 12,
    color: colors.primary[700],
    flex: 1,
    fontWeight: '500',
  },
  priorityIndicator: {
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    gap: 4,
  },
  snoozeButton: {
    backgroundColor: colors.warning[500],
  },
  deleteButton: {
    backgroundColor: colors.danger[500],
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default TaskCard;
