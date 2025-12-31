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
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { magicBreakdown } from '../../services/api/aiTools';
import { MagicBreakdownResult, SpoonLevel } from '../../types/aiTools';
import { colors, shadows } from '../../theme/colors';
import { useMLStore } from '../../stores/mlStore';

type Granularity = 'coarse' | 'medium' | 'fine' | 'micro';

interface MagicBreakdownProps {
  initialTask?: string;
  initialGranularity?: Granularity;
  energyLevel?: SpoonLevel;
  onBreakdownComplete?: (result: MagicBreakdownResult) => void;
}

const GRANULARITY_OPTIONS: { value: Granularity; label: string; emoji: string; description: string }[] = [
  { value: 'coarse', label: 'Big steps', emoji: '🦣', description: '3-5 major phases' },
  { value: 'medium', label: 'Manageable', emoji: '🐕', description: '5-8 clear steps' },
  { value: 'fine', label: 'Small', emoji: '🐈', description: '8-12 small tasks' },
  { value: 'micro', label: 'Tiny', emoji: '🐛', description: '12+ tiny actions' },
];

export const MagicBreakdown: React.FC<MagicBreakdownProps> = ({
  initialTask = '',
  initialGranularity,
  energyLevel,
  onBreakdownComplete,
}) => {
  const [task, setTask] = useState(initialTask);
  const [granularity, setGranularity] = useState<Granularity>(initialGranularity || 'medium');
  const [result, setResult] = useState<MagicBreakdownResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ML Integration
  const [toolUsageId, setToolUsageId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [mlRecommendation, setMlRecommendation] = useState<{
    suggestedGranularity: Granularity;
    reason: string;
    confidence: number;
  } | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const { patterns, fetchPatterns, submitFeedback, getRecommendations } = useMLStore();

  // Fetch patterns and determine recommended granularity
  useEffect(() => {
    const initML = async () => {
      try {
        const userPatterns = await fetchPatterns();
        
        // Determine recommended granularity based on user patterns
        if (userPatterns && !initialGranularity) {
          let suggested: Granularity = 'medium';
          let reason = '';
          let confidence = 0.5;

          // Based on preferred task size
          if (userPatterns.preferredTaskSize === 'micro') {
            suggested = 'micro';
            reason = 'You work best with tiny, specific steps';
            confidence = 0.85;
          } else if (userPatterns.preferredTaskSize === 'small') {
            suggested = 'fine';
            reason = 'Small steps match your productivity style';
            confidence = 0.8;
          } else if (userPatterns.preferredTaskSize === 'large') {
            suggested = 'coarse';
            reason = 'You prefer bigger chunks of work';
            confidence = 0.75;
          }

          // Adjust based on current energy (if provided via energyLevel)
          if (energyLevel) {
            const spoonValue = typeof energyLevel === 'number' ? energyLevel : 
              energyLevel === 'low' ? 1 : energyLevel === 'medium' ? 3 : 5;
            
            if (spoonValue <= 2) {
              // Low energy = smaller steps
              if (suggested === 'coarse') suggested = 'medium';
              else if (suggested === 'medium') suggested = 'fine';
              else suggested = 'micro';
              reason = 'Smaller steps recommended for your current energy';
              confidence = 0.9;
            }
          }

          // Check time of day patterns
          const hour = new Date().getHours();
          const currentPeriod = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
          if (userPatterns.peakEnergyTime !== currentPeriod) {
            // Not peak time, recommend smaller steps
            if (suggested === 'coarse') suggested = 'medium';
            confidence = Math.min(confidence + 0.1, 0.95);
          }

          setMlRecommendation({ suggestedGranularity: suggested, reason, confidence });
          
          // Auto-apply if confidence is high and no initial value
          if (confidence >= 0.8 && !initialGranularity) {
            setGranularity(suggested);
          }
        }
      } catch {
        // ML features are optional, continue without them
      }
    };

    initML();
  }, [energyLevel]);

  const handleBreakdown = async () => {
    if (!task.trim()) {
      setError('Add a task to break down.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCompletedSteps(new Set());

    try {
      // Generate usage ID for tracking
      const usageId = `breakdown-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToolUsageId(usageId);
      setFeedbackGiven(false);

      const breakdown = await magicBreakdown({
        task: task.trim(),
        granularity,
        currentEnergy: energyLevel,
      });

      // Enhance result with ML data if available
      if (patterns) {
        breakdown.mlEnhanced = true;
        breakdown.personalizedInsights = [];

        // Add personalized insights
        if (patterns.peakEnergyTime) {
          const hour = new Date().getHours();
          const isPeakTime = 
            (patterns.peakEnergyTime === 'morning' && hour >= 6 && hour < 12) ||
            (patterns.peakEnergyTime === 'afternoon' && hour >= 12 && hour < 17) ||
            (patterns.peakEnergyTime === 'evening' && hour >= 17 && hour < 21);
          
          if (isPeakTime) {
            breakdown.personalizedInsights.push('Great timing! This is your peak productivity window.');
          } else {
            breakdown.personalizedInsights.push(`Consider tackling harder steps during your peak time (${patterns.peakEnergyTime}).`);
          }
        }

        if (patterns.averageTaskDuration && breakdown.totalEstimatedMinutes) {
          if (breakdown.totalEstimatedMinutes > patterns.averageTaskDuration * 2) {
            breakdown.personalizedInsights.push('This is a larger task than usual. Take breaks between steps!');
          }
        }
      }

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

  const handleStepToggle = (index: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCompletedSteps(newCompleted);
  };

  const handleFeedback = async (wasHelpful: boolean) => {
    if (!toolUsageId || feedbackGiven) return;

    setFeedbackGiven(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await submitFeedback(toolUsageId, wasHelpful, undefined, {
        taskLength: task.length,
        granularityUsed: granularity,
        stepsGenerated: result?.steps.length || 0,
        stepsCompleted: completedSteps.size,
        totalMinutes: result?.totalEstimatedMinutes,
        mlRecommendationFollowed: mlRecommendation?.suggestedGranularity === granularity,
      });
    } catch {
      // Feedback is best-effort
    }
  };

  const handleGranularityChange = async (value: Granularity) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGranularity(value);
  };

  const progressPercentage = result?.steps.length 
    ? Math.round((completedSteps.size / result.steps.length) * 100) 
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeIn}>
        <Text style={styles.title}>🪄 Magic Breakdown</Text>
        <Text style={styles.subtitle}>Turn an overwhelming task into tiny, doable steps.</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
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
        
        {/* ML Recommendation Banner */}
        {mlRecommendation && mlRecommendation.confidence >= 0.7 && (
          <Animated.View entering={FadeInDown.delay(150)} style={styles.mlBanner}>
            <Text style={styles.mlBannerIcon}>🧠</Text>
            <View style={styles.mlBannerContent}>
              <Text style={styles.mlBannerText}>
                Recommended: <Text style={styles.mlBannerHighlight}>
                  {GRANULARITY_OPTIONS.find(o => o.value === mlRecommendation.suggestedGranularity)?.label}
                </Text>
              </Text>
              <Text style={styles.mlBannerReason}>{mlRecommendation.reason}</Text>
            </View>
            {granularity !== mlRecommendation.suggestedGranularity && (
              <TouchableOpacity
                style={styles.mlApplyButton}
                onPress={() => handleGranularityChange(mlRecommendation.suggestedGranularity)}
              >
                <Text style={styles.mlApplyButtonText}>Apply</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        <View style={styles.options}>
          {GRANULARITY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                granularity === option.value && styles.optionActive,
                mlRecommendation?.suggestedGranularity === option.value && 
                  granularity !== option.value && styles.optionRecommended,
              ]}
              onPress={() => handleGranularityChange(option.value)}
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
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Break It Down</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      {result && (
        <Animated.View entering={FadeInUp.delay(100)} style={styles.resultCard}>
          {/* ML Enhanced Badge */}
          {result.mlEnhanced && (
            <View style={styles.mlBadge}>
              <Text style={styles.mlBadgeText}>🧠 Personalized</Text>
            </View>
          )}

          <Text style={styles.resultTitle}>Smallest first step</Text>
          <Text style={styles.firstStep}>{result.smallestFirstStep}</Text>

          {/* Personalized Insights */}
          {result.personalizedInsights && result.personalizedInsights.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.insightsCard}>
              <Text style={styles.insightsTitle}>🧠 Personalized Insights</Text>
              {result.personalizedInsights.map((insight: string, idx: number) => (
                <View key={idx} style={styles.insightRow}>
                  <Text style={styles.insightBullet}>💡</Text>
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Progress Tracker */}
          {completedSteps.size > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressValue}>{completedSteps.size}/{result.steps.length}</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
              </View>
            </View>
          )}

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

          <Text style={styles.stepsHeader}>Steps (tap to mark complete)</Text>
          {result.steps.map((step, idx) => (
            <TouchableOpacity
              key={step.id || idx}
              style={[
                styles.stepCard,
                completedSteps.has(idx) && styles.stepCardCompleted,
              ]}
              onPress={() => handleStepToggle(idx)}
              activeOpacity={0.7}
            >
              <View style={styles.stepHeader}>
                <View style={[
                  styles.stepCheckbox,
                  completedSteps.has(idx) && styles.stepCheckboxChecked,
                ]}>
                  {completedSteps.has(idx) && <Text style={styles.stepCheckmark}>✓</Text>}
                </View>
                <Text style={[
                  styles.stepNumber,
                  completedSteps.has(idx) && styles.stepNumberCompleted,
                ]}>
                  {idx + 1}
                </Text>
                <Text style={styles.stepEmoji}>{step.emoji || '✨'}</Text>
                <Text style={styles.stepTime}>~{step.estimatedMinutes}m</Text>
                <Text style={styles.stepSpoons}>{'🥄'.repeat(step.spoons || 1)}</Text>
              </View>
              <Text style={[
                styles.stepTitle,
                completedSteps.has(idx) && styles.stepTitleCompleted,
              ]}>
                {step.title}
              </Text>
              {step.description && (
                <Text style={[
                  styles.stepDescription,
                  completedSteps.has(idx) && styles.stepDescriptionCompleted,
                ]}>
                  {step.description}
                </Text>
              )}
              {step.tip && <Text style={styles.stepTip}>💡 {step.tip}</Text>}
            </TouchableOpacity>
          ))}

          {/* Feedback Section */}
          {!feedbackGiven ? (
            <Animated.View entering={FadeIn.delay(300)} style={styles.feedbackSection}>
              <Text style={styles.feedbackTitle}>Was this breakdown helpful?</Text>
              <View style={styles.feedbackButtons}>
                <TouchableOpacity
                  style={[styles.feedbackButton, styles.feedbackButtonPositive]}
                  onPress={() => handleFeedback(true)}
                >
                  <Text style={styles.feedbackButtonText}>👍 Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.feedbackButton, styles.feedbackButtonNegative]}
                  onPress={() => handleFeedback(false)}
                >
                  <Text style={styles.feedbackButtonText}>👎 No</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.feedbackHint}>Your feedback helps personalize future breakdowns</Text>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn} style={styles.feedbackThanks}>
              <Text style={styles.feedbackThanksText}>✨ Thanks for the feedback!</Text>
            </Animated.View>
          )}
        </Animated.View>
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
  // ML Recommendation Banner
  mlBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  mlBannerIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  mlBannerContent: {
    flex: 1,
  },
  mlBannerText: {
    fontSize: 13,
    color: colors.gray[700],
  },
  mlBannerHighlight: {
    fontWeight: '700',
    color: colors.primary[700],
  },
  mlBannerReason: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 2,
  },
  mlApplyButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mlApplyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  optionRecommended: {
    borderColor: colors.primary[300],
    borderStyle: 'dashed',
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
  mlBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  mlBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[700],
  },
  resultTitle: { fontSize: 14, fontWeight: '700', color: colors.gray[800] },
  firstStep: { fontSize: 16, fontWeight: '700', color: colors.success[700] },
  insightsCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  insightsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary[700],
    marginBottom: 8,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  insightBullet: {
    fontSize: 14,
    marginRight: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[700],
  },
  insightsContainer: {
    backgroundColor: colors.primary[50],
    borderRadius: 10,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success[700],
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success[700],
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.success[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success[500],
    borderRadius: 3,
  },
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
  stepCardCompleted: {
    backgroundColor: colors.success[50],
    borderColor: colors.success[300],
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCheckboxChecked: {
    backgroundColor: colors.success[500],
    borderColor: colors.success[500],
  },
  stepCheckmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '700',
  },
  stepNumberCompleted: {
    backgroundColor: colors.success[500],
  },
  stepEmoji: { fontSize: 16 },
  stepTime: { marginLeft: 'auto', color: colors.gray[600] },
  stepSpoons: { marginLeft: 6, color: colors.gray[600], fontSize: 12 },
  stepTitle: { marginTop: 4, fontWeight: '700', color: colors.gray[900] },
  stepTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.gray[500],
  },
  stepDescription: { color: colors.gray[700], marginTop: 2 },
  stepDescriptionCompleted: {
    color: colors.gray[400],
  },
  stepTip: { color: colors.primary[700], marginTop: 4 },
  // Feedback Section
  feedbackSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    alignItems: 'center',
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 10,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  feedbackButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  feedbackButtonPositive: {
    backgroundColor: colors.success[50],
    borderColor: colors.success[300],
  },
  feedbackButtonNegative: {
    backgroundColor: colors.gray[50],
    borderColor: colors.gray[300],
  },
  feedbackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  feedbackHint: {
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 8,
  },
  feedbackThanks: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    alignItems: 'center',
  },
  feedbackThanksText: {
    fontSize: 14,
    color: colors.success[600],
    fontWeight: '600',
  },
});

export default MagicBreakdown;
