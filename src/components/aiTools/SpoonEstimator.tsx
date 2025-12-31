import React, { useState, useEffect } from 'react';
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
import { SpoonEstimate, EstimateSpoonInput } from '../../types/aiTools';
import { colors, shadows } from '../../theme/colors';
import { springConfigs } from '../../utils/animations';
import { estimateSpoons } from '../../services/api/aiTools';
import { useMLStore } from '../../stores/mlStore';

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

const TIME_OF_DAY_OPTIONS = [
  { value: 'morning' as const, label: 'Morning', emoji: '🌅' },
  { value: 'afternoon' as const, label: 'Afternoon', emoji: '☀️' },
  { value: 'evening' as const, label: 'Evening', emoji: '🌆' },
  { value: 'night' as const, label: 'Night', emoji: '🌙' },
];

export const SpoonEstimator: React.FC<SpoonEstimatorProps> = ({
  initialTask = '',
  onEstimateComplete,
  onClose,
}) => {
  const [taskTitle, setTaskTitle] = useState(initialTask);
  const [taskDescription, setTaskDescription] = useState('');
  const [currentEnergy, setCurrentEnergy] = useState<number | undefined>(undefined);
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night' | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [estimate, setEstimate] = useState<SpoonEstimate | null>(null);
  const [mlPrediction, setMlPrediction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [toolUsageId, setToolUsageId] = useState<string | null>(null);

  const { predictSpoons: mlPredictSpoons, submitFeedback, patterns, fetchPatterns } = useMLStore();

  // Auto-detect time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setTimeOfDay('morning');
    else if (hour >= 12 && hour < 17) setTimeOfDay('afternoon');
    else if (hour >= 17 && hour < 21) setTimeOfDay('evening');
    else setTimeOfDay('night');
  }, []);

  // Fetch user patterns on mount for insights
  useEffect(() => {
    fetchPatterns().catch(() => {});
  }, []);

  const handleEstimate = async () => {
    if (!taskTitle.trim()) {
      setError('Please enter a task');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Run both standard and ML predictions in parallel
      const [standardResult, mlResult] = await Promise.all([
        estimateSpoons({
          task: taskTitle.trim(),
          taskTitle: taskTitle.trim(),
          taskDescription: taskDescription.trim() || undefined,
          currentEnergy,
        }),
        mlPredictSpoons(
          taskTitle.trim(),
          taskDescription.trim() || undefined,
          currentEnergy,
          timeOfDay
        ).catch(() => null),
      ]);

      // Generate a usage ID for feedback tracking
      const usageId = `spoon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToolUsageId(usageId);

      // Merge ML insights into the estimate
      if (mlResult && mlResult.isPersonalized) {
        standardResult.mlEnhanced = true;
        standardResult.confidence = mlResult.confidence;
        standardResult.basedOnHistory = mlResult.basedOnSimilarTasks;
        
        // Add ML-specific tips
        if (mlResult.personalizedTips && mlResult.personalizedTips.length > 0) {
          standardResult.suggestions = [
            ...(standardResult.suggestions || []),
            ...mlResult.personalizedTips,
          ];
        }
        
        // Add adjustment factors as additional context
        if (mlResult.adjustmentFactors && mlResult.adjustmentFactors.length > 0) {
          standardResult.mlAdjustments = mlResult.adjustmentFactors;
        }
      }

      setEstimate(standardResult);
      setMlPrediction(mlResult);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onEstimateComplete?.(standardResult);
    } catch (err) {
      setError('Failed to estimate. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (wasHelpful: boolean, actualSpoons?: number) => {
    if (!toolUsageId || feedbackGiven) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeedbackGiven(true);

    await submitFeedback(
      toolUsageId,
      wasHelpful,
      undefined,
      actualSpoons !== undefined ? { actualSpoons } : undefined
    );
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

  const getImpactColor = (impact: string | number) => {
    const impactStr = String(impact).toLowerCase();
    if (impactStr === 'high' || Number(impact) >= 4) return { bg: colors.danger[100], text: colors.danger[700] };
    if (impactStr === 'medium' || Number(impact) >= 2) return { bg: colors.warning[100], text: colors.warning[700] };
    return { bg: colors.success[100], text: colors.success[700] };
  };

  const getImpactLabel = (impact: string | number) => {
    if (typeof impact === 'string') return impact.toUpperCase();
    if (impact >= 4) return 'HIGH';
    if (impact >= 2) return 'MEDIUM';
    return 'LOW';
  };

  const renderMLBadge = () => {
    if (!mlPrediction?.isPersonalized) return null;

    return (
      <Animated.View entering={FadeIn} style={styles.mlBadge}>
        <Text style={styles.mlBadgeIcon}>🧠</Text>
        <Text style={styles.mlBadgeText}>
          Personalized • Based on {mlPrediction.basedOnSimilarTasks} similar tasks
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
        <Text style={styles.confidenceLabel}>Confidence</Text>
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

  const renderMLAdjustments = () => {
    if (!mlPrediction?.adjustmentFactors || mlPrediction.adjustmentFactors.length === 0) return null;

    return (
      <Animated.View entering={FadeInDown.delay(200)} style={styles.adjustmentsCard}>
        <Text style={styles.adjustmentsTitle}>🎯 Personalized Adjustments</Text>
        {mlPrediction.adjustmentFactors.map((adj: { factor: string; adjustment: number; reason: string }, index: number) => (
          <View key={index} style={styles.adjustment}>
            <View style={styles.adjustmentHeader}>
              <Text style={styles.adjustmentFactor}>{adj.factor}</Text>
              <Text style={[
                styles.adjustmentValue,
                { color: adj.adjustment > 0 ? colors.danger[500] : colors.success[500] }
              ]}>
                {adj.adjustment > 0 ? '+' : ''}{adj.adjustment} spoon
              </Text>
            </View>
            <Text style={styles.adjustmentReason}>{adj.reason}</Text>
          </View>
        ))}
      </Animated.View>
    );
  };

  const renderFeedbackSection = () => {
    if (!estimate) return null;

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

  const renderPatternInsight = () => {
    if (!patterns || patterns.insights.length === 0) return null;

    // Show a relevant insight
    const relevantInsight = patterns.insights.find(i => 
      i.toLowerCase().includes('energy') || i.toLowerCase().includes('productive')
    ) || patterns.insights[0];

    return (
      <Animated.View entering={FadeInDown.delay(50)} style={styles.insightBanner}>
        <Text style={styles.insightIcon}>💡</Text>
        <Text style={styles.insightText}>{relevantInsight}</Text>
      </Animated.View>
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
        {mlPrediction?.isPersonalized && (
          <View style={styles.personalizedBadge}>
            <Text style={styles.personalizedBadgeText}>🧠 ML-Enhanced</Text>
          </View>
        )}
      </Animated.View>

      {!estimate ? (
        <>
          {/* Pattern Insight Banner */}
          {renderPatternInsight()}

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

          {/* Time of Day (auto-detected but adjustable) */}
          <Animated.View entering={FadeInDown.delay(350)} style={styles.inputGroup}>
            <Text style={styles.label}>When will you do this? (Auto-detected)</Text>
            <View style={styles.timeSelector}>
              {TIME_OF_DAY_OPTIONS.map(({ value, label, emoji }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.timeOption,
                    timeOfDay === value && styles.timeOptionSelected,
                  ]}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTimeOfDay(value);
                  }}
                >
                  <Text style={styles.timeEmoji}>{emoji}</Text>
                  <Text style={[
                    styles.timeLabel,
                    timeOfDay === value && styles.timeLabelSelected
                  ]}>
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
          {/* ML Badge */}
          {renderMLBadge()}

          {/* Spoon Count */}
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Energy Cost</Text>
            {renderSpoonMeter(estimate.spoons ?? 3)}
            <Text style={[styles.resultValue, { color: getSpoonColor(estimate.spoons ?? 3) }]}>
              {estimate.label}
            </Text>
            <Text style={styles.resultEmoji}>{estimate.emoji ?? '🥄🥄🥄'}</Text>
            {renderConfidenceIndicator()}
          </View>

          {/* Explanation */}
          <View style={styles.explanationCard}>
            <Text style={styles.explanationText}>{estimate.explanation ?? 'Energy cost estimated based on task complexity.'}</Text>
          </View>

          {/* ML Adjustments */}
          {renderMLAdjustments()}

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
                {!['easy', 'manageable', 'challenging', 'difficult'].includes(estimate.feasibility) && estimate.feasibility}
              </Text>
              {estimate.adjustedSuggestion && (
                <Text style={styles.feasibilitySuggestion}>
                  {estimate.adjustedSuggestion}
                </Text>
              )}
            </View>
          )}

          {/* Suggestions */}
          {estimate.suggestions && estimate.suggestions.length > 0 && (
            <View style={styles.suggestionsCard}>
              <Text style={styles.suggestionsTitle}>💡 Tips to Make It Easier</Text>
              {estimate.suggestions.map((suggestion, index) => (
                <View key={index} style={styles.suggestion}>
                  <Text style={styles.suggestionBullet}>•</Text>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Feedback Section */}
          {renderFeedbackSection()}

          {/* Try Another */}
          <TouchableOpacity
            style={styles.tryAnotherButton}
            onPress={() => {
              setEstimate(null);
              setMlPrediction(null);
              setTaskTitle('');
              setTaskDescription('');
              setFeedbackGiven(false);
              setToolUsageId(null);
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
  timeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  timeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[50],
  },
  timeOptionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  timeEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[600],
  },
  timeLabelSelected: {
    color: colors.primary[700],
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  insightIcon: {
    fontSize: 16,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary[700],
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
  // ML Badge styles
  mlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
    alignSelf: 'center',
    gap: 6,
  },
  mlBadgeIcon: {
    fontSize: 14,
  },
  mlBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[700],
  },
  // Confidence indicator
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
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
  // ML Adjustments card
  adjustmentsCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  adjustmentsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary[700],
    marginBottom: 12,
  },
  adjustment: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[100],
  },
  adjustmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  adjustmentFactor: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[800],
  },
  adjustmentValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  adjustmentReason: {
    fontSize: 12,
    color: colors.primary[600],
  },
  // Feedback styles
  feedbackCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
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
  feedbackButtonEmoji: {
    fontSize: 16,
  },
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
    marginBottom: 16,
    gap: 8,
  },
  feedbackThanksEmoji: {
    fontSize: 18,
  },
  feedbackThanksText: {
    fontSize: 14,
    color: colors.success[700],
  },
  // Existing result styles
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

