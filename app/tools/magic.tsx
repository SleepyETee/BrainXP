// Magic Breakdown Tool Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, gradients, shadows } from '../../src/theme/colors';
import { MagicBreakdownResult, SpoonLevel } from '../../src/types/aiTools';
import { magicBreakdown } from '../../src/services/api/aiTools';

export default function MagicBreakdownScreen() {
  const router = useRouter();
  const [task, setTask] = useState('');
  const [granularity, setGranularity] = useState<'coarse' | 'medium' | 'fine' | 'micro'>('medium');
  const [currentEnergy, setCurrentEnergy] = useState<SpoonLevel | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MagicBreakdownResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const GRANULARITY_OPTIONS = [
    { value: 'coarse' as const, label: 'Big Steps', emoji: '🦣', desc: '3-4 steps' },
    { value: 'medium' as const, label: 'Medium', emoji: '🐕', desc: '5-7 steps' },
    { value: 'fine' as const, label: 'Small', emoji: '🐈', desc: '8-10 steps' },
    { value: 'micro' as const, label: 'Tiny', emoji: '🐛', desc: '10-15 steps' },
  ];

  const ENERGY_OPTIONS: { value: SpoonLevel; emoji: string }[] = [
    { value: 1, emoji: '😴' },
    { value: 2, emoji: '😔' },
    { value: 3, emoji: '😐' },
    { value: 4, emoji: '🙂' },
    { value: 5, emoji: '😄' },
  ];

  const handleBreakdown = async () => {
    if (!task.trim()) {
      setError('Please enter a task to break down');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const breakdownResult = await magicBreakdown({
        task: task.trim(),
        granularity,
        currentEnergy,
      });
      setResult(breakdownResult);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError('Failed to break down task. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToTasks = async () => {
    // TODO: Integrate with task store to create subtasks
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#667EEA', '#764BA2']}
        style={styles.headerGradient}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerEmoji}>🪄</Text>
        <Text style={styles.headerTitle}>Magic Breakdown</Text>
        <Text style={styles.headerSubtitle}>
          Transform overwhelming tasks into tiny, doable steps
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!result ? (
          <>
            {/* Task Input */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.inputSection}>
              <Text style={styles.label}>What task feels overwhelming?</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Clean my entire apartment..."
                placeholderTextColor={colors.gray[400]}
                value={task}
                onChangeText={setTask}
                multiline
                textAlignVertical="top"
              />
            </Animated.View>

            {/* Granularity */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.inputSection}>
              <Text style={styles.label}>How small should the steps be?</Text>
              <View style={styles.granularityOptions}>
                {GRANULARITY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.granularityOption,
                      granularity === option.value && styles.granularityOptionSelected,
                    ]}
                    onPress={() => setGranularity(option.value)}
                  >
                    <Text style={styles.granularityEmoji}>{option.emoji}</Text>
                    <Text style={styles.granularityLabel}>{option.label}</Text>
                    <Text style={styles.granularityDesc}>{option.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Energy Level */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.inputSection}>
              <Text style={styles.label}>Current energy level? (Optional)</Text>
              <View style={styles.energyOptions}>
                {ENERGY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.energyOption,
                      currentEnergy === option.value && styles.energyOptionSelected,
                    ]}
                    onPress={() => setCurrentEnergy(option.value)}
                  >
                    <Text style={styles.energyEmoji}>{option.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {error && <Text style={styles.error}>{error}</Text>}

            <Animated.View entering={FadeInDown.delay(400)}>
              <TouchableOpacity
                style={[styles.breakdownButton, isLoading && styles.buttonDisabled]}
                onPress={handleBreakdown}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.buttonEmoji}>✨</Text>
                    <Text style={styles.buttonText}>Break It Down</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          /* Results */
          <Animated.View entering={FadeIn}>
            {/* First Step Highlight */}
            <View style={styles.firstStepCard}>
              <Text style={styles.firstStepLabel}>🚀 Start Here (Under 2 min)</Text>
              <Text style={styles.firstStepText}>{result.smallestFirstStep}</Text>
            </View>

            {/* Encouragement */}
            <View style={styles.encouragementCard}>
              <Text style={styles.encouragementText}>{result.encouragement}</Text>
            </View>

            {/* Steps */}
            <Text style={styles.stepsTitle}>Your Steps</Text>
            {result.steps.map((step, index) => (
              <Animated.View
                key={step.id}
                entering={FadeInDown.delay(index * 80)}
                style={styles.stepCard}
              >
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepEmoji}>{step.emoji}</Text>
                  <View style={styles.stepMeta}>
                    <Text style={styles.stepTime}>~{step.estimatedMinutes}m</Text>
                    <Text style={styles.stepSpoons}>{'🥄'.repeat(step.spoons)}</Text>
                  </View>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                {step.description && (
                  <Text style={styles.stepDescription}>{step.description}</Text>
                )}
                {step.tip && (
                  <Text style={styles.stepTip}>💡 {step.tip}</Text>
                )}
              </Animated.View>
            ))}

            {/* Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total time:</Text>
                <Text style={styles.summaryValue}>~{result.totalEstimatedMinutes} min</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total energy:</Text>
                <Text style={styles.summaryValue}>
                  {'🥄'.repeat(Math.min(result.totalSpoons, 5))}
                  {result.totalSpoons > 5 ? '+' : ''}
                </Text>
              </View>
            </View>

            {/* Checkpoints */}
            {result.progressCheckpoints.length > 0 && (
              <View style={styles.checkpointsCard}>
                <Text style={styles.checkpointsTitle}>🎯 Celebration Points</Text>
                {result.progressCheckpoints.map((checkpoint, index) => (
                  <Text key={index} style={styles.checkpoint}>
                    • {checkpoint}
                  </Text>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.addTasksButton}
                onPress={handleAddToTasks}
              >
                <Text style={styles.addTasksButtonText}>Add to My Tasks</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tryAgainButton}
                onPress={() => setResult(null)}
              >
                <Text style={styles.tryAgainButtonText}>Try Different Settings</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray[800],
    minHeight: 100,
  },
  granularityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  granularityOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[50],
  },
  granularityOptionSelected: {
    borderColor: '#764BA2',
    backgroundColor: '#764BA215',
  },
  granularityEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  granularityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
  },
  granularityDesc: {
    fontSize: 10,
    color: colors.gray[500],
  },
  energyOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  energyOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[50],
  },
  energyOptionSelected: {
    borderColor: '#764BA2',
    backgroundColor: '#764BA215',
  },
  energyEmoji: {
    fontSize: 24,
  },
  error: {
    fontSize: 14,
    color: colors.danger[500],
    marginBottom: 16,
    textAlign: 'center',
  },
  breakdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#764BA2',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonEmoji: {
    fontSize: 18,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  firstStepCard: {
    backgroundColor: colors.success[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.success[200],
  },
  firstStepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success[600],
    marginBottom: 8,
  },
  firstStepText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.success[800],
  },
  encouragementCard: {
    backgroundColor: '#764BA215',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  encouragementText: {
    fontSize: 15,
    color: '#764BA2',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 12,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#764BA2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  stepMeta: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  stepTime: {
    fontSize: 12,
    color: colors.gray[500],
  },
  stepSpoons: {
    fontSize: 10,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 8,
  },
  stepTip: {
    fontSize: 13,
    color: '#764BA2',
    fontStyle: 'italic',
  },
  summaryCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
  },
  checkpointsCard: {
    backgroundColor: colors.warning[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  checkpointsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warning[700],
    marginBottom: 8,
  },
  checkpoint: {
    fontSize: 14,
    color: colors.warning[800],
    marginBottom: 4,
  },
  actions: {
    gap: 12,
  },
  addTasksButton: {
    backgroundColor: '#764BA2',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...shadows.sm,
  },
  addTasksButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tryAgainButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  tryAgainButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#764BA2',
  },
});
