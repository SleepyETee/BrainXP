import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useTherapyStore } from '../../stores/therapyStore';
import { MindfulnessTrigger, THERAPY_DISCLAIMER } from '../../types/therapy';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface GroundingExerciseProps {
  variant: '5_4_3_2_1' | '3_2_1';
  trigger: MindfulnessTrigger;
  contextTaskId?: string;
  contextFocusSessionId?: string;
  onComplete: () => void;
  onSkip?: () => void;
}

interface GroundingStep {
  sense: string;
  emoji: string;
  count: number;
  prompt: string;
}

const FULL_GROUNDING: GroundingStep[] = [
  { sense: 'see', emoji: '👁️', count: 5, prompt: 'things you can see' },
  { sense: 'touch', emoji: '✋', count: 4, prompt: 'things you can touch' },
  { sense: 'hear', emoji: '👂', count: 3, prompt: 'things you can hear' },
  { sense: 'smell', emoji: '👃', count: 2, prompt: 'things you can smell' },
  { sense: 'taste', emoji: '👅', count: 1, prompt: 'thing you can taste' },
];

const QUICK_GROUNDING: GroundingStep[] = [
  { sense: 'see', emoji: '👁️', count: 3, prompt: 'things you can see' },
  { sense: 'touch', emoji: '✋', count: 2, prompt: 'things you can touch' },
  { sense: 'hear', emoji: '👂', count: 1, prompt: 'thing you can hear' },
];

export const GroundingExercise: React.FC<GroundingExerciseProps> = ({
  variant,
  trigger,
  contextTaskId,
  contextFocusSessionId,
  onComplete,
  onSkip,
}) => {
  const steps = variant === '5_4_3_2_1' ? FULL_GROUNDING : QUICK_GROUNDING;
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [inputs, setInputs] = useState<string[]>([]);
  const [moodBefore, setMoodBefore] = useState<number | null>(null);
  const [phase, setPhase] = useState<'intro' | 'exercise' | 'complete'>('intro');
  
  const progress = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  const startSession = useTherapyStore((state) => state.startSession);
  const saveMoodBefore = useTherapyStore((state) => state.setMoodBefore);
  const completeSession = useTherapyStore((state) => state.completeSession);
  const activeSession = useTherapyStore((state) => state.activeSession);
  
  const currentStep = steps[currentStepIndex];
  const totalItems = steps.reduce((sum, s) => sum + s.count, 0);
  const completedItems = steps.slice(0, currentStepIndex).reduce((sum, s) => sum + s.count, 0) + inputs.length;
  
  useEffect(() => {
    Animated.timing(progress, {
      toValue: completedItems / totalItems,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [completedItems]);
  
  const handleStartExercise = () => {
    const type = variant === '5_4_3_2_1' ? 'grounding_5_4_3_2_1' : 'grounding_3_2_1';
    startSession(type, trigger, contextTaskId, contextFocusSessionId);
    setPhase('exercise');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  const handleMoodSelect = (mood: number) => {
    setMoodBefore(mood);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleAddInput = (text: string) => {
    if (text.trim()) {
      const newInputs = [...inputs, text.trim()];
      setInputs(newInputs);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (newInputs.length >= currentStep.count) {
        // Move to next step
        if (currentStepIndex < steps.length - 1) {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setCurrentStepIndex(currentStepIndex + 1);
            setInputs([]);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
          });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          // Exercise complete
          handleComplete();
        }
      }
    }
  };
  
  const handleComplete = () => {
    setPhase('complete');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  
  const handleFinish = (moodAfter: number) => {
    if (activeSession) {
      completeSession(activeSession.id, moodAfter);
    }
    onComplete();
  };
  
  const renderIntro = () => (
    <View style={styles.introContainer}>
      <Text style={styles.introEmoji}>🌿</Text>
      <Text style={styles.introTitle}>
        {variant === '5_4_3_2_1' ? '5-4-3-2-1 Grounding' : 'Quick 3-2-1 Grounding'}
      </Text>
      <Text style={styles.introText}>
        {variant === '5_4_3_2_1'
          ? "Let's bring you back to the present moment using your senses."
          : "A quick 60-second grounding to center yourself."}
      </Text>
      
      <View style={styles.moodSection}>
        <Text style={styles.moodLabel}>How are you feeling right now?</Text>
        <View style={styles.moodRow}>
          {[1, 2, 3, 4, 5].map((mood) => (
            <TouchableOpacity
              key={mood}
              style={[
                styles.moodButton,
                moodBefore === mood && styles.moodButtonSelected,
              ]}
              onPress={() => handleMoodSelect(mood)}
            >
              <Text style={styles.moodEmoji}>
                {mood === 1 ? '😫' : mood === 2 ? '😔' : mood === 3 ? '😐' : mood === 4 ? '🙂' : '😊'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.buttonRow}>
        {onSkip && (
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.startButton, !moodBefore && styles.startButtonDisabled]}
          onPress={handleStartExercise}
          disabled={!moodBefore}
        >
          <Text style={styles.startButtonText}>Begin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderExercise = () => (
    <Animated.View style={[styles.exerciseContainer, { opacity: fadeAnim }]}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      
      <Text style={styles.stepEmoji}>{currentStep.emoji}</Text>
      <Text style={styles.stepCount}>{currentStep.count}</Text>
      <Text style={styles.stepPrompt}>{currentStep.prompt}</Text>
      
      {/* Input chips */}
      <View style={styles.chipsContainer}>
        {Array.from({ length: currentStep.count }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.chip,
              i < inputs.length && styles.chipFilled,
            ]}
          >
            {i < inputs.length ? (
              <Text style={styles.chipText}>{inputs[i]}</Text>
            ) : i === inputs.length ? (
              <ChipInput
                placeholder={`${i + 1}...`}
                onSubmit={handleAddInput}
                autoFocus={i === 0}
              />
            ) : (
              <Text style={styles.chipPlaceholder}>{i + 1}</Text>
            )}
          </View>
        ))}
      </View>
      
      <Text style={styles.hint}>
        Type something and press enter, or just tap anywhere you notice
      </Text>
    </Animated.View>
  );
  
  const renderComplete = () => (
    <View style={styles.completeContainer}>
      <Text style={styles.completeEmoji}>✨</Text>
      <Text style={styles.completeTitle}>You're grounded</Text>
      <Text style={styles.completeText}>
        Take a breath. You're present. You're here.
      </Text>
      
      <View style={styles.moodSection}>
        <Text style={styles.moodLabel}>How do you feel now?</Text>
        <View style={styles.moodRow}>
          {[1, 2, 3, 4, 5].map((mood) => (
            <TouchableOpacity
              key={mood}
              style={styles.moodButton}
              onPress={() => handleFinish(mood)}
            >
              <Text style={styles.moodEmoji}>
                {mood === 1 ? '😫' : mood === 2 ? '😔' : mood === 3 ? '😐' : mood === 4 ? '🙂' : '😊'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      {phase === 'intro' && renderIntro()}
      {phase === 'exercise' && renderExercise()}
      {phase === 'complete' && renderComplete()}
      
      <Text style={styles.disclaimer}>{THERAPY_DISCLAIMER.mindfulness}</Text>
    </View>
  );
};

// Helper component for input in chips
const ChipInput: React.FC<{
  placeholder: string;
  onSubmit: (text: string) => void;
  autoFocus?: boolean;
}> = ({ placeholder, onSubmit, autoFocus }) => {
  const [value, setValue] = useState('');
  
  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value);
      setValue('');
    }
  };
  
  return (
    <TextInput
      style={styles.chipInput}
      value={value}
      onChangeText={setValue}
      onSubmitEditing={handleSubmit}
      placeholder={placeholder}
      placeholderTextColor={colors.gray[400]}
      autoFocus={autoFocus}
      returnKeyType="done"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  introContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  moodSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  moodLabel: {
    fontSize: 15,
    color: colors.gray[600],
    marginBottom: 16,
  },
  moodRow: {
    flexDirection: 'row',
    gap: 12,
  },
  moodButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gray[50],
    borderWidth: 2,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodButtonSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  moodEmoji: {
    fontSize: 26,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 'auto',
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
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
  exerciseContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 3,
    marginBottom: 48,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary[400],
    borderRadius: 3,
  },
  stepEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  stepCount: {
    fontSize: 72,
    fontWeight: '800',
    color: colors.primary[500],
    marginBottom: 8,
  },
  stepPrompt: {
    fontSize: 20,
    color: colors.gray[700],
    marginBottom: 32,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  chip: {
    minWidth: 80,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.gray[50],
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
  },
  chipFilled: {
    backgroundColor: colors.secondary[50],
    borderColor: colors.secondary[300],
    borderStyle: 'solid',
  },
  chipText: {
    fontSize: 14,
    color: colors.secondary[700],
    fontWeight: '500',
    textAlign: 'center',
  },
  chipPlaceholder: {
    fontSize: 14,
    color: colors.gray[400],
    textAlign: 'center',
  },
  chipInput: {
    fontSize: 14,
    color: colors.gray[800],
    textAlign: 'center',
    minWidth: 60,
    padding: 0,
  },
  hint: {
    fontSize: 13,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 'auto',
  },
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeEmoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
  },
  completeText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 40,
  },
  disclaimer: {
    fontSize: 11,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 16,
  },
});

export default GroundingExercise;
