import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTaskStore } from '../../src/stores/taskStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { SubtaskItem, AddSubtaskInput, SubtaskProgress } from '../../src/components/tasks/SubtaskItem';
import { colors, semanticColors } from '../../src/theme/colors';
import { formatRelativeDate, formatTime } from '../../src/utils/date';
import { springConfigs } from '../../src/utils/animations';
import { Subtask } from '../../src/types/task';

export default function TaskDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = useTaskStore((state) => state.getTaskById(id));
  const completeTask = useTaskStore((state) => state.completeTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const addSubtask = useTaskStore((state) => state.addSubtask);
  const toggleSubtask = useTaskStore((state) => state.toggleSubtask);
  const deleteSubtask = useTaskStore((state) => state.deleteSubtask);
  const addXP = useProgressStore((state) => state.addXP);
  
  const [isCompleting, setIsCompleting] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [showAddSubtask, setShowAddSubtask] = useState(false);

  // Animation values
  const completeButtonScale = useSharedValue(1);

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View entering={FadeIn} style={styles.notFound}>
          <Text style={styles.notFoundEmoji}>🔍</Text>
          <Text style={styles.notFoundText}>Task not found</Text>
          <Text style={styles.notFoundSubtext}>This task may have been deleted</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </Animated.View>
      </SafeAreaView>
    );
  }

  const handleComplete = async () => {
    setIsCompleting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    completeButtonScale.value = withSequence(
      withSpring(0.95, springConfigs.snappy),
      withSpring(1, springConfigs.bouncy)
    );

    try {
      const result = await completeTask(task.id);
      await addXP(result.xpEarned, 'task_complete', 'Completed a task', task.id);
      
      // Show celebration before navigating back
      setTimeout(() => router.back(), 500);
    } catch (error) {
      console.error('Failed to complete task:', error);
      setIsCompleting(false);
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteTask(task.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleStartFocus = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/focus/setup',
      params: { taskId: task.id, taskTitle: task.title },
    });
  };

  const handleAddSubtask = useCallback(async () => {
    if (!newSubtaskTitle.trim()) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addSubtask(task.id, { title: newSubtaskTitle.trim() });
    setNewSubtaskTitle('');
    // Keep input visible for adding more
  }, [task.id, newSubtaskTitle, addSubtask]);

  const handleToggleSubtask = useCallback(async (subtaskId: string) => {
    await toggleSubtask(task.id, subtaskId);
  }, [task.id, toggleSubtask]);

  const handleDeleteSubtask = useCallback(async (subtaskId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteSubtask(task.id, subtaskId);
  }, [task.id, deleteSubtask]);

  const completeButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: completeButtonScale.value }],
  }));

  // Map priority to color with fallback for values not in semanticColors.priority
  const priorityColorMap: Record<string, string> = {
    ...semanticColors.priority,
    medium: colors.gray[400],
    high: semanticColors.priority.important,
  };
  const priorityColor = priorityColorMap[task.priority] || colors.gray[400];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isDone = task.status === 'done';
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => router.push(`/task/edit/${task.id}`)}
              style={styles.headerButton}
            >
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleDelete}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteButton}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Status badge */}
          {isDone && (
            <Animated.View entering={FadeIn}>
              <Badge label="✓ Completed" variant="success" />
            </Animated.View>
          )}

          {/* Title */}
          <Animated.Text 
            entering={FadeInDown.delay(50)}
            style={[styles.title, isDone && styles.titleDone]}
          >
            {task.title}
          </Animated.Text>

          {/* First step highlight */}
          {task.smallestFirstStep && !isDone && (
            <Animated.View entering={FadeInDown.delay(100)} style={styles.firstStepCard}>
              <LinearGradient
                colors={[colors.primary[50], colors.primary[100]]}
                style={styles.firstStepGradient}
              >
                <Text style={styles.firstStepLabel}>🎯 Start with this</Text>
                <Text style={styles.firstStepText}>{task.smallestFirstStep}</Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Metadata */}
          <Animated.View entering={FadeInDown.delay(150)} style={styles.metadata}>
            {task.dueDate && (
              <View style={[styles.metaChip, isOverdue && styles.metaChipOverdue]}>
                <Text style={styles.metaIcon}>📅</Text>
                <Text style={[styles.metaText, isOverdue && styles.overdue]}>
                  {formatRelativeDate(task.dueDate)}
                  {task.dueTime && ` at ${formatTime(task.dueTime)}`}
                </Text>
              </View>
            )}

            {task.estimatedMinutes && (
              <View style={styles.metaChip}>
                <Text style={styles.metaIcon}>⏱️</Text>
                <Text style={styles.metaText}>{task.estimatedMinutes} min</Text>
              </View>
            )}

            {task.priority !== 'none' && (
              <View style={[styles.metaChip, { backgroundColor: `${priorityColor}15` }]}>
                <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                <Text style={[styles.metaText, { color: priorityColor }]}>
                  {task.priority.replace('_', ' & ')}
                </Text>
              </View>
            )}

            <View style={styles.metaChip}>
              <Text style={styles.metaIcon}>⚡</Text>
              <Text style={styles.metaText}>{task.energyRequired} energy</Text>
            </View>
          </Animated.View>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200)} style={styles.tags}>
              {task.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Description */}
          {task.description && (
            <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.description}>{task.description}</Text>
            </Animated.View>
          )}

          {/* Subtasks Section - Enhanced */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Subtasks {subtasks.length > 0 && `(${completedSubtasks}/${subtasks.length})`}
              </Text>
              {!showAddSubtask && !isDone && (
                <TouchableOpacity 
                  onPress={() => setShowAddSubtask(true)}
                  style={styles.addButton}
                >
                  <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Progress bar */}
            {subtasks.length > 0 && (
              <SubtaskProgress 
                total={subtasks.length} 
                completed={completedSubtasks}
                showLabel={false}
              />
            )}

            {/* Subtask list */}
            <View style={styles.subtaskList}>
              {subtasks.map((subtask, index) => (
                <SubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  index={index}
                  onToggle={() => handleToggleSubtask(subtask.id)}
                  onDelete={() => handleDeleteSubtask(subtask.id)}
                  isEditing={editingSubtaskId === subtask.id}
                  onStartEdit={() => setEditingSubtaskId(subtask.id)}
                  onEditSubmit={() => setEditingSubtaskId(null)}
                />
              ))}
            </View>

            {/* Add subtask input */}
            {(showAddSubtask || subtasks.length === 0) && !isDone && (
              <AddSubtaskInput
                value={newSubtaskTitle}
                onChange={setNewSubtaskTitle}
                onSubmit={handleAddSubtask}
                onCancel={() => {
                  setShowAddSubtask(false);
                  setNewSubtaskTitle('');
                }}
                placeholder={subtasks.length === 0 ? "Break this down into smaller steps..." : "Add another step..."}
                autoFocus={showAddSubtask && subtasks.length > 0}
              />
            )}

            {/* Empty state */}
            {subtasks.length === 0 && !showAddSubtask && !isDone && (
              <TouchableOpacity 
                style={styles.emptySubtasks}
                onPress={() => setShowAddSubtask(true)}
              >
                <Text style={styles.emptySubtasksIcon}>📝</Text>
                <Text style={styles.emptySubtasksText}>
                  Break this task into smaller, manageable steps
                </Text>
                <Text style={styles.emptySubtasksHint}>Tap to add your first subtask</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* AI Decomposition */}
          {!subtasks.length && !isDone && (
            <Animated.View entering={FadeInDown.delay(350)}>
              <TouchableOpacity
                style={styles.aiButton}
                onPress={() => router.push(`/task/decompose/${task.id}`)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.gray[50], colors.gray[100]]}
                  style={styles.aiButtonGradient}
                >
                  <Text style={styles.aiButtonIcon}>🤖</Text>
                  <View style={styles.aiButtonText}>
                    <Text style={styles.aiButtonTitle}>Break down with AI</Text>
                    <Text style={styles.aiButtonDesc}>
                      Let AI suggest smaller steps for this task
                    </Text>
                  </View>
                  <Text style={styles.aiButtonArrow}>→</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>

        {/* Actions */}
        {!isDone && (
          <Animated.View 
            entering={FadeInDown.delay(400)}
            style={styles.actions}
          >
            <Button
              title="🎯 Start Focus"
              variant="outline"
              onPress={handleStartFocus}
              style={styles.focusButton}
            />
            <Animated.View style={[styles.completeButtonWrapper, completeButtonStyle]}>
              <Button
                title={isCompleting ? "Completing..." : "✓ Complete"}
                onPress={handleComplete}
                loading={isCompleting}
                style={styles.completeButton}
              />
            </Animated.View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
  },
  notFoundEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[700],
  },
  notFoundSubtext: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    fontSize: 28,
    color: colors.gray[600],
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  headerButton: {
    padding: 4,
  },
  editButton: {
    fontSize: 16,
    color: colors.primary[500],
    fontWeight: '600',
  },
  deleteButton: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 16,
    marginTop: 8,
    lineHeight: 34,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: colors.gray[400],
  },
  firstStepCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
  },
  firstStepGradient: {
    padding: 16,
  },
  firstStepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary[600],
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  firstStepText: {
    fontSize: 16,
    color: colors.primary[800],
    fontWeight: '500',
    lineHeight: 22,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gray[50],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  metaChipOverdue: {
    backgroundColor: colors.danger[50],
  },
  metaIcon: {
    fontSize: 14,
  },
  metaText: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '500',
  },
  overdue: {
    color: colors.danger[600],
    fontWeight: '600',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 24,
  },
  subtaskList: {
    marginTop: 12,
    gap: 4,
  },
  emptySubtasks: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderStyle: 'dashed',
  },
  emptySubtasksIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptySubtasksText: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtasksHint: {
    fontSize: 12,
    color: colors.gray[400],
  },
  aiButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
  },
  aiButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  aiButtonIcon: {
    fontSize: 32,
  },
  aiButtonText: {
    flex: 1,
  },
  aiButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
  },
  aiButtonDesc: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  aiButtonArrow: {
    fontSize: 22,
    color: colors.gray[400],
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    backgroundColor: '#FFFFFF',
  },
  focusButton: {
    flex: 1,
  },
  completeButtonWrapper: {
    flex: 1,
  },
  completeButton: {
    flex: 1,
  },
});

