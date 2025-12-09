import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useTherapyStore } from '../../stores/therapyStore';
import { FocusSessionPlan } from '../../types/therapy';
import * as Haptics from 'expo-haptics';

interface SessionStepReviewProps {
  planId: string;
  onComplete: () => void;
}

export const SessionStepReview: React.FC<SessionStepReviewProps> = ({
  planId,
  onComplete,
}) => {
  const {
    sessionPlans,
    markStepCompleted,
    markStepForgotten,
    completeSessionPlan,
    getRecentPerformance,
    profile,
  } = useTherapyStore();
  
  const plan = sessionPlans.find((p) => p.id === planId);
  const [reviewComplete, setReviewComplete] = useState(false);
  
  if (!plan) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Plan not found</Text>
      </View>
    );
  }
  
  const handleMarkStep = (stepId: string, completed: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (completed) {
      markStepCompleted(planId, stepId);
    } else {
      markStepForgotten(planId, stepId);
    }
  };
  
  const allStepsReviewed = plan.steps.every((s) => s.completed || s.forgotten);
  
  const handleFinishReview = () => {
    completeSessionPlan(planId);
    setReviewComplete(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  
  const { successRate, trend } = getRecentPerformance();
  const completedCount = plan.steps.filter((s) => s.completed).length;
  const totalSteps = plan.steps.length;
  const sessionSuccessRate = totalSteps > 0 ? completedCount / totalSteps : 0;
  
  if (reviewComplete) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.emoji}>
            {sessionSuccessRate >= 0.8 ? '🌟' : sessionSuccessRate >= 0.5 ? '💪' : '🌱'}
          </Text>
          <Text style={styles.title}>
            {sessionSuccessRate >= 0.8
              ? 'Great job!'
              : sessionSuccessRate >= 0.5
              ? 'Nice effort!'
              : 'Good practice!'}
          </Text>
          
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Steps remembered</Text>
              <Text style={styles.statValue}>{completedCount} / {totalSteps}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>This session</Text>
              <Text style={styles.statValue}>{Math.round(sessionSuccessRate * 100)}%</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Your average</Text>
              <Text style={styles.statValue}>{Math.round(successRate * 100)}%</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Trend</Text>
              <Text style={[styles.statValue, styles[`trend_${trend}`]]}>
                {trend === 'improving' && '📈 Improving'}
                {trend === 'stable' && '➡️ Stable'}
                {trend === 'declining' && '📉 Needs practice'}
              </Text>
            </View>
          </View>
          
          {/* Adaptive feedback */}
          <View style={styles.feedbackCard}>
            {sessionSuccessRate < 0.5 && plan.steps.length > 2 && (
              <>
                <Text style={styles.feedbackTitle}>💡 Suggestion</Text>
                <Text style={styles.feedbackText}>
                  Try using only 2 steps next time. Building up slowly is more effective
                  than struggling with too many at once.
                </Text>
              </>
            )}
            {sessionSuccessRate >= 0.9 && plan.steps.length < 5 && (
              <>
                <Text style={styles.feedbackTitle}>🎯 Challenge yourself</Text>
                <Text style={styles.feedbackText}>
                  You're doing great! Next time, try adding one more step to stretch
                  your working memory.
                </Text>
              </>
            )}
            {sessionSuccessRate >= 0.5 && sessionSuccessRate < 0.9 && (
              <>
                <Text style={styles.feedbackTitle}>🧠 Building the skill</Text>
                <Text style={styles.feedbackText}>
                  This skill transfers to real life - following multi-step instructions,
                  keeping track of a conversation, or planning your day.
                </Text>
              </>
            )}
          </View>
          
          <View style={styles.capacityInfo}>
            <Text style={styles.capacityLabel}>
              Your current capacity: {profile?.workingMemoryCapacity || 3} steps
            </Text>
            <Text style={styles.capacityHint}>
              This adjusts automatically based on your performance
            </Text>
          </View>
        </ScrollView>
        
        <TouchableOpacity style={styles.doneButton} onPress={onComplete}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.emoji}>🔍</Text>
        <Text style={styles.title}>How did you do?</Text>
        <Text style={styles.subtitle}>
          Which steps did you remember to do?
        </Text>
        
        <View style={styles.stepsContainer}>
          {plan.steps.map((step, index) => (
            <View key={step.id} style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
              
              <View style={styles.stepActions}>
                <TouchableOpacity
                  style={[
                    styles.stepButton,
                    styles.rememberedButton,
                    step.completed && styles.stepButtonSelected,
                  ]}
                  onPress={() => handleMarkStep(step.id, true)}
                  disabled={step.completed || step.forgotten}
                >
                  <Text style={[
                    styles.stepButtonText,
                    step.completed && styles.stepButtonTextSelected,
                  ]}>
                    ✓ Did it
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.stepButton,
                    styles.forgotButton,
                    step.forgotten && styles.stepButtonForgotSelected,
                  ]}
                  onPress={() => handleMarkStep(step.id, false)}
                  disabled={step.completed || step.forgotten}
                >
                  <Text style={[
                    styles.stepButtonText,
                    step.forgotten && styles.stepButtonTextSelected,
                  ]}>
                    ✗ Forgot
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      
      <TouchableOpacity
        style={[
          styles.finishButton,
          !allStepsReviewed && styles.finishButtonDisabled,
        ]}
        onPress={handleFinishReview}
        disabled={!allStepsReviewed}
      >
        <Text style={styles.finishButtonText}>See results</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  emoji: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 32,
  },
  errorText: {
    fontSize: 16,
    color: colors.gray[500],
    textAlign: 'center',
  },
  stepsContainer: {
    gap: 16,
  },
  stepCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: colors.gray[800],
    lineHeight: 22,
  },
  stepActions: {
    flexDirection: 'row',
    gap: 12,
  },
  stepButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
  },
  rememberedButton: {
    backgroundColor: colors.success[50],
    borderColor: colors.success[200],
  },
  forgotButton: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[200],
  },
  stepButtonSelected: {
    backgroundColor: colors.success[500],
    borderColor: colors.success[500],
  },
  stepButtonForgotSelected: {
    backgroundColor: colors.gray[400],
    borderColor: colors.gray[400],
  },
  stepButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  stepButtonTextSelected: {
    color: '#FFFFFF',
  },
  finishButton: {
    margin: 24,
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  finishButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 15,
    color: colors.gray[600],
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
  },
  statDivider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 12,
  },
  trend_improving: {
    color: colors.success[600],
  },
  trend_stable: {
    color: colors.gray[600],
  },
  trend_declining: {
    color: colors.warning[600],
  },
  feedbackCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[700],
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: colors.primary[600],
    lineHeight: 21,
  },
  capacityInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  capacityLabel: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '500',
  },
  capacityHint: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 4,
  },
  doneButton: {
    margin: 24,
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default SessionStepReview;
