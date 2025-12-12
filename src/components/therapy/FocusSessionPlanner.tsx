import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useTherapyStore } from '../../stores/therapyStore';
import { useMLStore, TaskRecommendation } from '../../stores/mlStore';
import * as Haptics from 'expo-haptics';

interface FocusSessionPlannerProps {
  sessionId: string;
  taskTitle?: string;
  onPlanCreated: (planId: string) => void;
  onSkip?: () => void;
}

export const FocusSessionPlanner: React.FC<FocusSessionPlannerProps> = ({
  sessionId,
  taskTitle,
  onPlanCreated,
  onSkip,
}) => {
  const profile = useTherapyStore((state) => state.profile);
  const getRecommendedStepCount = useTherapyStore((state) => state.getRecommendedStepCount);
  const createSessionPlan = useTherapyStore((state) => state.createSessionPlan);
  
  // ML Store integration
  const patterns = useMLStore((state) => state.patterns);
  const getRecommendations = useMLStore((state) => state.getRecommendations);
  const submitFeedback = useMLStore((state) => state.submitFeedback);
  const fetchPatterns = useMLStore((state) => state.fetchPatterns);
  
  const recommendedSteps = React.useMemo(() => getRecommendedStepCount(), [profile]);
  const [steps, setSteps] = useState<string[]>(['']);
  const [showTip, setShowTip] = useState(false);
  const [mlSuggestions, setMlSuggestions] = useState<TaskRecommendation[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showMLInsights, setShowMLInsights] = useState(false);
  
  // Fetch ML patterns and suggestions on mount
  useEffect(() => {
    fetchPatterns();
    loadMLSuggestions();
  }, []);
  
  const loadMLSuggestions = async () => {
    if (!taskTitle) return;
    
    setIsLoadingSuggestions(true);
    try {
      const recommendations = await getRecommendations(taskTitle);
      if (recommendations && recommendations.length > 0) {
        setMlSuggestions(recommendations.slice(0, 3));
      }
    } catch (error) {
      console.log('Could not load ML suggestions');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  
  // Get optimal focus time from patterns
  const optimalFocusInsight = React.useMemo(() => {
    if (!patterns?.bestHours || patterns.bestHours.length === 0) return null;
    const currentHour = new Date().getHours();
    const currentProductivity = patterns.bestHours.find(h => h.hour === currentHour);
    const bestHour = patterns.bestHours.reduce((best, curr) => 
      curr.productivity > best.productivity ? curr : best
    );
    
    if (currentProductivity && currentProductivity.productivity >= bestHour.productivity * 0.8) {
      return { type: 'optimal', message: '🎯 Great timing! This is one of your peak focus hours.' };
    } else if (bestHour) {
      const formatHour = (h: number) => h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm` : `${h - 12}pm`;
      return { type: 'suggestion', message: `💡 Your peak focus is usually around ${formatHour(bestHour.hour)}` };
    }
    return null;
  }, [patterns]);

  const handleAddStep = () => {
    if (steps.length < 5) {
      setSteps([...steps, '']);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const handleUpdateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };
  
  const handleUseSuggestion = (suggestion: TaskRecommendation) => {
    const emptyIndex = steps.findIndex(s => !s.trim());
    if (emptyIndex !== -1) {
      handleUpdateStep(emptyIndex, suggestion.message);
    } else if (steps.length < 5) {
      setSteps([...steps, suggestion.message]);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleCreatePlan = async () => {
    const validSteps = steps.filter((s) => s.trim());
    if (validSteps.length === 0) return;
    
    const plan = createSessionPlan(sessionId, validSteps);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Track this plan creation for ML learning
    try {
      await submitFeedback(
        `focus_plan_${sessionId}`,
        true,
        undefined,
        { taskTitle, stepCount: validSteps.length }
      );
    } catch (error) {
      // Silent fail - don't block user flow
    }
    
    onPlanCreated(plan.id);
  };
  
  const validStepCount = steps.filter((s) => s.trim()).length;
  const isOverRecommended = validStepCount > recommendedSteps;
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.emoji}>🧠</Text>
        <Text style={styles.title}>Hold these steps in mind</Text>
        <Text style={styles.subtitle}>
          {taskTitle && `For: ${taskTitle}\n\n`}
          What {recommendedSteps} steps will you take during this session?
        </Text>
        
        {/* ML Insights Banner */}
        {optimalFocusInsight && (
          <TouchableOpacity 
            style={[
              styles.mlInsightBanner,
              optimalFocusInsight.type === 'optimal' ? styles.mlInsightOptimal : styles.mlInsightSuggestion
            ]}
            onPress={() => setShowMLInsights(!showMLInsights)}
          >
            <Text style={styles.mlInsightText}>{optimalFocusInsight.message}</Text>
          </TouchableOpacity>
        )}
        
        {/* ML Step Suggestions */}
        {mlSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>✨ Suggested based on your patterns</Text>
            {isLoadingSuggestions ? (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            ) : (
              <View style={styles.suggestionChips}>
                {mlSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => handleUseSuggestion(suggestion)}
                  >
                    <Text style={styles.suggestionChipText} numberOfLines={1}>
                      + {suggestion.message}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <TextInput
                style={styles.stepInput}
                value={step}
                onChangeText={(value) => handleUpdateStep(index, value)}
                placeholder={`Step ${index + 1}...`}
                placeholderTextColor={colors.gray[400]}
                autoFocus={index === 0}
              />
              {steps.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveStep(index)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          {steps.length < 5 && (
            <TouchableOpacity style={styles.addButton} onPress={handleAddStep}>
              <Text style={styles.addButtonText}>+ Add step</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Capacity indicator */}
        <View style={styles.capacityContainer}>
          <View style={styles.capacityHeader}>
            <Text style={styles.capacityLabel}>
              Your working memory capacity: {recommendedSteps} steps
            </Text>
            <TouchableOpacity onPress={() => setShowTip(!showTip)}>
              <Text style={styles.infoButton}>ℹ️</Text>
            </TouchableOpacity>
          </View>
          
          {showTip && (
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                This is based on your past sessions. We'll adjust it as you practice.
                {'\n\n'}
                The skill of holding steps in mind is the same one you use when following
                multi-step instructions in class or at work.
              </Text>
            </View>
          )}
          
          {isOverRecommended && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                💡 You've added {validStepCount} steps, but we recommend {recommendedSteps}.
                Consider focusing on fewer steps for better recall.
              </Text>
            </View>
          )}
        </View>
        
        {/* ML Learning Stats */}
        {patterns?.estimationAccuracy !== undefined && (
          <View style={styles.mlStatsContainer}>
            <Text style={styles.mlStatsTitle}>📊 Your Focus Patterns</Text>
            <View style={styles.mlStatRow}>
              <Text style={styles.mlStatLabel}>Avg session duration:</Text>
              <Text style={styles.mlStatValue}>
                {patterns.averageTaskDuration ? `${Math.round(patterns.averageTaskDuration)} min` : 'Learning...'}
              </Text>
            </View>
            <View style={styles.mlStatRow}>
              <Text style={styles.mlStatLabel}>Estimation accuracy:</Text>
              <Text style={styles.mlStatValue}>
                {patterns.estimationAccuracy ? `${Math.round(patterns.estimationAccuracy * 100)}%` : 'Learning...'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.buttonRow}>
        {onSkip && (
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.startButton,
            validStepCount === 0 && styles.startButtonDisabled,
          ]}
          onPress={handleCreatePlan}
          disabled={validStepCount === 0}
        >
          <Text style={styles.startButtonText}>
            Start with {validStepCount} step{validStepCount !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      </View>
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
    padding: 24,
  },
  emoji: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  stepsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
  },
  stepInput: {
    flex: 1,
    fontSize: 16,
    color: colors.gray[800],
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 18,
    color: colors.gray[500],
    fontWeight: '500',
  },
  addButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 15,
    color: colors.primary[600],
    fontWeight: '500',
  },
  capacityContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
  },
  capacityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  capacityLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  infoButton: {
    fontSize: 16,
  },
  tipBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  tipText: {
    fontSize: 13,
    color: colors.primary[700],
    lineHeight: 20,
  },
  warningBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.warning[50],
    borderRadius: 8,
  },
  warningText: {
    fontSize: 13,
    color: colors.warning[700],
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    fontSize: 16,
    color: colors.gray[500],
    fontWeight: '500',
  },
  startButton: {
    flex: 1,
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  startButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  mlInsightBanner: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  mlInsightOptimal: {
    backgroundColor: colors.success[50],
    borderLeftWidth: 3,
    borderLeftColor: colors.success[500],
  },
  mlInsightSuggestion: {
    backgroundColor: colors.primary[50],
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
  },
  mlInsightText: {
    fontSize: 13,
    color: colors.gray[700],
    fontWeight: '500',
  },
  suggestionsContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: 10,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    maxWidth: '90%',
  },
  suggestionChipText: {
    fontSize: 13,
    color: colors.primary[700],
    fontWeight: '500',
  },
  mlStatsContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  mlStatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 10,
  },
  mlStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  mlStatLabel: {
    fontSize: 13,
    color: colors.gray[500],
  },
  mlStatValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[700],
  },
});

export default FocusSessionPlanner;
