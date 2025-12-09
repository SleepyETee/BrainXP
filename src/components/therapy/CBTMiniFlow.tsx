import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useTherapyStore } from '../../stores/therapyStore';
import { AvoidanceReason, THERAPY_DISCLAIMER } from '../../types/therapy';
import * as Haptics from 'expo-haptics';

interface CBTMiniFlowProps {
  taskId: string;
  taskTitle: string;
  triggerType: 'user_flagged' | 'overdue_nudge' | 'pattern_detected';
  onComplete: () => void;
  onSkip: () => void;
}

const PRESET_THOUGHTS: { key: AvoidanceReason; label: string; emoji: string }[] = [
  { key: 'fear_of_failure', label: "I'll fail", emoji: '😰' },
  { key: 'too_overwhelming', label: "It's too much", emoji: '😵' },
  { key: 'dont_know_where_to_start', label: "I don't know where to start", emoji: '🤷' },
  { key: 'perfectionism', label: "It won't be perfect", emoji: '🎯' },
  { key: 'fear_of_criticism', label: "People will judge me", emoji: '👀' },
  { key: 'boredom', label: "It's so boring", emoji: '😴' },
  { key: 'analysis_paralysis', label: "I can't decide how", emoji: '🔄' },
];

const BALANCED_SUGGESTIONS = [
  "I can do just the first step",
  "Done is better than perfect",
  "I can ask for help if needed",
  "2 minutes is better than 0",
  "I've done hard things before",
  "This feeling will pass",
];

type FlowStep = 'identify' | 'reframe' | 'action' | 'complete';

export const CBTMiniFlow: React.FC<CBTMiniFlowProps> = ({
  taskId,
  taskTitle,
  triggerType,
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState<FlowStep>('identify');
  const [selectedThoughts, setSelectedThoughts] = useState<AvoidanceReason[]>([]);
  const [customThought, setCustomThought] = useState('');
  const [balancedThoughts, setBalancedThoughts] = useState<string[]>([]);
  const [customBalanced, setCustomBalanced] = useState('');
  const [twoMinuteAction, setTwoMinuteAction] = useState('');
  
  const {
    startIntervention,
    addNegativeThought,
    addBalancedThought,
    setTwoMinuteAction: saveTwoMinuteAction,
    completeIntervention,
    skipIntervention,
    activeIntervention,
  } = useTherapyStore();
  
  // Start intervention on mount
  React.useEffect(() => {
    startIntervention(taskId, triggerType);
  }, [taskId, triggerType, startIntervention]);
  
  const handleToggleThought = (key: AvoidanceReason) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedThoughts((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };
  
  const handleNextFromIdentify = () => {
    if (!activeIntervention) return;
    
    // Save negative thoughts
    selectedThoughts.forEach((key) => {
      const preset = PRESET_THOUGHTS.find((p) => p.key === key);
      if (preset) {
        addNegativeThought(activeIntervention.id, preset.label, key);
      }
    });
    
    if (customThought.trim()) {
      addNegativeThought(activeIntervention.id, customThought.trim(), 'other');
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('reframe');
  };
  
  const handleToggleBalanced = (thought: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBalancedThoughts((prev) =>
      prev.includes(thought) ? prev.filter((t) => t !== thought) : [...prev, thought]
    );
  };
  
  const handleNextFromReframe = () => {
    if (!activeIntervention) return;
    
    balancedThoughts.forEach((thought) => {
      addBalancedThought(activeIntervention.id, thought);
    });
    
    if (customBalanced.trim()) {
      addBalancedThought(activeIntervention.id, customBalanced.trim());
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('action');
  };
  
  const handleComplete = () => {
    if (!activeIntervention) return;
    
    if (twoMinuteAction.trim()) {
      saveTwoMinuteAction(activeIntervention.id, twoMinuteAction.trim());
    }
    
    completeIntervention(activeIntervention.id, 'completed_action');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep('complete');
    
    setTimeout(onComplete, 1500);
  };
  
  const handleSkip = () => {
    if (activeIntervention) {
      skipIntervention(activeIntervention.id);
    }
    onSkip();
  };
  
  const renderIdentifyStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's holding you back?</Text>
      <Text style={styles.stepSubtitle}>
        For: <Text style={styles.taskTitle}>{taskTitle}</Text>
      </Text>
      
      <Text style={styles.questionText}>
        What are you telling yourself right now?
      </Text>
      
      <View style={styles.optionsGrid}>
        {PRESET_THOUGHTS.map((thought) => (
          <TouchableOpacity
            key={thought.key}
            style={[
              styles.optionButton,
              selectedThoughts.includes(thought.key) && styles.optionButtonSelected,
            ]}
            onPress={() => handleToggleThought(thought.key)}
          >
            <Text style={styles.optionEmoji}>{thought.emoji}</Text>
            <Text
              style={[
                styles.optionText,
                selectedThoughts.includes(thought.key) && styles.optionTextSelected,
              ]}
            >
              {thought.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TextInput
        style={styles.customInput}
        placeholder="Or type your own thought..."
        value={customThought}
        onChangeText={setCustomThought}
        placeholderTextColor={colors.gray[400]}
        multiline
      />
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            (selectedThoughts.length === 0 && !customThought.trim()) && styles.nextButtonDisabled,
          ]}
          onPress={handleNextFromIdentify}
          disabled={selectedThoughts.length === 0 && !customThought.trim()}
        >
          <Text style={styles.nextButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderReframeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Let's reframe that</Text>
      
      <Text style={styles.questionText}>
        Is that 100% true? Pick 2 more balanced thoughts:
      </Text>
      
      <View style={styles.balancedGrid}>
        {BALANCED_SUGGESTIONS.map((thought) => (
          <TouchableOpacity
            key={thought}
            style={[
              styles.balancedButton,
              balancedThoughts.includes(thought) && styles.balancedButtonSelected,
            ]}
            onPress={() => handleToggleBalanced(thought)}
          >
            <Text
              style={[
                styles.balancedText,
                balancedThoughts.includes(thought) && styles.balancedTextSelected,
              ]}
            >
              {thought}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TextInput
        style={styles.customInput}
        placeholder="Or write your own balanced thought..."
        value={customBalanced}
        onChangeText={setCustomBalanced}
        placeholderTextColor={colors.gray[400]}
        multiline
      />
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep('identify')}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            (balancedThoughts.length === 0 && !customBalanced.trim()) && styles.nextButtonDisabled,
          ]}
          onPress={handleNextFromReframe}
          disabled={balancedThoughts.length === 0 && !customBalanced.trim()}
        >
          <Text style={styles.nextButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderActionStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Pick a 2-minute action</Text>
      
      <Text style={styles.questionText}>
        What's one tiny thing you could try right now?
        {'\n'}Even just 2 minutes counts.
      </Text>
      
      <TextInput
        style={[styles.customInput, styles.actionInput]}
        placeholder="e.g., Open the document, write one sentence..."
        value={twoMinuteAction}
        onChangeText={setTwoMinuteAction}
        placeholderTextColor={colors.gray[400]}
        multiline
        autoFocus
      />
      
      <View style={styles.suggestionRow}>
        <Text style={styles.suggestionLabel}>Quick ideas:</Text>
        {['Open the file', 'Write 1 sentence', 'Set a timer'].map((suggestion) => (
          <TouchableOpacity
            key={suggestion}
            style={styles.suggestionChip}
            onPress={() => setTwoMinuteAction(suggestion)}
          >
            <Text style={styles.suggestionChipText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep('reframe')}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
        >
          <Text style={styles.completeButtonText}>Let's go! 🚀</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderCompleteStep = () => (
    <View style={[styles.stepContainer, styles.completeContainer]}>
      <Text style={styles.completeEmoji}>✨</Text>
      <Text style={styles.completeTitle}>You've got this!</Text>
      <Text style={styles.completeSubtitle}>
        Remember: 2 minutes is infinitely better than 0.
      </Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {step === 'identify' && renderIdentifyStep()}
        {step === 'reframe' && renderReframeStep()}
        {step === 'action' && renderActionStep()}
        {step === 'complete' && renderCompleteStep()}
      </ScrollView>
      
      <Text style={styles.disclaimer}>{THERAPY_DISCLAIMER.cbt}</Text>
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
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 24,
  },
  taskTitle: {
    fontWeight: '600',
    color: colors.gray[700],
  },
  questionText: {
    fontSize: 16,
    color: colors.gray[700],
    marginBottom: 20,
    lineHeight: 24,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  optionButtonSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[400],
  },
  optionEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  optionText: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: '500',
  },
  optionTextSelected: {
    color: colors.primary[700],
  },
  customInput: {
    fontSize: 16,
    color: colors.gray[800],
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  actionInput: {
    minHeight: 100,
  },
  balancedGrid: {
    gap: 10,
    marginBottom: 20,
  },
  balancedButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  balancedButtonSelected: {
    backgroundColor: colors.secondary[50],
    borderColor: colors.secondary[400],
  },
  balancedText: {
    fontSize: 15,
    color: colors.gray[700],
    fontWeight: '500',
  },
  balancedTextSelected: {
    color: colors.secondary[700],
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  suggestionLabel: {
    fontSize: 13,
    color: colors.gray[500],
    marginRight: 4,
  },
  suggestionChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
  },
  suggestionChipText: {
    fontSize: 13,
    color: colors.gray[600],
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 20,
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    fontSize: 15,
    color: colors.gray[500],
    fontWeight: '500',
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 15,
    color: colors.gray[600],
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  nextButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  nextButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: colors.success[500],
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  completeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  completeEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
  },
  completeSubtitle: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 11,
    color: colors.gray[400],
    textAlign: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
});

export default CBTMiniFlow;
