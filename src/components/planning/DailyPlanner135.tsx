// 1-3-5 Rule Daily Planner - ADHD-Friendly Task Planning
// Research: Limits daily tasks to reduce overwhelm (1 big, 3 medium, 5 small)
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, shadows, adhdPalette } from '../../theme/colors';
import { useSettingsStore } from '../../stores/settingsStore';
import { AnimatedView } from '../accessibility/AnimatedView';

// Task slot types for 1-3-5 rule
type TaskSize = 'big' | 'medium' | 'small';

interface PlannerTask {
  id: string;
  title: string;
  size: TaskSize;
  completed: boolean;
}

interface DailyPlanner135Props {
  onTaskAdd?: (task: { title: string; size: TaskSize }) => void;
  onTaskComplete?: (taskId: string) => void;
  onPlanComplete?: (tasks: PlannerTask[]) => void;
  existingTasks?: PlannerTask[];
}

const TASK_CONFIG = {
  big: {
    count: 1,
    label: 'Big Task',
    description: 'Your most important task',
    emoji: '🎯',
    color: colors.accent[400],
    bgColor: `${colors.accent[400]}10`,
  },
  medium: {
    count: 3,
    label: 'Medium Tasks',
    description: 'Important but less demanding',
    emoji: '📋',
    color: colors.primary[500],
    bgColor: `${colors.primary[500]}10`,
  },
  small: {
    count: 5,
    label: 'Small Tasks',
    description: 'Quick wins & simple tasks',
    emoji: '✅',
    color: colors.secondary[500],
    bgColor: `${colors.secondary[500]}10`,
  },
};

const TaskSlot: React.FC<{
  size: TaskSize;
  task?: PlannerTask;
  index: number;
  onAdd: (title: string) => void;
  onComplete: () => void;
  onRemove: () => void;
}> = ({ size, task, index, onAdd, onComplete, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const config = TASK_CONFIG[size];
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);

  const handleSubmit = useCallback(() => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue('');
      setIsEditing(false);
      if (!reduceMotion) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [inputValue, onAdd, reduceMotion]);

  const handleComplete = useCallback(async () => {
    if (!reduceMotion) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onComplete();
  }, [onComplete, reduceMotion]);

  if (!task && !isEditing) {
    return (
      <AnimatedView delay={index * 50}>
        <TouchableOpacity
          style={[styles.emptySlot, { borderColor: `${config.color}30` }]}
          onPress={() => setIsEditing(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.emptySlotPlus, { color: config.color }]}>+</Text>
          <Text style={styles.emptySlotText}>Add {config.label.toLowerCase()}</Text>
        </TouchableOpacity>
      </AnimatedView>
    );
  }

  if (isEditing) {
    return (
      <AnimatedView delay={0}>
        <View style={[styles.inputSlot, { borderColor: config.color }]}>
          <TextInput
            style={styles.taskInput}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={`What's your ${size} task?`}
            placeholderTextColor={colors.gray[400]}
            autoFocus
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
            // Accessibility: larger touch target
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          />
          <View style={styles.inputActions}>
            <TouchableOpacity
              onPress={() => setIsEditing(false)}
              style={styles.inputButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.inputButton, styles.addButtonSmall, { backgroundColor: config.color }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedView>
    );
  }

  return (
    <AnimatedView delay={index * 50}>
      <View style={[styles.taskSlot, task?.completed && styles.taskSlotCompleted]}>
        <TouchableOpacity
          onPress={handleComplete}
          style={[
            styles.checkbox,
            { borderColor: config.color },
            task?.completed && { backgroundColor: config.color },
          ]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task?.completed }}
          accessibilityLabel={`Mark ${task?.title} as ${task?.completed ? 'incomplete' : 'complete'}`}
        >
          {task?.completed && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <Text
          style={[
            styles.taskTitle,
            task?.completed && styles.taskTitleCompleted,
          ]}
          numberOfLines={2}
        >
          {task?.title}
        </Text>
        <TouchableOpacity
          onPress={onRemove}
          style={styles.removeButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel={`Remove ${task?.title}`}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    </AnimatedView>
  );
};

export const DailyPlanner135: React.FC<DailyPlanner135Props> = ({
  onTaskAdd,
  onTaskComplete,
  onPlanComplete,
  existingTasks = [],
}) => {
  const [tasks, setTasks] = useState<PlannerTask[]>(existingTasks);
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);

  const bigTasks = tasks.filter((t) => t.size === 'big');
  const mediumTasks = tasks.filter((t) => t.size === 'medium');
  const smallTasks = tasks.filter((t) => t.size === 'small');

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  const handleAddTask = useCallback(
    (size: TaskSize) => (title: string) => {
      const newTask: PlannerTask = {
        id: `${Date.now()}-${Math.random()}`,
        title,
        size,
        completed: false,
      };
      setTasks((prev) => [...prev, newTask]);
      onTaskAdd?.({ title, size });
    },
    [onTaskAdd]
  );

  const handleCompleteTask = useCallback(
    (taskId: string) => () => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
      );
      onTaskComplete?.(taskId);
    },
    [onTaskComplete]
  );

  const handleRemoveTask = useCallback((taskId: string) => () => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const handleSavePlan = useCallback(async () => {
    if (!reduceMotion) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onPlanComplete?.(tasks);
  }, [tasks, onPlanComplete, reduceMotion]);

  const renderTaskSection = (
    size: TaskSize,
    taskList: PlannerTask[],
    maxCount: number
  ) => {
    const config = TASK_CONFIG[size];
    const slots = [];

    // Render existing tasks
    for (let i = 0; i < taskList.length; i++) {
      slots.push(
        <TaskSlot
          key={taskList[i].id}
          size={size}
          task={taskList[i]}
          index={i}
          onAdd={handleAddTask(size)}
          onComplete={handleCompleteTask(taskList[i].id)}
          onRemove={handleRemoveTask(taskList[i].id)}
        />
      );
    }

    // Render empty slots
    for (let i = taskList.length; i < maxCount; i++) {
      slots.push(
        <TaskSlot
          key={`empty-${size}-${i}`}
          size={size}
          index={i}
          onAdd={handleAddTask(size)}
          onComplete={() => {}}
          onRemove={() => {}}
        />
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: config.bgColor }]}>
            <Text style={styles.sectionEmoji}>{config.emoji}</Text>
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={[styles.sectionTitle, { color: config.color }]}>
              {config.label}
            </Text>
            <Text style={styles.sectionDescription}>{config.description}</Text>
          </View>
          <View style={styles.sectionCount}>
            <Text style={[styles.sectionCountText, { color: config.color }]}>
              {taskList.filter((t) => t.completed).length}/{maxCount}
            </Text>
          </View>
        </View>
        <View style={styles.taskList}>{slots}</View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with progress */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Daily Plan</Text>
          <Text style={styles.headerSubtitle}>
            Focus on what matters most
          </Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>
            {completedCount}/{totalCount}
          </Text>
        </View>
      </View>

      {/* Info callout - ADHD-friendly explanation */}
      <View style={styles.infoCallout}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          The 1-3-5 rule helps you focus without overwhelm: 1 big task, 3 medium tasks, 5 small wins.
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderTaskSection('big', bigTasks, TASK_CONFIG.big.count)}
        {renderTaskSection('medium', mediumTasks, TASK_CONFIG.medium.count)}
        {renderTaskSection('small', smallTasks, TASK_CONFIG.small.count)}
      </ScrollView>

      {/* Save button */}
      {tasks.length > 0 && (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSavePlan}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Save your daily plan"
        >
          <Text style={styles.saveButtonText}>Save Plan</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
    // ADHD-friendly: clear, bold headers
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
    // Good line height for readability
    lineHeight: 20,
  },
  progressBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  progressText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary[600],
  },

  // Info callout - helps explain the system
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[400],
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 19,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Section styles
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionDescription: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 1,
  },
  sectionCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  sectionCountText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Task list
  taskList: {
    gap: 8,
  },

  // Empty slot
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: colors.gray[50],
    // Minimum touch target for accessibility
    minHeight: 52,
  },
  emptySlotPlus: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
  },
  emptySlotText: {
    fontSize: 14,
    color: colors.gray[500],
  },

  // Input slot
  inputSlot: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  taskInput: {
    fontSize: 16,
    color: colors.gray[800],
    paddingVertical: 8,
    paddingHorizontal: 4,
    // Good line height for readability
    lineHeight: 22,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  inputButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
  },
  addButtonSmall: {
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Task slot
  taskSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
    gap: 12,
    // Minimum height for touch accessibility
    minHeight: 56,
  },
  taskSlotCompleted: {
    backgroundColor: colors.gray[50],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  taskTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[800],
    // Good line height for readability
    lineHeight: 21,
  },
  taskTitleCompleted: {
    color: colors.gray[400],
    textDecorationLine: 'line-through',
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    fontSize: 22,
    color: colors.gray[400],
    fontWeight: '300',
  },

  // Save button
  saveButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...shadows.lg,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default DailyPlanner135;

