import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTaskStore } from '../../src/stores/taskStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { colors, semanticColors } from '../../src/theme/colors';
import { formatRelativeDate, formatTime } from '../../src/utils/date';

export default function TaskDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = useTaskStore((state) => state.getTaskById(id));
  const completeTask = useTaskStore((state) => state.completeTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const addXP = useProgressStore((state) => state.addXP);
  const [isCompleting, setIsCompleting] = useState(false);

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Task not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const result = await completeTask(task.id);
      await addXP(result.xpEarned, 'task_complete', 'Completed a task', task.id);
      router.back();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
    setIsCompleting(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTask(task.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleStartFocus = () => {
    router.push({
      pathname: '/focus/setup',
      params: { taskId: task.id, taskTitle: task.title },
    });
  };

  const priorityColor = semanticColors.priority[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push(`/task/edit/${task.id}`)}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={styles.deleteButton}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Status badge */}
        {task.status === 'done' && (
          <Badge label="Completed" variant="success" />
        )}

        {/* Title */}
        <Text style={[styles.title, task.status === 'done' && styles.titleDone]}>
          {task.title}
        </Text>

        {/* First step */}
        {task.smallestFirstStep && (
          <View style={styles.firstStepCard}>
            <Text style={styles.firstStepLabel}>🎯 Smallest first step</Text>
            <Text style={styles.firstStepText}>{task.smallestFirstStep}</Text>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.metadata}>
          {task.dueDate && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={[styles.metaText, isOverdue && styles.overdue]}>
                {formatRelativeDate(task.dueDate)}
                {task.dueTime && ` at ${formatTime(task.dueTime)}`}
              </Text>
            </View>
          )}

          {task.estimatedMinutes && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱️</Text>
              <Text style={styles.metaText}>{task.estimatedMinutes} min</Text>
            </View>
          )}

          {task.priority !== 'none' && (
            <View style={styles.metaItem}>
              <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
              <Text style={styles.metaText}>
                {task.priority.replace('_', ' & ')}
              </Text>
            </View>
          )}

          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>⚡</Text>
            <Text style={styles.metaText}>
              {task.energyRequired} energy
            </Text>
          </View>
        </View>

        {/* Tags */}
        {task.tags.length > 0 && (
          <View style={styles.tags}>
            {task.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Description */}
        {task.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.description}>{task.description}</Text>
          </View>
        )}

        {/* Subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Subtasks ({task.subtasks.filter((s) => s.status === 'done').length}/
              {task.subtasks.length})
            </Text>
            {task.subtasks.map((subtask) => (
              <View key={subtask.id} style={styles.subtaskItem}>
                <View
                  style={[
                    styles.subtaskCheckbox,
                    subtask.status === 'done' && styles.subtaskCheckboxDone,
                  ]}
                >
                  {subtask.status === 'done' && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.subtaskText,
                    subtask.status === 'done' && styles.subtaskTextDone,
                  ]}
                >
                  {subtask.title}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Decomposition */}
        {!task.subtasks?.length && task.status !== 'done' && (
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => router.push(`/task/decompose/${task.id}`)}
          >
            <Text style={styles.aiButtonIcon}>🤖</Text>
            <View style={styles.aiButtonText}>
              <Text style={styles.aiButtonTitle}>Break down with AI</Text>
              <Text style={styles.aiButtonDesc}>
                Let AI suggest smaller steps for this task
              </Text>
            </View>
            <Text style={styles.aiButtonArrow}>→</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Actions */}
      {task.status !== 'done' && (
        <View style={styles.actions}>
          <Button
            title="Start Focus"
            variant="outline"
            onPress={handleStartFocus}
            style={styles.focusButton}
          />
          <Button
            title="Mark Complete"
            onPress={handleComplete}
            loading={isCompleting}
            style={styles.completeButton}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.gray[500],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
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
  editButton: {
    fontSize: 16,
    color: colors.primary[500],
    fontWeight: '500',
  },
  deleteButton: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 16,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: colors.gray[400],
  },
  firstStepCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  firstStepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
    marginBottom: 4,
  },
  firstStepText: {
    fontSize: 15,
    color: colors.primary[800],
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 16,
  },
  metaText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  overdue: {
    color: colors.danger[500],
    fontWeight: '600',
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: colors.gray[700],
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 22,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  subtaskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskCheckboxDone: {
    backgroundColor: colors.success[500],
    borderColor: colors.success[500],
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subtaskText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[700],
  },
  subtaskTextDone: {
    textDecorationLine: 'line-through',
    color: colors.gray[400],
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
  },
  aiButtonIcon: {
    fontSize: 28,
  },
  aiButtonText: {
    flex: 1,
  },
  aiButtonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
  },
  aiButtonDesc: {
    fontSize: 13,
    color: colors.gray[500],
  },
  aiButtonArrow: {
    fontSize: 20,
    color: colors.gray[400],
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  focusButton: {
    flex: 1,
  },
  completeButton: {
    flex: 1,
  },
});

