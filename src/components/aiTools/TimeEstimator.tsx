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
import { estimateTime } from '../../services/api/aiTools';
import { TimeEstimate } from '../../types/aiTools';
import { colors, shadows } from '../../theme/colors';

type Complexity = 'simple' | 'moderate' | 'complex';

interface TimeEstimatorProps {
  initialTask?: string;
  initialComplexity?: Complexity;
  onEstimateComplete?: (estimate: TimeEstimate) => void;
}

const COMPLEXITY_OPTIONS: { value: Complexity; label: string; emoji: string }[] = [
  { value: 'simple', label: 'Simple', emoji: '🟢' },
  { value: 'moderate', label: 'Moderate', emoji: '🟡' },
  { value: 'complex', label: 'Complex', emoji: '🔴' },
];

export const TimeEstimator: React.FC<TimeEstimatorProps> = ({
  initialTask = '',
  initialComplexity = 'moderate',
  onEstimateComplete,
}) => {
  const [task, setTask] = useState(initialTask);
  const [complexity, setComplexity] = useState<Complexity>(initialComplexity);
  const [result, setResult] = useState<TimeEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleEstimate = async () => {
    if (!task.trim()) {
      setError('Add a task to estimate.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const estimate = await estimateTime({
        taskTitle: task.trim(),
        taskDescription: task.trim(),
        complexity,
      });
      setResult(estimate);
      onEstimateComplete?.(estimate);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError('Could not estimate right now. Try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>⏱️ Time Estimator</Text>
      <Text style={styles.subtitle}>Realistic time ranges with ADHD-aware buffers.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Task</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Write project update"
          placeholderTextColor={colors.gray[400]}
          value={task}
          onChangeText={setTask}
          multiline
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Complexity</Text>
        <View style={styles.complexityRow}>
          {COMPLEXITY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.complexityChip,
                complexity === option.value && styles.complexityChipActive,
              ]}
              onPress={() => setComplexity(option.value)}
            >
              <Text style={styles.complexityEmoji}>{option.emoji}</Text>
              <Text
                style={[
                  styles.complexityText,
                  complexity === option.value && styles.complexityTextActive,
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
          onPress={handleEstimate}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Estimate Time</Text>}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Your estimate</Text>
          <Text style={styles.mainEstimate}>{formatTime(result.estimatedMinutes)}</Text>
          <Text style={styles.confidence}>Confidence: {result.confidence?.toUpperCase?.() || 'MEDIUM'}</Text>

          <View style={styles.rangeRow}>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>Best case</Text>
              <Text style={styles.rangeValue}>{formatTime(result.minMinutes)}</Text>
            </View>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>Buffer</Text>
              <Text style={styles.rangeValue}>{formatTime(result.maxMinutes)}</Text>
            </View>
          </View>

          {result.breakdown && (
            <View style={styles.breakdown}>
              <Text style={styles.breakdownTitle}>Breakdown</Text>
              {result.breakdown.map((item, idx) => (
                <View key={`${item.phase}-${idx}`} style={styles.breakdownRow}>
                  <Text style={styles.breakdownPhase}>{item.phase}</Text>
                  <Text style={styles.breakdownMinutes}>{formatTime(item.minutes)}</Text>
                </View>
              ))}
            </View>
          )}

          {result.tips && (
            <View style={styles.tips}>
              {result.tips.map((tip, idx) => (
                <Text key={idx} style={styles.tip}>
                  • {tip}
                </Text>
              ))}
            </View>
          )}
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
    minHeight: 60,
    color: colors.gray[800],
    backgroundColor: colors.gray[50],
  },
  complexityRow: { flexDirection: 'row', gap: 8 },
  complexityChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  complexityChipActive: {
    borderColor: colors.primary[500],
    backgroundColor: `${colors.primary[500]}15`,
  },
  complexityEmoji: { fontSize: 16, marginBottom: 4 },
  complexityText: { fontSize: 13, color: colors.gray[700] },
  complexityTextActive: { color: colors.primary[700], fontWeight: '700' },
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
  resultTitle: { fontSize: 15, fontWeight: '700', color: colors.gray[800] },
  mainEstimate: { fontSize: 32, fontWeight: '800', color: colors.gray[900] },
  confidence: { fontSize: 12, color: colors.gray[500] },
  rangeRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  rangeItem: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: colors.gray[50] },
  rangeLabel: { fontSize: 12, color: colors.gray[500] },
  rangeValue: { fontSize: 16, fontWeight: '700', color: colors.gray[800] },
  breakdown: { gap: 6, marginTop: 6 },
  breakdownTitle: { fontWeight: '700', color: colors.gray[700] },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownPhase: { color: colors.gray[700] },
  breakdownMinutes: { fontWeight: '700', color: colors.gray[800] },
  tips: { gap: 4, marginTop: 6 },
  tip: { color: colors.gray[700], fontSize: 13 },
});

export default TimeEstimator;
