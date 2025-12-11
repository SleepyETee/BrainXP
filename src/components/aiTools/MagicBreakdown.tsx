import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { magicBreakdown } from '../../services/api/aiTools';
import { MagicBreakdownResult, SpoonLevel } from '../../types/aiTools';
import { colors, shadows } from '../../theme/colors';

type Granularity = 'coarse' | 'medium' | 'fine' | 'micro';

interface MagicBreakdownProps {
  initialTask?: string;
  initialGranularity?: Granularity;
  energyLevel?: SpoonLevel;
  onBreakdownComplete?: (result: MagicBreakdownResult) => void;
}

const GRANULARITY_OPTIONS: { value: Granularity; label: string; emoji: string }[] = [
  { value: 'coarse', label: 'Big steps', emoji: '🦣' },
  { value: 'medium', label: 'Manageable', emoji: '🐕' },
  { value: 'fine', label: 'Small', emoji: '🐈' },
  { value: 'micro', label: 'Tiny', emoji: '🐛' },
];

export const MagicBreakdown: React.FC<MagicBreakdownProps> = ({
  initialTask = '',
  initialGranularity = 'medium',
  energyLevel,
  onBreakdownComplete,
}) => {
  const [task, setTask] = useState(initialTask);
  const [granularity, setGranularity] = useState<Granularity>(initialGranularity);
  const [result, setResult] = useState<MagicBreakdownResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBreakdown = async () => {
    if (!task.trim()) {
      setError('Add a task to break down.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const breakdown = await magicBreakdown({
        task: task.trim(),
        granularity,
        currentEnergy: energyLevel,
      });
      setResult(breakdown);
      onBreakdownComplete?.(breakdown);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError('Could not break this down right now.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🪄 Magic Breakdown</Text>
      <Text style={styles.subtitle}>Turn an overwhelming task into tiny, doable steps.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Task</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Clean the apartment"
          placeholderTextColor={colors.gray[400]}
          value={task}
          onChangeText={setTask}
          multiline
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Granularity</Text>
        <View style={styles.options}>
          {GRANULARITY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                granularity === option.value && styles.optionActive,
              ]}
              onPress={() => setGranularity(option.value)}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <Text
                style={[
                  styles.optionText,
                  granularity === option.value && styles.optionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleBreakdown}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Break It Down</Text>}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Smallest first step</Text>
          <Text style={styles.firstStep}>{result.smallestFirstStep}</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total time</Text>
            <Text style={styles.summaryValue}>~{result.totalEstimatedMinutes}m</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total spoons</Text>
            <Text style={styles.summaryValue}>
              {'🥄'.repeat(Math.min(result.totalSpoons, 5))}
              {result.totalSpoons > 5 ? '+' : ''}
            </Text>
          </View>

          <Text style={styles.stepsHeader}>Steps</Text>
          {result.steps.map((step, idx) => (
            <View key={step.id || idx} style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepNumber}>{idx + 1}</Text>
                <Text style={styles.stepEmoji}>{step.emoji || '✨'}</Text>
                <Text style={styles.stepTime}>~{step.estimatedMinutes}m</Text>
                <Text style={styles.stepSpoons}>{'🥄'.repeat(step.spoons || 1)}</Text>
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              {step.description && <Text style={styles.stepDescription}>{step.description}</Text>}
              {step.tip && <Text style={styles.stepTip}>💡 {step.tip}</Text>}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.gray[900] },
  subtitle: { fontSize: 14, color: colors.gray[600] },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...shadows.sm,
    gap: 8,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray[700] },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    color: colors.gray[800],
    backgroundColor: colors.gray[50],
  },
  options: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  optionActive: {
    borderColor: colors.primary[500],
    backgroundColor: `${colors.primary[500]}15`,
  },
  optionEmoji: { fontSize: 18, marginBottom: 2 },
  optionText: { fontSize: 13, color: colors.gray[700] },
  optionTextActive: { color: colors.primary[700], fontWeight: '700' },
  button: {
    marginTop: 8,
    backgroundColor: colors.primary[600],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: colors.danger[500], marginTop: 4 },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...shadows.sm,
    gap: 8,
  },
  resultTitle: { fontSize: 14, fontWeight: '700', color: colors.gray[800] },
  firstStep: { fontSize: 16, fontWeight: '700', color: colors.success[700] },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: colors.gray[600] },
  summaryValue: { fontWeight: '700', color: colors.gray[800] },
  stepsHeader: { fontSize: 15, fontWeight: '700', color: colors.gray[800], marginTop: 8 },
  stepCard: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
  },
  stepEmoji: { fontSize: 16 },
  stepTime: { marginLeft: 'auto', color: colors.gray[600] },
  stepSpoons: { marginLeft: 6, color: colors.gray[600], fontSize: 12 },
  stepTitle: { marginTop: 4, fontWeight: '700', color: colors.gray[900] },
  stepDescription: { color: colors.gray[700], marginTop: 2 },
  stepTip: { color: colors.primary[700], marginTop: 4 },
});

export default MagicBreakdown;
