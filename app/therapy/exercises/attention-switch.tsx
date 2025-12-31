// Attention Switching Exercise Screen
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, shadows } from '../../../src/theme/colors';
import { useTherapyStore } from '../../../src/stores/therapyStore';
import { useProgressStore } from '../../../src/stores/progressStore';

type Category = 'color' | 'shape' | 'number';

interface Stimulus {
  color: string;
  shape: string;
  number: number;
}

const COLORS = ['red', 'blue', 'green', 'yellow'];
const SHAPES = ['circle', 'square', 'triangle', 'star'];
const COLOR_MAP: Record<string, string> = {
  red: colors.danger[500],
  blue: colors.primary[500],
  green: colors.success[500],
  yellow: colors.warning[500],
};

const SHAPE_EMOJI: Record<string, string> = {
  circle: '●',
  square: '■',
  triangle: '▲',
  star: '★',
};

export default function AttentionSwitchScreen() {
  const router = useRouter();
  const addXP = useProgressStore((state) => state.addXP);
  const addTrainingSession = useTherapyStore((state) => state.addTrainingSession);

  const [phase, setPhase] = useState<'intro' | 'playing' | 'results'>('intro');
  const [currentCategory, setCurrentCategory] = useState<Category>('color');
  const [stimulus, setStimulus] = useState<Stimulus | null>(null);
  const [score, setScore] = useState(0);
  const [totalTrials, setTotalTrials] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [switchCount, setSwitchCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);

  const feedbackScale = useSharedValue(0);

  const generateStimulus = useCallback((): Stimulus => {
    return {
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      number: Math.floor(Math.random() * 9) + 1,
    };
  }, []);

  const getOptions = useCallback((category: Category, correct: string | number): (string | number)[] => {
    let pool: (string | number)[];
    if (category === 'color') pool = [...COLORS];
    else if (category === 'shape') pool = [...SHAPES];
    else pool = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Remove correct answer and pick 3 random wrong answers
    const filtered = pool.filter(item => item !== correct);
    const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 3);
    
    // Add correct answer and shuffle
    const options = [...shuffled, correct].sort(() => Math.random() - 0.5);
    return options;
  }, []);

  const startGame = () => {
    setPhase('playing');
    setScore(0);
    setTotalTrials(0);
    setCorrectAnswers(0);
    setSwitchCount(0);
    setTimeRemaining(180);
    setCurrentCategory('color');
    setStimulus(generateStimulus());
  };

  const handleAnswer = async (answer: string | number) => {
    if (!stimulus) return;

    const correctAnswer = 
      currentCategory === 'color' ? stimulus.color :
      currentCategory === 'shape' ? stimulus.shape :
      stimulus.number;

    const isCorrect = answer === correctAnswer;
    setTotalTrials(t => t + 1);

    if (isCorrect) {
      setCorrectAnswers(c => c + 1);
      setScore(s => s + 10);
      setShowFeedback('correct');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setShowFeedback('wrong');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    feedbackScale.value = withSpring(1, { damping: 10 }, () => {
      feedbackScale.value = withTiming(0, { duration: 300 });
    });

    // Maybe switch category (30% chance after each trial)
    if (Math.random() < 0.3) {
      const categories: Category[] = ['color', 'shape', 'number'];
      const newCategory = categories.filter(c => c !== currentCategory)[Math.floor(Math.random() * 2)];
      setCurrentCategory(newCategory);
      setSwitchCount(s => s + 1);
    }

    // Generate new stimulus after brief delay
    setTimeout(() => {
      setShowFeedback(null);
      setStimulus(generateStimulus());
    }, 500);
  };

  // Timer effect
  useEffect(() => {
    if (phase !== 'playing') return;

    const timer = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) {
          clearInterval(timer);
          setPhase('results');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Record results when game ends
  useEffect(() => {
    if (phase === 'results') {
      const accuracy = totalTrials > 0 ? correctAnswers / totalTrials : 0;
      const now = new Date().toISOString();
      
      addTrainingSession({
        userId: 'current-user',
        skill: 'attention_switching',
        exerciseType: 'quick_switch',
        difficulty: 1,
        duration: 180 - timeRemaining,
        score,
        accuracy,
        startedAt: now,
        completedAt: now,
      });

      // Award XP based on performance
      const xpEarned = Math.floor(score / 5) + (accuracy >= 0.8 ? 10 : 0);
      if (xpEarned > 0) {
        addXP(xpEarned, 'focus_session', 'Completed attention switching exercise');
      }
    }
  }, [phase]);

  const feedbackStyle = useAnimatedStyle(() => ({
    transform: [{ scale: feedbackScale.value }],
    opacity: feedbackScale.value,
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderIntro = () => (
    <Animated.View entering={FadeIn} style={styles.introContainer}>
      <Text style={styles.introEmoji}>🔄</Text>
      <Text style={styles.introTitle}>Quick Switch</Text>
      <Text style={styles.introDescription}>
        Practice switching your attention between different categories on cue.
      </Text>
      
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>How to Play</Text>
        <Text style={styles.instructionItem}>
          • You'll see a shape with a color and number
        </Text>
        <Text style={styles.instructionItem}>
          • The current category tells you what to identify
        </Text>
        <Text style={styles.instructionItem}>
          • The category may switch at any time!
        </Text>
        <Text style={styles.instructionItem}>
          • Stay flexible and respond quickly
        </Text>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={startGame}>
        <Text style={styles.startButtonText}>Start Exercise</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderPlaying = () => {
    if (!stimulus) return null;

    const correctAnswer = 
      currentCategory === 'color' ? stimulus.color :
      currentCategory === 'shape' ? stimulus.shape :
      stimulus.number;

    const options = getOptions(currentCategory, correctAnswer);

    return (
      <View style={styles.gameContainer}>
        {/* Timer and Score */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{formatTime(timeRemaining)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{score}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Switches</Text>
            <Text style={styles.statValue}>{switchCount}</Text>
          </View>
        </View>

        {/* Current Category */}
        <Animated.View 
          entering={FadeInDown}
          key={currentCategory}
          style={styles.categoryBanner}
        >
          <Text style={styles.categoryLabel}>Identify the</Text>
          <Text style={styles.categoryValue}>{currentCategory.toUpperCase()}</Text>
        </Animated.View>

        {/* Stimulus */}
        <View style={styles.stimulusContainer}>
          <Text style={[styles.stimulusShape, { color: COLOR_MAP[stimulus.color] }]}>
            {SHAPE_EMOJI[stimulus.shape]}
          </Text>
          <Text style={styles.stimulusNumber}>{stimulus.number}</Text>
        </View>

        {/* Feedback */}
        {showFeedback && (
          <Animated.View style={[styles.feedback, feedbackStyle]}>
            <Text style={styles.feedbackEmoji}>
              {showFeedback === 'correct' ? '✓' : '✗'}
            </Text>
          </Animated.View>
        )}

        {/* Options */}
        <View style={styles.optionsGrid}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={`${option}-${index}`}
              style={styles.optionButton}
              onPress={() => handleAnswer(option)}
            >
              <Text style={styles.optionText}>
                {currentCategory === 'color' ? (
                  <View style={[styles.colorSwatch, { backgroundColor: COLOR_MAP[option as string] }]} />
                ) : currentCategory === 'shape' ? (
                  SHAPE_EMOJI[option as string]
                ) : (
                  option
                )}
              </Text>
              {currentCategory === 'color' && (
                <View style={[styles.colorSwatch, { backgroundColor: COLOR_MAP[option as string] }]} />
              )}
              {currentCategory !== 'color' && (
                <Text style={styles.optionText}>
                  {currentCategory === 'shape' ? SHAPE_EMOJI[option as string] : option}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderResults = () => {
    const accuracy = totalTrials > 0 ? Math.round((correctAnswers / totalTrials) * 100) : 0;
    const xpEarned = Math.floor(score / 5) + (accuracy >= 80 ? 10 : 0);

    return (
      <Animated.View entering={FadeIn} style={styles.resultsContainer}>
        <Text style={styles.resultsEmoji}>🎯</Text>
        <Text style={styles.resultsTitle}>Exercise Complete!</Text>

        <View style={styles.resultsCard}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Score</Text>
            <Text style={styles.resultValue}>{score}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Accuracy</Text>
            <Text style={styles.resultValue}>{accuracy}%</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Trials</Text>
            <Text style={styles.resultValue}>{totalTrials}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Category Switches</Text>
            <Text style={styles.resultValue}>{switchCount}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>XP Earned</Text>
            <Text style={[styles.resultValue, { color: colors.primary[500] }]}>+{xpEarned}</Text>
          </View>
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
        <Text style={styles.headerTitle}>Quick Switch</Text>
        <View style={styles.placeholder} />
      </View>

      {phase === 'intro' && renderIntro()}
      {phase === 'playing' && renderPlaying()}
      {phase === 'results' && renderResults()}
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
  introContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    ...shadows.sm,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
  },
  categoryBanner: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryLabel: {
    fontSize: 14,
    color: colors.primary[100],
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stimulusContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    minHeight: 160,
    ...shadows.md,
  },
  stimulusShape: {
    fontSize: 80,
    marginBottom: 8,
  },
  stimulusNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[400],
  },
  feedback: {
    position: 'absolute',
    top: '40%',
    left: '45%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 40,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackEmoji: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  optionText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[800],
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  resultsContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 24,
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
