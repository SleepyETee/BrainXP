import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SpoonEstimate, SpoonLevel, EstimateSpoonInput } from '../../types/aiTools';
import { colors, shadows } from '../../theme/colors';
import { springConfigs } from '../../utils/animations';
import { estimateSpoons } from '../../services/api/aiTools';

interface SpoonEstimatorProps {
  initialTask?: string;
  onEstimateComplete?: (estimate: SpoonEstimate) => void;
  onClose?: () => void;
}

const ENERGY_LEVELS: { level: number; label: string; emoji: string; color: string }[] = [
  { level: 1, label: 'Very Low', emoji: '😴', color: colors.danger[500] },
  { level: 2, label: 'Low', emoji: '😔', color: colors.warning[500] },
  { level: 3, label: 'Moderate', emoji: '😐', color: colors.gray[500] },
  { level: 4, label: 'Good', emoji: '🙂', color: colors.success[500] },
  { level: 5, label: 'Great', emoji: '😄', color: colors.primary[500] },
];

export const SpoonEstimator: React.FC<SpoonEstimatorProps> = ({
  initialTask = '',
  onEstimateComplete,
  onClose,
}) => {
  const [taskTitle, setTaskTitle] = useState(initialTask);
  const [taskDescription, setTaskDescription] = useState('');
  const [currentEnergy, setCurrentEnergy] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [estimate, setEstimate] = useState<SpoonEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEstimate = async () => {
    if (!taskTitle.trim()) {
      setError('Please enter a task');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const input: EstimateSpoonInput = {
        task: taskTitle.trim(),
        taskTitle: taskTitle.trim(),
        taskDescription: taskDescription.trim() || undefined,
        currentEnergy,
      };

      const result = await estimateSpoons(input);
      setEstimate(result);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onEstimateComplete?.(result);
    } catch (err) {
      setError('Failed to estimate. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSpoonColor = (spoons: number) => {
    if (spoons <= 1) return colors.success[500];
    if (spoons <= 2) return colors.success[400];
    if (spoons <= 3) return colors.warning[500];
    if (spoons <= 4) return colors.warning[600];
    return colors.danger[500];
  };

  const renderSpoonMeter = (spoons: number) => {
    return (
      <View style={styles.spoonMeter}>
        {[1, 2, 3, 4, 5].map((level) => (
          <Animated.View
            key={level}
            entering={FadeInDown.delay(level * 100)}
            style={[
              styles.spoon,
              {
                backgroundColor: level <= spoons ? getSpoonColor(spoons) : colors.gray[200],
                opacity: level <= spoons ? 1 : 0.3,
              },
            ]}
          >
            <Text style={styles.spoonEmoji}>🥄</Text>
          </Animated.View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Animated.View entering={FadeIn} style={styles.header}>
        <Text style={styles.title}>🥄 Spoon Estimator</Text>
        <Text style={styles.subtitle}>
          Estimate how much energy this task will take
        </Text>
      </Animated.View>

      {!estimate ? (
        <>
          {/* Task Input */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.inputGroup}>
            <Text style={styles.label}>What task do you want to estimate?</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Clean the kitchen, Write a report..."
              placeholderTextColor={colors.gray[400]}
              value={taskTitle}
              onChangeText={setTaskTitle}
            />
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.inputGroup}>
            <Text style={styles.label}>Any additional details? (Optional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Add context to get a more accurate estimate..."
              placeholderTextColor={colors.gray[400]}
              value={taskDescription}
              onChangeText={setTaskDescription}
              multiline
              textAlignVertical="top"
            />
          </Animated.View>

          {/* Current Energy */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.inputGroup}>
            <Text style={styles.label}>How's your energy right now? (Optional)</Text>
            <View style={styles.energySelector}>
              {ENERGY_LEVELS.map(({ level, label, emoji, color }) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.energyOption,
                    currentEnergy === level && { borderColor: color, backgroundColor: `${color}15` },
                  ]}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCurrentEnergy(level);
                  }}
                >
                  <Text style={styles.energyEmoji}>{emoji}</Text>
                  <Text style={[styles.energyLabel, currentEnergy === level && { color }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Error */}
          {error && (
            <Text style={styles.error}>{error}</Text>
          )}

          {/* Estimate Button */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <TouchableOpacity
              style={[styles.estimateButton, isLoading && styles.estimateButtonDisabled]}
              onPress={handleEstimate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.estimateButtonEmoji}>✨</Text>
                  <Text style={styles.estimateButtonText}>Estimate Spoons</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </>
      ) : (
        /* Results */
        <Animated.View entering={FadeIn}>
          {/* Spoon Count */}
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Energy Cost</Text>
            {renderSpoonMeter(estimate.spoons ?? estimate.spoonsCost ?? 3)}
            <Text style={[styles.resultValue, { color: getSpoonColor(estimate.spoons ?? estimate.spoonsCost ?? 3) }]}>
              {estimate.label}
            </Text>
            <Text style={styles.resultEmoji}>{estimate.emoji}</Text>
          </View>

          {/* Explanation */}
          <View style={styles.explanationCard}>
            <Text style={styles.explanationText}>{estimate.explanation}</Text>
          </View>

          {/* Factors */}
          {estimate.factors && estimate.factors.length > 0 && (
            <View style={styles.factorsCard}>
              <Text style={styles.factorsTitle}>🔍 Contributing Factors</Text>
              {estimate.factors.map((factor, index) => (
                <View key={index} style={styles.factor}>
                  <View style={styles.factorHeader}>
                    <Text style={styles.factorName}>{factor.name}</Text>
                    <View
                      style={[
                        styles.factorImpact,
                        {
                          backgroundColor:
                            factor.impact === 'high'
                              ? colors.danger[100]
                              : factor.impact === 'medium'
                              ? colors.warning[100]
                              : colors.success[100],
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.factorImpactText,
                          {
                            color:
                              factor.impact === 'high'
                                ? colors.danger[700]
                                : factor.impact === 'medium'
                                ? colors.warning[700]
                                : colors.success[700],
                          },
                        ]}
                      >
                        {factor.impact.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.factorDescription}>{factor.description}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Feasibility */}
          {estimate.feasibility && typeof estimate.feasibility === 'string' && (
            <View style={styles.feasibilityCard}>
              <Text style={styles.feasibilityTitle}>📊 Based on Your Energy</Text>
              <Text style={styles.feasibilityValue}>
                {estimate.feasibility === 'easy' && '✅ Easy - You got this!'}
                {estimate.feasibility === 'manageable' && '👍 Manageable - Pace yourself'}
                {estimate.feasibility === 'challenging' && '⚠️ Challenging - Consider breaking it down'}
                {estimate.feasibility === 'difficult' && '🚨 Difficult - Maybe save for later'}
              </Text>
              {estimate.adjustedSuggestion && (
                <Text style={styles.feasibilitySuggestion}>
                  {estimate.adjustedSuggestion}
                </Text>
              )}
            </View>
          )}

          {/* Suggestions */}
          {(estimate.suggestions || estimate.tips) && (estimate.suggestions || estimate.tips)!.length > 0 && (
            <View style={styles.suggestionsCard}>
              <Text style={styles.suggestionsTitle}>💡 Tips to Make It Easier</Text>
              {(estimate.suggestions || estimate.tips)!.map((suggestion, index) => (
                <View key={index} style={styles.suggestion}>
                  <Text style={styles.suggestionBullet}>•</Text>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Try Another */}
          <TouchableOpacity
            style={styles.tryAnotherButton}
            onPress={() => {
              setEstimate(null);
              setTaskTitle('');
              setTaskDescription('');
            }}
          >
            <Text style={styles.tryAnotherText}>Estimate Another Task</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray[500],
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
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
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  energySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  energyOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[50],
  },
  energyEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  energyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[600],
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    color: colors.danger[500],
    marginBottom: 16,
    textAlign: 'center',
  },
  estimateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    ...shadows.md,
  },
  estimateButtonDisabled: {
    opacity: 0.7,
  },
  estimateButtonEmoji: {
    fontSize: 18,
  },
  estimateButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...shadows.sm,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 16,
  },
  spoonMeter: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  spoon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spoonEmoji: {
    fontSize: 20,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultEmoji: {
    fontSize: 16,
  },
  explanationCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  explanationText: {
    fontSize: 15,
    color: colors.primary[800],
    lineHeight: 22,
  },
  factorsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  factorsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 12,
  },
  factor: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  factorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  factorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  factorImpact: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  factorImpactText: {
    fontSize: 10,
    fontWeight: '700',
  },
  factorDescription: {
    fontSize: 13,
    color: colors.gray[600],
  },
  feasibilityCard: {
    backgroundColor: colors.warning[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  feasibilityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warning[700],
    marginBottom: 8,
  },
  feasibilityValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.warning[800],
    marginBottom: 8,
  },
  feasibilitySuggestion: {
    fontSize: 14,
    color: colors.warning[700],
    fontStyle: 'italic',
  },
  suggestionsCard: {
    backgroundColor: colors.success[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success[700],
    marginBottom: 12,
  },
  suggestion: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  suggestionBullet: {
    fontSize: 14,
    color: colors.success[600],
    marginRight: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: colors.success[800],
    lineHeight: 20,
  },
  tryAnotherButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  tryAnotherText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[600],
  },
});

export default SpoonEstimator;
