// Study Quiz Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useStudyStore } from '../../src/stores/studyStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { colors, gradients, shadows } from '../../src/theme/colors';
import { StudySet } from '../../src/types/study';

interface QuizQuestion {
  id: string;
  front: string;
  back: string;
  options: string[];
  correctIndex: number;
}

export default function StudyQuizScreen() {
  const router = useRouter();
  const studySets = useStudyStore((state) => state.studySets);
  const flashcards = useStudyStore((state) => state.flashcards);
  const addXP = useProgressStore((state) => state.addXP);
  
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const startQuiz = (set: StudySet) => {
    const cards = flashcards[set.id] || [];
    if (cards.length < 4) {
      // Need at least 4 cards for multiple choice
      return;
    }

    // Generate quiz questions from flashcards
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    const quizQuestions: QuizQuestion[] = shuffledCards.slice(0, Math.min(10, cards.length)).map((card, idx) => {
      // Get 3 wrong answers from other cards
      const wrongAnswers = cards
        .filter((c) => c.id !== card.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((c) => c.back);

      // Insert correct answer at random position
      const correctIndex = Math.floor(Math.random() * 4);
      const options = [...wrongAnswers];
      options.splice(correctIndex, 0, card.back);

      return {
        id: card.id,
        front: card.front,
        back: card.back,
        options: options.slice(0, 4), // Ensure only 4 options
        correctIndex,
      };
    });

    setQuestions(quizQuestions);
    setSelectedSet(set);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleAnswer = async (index: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    const isCorrect = index === questions[currentIndex].correctIndex;
    
    if (isCorrect) {
      setScore((prev) => prev + 1);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      // Quiz complete
      const xpEarned = score * 5;
      await addXP(xpEarned, 'quiz_complete', 'Completed study quiz');
      setShowResult(true);
    }
  };

  const handleRestart = () => {
    if (selectedSet) {
      startQuiz(selectedSet);
    }
  };

  // Result Screen
  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[...gradients.focus]}
          style={styles.resultGradient}
        >
          <Animated.View entering={FadeIn} style={styles.resultContent}>
            <Text style={styles.resultEmoji}>
              {percentage >= 80 ? '🏆' : percentage >= 60 ? '👏' : '💪'}
            </Text>
            <Text style={styles.resultTitle}>Quiz Complete!</Text>
            <Text style={styles.resultScore}>
              {score} / {questions.length}
            </Text>
            <Text style={styles.resultPercentage}>{percentage}%</Text>
            <Text style={styles.resultXP}>+{score * 5} XP earned</Text>
            
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRestart}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setSelectedSet(null)}
              >
                <Text style={styles.backButtonText}>Choose Another Set</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  // Quiz in progress
  if (selectedSet && questions.length > 0) {
    const question = questions[currentIndex];
    
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.quizHeader}>
          <TouchableOpacity onPress={() => setSelectedSet(null)}>
            <Text style={styles.exitText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentIndex + 1) / questions.length) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {currentIndex + 1} / {questions.length}
            </Text>
          </View>
          <Text style={styles.scoreLabel}>Score: {score}</Text>
        </View>

        <ScrollView style={styles.quizContent}>
          {/* Question */}
          <Animated.View entering={FadeIn} style={styles.questionCard}>
            <Text style={styles.questionLabel}>Question {currentIndex + 1}</Text>
            <Text style={styles.questionText}>{question.front}</Text>
          </Animated.View>

          {/* Options */}
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correctIndex;
            const showCorrect = selectedAnswer !== null && isCorrect;
            const showWrong = isSelected && !isCorrect;

            return (
              <Animated.View key={index} entering={FadeInDown.delay(index * 80)}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    showCorrect && styles.optionCorrect,
                    showWrong && styles.optionWrong,
                    isSelected && !showCorrect && !showWrong && styles.optionSelected,
                  ]}
                  onPress={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                >
                  <Text style={styles.optionLetter}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                  <Text
                    style={[
                      styles.optionText,
                      (showCorrect || showWrong) && styles.optionTextHighlight,
                    ]}
                    numberOfLines={3}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {/* Next Button */}
          {selectedAnswer !== null && (
            <Animated.View entering={FadeIn} style={styles.nextContainer}>
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    );
  }

  // Set Selection Screen
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerBack}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz Mode</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Animated.View entering={FadeIn}>
          <Text style={styles.title}>📝 Choose a Study Set</Text>
          <Text style={styles.subtitle}>
            Test your knowledge with multiple choice questions
          </Text>
        </Animated.View>

        {studySets.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📚</Text>
            <Text style={styles.emptyTitle}>No Study Sets</Text>
            <Text style={styles.emptyText}>
              Create a study set first to take a quiz
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/study/create')}
            >
              <Text style={styles.createButtonText}>Create Study Set</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.setsList}>
            {studySets.map((set, index) => {
              const cards = flashcards[set.id] || [];
              const canQuiz = cards.length >= 4;
              
              return (
                <Animated.View key={set.id} entering={FadeInDown.delay(index * 80)}>
                  <TouchableOpacity
                    style={[styles.setCard, !canQuiz && styles.setCardDisabled]}
                    onPress={() => canQuiz && startQuiz(set)}
                    disabled={!canQuiz}
                  >
                    <View style={[styles.setIcon, { backgroundColor: set.color || colors.primary[500] }]}>
                      <Text style={styles.setEmoji}>{set.icon || '📚'}</Text>
                    </View>
                    <View style={styles.setInfo}>
                      <Text style={styles.setTitle}>{set.title}</Text>
                      <Text style={styles.setCards}>
                        {cards.length} cards
                        {!canQuiz && ' (need 4+ for quiz)'}
                      </Text>
                    </View>
                    {canQuiz && <Text style={styles.setArrow}>→</Text>}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerBack: {
    fontSize: 16,
    color: colors.primary[600],
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[900],
  },
  headerSpacer: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray[500],
    marginBottom: 24,
  },
  setsList: {
    gap: 12,
  },
  setCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  setCardDisabled: {
    opacity: 0.5,
  },
  setIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  setEmoji: {
    fontSize: 24,
  },
  setInfo: {
    flex: 1,
  },
  setTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
  },
  setCards: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  setArrow: {
    fontSize: 18,
    color: colors.gray[400],
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.gray[50],
    borderRadius: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Quiz styles
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  exitText: {
    fontSize: 24,
    color: colors.gray[500],
    width: 40,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  quizContent: {
    flex: 1,
    padding: 20,
  },
  questionCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[800],
    lineHeight: 26,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  optionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  optionCorrect: {
    borderColor: colors.success[500],
    backgroundColor: colors.success[50],
  },
  optionWrong: {
    borderColor: colors.danger[500],
    backgroundColor: colors.danger[50],
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    textAlign: 'center',
    lineHeight: 32,
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[600],
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 21,
  },
  optionTextHighlight: {
    fontWeight: '600',
  },
  nextContainer: {
    marginTop: 20,
  },
  nextButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...shadows.md,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Result styles
  resultGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    alignItems: 'center',
    padding: 40,
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  resultScore: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resultPercentage: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  resultXP: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 32,
  },
  resultActions: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
});
