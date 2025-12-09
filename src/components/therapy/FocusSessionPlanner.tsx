import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useTherapyStore } from '../../stores/therapyStore';
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
  
  const recommendedSteps = React.useMemo(() => getRecommendedStepCount(), [profile]);
  const [steps, setSteps] = useState<string[]>(['']);
  const [showTip, setShowTip] = useState(false);
  
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
  
  const handleCreatePlan = () => {
    const validSteps = steps.filter((s) => s.trim());
    if (validSteps.length === 0) return;
    
    const plan = createSessionPlan(sessionId, validSteps);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
});

export default FocusSessionPlanner;
