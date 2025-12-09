import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { AIDecompositionResult } from '../../types/task';
import { Button } from '../ui/Button';
import { colors } from '../../theme/colors';

interface AIDecompositionProps {
  taskTitle: string;
  onDecompose: () => Promise<AIDecompositionResult>;
  onApply: (steps: AIDecompositionResult['suggestedSteps']) => Promise<void>;
  onCancel: () => void;
}

export const AIDecomposition: React.FC<AIDecompositionProps> = ({
  taskTitle,
  onDecompose,
  onApply,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [result, setResult] = useState<AIDecompositionResult | null>(null);
  const [selectedSteps, setSelectedSteps] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleDecompose = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const decomposition = await onDecompose();
      setResult(decomposition);
      // Select all steps by default
      setSelectedSteps(new Set(decomposition.suggestedSteps.map((_, i) => i)));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError('Unable to break down task. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStep = (index: number) => {
    const newSelected = new Set(selectedSteps);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSteps(newSelected);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleApply = async () => {
    if (!result) return;

    setIsApplying(true);
    try {
      const selectedStepData = result.suggestedSteps.filter((_, i) =>
        selectedSteps.has(i)
      );
      await onApply(selectedStepData);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError('Failed to create subtasks. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const getTotalTime = () => {
    if (!result) return 0;
    return result.suggestedSteps
      .filter((_, i) => selectedSteps.has(i))
      .reduce((sum, step) => sum + step.estimatedMinutes, 0);
  };

  // Initial state - show decompose button
  if (!result && !isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sparkle}>✨</Text>
          <Text style={styles.title}>Break It Down</Text>
        </View>

        <Text style={styles.description}>
          Feeling overwhelmed? Let AI help break "{taskTitle}" into smaller, manageable steps.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.actions}>
          <Button
            title="Cancel"
            variant="ghost"
            onPress={onCancel}
            style={styles.cancelButton}
          />
          <Button
            title="Break It Down"
            onPress={handleDecompose}
            style={styles.decomposeButton}
          />
        </View>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Breaking down your task...</Text>
          <Text style={styles.loadingHint}>
            Analyzing complexity and creating actionable steps
          </Text>
        </View>
      </View>
    );
  }

  // Results state
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sparkle}>✨</Text>
        <Text style={styles.title}>Suggested Steps</Text>
      </View>

      <Text style={styles.description}>
        Select the steps you'd like to add as subtasks:
      </Text>

      <ScrollView style={styles.stepsList} showsVerticalScrollIndicator={false}>
        {result?.suggestedSteps.map((step, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.stepItem,
              selectedSteps.has(index) && styles.stepItemSelected,
            ]}
            onPress={() => handleToggleStep(index)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.stepCheckbox,
                selectedSteps.has(index) && styles.stepCheckboxSelected,
              ]}
            >
              {selectedSteps.has(index) && (
                <Text style={styles.stepCheckmark}>✓</Text>
              )}
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepNumber}>Step {index + 1}</Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <View style={styles.stepMeta}>
                <Text style={styles.stepTime}>~{step.estimatedMinutes} min</Text>
                {step.suggestedDate && (
                  <Text style={styles.stepDate}>{step.suggestedDate}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Selected steps:</Text>
          <Text style={styles.summaryValue}>
            {selectedSteps.size} of {result?.suggestedSteps.length}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Estimated time:</Text>
          <Text style={styles.summaryValue}>{getTotalTime()} min</Text>
        </View>
        {result && result.userTimeRatio !== 1 && (
          <Text style={styles.timeNote}>
            Based on your history, you may need {Math.round(result.userTimeRatio * 100)}% of
            estimated time
          </Text>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        <Button
          title="Cancel"
          variant="ghost"
          onPress={onCancel}
          style={styles.cancelButton}
        />
        <Button
          title={`Add ${selectedSteps.size} Subtasks`}
          onPress={handleApply}
          loading={isApplying}
          disabled={selectedSteps.size === 0}
          style={styles.applyButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sparkle: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[800],
  },
  description: {
    fontSize: 15,
    color: colors.gray[600],
    lineHeight: 22,
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray[700],
    marginTop: 16,
  },
  loadingHint: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 8,
  },
  stepsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 8,
  },
  stepItemSelected: {
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
  },
  stepCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.gray[300],
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCheckboxSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  stepCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[800],
    marginBottom: 4,
  },
  stepMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  stepTime: {
    fontSize: 13,
    color: colors.gray[500],
  },
  stepDate: {
    fontSize: 13,
    color: colors.gray[400],
  },
  summary: {
    backgroundColor: colors.gray[50],
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
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
  timeNote: {
    fontSize: 12,
    color: colors.primary[600],
    fontStyle: 'italic',
    marginTop: 8,
  },
  error: {
    fontSize: 14,
    color: colors.danger[500],
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  decomposeButton: {
    flex: 2,
  },
  applyButton: {
    flex: 2,
  },
});

export default AIDecomposition;
