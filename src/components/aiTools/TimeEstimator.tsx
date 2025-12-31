import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { estimateTime } from '../../services/api/aiTools';
import { TimeEstimate } from '../../types/aiTools';
import { colors, shadows } from '../../theme/colors';
import { useMLStore } from '../../stores/mlStore';

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
  const [mlPrediction, setMlPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [toolUsageId, setToolUsageId] = useState<string | null>(null);

  const { predictTime: mlPredictTime, submitFeedback, patterns, fetchPatterns } = useMLStore();

  useEffect(() => {
    fetchPatterns().catch(() => {});
  }, []);

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
      const [standardResult, mlResult] = await Promise.all([
        estimateTime({
          taskTitle: task.trim(),
          taskDescription: task.trim(),
          complexity,
        }),
        mlPredictTime(
          task.trim(),
          task.trim(),
          undefined
        ).catch(() => null),
      ]);

      const usageId = `time-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToolUsageId(usageId);

      if (mlResult && mlResult.isPersonalized) {
        standardResult.mlEnhanced = true;
        standardResult.mlConfidence = mlResult.confidence;
        standardResult.basedOnHistory = mlResult.similarTasksAnalyzed;

        if (mlResult.userAccuracyFactor !== 1) {
          standardResult.mlAdjustedMinutes = mlResult.predictedMinutes;
          standardResult.accuracyFactor = mlResult.userAccuracyFactor;
        }

        if (mlResult.personalizedBreakdown && mlResult.personalizedBreakdown.length > 0) {
          standardResult.mlBreakdown = mlResult.personalizedBreakdown;
        }

        if (mlResult.context && mlResult.context.length > 0) {
          standardResult.tips = [
            ...(standardResult.tips || []),
            ...mlResult.context,
          ];
        }
      }

      setResult(standardResult);
      setMlPrediction(mlResult);
      onEstimateComplete?.(standardResult);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError('Could not estimate right now. Try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (wasHelpful: boolean, actualMinutes?: number) => {
    if (!toolUsageId || feedbackGiven) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeedbackGiven(true);

    await submitFeedback(
      toolUsageId,
      wasHelpful,
      undefined,
      actualMinutes !== undefined ? { actualMinutes } : undefined
    );
  };

  const handleReset = () => {
    setResult(null);
    setMlPrediction(null);
    setTask('');
    setFeedbackGiven(false);
    setToolUsageId(null);
  };

  const renderMLBadge = () => {
    if (!mlPrediction?.isPersonalized) return null;

    return (
      <Animated.View entering={FadeIn} style={styles.mlBadge}>
        <Text style={styles.mlBadgeIcon}>🧠</Text>
        <Text style={styles.mlBadgeText}>
          Personalized • Based on {mlPrediction.similarTasksAnalyzed} similar tasks
        </Text>
      </Animated.View>
    );
  };

  const renderConfidenceIndicator = () => {
    if (!mlPrediction) return null;

    const confidence = mlPrediction.confidence;
    const confidencePercent = Math.round(confidence * 100);
    const confidenceColor = confidence >= 0.7 
      ? colors.success[500] 
      : confidence >= 0.4 
        ? colors.warning[500] 
        : colors.gray[400];

    return (
      <View style={styles.confidenceContainer}>
        <Text style={styles.confidenceLabel}>ML Confidence</Text>
        <View style={styles.confidenceBar}>
          <View 
            style={[
              styles.confidenceFill, 
              { width: `${confidencePercent}%`, backgroundColor: confidenceColor }
            ]} 
          />
        </View>
        <Text style={[styles.confidenceText, { color: confidenceColor }]}>
          {confidencePercent}%
        </Text>
      </View>
    );
  };

  const renderAccuracyInsight = () => {
    if (!mlPrediction || mlPrediction.userAccuracyFactor === 1) return null;

    const factor = mlPrediction.userAccuracyFactor;
    const isOverestimator = factor < 1;
    
    return (
      <Animated.View entering={FadeInDown.delay(100)} style={styles.accuracyCard}>
        <Text style={styles.accuracyTitle}>
          {isOverestimator ? '⚡ You tend to overestimate' : '⏰ You tend to underestimate'}
        </Text>
        <Text style={styles.accuracyText}>
          {isOverestimator 
            ? `Tasks typically take ${Math.round((1 - factor) * 100)}% less time than you think.`
            : `Tasks typically take ${Math.round((factor - 1) * 100)}% more time than you think.`
          }
        </Text>
        {mlPrediction.predictedMinutes && (
          <Text style={styles.accuracyAdjusted}>
            Adjusted estimate: <Text style={styles.accuracyValue}>{formatTime(mlPrediction.predictedMinutes)}</Text>
          </Text>
        )}
      </Animated.View>
    );
  };

  const renderMLBreakdown = () => {
    if (!mlPrediction?.personalizedBreakdown || mlPrediction.personalizedBreakdown.length === 0) return null;

    return (
      <Animated.View entering={FadeInDown.delay(200)} style={styles.mlBreakdownCard}>
        <Text style={styles.mlBreakdownTitle}>🎯 Personalized Breakdown</Text>
        {mlPrediction.personalizedBreakdown.map((phase: { phase: string; minutes: number; basedOn: string }, index: number) => (
          <View key={index} style={styles.mlBreakdownRow}>
            <View style={styles.mlBreakdownInfo}>
              <Text style={styles.mlBreakdownPhase}>{phase.phase}</Text>
              <Text style={styles.mlBreakdownBasis}>{phase.basedOn}</Text>
            </View>
            <Text style={styles.mlBreakdownMinutes}>{formatTime(phase.minutes)}</Text>
          </View>
        ))}
      </Animated.View>
    );
  };

  const renderPatternInsight = () => {
    if (!patterns || !result) return null;

    if (patterns.estimationAccuracy && patterns.estimationAccuracy !== 1) {
      const accuracy = Math.round(patterns.estimationAccuracy * 100);
      return (
        <Animated.View entering={FadeInDown.delay(50)} style={styles.insightBanner}>
          <Text style={styles.insightIcon}>📊</Text>
          <Text style={styles.insightText}>
            Your estimation accuracy: {accuracy}% • 
            {accuracy > 80 ? " You're great at estimating!" : " We've adjusted for this."}
          </Text>
        </Animated.View>
      );
    }

    return null;
  };

  const renderFeedbackSection = () => {
    if (!result) return null;

    if (feedbackGiven) {
      return (
        <Animated.View entering={FadeIn} style={styles.feedbackThanks}>
          <Text style={styles.feedbackThanksEmoji}>🙏</Text>
          <Text style={styles.feedbackThanksText}>
            Thanks! Your feedback helps improve predictions.
          </Text>
        </Animated.View>
      );
    }

    return (
      <Animated.View entering={FadeInDown.delay(400)} style={styles.feedbackCard}>
        <Text style={styles.feedbackTitle}>Was this estimate helpful?</Text>
        <View style={styles.feedbackButtons}>
          <TouchableOpacity
            style={[styles.feedbackButton, styles.feedbackButtonPositive]}
            onPress={() => handleFeedback(true)}
          >
            <Text style={styles.feedbackButtonEmoji}>👍</Text>
            <Text style={styles.feedbackButtonText}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.feedbackButton, styles.feedbackButtonNegative]}
            onPress={() => handleFeedback(false)}
          >
            <Text style={styles.feedbackButtonEmoji}>👎</Text>
            <Text style={styles.feedbackButtonText}>No</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.feedbackHint}>
          Your feedback improves future predictions
        </Text>
      </Animated.View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>⏱️ Time Estimator</Text>
        <Text style={styles.subtitle}>Realistic time ranges with ADHD-aware buffers.</Text>
        {mlPrediction?.isPersonalized && (
          <View style={styles.personalizedBadge}>
            <Text style={styles.personalizedBadgeText}>🧠 ML-Enhanced</Text>
          </View>
        )}
      </View>

      {!result ? (
        <>
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
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setComplexity(option.value);
                  }}
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
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonEmoji}>✨</Text>
                  <Text style={styles.buttonText}>Estimate Time</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Animated.View entering={FadeIn}>
          {renderMLBadge()}

          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Your estimate</Text>
            <Text style={styles.mainEstimate}>{formatTime(result.estimatedMinutes)}</Text>
            
            {mlPrediction?.isPersonalized && mlPrediction.predictedMinutes !== result.estimatedMinutes && (
              <Text style={styles.mlAdjustedEstimate}>
                🧠 ML suggests: {formatTime(mlPrediction.predictedMinutes)}
              </Text>
            )}
            
            <Text style={styles.confidence}>Confidence: {result.confidence?.toUpperCase?.() || 'MEDIUM'}</Text>

            {renderConfidenceIndicator()}

            <View style={styles.rangeRow}>
              <View style={styles.rangeItem}>
                <Text style={styles.rangeLabel}>Best case</Text>
                <Text style={styles.rangeValue}>{formatTime(result.minMinutes)}</Text>
              </View>
              <View style={styles.rangeItem}>
                <Text style={styles.rangeLabel}>Buffer</Text>
                <Text style={styles.rangeValue}>{formatTime(result.maxMinutes)}</Text>
              </View>
              {mlPrediction?.lowerBound && mlPrediction?.upperBound && (
                <View style={[styles.rangeItem, styles.rangeItemML]}>
                  <Text style={styles.rangeLabel}>🧠 ML Range</Text>
                  <Text style={styles.rangeValue}>
                    {formatTime(mlPrediction.lowerBound)}-{formatTime(mlPrediction.upperBound)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {renderPatternInsight()}

          {renderAccuracyInsight()}

          {renderMLBreakdown()}

          {result.breakdown && (
            <Animated.View entering={FadeInDown.delay(150)} style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>📋 Standard Breakdown</Text>
              {result.breakdown.map((item, idx) => (
                <View key={`${item.phase}-${idx}`} style={styles.breakdownRow}>
                  <Text style={styles.breakdownPhase}>{item.phase}</Text>
                  <Text style={styles.breakdownMinutes}>{formatTime(item.minutes)}</Text>
                </View>
              ))}
            </Animated.View>
          )}

          {result.tips && result.tips.length > 0 && (
            <Animated.View entering={FadeInDown.delay(250)} style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>💡 Tips</Text>
              {result.tips.map((tip, idx) => (
                <Text key={idx} style={styles.tip}>
                  • {tip}
                </Text>
              ))}
            </Animated.View>
          )}

          {renderFeedbackSection()}

          <TouchableOpacity style={styles.tryAnotherButton} onPress={handleReset}>
            <Text style={styles.tryAnotherText}>Estimate Another Task</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  header: { marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: colors.gray[900] },
  subtitle: { fontSize: 14, color: colors.gray[600] },
  personalizedBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  personalizedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[700],
  },
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonEmoji: { fontSize: 16 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: colors.danger[500], marginTop: 4 },
  mlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
    alignSelf: 'center',
    gap: 6,
  },
  mlBadgeIcon: { fontSize: 14 },
  mlBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[700],
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    color: colors.gray[500],
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accuracyCard: {
    backgroundColor: colors.warning[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  accuracyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warning[700],
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: 13,
    color: colors.warning[600],
  },
  accuracyAdjusted: {
    fontSize: 13,
    color: colors.warning[700],
    marginTop: 8,
  },
  accuracyValue: {
    fontWeight: '700',
  },
  mlBreakdownCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  mlBreakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary[700],
    marginBottom: 12,
  },
  mlBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[100],
  },
  mlBreakdownInfo: {
    flex: 1,
  },
  mlBreakdownPhase: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[800],
  },
  mlBreakdownBasis: {
    fontSize: 11,
    color: colors.primary[500],
    fontStyle: 'italic',
  },
  mlBreakdownMinutes: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary[700],
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  insightIcon: { fontSize: 16 },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary[700],
  },
  feedbackCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 12,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  feedbackButtonPositive: {
    backgroundColor: colors.success[100],
  },
  feedbackButtonNegative: {
    backgroundColor: colors.danger[100],
  },
  feedbackButtonEmoji: { fontSize: 16 },
  feedbackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  feedbackHint: {
    fontSize: 11,
    color: colors.gray[400],
  },
  feedbackThanks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  feedbackThanksEmoji: { fontSize: 18 },
  feedbackThanksText: {
    fontSize: 14,
    color: colors.success[700],
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...shadows.sm,
    gap: 8,
    marginBottom: 12,
  },
  resultTitle: { fontSize: 15, fontWeight: '700', color: colors.gray[800] },
  mainEstimate: { fontSize: 32, fontWeight: '800', color: colors.gray[900] },
  mlAdjustedEstimate: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '600',
  },
  confidence: { fontSize: 12, color: colors.gray[500] },
  rangeRow: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  rangeItem: { flex: 1, minWidth: 80, padding: 12, borderRadius: 12, backgroundColor: colors.gray[50] },
  rangeItemML: { backgroundColor: colors.primary[50] },
  rangeLabel: { fontSize: 12, color: colors.gray[500] },
  rangeValue: { fontSize: 16, fontWeight: '700', color: colors.gray[800] },
  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    ...shadows.sm,
  },
  breakdownTitle: { fontWeight: '700', color: colors.gray[700], marginBottom: 8 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  breakdownPhase: { color: colors.gray[700] },
  breakdownMinutes: { fontWeight: '700', color: colors.gray[800] },
  tipsCard: {
    backgroundColor: colors.success[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success[700],
    marginBottom: 8,
  },
  tip: { color: colors.success[800], fontSize: 13, marginBottom: 4 },
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

export default TimeEstimator;
