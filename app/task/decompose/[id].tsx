// AI Task Decomposition Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTaskStore } from '../../../src/stores/taskStore';
import { decomposeTask, DecomposeTaskResponse } from '../../../src/services/api/ai';
import { colors, shadows } from '../../../src/theme/colors';

type Granularity = 'coarse' | 'medium' | 'fine' | 'micro';

const GRANULARITY_OPTIONS: { value: Granularity; label: string; emoji: string; desc: string }[] = [
  { value: 'coarse', label: 'Big Steps', emoji: '🦶', desc: '3-4 steps, 15-30 min each' },
  { value: 'medium', label: 'Medium', emoji: '👣', desc: '5-7 steps, 10-20 min each' },
  { value: 'fine', label: 'Small Steps', emoji: '🐾', desc: '7-10 steps, 5-15 min each' },
  { value: 'micro', label: 'Tiny Steps', emoji: '🐜', desc: '10-15 steps, 2-10 min each' },
];

export default function TaskDecomposeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = useTaskStore((state) => state.getTaskById(id));
  const updateTask = useTaskStore((state) => state.updateTask);

  const [granularity, setGranularity] = useState<Granularity>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DecomposeTaskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecompose = async () => {
    if (!task) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await decomposeTask({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        userContext: {
          energyLevel: task.energyRequired as 'low' | 'medium' | 'high',
        },
      });
      setResult(response);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError('Failed to break down task. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySteps = async () => {
    if (!task || !result) return;

    try {
      // Create subtasks from the AI suggestions
      const subtasks = result.suggestedSteps.map((step, index) => ({
        id: `subtask_${Date.now()}_${index}`,
        title: step.title,
        status: 'todo' as const,
        order: step.order,
        estimatedMinutes: step.estimatedMinutes,
      }));

      await updateTask(task.id, {
        subtasks,
        smallestFirstStep: result.smallestFirstStep,
        estimatedMinutes: result.adjustedEstimate || result.totalEstimatedMinutes,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err) {
      setError('Failed to save steps. Please try again.');
    }
  };

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Task not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Break Down Task</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Task Info */}
        <Animated.View entering={FadeIn} style={styles.taskCard}>
          <Text style={styles.taskEmoji}>🎯</Text>
          <Text style={styles.taskTitle}>{task.title}</Text>
          {task.description && (
            <Text style={styles.taskDescription}>{task.description}</Text>
          )}
        </Animated.View>

        {!result ? (
          <>
            {/* Granularity Selection */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
              <Text style={styles.sectionTitle}>How small should the steps be?</Text>
              <Text style={styles.sectionHint}>
                Feeling overwhelmed? Choose smaller steps!
              </Text>
              <View style={styles.granularityGrid}>
                {GRANULARITY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.granularityOption,
                      granularity === option.value && styles.granularityOptionSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setGranularity(option.value);
                    }}
                  >
                    <Text style={styles.granularityEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.granularityLabel,
                        granularity === option.value && styles.granularityLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={styles.granularityDesc}>{option.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Error */}
            {error && (
              <Animated.View entering={FadeIn} style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            {/* Decompose Button */}
            <Animated.View entering={FadeInDown.delay(200)}>
              <TouchableOpacity
                style={[styles.decomposeButton, isLoading && styles.buttonDisabled]}
                onPress={handleDecompose}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.decomposeButtonText}>
                      Breaking it down...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.decomposeButtonEmoji}>✨</Text>
                    <Text style={styles.decomposeButtonText}>
                      Break Down with AI
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Tips */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>💡 How this helps</Text>
              <Text style={styles.tipItem}>
                • AI understands ADHD-friendly task breakdown
              </Text>
              <Text style={styles.tipItem}>
                • Each step starts with an action verb
              </Text>
              <Text style={styles.tipItem}>
                • Time estimates account for transitions
              </Text>
              <Text style={styles.tipItem}>
                • Easiest step first to build momentum
              </Text>
            </Animated.View>
          </>
        ) : (
          <>
            {/* Results */}
            <Animated.View entering={FadeIn}>
              {/* First Step Highlight */}
              <View style={styles.firstStepCard}>
                <Text style={styles.firstStepLabel}>🚀 Start Here (2 min or less)</Text>
                <Text style={styles.firstStepText}>{result.smallestFirstStep}</Text>
              </View>

              {/* Steps */}
              <View style={styles.stepsSection}>
                <Text style={styles.sectionTitle}>
                  📋 Your {result.suggestedSteps.length} Steps
                </Text>
                <Text style={styles.totalTime}>
                  Total: ~{result.adjustedEstimate || result.totalEstimatedMinutes} minutes
                </Text>

                {result.suggestedSteps.map((step, index) => (
                  <Animated.View
                    key={index}
                    entering={FadeInDown.delay(100 + index * 50)}
                    style={styles.stepCard}
                  >
                    <View style={styles.stepHeader}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{step.order}</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <View style={styles.stepMeta}>
                          <Text style={styles.stepTime}>
                            ⏱ {step.estimatedMinutes} min
                          </Text>
                          {step.energyRequired && (
                            <Text style={styles.stepEnergy}>
                              {step.energyRequired === 'low' && '🟢 Low energy'}
                              {step.energyRequired === 'medium' && '🟡 Medium'}
                              {step.energyRequired === 'high' && '🔴 High energy'}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                    {step.tip && (
                      <Text style={styles.stepTip}>💡 {step.tip}</Text>
                    )}
                  </Animated.View>
                ))}
              </View>

              {/* Motivational Note */}
              {result.motivationalNote && (
                <View style={styles.motivationCard}>
                  <Text style={styles.motivationText}>
                    🌟 {result.motivationalNote}
                  </Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handleApplySteps}
                >
                  <Text style={styles.applyButtonText}>Use These Steps</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => setResult(null)}
                >
                  <Text style={styles.retryButtonText}>Try Different Size</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[800],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: colors.gray[500],
    marginBottom: 16,
  },
  backLink: {
    fontSize: 16,
    color: colors.primary[600],
    fontWeight: '600',
  },
  taskCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    ...shadows.sm,
  },
  taskEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[800],
    textAlign: 'center',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 16,
  },
  granularityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  granularityOption: {
    width: '47%',
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  granularityOptionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  granularityEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  granularityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 4,
  },
  granularityLabelSelected: {
    color: colors.primary[700],
  },
  granularityDesc: {
    fontSize: 11,
    color: colors.gray[500],
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: colors.danger[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.danger[200],
  },
  errorText: {
    fontSize: 14,
    color: colors.danger[700],
    textAlign: 'center',
  },
  decomposeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginBottom: 24,
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  decomposeButtonEmoji: {
    fontSize: 20,
  },
  decomposeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tipsCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary[700],
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: colors.primary[600],
    marginBottom: 6,
    lineHeight: 20,
  },
  firstStepCard: {
    backgroundColor: colors.success[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  firstStepLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success[700],
    marginBottom: 8,
  },
  firstStepText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success[800],
  },
  stepsSection: {
    marginBottom: 20,
  },
  totalTime: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 16,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  stepHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 4,
  },
  stepMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  stepTime: {
    fontSize: 12,
    color: colors.gray[500],
  },
  stepEnergy: {
    fontSize: 12,
    color: colors.gray[500],
  },
  stepTip: {
    fontSize: 13,
    color: colors.primary[600],
    fontStyle: 'italic',
    marginTop: 8,
    paddingLeft: 44,
  },
  motivationCard: {
    backgroundColor: colors.warning[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  motivationText: {
    fontSize: 14,
    color: colors.warning[800],
    fontWeight: '500',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  applyButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...shadows.md,
  },
  applyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  retryButton: {
    backgroundColor: colors.gray[100],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[600],
  },
});
