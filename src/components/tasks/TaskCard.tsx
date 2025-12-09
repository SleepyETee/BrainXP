import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Task } from '../../types/task';
import { colors, semanticColors } from '../../theme/colors';
import { formatRelativeDate, formatTime } from '../../utils/date';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onSnooze?: () => void;
  showSubtasks?: boolean;
  compact?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onComplete,
  onDelete,
  onSnooze,
  showSubtasks = true,
  compact = false,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const checkboxScale = useRef(new Animated.Value(1)).current;
  const swipeableRef = useRef<Swipeable>(null);

  const handleComplete = async () => {
    if (isCompleting) return;

    setIsCompleting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate checkbox
    Animated.sequence([
      Animated.spring(checkboxScale, {
        toValue: 1.3,
        useNativeDriver: true,
      }),
      Animated.spring(checkboxScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    await onComplete();
    setIsCompleting(false);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swipeableRef.current?.close();
    onDelete();
  };

  const handleSnooze = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    swipeableRef.current?.close();
    onSnooze?.();
  };

  const renderRightActions = () => (
    <View style={styles.rightActions}>
      {onSnooze && (
        <TouchableOpacity
          style={[styles.actionButton, styles.snoozeButton]}
          onPress={handleSnooze}
        >
          <Text style={styles.actionText}>Snooze</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={handleDelete}
      >
        <Text style={styles.actionText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const priorityColor = semanticColors.priority[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isDone = task.status === 'done';
  const subtaskCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.status === 'done').length || 0;

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      overshootRight={false}
    >
      <TouchableOpacity
        style={[styles.container, compact && styles.containerCompact]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Checkbox */}
        <Animated.View style={{ transform: [{ scale: checkboxScale }] }}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              isDone && styles.checkboxDone,
            ]}
            onPress={handleComplete}
            disabled={isCompleting}
          >
            {isDone && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        </Animated.View>

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
            {task.priority !== 'none' && (
              <View
                style={[
                  styles.priorityDot,
                  { backgroundColor: priorityColor },
                ]}
              />
            )}
          </View>

          {/* Metadata Row */}
          {!compact && (
            <View style={styles.metadata}>
              {task.dueDate && (
                <Text style={[styles.dueDate, isOverdue && styles.overdue]}>
                  {formatRelativeDate(task.dueDate)}
                  {task.dueTime && ` at ${formatTime(task.dueTime)}`}
                </Text>
              )}

              {task.estimatedMinutes && (
                <View style={styles.estimate}>
                  <Text style={styles.estimateText}>
                    ~{task.estimatedMinutes}m
                  </Text>
                </View>
              )}

              {task.energyRequired !== 'medium' && (
                <View
                  style={[
                    styles.energyBadge,
                    { backgroundColor: semanticColors.energy[task.energyRequired] + '20' },
                  ]}
                >
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
                  <Text style={styles.tagText}>{tag}</Text>
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
                <View
                  style={[
                    styles.subtaskProgressFill,
                    { width: `${(completedSubtasks / subtaskCount) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.subtaskText}>
                {completedSubtasks}/{subtaskCount}
              </Text>
            </View>
          )}

          {/* Smallest first step */}
          {!compact && task.smallestFirstStep && !isDone && (
            <View style={styles.firstStep}>
              <Text style={styles.firstStepLabel}>Start with:</Text>
              <Text style={styles.firstStepText} numberOfLines={1}>
                {task.smallestFirstStep}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  containerCompact: {
    padding: 12,
    marginVertical: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.success[500],
    borderColor: colors.success[500],
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
    fontWeight: '500',
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
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 7,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 10,
    flexWrap: 'wrap',
  },
  dueDate: {
    fontSize: 13,
    color: colors.gray[500],
  },
  overdue: {
    color: colors.danger[500],
    fontWeight: '500',
  },
  estimate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estimateText: {
    fontSize: 12,
    color: colors.gray[400],
  },
  energyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  energyText: {
    fontSize: 11,
    fontWeight: '500',
  },
  tags: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    color: colors.primary[600],
    fontWeight: '500',
  },
  moreText: {
    fontSize: 11,
    color: colors.gray[400],
    alignSelf: 'center',
  },
  subtaskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  subtaskProgress: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  subtaskProgressFill: {
    height: '100%',
    backgroundColor: colors.success[500],
    borderRadius: 2,
  },
  subtaskText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  firstStep: {
    flexDirection: 'row',
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.primary[50],
    borderRadius: 6,
    gap: 4,
  },
  firstStepLabel: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '500',
  },
  firstStepText: {
    fontSize: 12,
    color: colors.primary[700],
    flex: 1,
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
    borderRadius: 0,
  },
  snoozeButton: {
    backgroundColor: colors.warning[500],
  },
  deleteButton: {
    backgroundColor: colors.danger[500],
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default TaskCard;
