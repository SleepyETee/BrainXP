// Plan Builder Exercise Screen
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, shadows } from '../../../src/theme/colors';
import { useTherapyStore } from '../../../src/stores/therapyStore';
import { useProgressStore } from '../../../src/stores/progressStore';

interface PlanStep {
  id: string;
  text: string;
  order: number;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  emoji: string;
  steps: PlanStep[];
  correctOrder: number[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'morning_routine',
    title: 'Morning Routine',
    description: 'Arrange these steps in the best order for a productive morning.',
    emoji: '🌅',
    steps: [
      { id: '1', text: 'Make bed', order: 0 },
      { id: '2', text: 'Brush teeth', order: 0 },
      { id: '3', text: 'Get dressed', order: 0 },
      { id: '4', text: 'Eat breakfast', order: 0 },
      { id: '5', text: 'Check calendar', order: 0 },
    ],
    correctOrder: [1, 2, 3, 4, 5], // Multiple correct orders possible
  },
  {
    id: 'project_start',
    title: 'Starting a Project',
    description: 'What order should you do these when starting a new project?',
    emoji: '📋',
    steps: [
      { id: '1', text: 'Define the goal', order: 0 },
      { id: '2', text: 'Break into tasks', order: 0 },
      { id: '3', text: 'Gather materials', order: 0 },
      { id: '4', text: 'Set a deadline', order: 0 },
      { id: '5', text: 'Start first task', order: 0 },
    ],
    correctOrder: [1, 4, 2, 3, 5],
  },
  {
    id: 'email_response',
    title: 'Responding to Important Email',
    description: 'Order these steps for crafting a thoughtful email response.',
    emoji: '✉️',
    steps: [
      { id: '1', text: 'Read email carefully', order: 0 },
      { id: '2', text: 'Draft response', order: 0 },
      { id: '3', text: 'Review and edit', order: 0 },
      { id: '4', text: 'Identify key points', order: 0 },
      { id: '5', text: 'Send email', order: 0 },
    ],
    correctOrder: [1, 4, 2, 3, 5],
  },
];

export default function PlanBuilderScreen() {
  const router = useRouter();
  const addXP = useProgressStore((state) => state.addXP);
  const addTrainingSession = useTherapyStore((state) => state.addTrainingSession);

  const [phase, setPhase] = useState<'intro' | 'playing' | 'feedback' | 'results'>('intro');
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [arrangedSteps, setArrangedSteps] = useState<PlanStep[]>([]);
  const [availableSteps, setAvailableSteps] = useState<PlanStep[]>([]);
  const [score, setScore] = useState(0);
  const [scenariosCompleted, setScenariosCompleted] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const currentScenario = SCENARIOS[currentScenarioIndex];

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startGame = () => {
    setPhase('playing');
    setScore(0);
    setScenariosCompleted(0);
    setCurrentScenarioIndex(0);
    loadScenario(0);
  };

  const loadScenario = (index: number) => {
    const scenario = SCENARIOS[index];
    setArrangedSteps([]);
    setAvailableSteps(shuffleArray(scenario.steps));
  };

  const handleSelectStep = async (step: PlanStep) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Move step from available to arranged
    setAvailableSteps(prev => prev.filter(s => s.id !== step.id));
    setArrangedSteps(prev => [...prev, { ...step, order: prev.length + 1 }]);
  };

  const handleRemoveStep = async (step: PlanStep) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Move step back to available
    setArrangedSteps(prev => prev.filter(s => s.id !== step.id));
    setAvailableSteps(prev => [...prev, step]);
  };

  const handleSubmit = async () => {
    if (arrangedSteps.length !== currentScenario.steps.length) {
      return;
    }

    // Calculate score based on order
    const userOrder = arrangedSteps.map(s => parseInt(s.id));
    const correctOrder = currentScenario.correctOrder;
    
    let correctPositions = 0;
    for (let i = 0; i < userOrder.length; i++) {
      if (userOrder[i] === correctOrder[i]) {
        correctPositions++;
      }
    }

    const scenarioScore = Math.round((correctPositions / correctOrder.length) * 100);
    setScore(prev => prev + scenarioScore);
    setScenariosCompleted(prev => prev + 1);

    // Show feedback
    if (scenarioScore >= 80) {
      setFeedbackMessage('Excellent! Great planning skills! 🎉');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (scenarioScore >= 60) {
      setFeedbackMessage('Good effort! Here\'s the suggested order. 👍');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      setFeedbackMessage('Keep practicing! Planning gets easier. 💪');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setPhase('feedback');
  };

  const handleNext = () => {
    if (currentScenarioIndex < SCENARIOS.length - 1) {
      const nextIndex = currentScenarioIndex + 1;
      setCurrentScenarioIndex(nextIndex);
      loadScenario(nextIndex);
      setPhase('playing');
    } else {
      // All scenarios completed
      const avgScore = Math.round(score / SCENARIOS.length);
      const now = new Date().toISOString();
      
      addTrainingSession({
        userId: 'current-user',
        skill: 'planning',
        exerciseType: 'plan_builder',
        difficulty: 1,
        duration: 300, // ~5 minutes
        score: avgScore,
        accuracy: avgScore / 100,
        startedAt: now,
        completedAt: now,
      });

      const xpEarned = Math.floor(avgScore / 10) + (avgScore >= 80 ? 10 : 0);
      if (xpEarned > 0) {
        addXP(xpEarned, 'focus_session', 'Completed plan builder exercise');
      }

      setPhase('results');
    }
  };

  const renderIntro = () => (
    <Animated.View entering={FadeIn} style={styles.introContainer}>
      <Text style={styles.introEmoji}>📋</Text>
      <Text style={styles.introTitle}>Plan Builder</Text>
      <Text style={styles.introDescription}>
        Practice arranging steps in the best order for different goals.
      </Text>
      
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>How to Play</Text>
        <Text style={styles.instructionItem}>
          • You'll see a goal with shuffled steps
        </Text>
        <Text style={styles.instructionItem}>
          • Tap steps to arrange them in order
        </Text>
        <Text style={styles.instructionItem}>
          • Tap arranged steps to remove them
        </Text>
        <Text style={styles.instructionItem}>
          • Submit when you think it's right!
        </Text>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={startGame}>
        <Text style={styles.startButtonText}>Start Exercise</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderPlaying = () => (
    <View style={styles.gameContainer}>
      {/* Scenario Header */}
      <Animated.View entering={FadeInDown} style={styles.scenarioCard}>
        <Text style={styles.scenarioEmoji}>{currentScenario.emoji}</Text>
        <Text style={styles.scenarioTitle}>{currentScenario.title}</Text>
        <Text style={styles.scenarioDescription}>{currentScenario.description}</Text>
        <Text style={styles.scenarioProgress}>
          Scenario {currentScenarioIndex + 1} of {SCENARIOS.length}
        </Text>
      </Animated.View>

      {/* Arranged Steps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Plan ({arrangedSteps.length}/{currentScenario.steps.length})</Text>
        <View style={styles.stepsContainer}>
          {arrangedSteps.length === 0 ? (
            <Text style={styles.emptyText}>Tap steps below to build your plan</Text>
          ) : (
            arrangedSteps.map((step, index) => (
              <Animated.View
                key={step.id}
                entering={FadeInDown.delay(index * 50)}
                layout={Layout.springify()}
              >
                <TouchableOpacity
                  style={styles.arrangedStep}
                  onPress={() => handleRemoveStep(step)}
                >
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                  <Text style={styles.stepText}>{step.text}</Text>
                  <Text style={styles.removeIcon}>✕</Text>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </View>
      </View>

      {/* Available Steps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Steps</Text>
        <View style={styles.availableContainer}>
          {availableSteps.map((step) => (
            <Animated.View key={step.id} layout={Layout.springify()}>
              <TouchableOpacity
                style={styles.availableStep}
                onPress={() => handleSelectStep(step)}
              >
                <Text style={styles.availableStepText}>{step.text}</Text>
                <Text style={styles.addIcon}>+</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          arrangedSteps.length !== currentScenario.steps.length && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={arrangedSteps.length !== currentScenario.steps.length}
      >
        <Text style={styles.submitButtonText}>Check My Plan</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFeedback = () => (
    <Animated.View entering={FadeIn} style={styles.feedbackContainer}>
      <Text style={styles.feedbackEmoji}>
        {feedbackMessage.includes('Excellent') ? '🎉' : feedbackMessage.includes('Good') ? '👍' : '💪'}
      </Text>
      <Text style={styles.feedbackMessage}>{feedbackMessage}</Text>

      <View style={styles.comparisonCard}>
        <View style={styles.comparisonColumn}>
          <Text style={styles.comparisonTitle}>Your Order</Text>
          {arrangedSteps.map((step, index) => (
            <Text key={step.id} style={styles.comparisonStep}>
              {index + 1}. {step.text}
            </Text>
          ))}
        </View>
        <View style={styles.comparisonColumn}>
          <Text style={styles.comparisonTitle}>Suggested</Text>
          {currentScenario.correctOrder.map((stepNum, index) => {
            const step = currentScenario.steps.find(s => s.id === String(stepNum));
            return (
              <Text key={stepNum} style={styles.comparisonStep}>
                {index + 1}. {step?.text}
              </Text>
            );
          })}
        </View>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {currentScenarioIndex < SCENARIOS.length - 1 ? 'Next Scenario' : 'See Results'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderResults = () => {
    const avgScore = Math.round(score / SCENARIOS.length);
    const xpEarned = Math.floor(avgScore / 10) + (avgScore >= 80 ? 10 : 0);

    return (
      <Animated.View entering={FadeIn} style={styles.resultsContainer}>
        <Text style={styles.resultsEmoji}>🏆</Text>
        <Text style={styles.resultsTitle}>Exercise Complete!</Text>

        <View style={styles.resultsCard}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Average Score</Text>
            <Text style={styles.resultValue}>{avgScore}%</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Scenarios Completed</Text>
            <Text style={styles.resultValue}>{scenariosCompleted}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>XP Earned</Text>
            <Text style={[styles.resultValue, { color: colors.primary[500] }]}>+{xpEarned}</Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Planning Tip</Text>
          <Text style={styles.tipText}>
            When facing a task, always start by defining your goal and breaking it down into smaller steps.
            This makes complex tasks feel more manageable!
          </Text>
        </View>

        <View style={styles.resultsButtons}>
          <TouchableOpacity style={styles.playAgainButton} onPress={startGame}>
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan Builder</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {phase === 'intro' && renderIntro()}
        {phase === 'playing' && renderPlaying()}
        {phase === 'feedback' && renderFeedback()}
        {phase === 'results' && renderResults()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    fontSize: 16,
    color: colors.primary[600],
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  introContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  introEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 8,
  },
  introDescription: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    ...shadows.sm,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 8,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    ...shadows.md,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gameContainer: {
    flex: 1,
  },
  scenarioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    ...shadows.sm,
  },
  scenarioEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  scenarioTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 4,
  },
  scenarioDescription: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 8,
  },
  scenarioProgress: {
    fontSize: 12,
    color: colors.gray[400],
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[700],
    marginBottom: 12,
  },
  stepsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    minHeight: 150,
    ...shadows.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[400],
    textAlign: 'center',
    paddingVertical: 40,
  },
  arrangedStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '700',
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[800],
  },
  removeIcon: {
    fontSize: 16,
    color: colors.gray[400],
    padding: 4,
  },
  availableContainer: {
    gap: 8,
  },
  availableStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  availableStepText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[700],
  },
  addIcon: {
    fontSize: 20,
    color: colors.primary[500],
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: colors.success[500],
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    ...shadows.md,
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  feedbackContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  feedbackEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  feedbackMessage: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 24,
  },
  comparisonCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    ...shadows.sm,
  },
  comparisonColumn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[600],
    marginBottom: 12,
    textAlign: 'center',
  },
  comparisonStep: {
    fontSize: 13,
    color: colors.gray[700],
    marginBottom: 8,
    lineHeight: 18,
  },
  nextButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    ...shadows.md,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultsContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  resultsEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 24,
  },
  resultsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 16,
    ...shadows.sm,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  resultLabel: {
    fontSize: 16,
    color: colors.gray[600],
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  tipCard: {
    backgroundColor: colors.success[50],
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success[700],
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: colors.success[800],
    lineHeight: 20,
  },
  resultsButtons: {
    width: '100%',
    gap: 12,
  },
  playAgainButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...shadows.md,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doneButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
  },
});
