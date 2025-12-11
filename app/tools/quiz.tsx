// Quiz Generator Tool Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, gradients, shadows } from '../../src/theme/colors';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export default function QuizGeneratorScreen() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const QUESTION_COUNT_OPTIONS = [5, 10, 15] as const;

  const handleGenerate = async () => {
    if (!content.trim()) {
      setError('Please enter some content to generate a quiz from');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate AI generation (replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Generate mock questions
      const mockQuestions: QuizQuestion[] = [];
      for (let i = 0; i < questionCount; i++) {
        mockQuestions.push({
          id: `q-${i}`,
          question: `Question ${i + 1}: What is an important concept from the provided content?`,
          options: [
            'Option A - Correct answer',
            'Option B - Incorrect',
            'Option C - Incorrect',
            'Option D - Incorrect',
          ],
          correctIndex: 0,
          explanation: 'This is the correct answer because it directly relates to the key concept.',
        });
      }
      
      setQuestions(mockQuestions);
      setCurrentQuestion(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowResult(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError('Failed to generate quiz. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = async (index: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    const isCorrect = index === questions[currentQuestion].correctIndex;
    
    if (isCorrect) {
      setScore((prev) => prev + 1);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
    }
  };

  const handleRestart = () => {
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setContent('');
  };

  // Quiz Result Screen
  if (showResult && questions.length > 0) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.resultContainer}>
          <Animated.View entering={FadeIn} style={styles.resultContent}>
            <Text style={styles.resultEmoji}>
              {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪'}
            </Text>
            <Text style={styles.resultTitle}>Quiz Complete!</Text>
            <Text style={styles.resultScore}>
              {score} / {questions.length}
            </Text>
            <Text style={styles.resultPercentage}>{percentage}%</Text>
            <Text style={styles.resultMessage}>
              {percentage >= 80
                ? 'Excellent! You really know this material!'
                : percentage >= 60
                ? 'Good job! Keep studying to improve.'
                : 'Keep practicing! You\'ll get there.'}
            </Text>
            
            <TouchableOpacity
              style={styles.restartButton}
              onPress={handleRestart}
            >
              <Text style={styles.restartButtonText}>Create New Quiz</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.backToStudyButton}
              onPress={() => router.push('/study')}
            >
              <Text style={styles.backToStudyButtonText}>Go to Study Hub</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  // Quiz Question Screen
  if (questions.length > 0) {
    const question = questions[currentQuestion];
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Progress Header */}
        <View style={styles.quizHeader}>
          <TouchableOpacity onPress={() => setQuestions([])}>
            <Text style={styles.exitButton}>✕</Text>
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentQuestion + 1) / questions.length) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {currentQuestion + 1} / {questions.length}
            </Text>
          </View>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.quizContent}
        >
          {/* Question */}
          <Animated.View entering={FadeIn} style={styles.questionCard}>
            <Text style={styles.questionText}>{question.question}</Text>
          </Animated.View>

          {/* Options */}
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correctIndex;
            const showCorrect = selectedAnswer !== null && isCorrect;
            const showWrong = isSelected && !isCorrect;

            return (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(index * 100)}
              >
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionSelected,
                    showCorrect && styles.optionCorrect,
                    showWrong && styles.optionWrong,
                  ]}
                  onPress={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                >
                  <Text
                    style={[
                      styles.optionText,
                      (showCorrect || isSelected) && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {/* Explanation */}
          {selectedAnswer !== null && question.explanation && (
            <Animated.View entering={FadeIn} style={styles.explanationCard}>
              <Text style={styles.explanationTitle}>💡 Explanation</Text>
              <Text style={styles.explanationText}>{question.explanation}</Text>
            </Animated.View>
          )}

          {/* Next Button */}
          {selectedAnswer !== null && (
            <Animated.View entering={FadeIn}>
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    );
  }

  // Initial Setup Screen
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={[...gradients.growth]}
        style={styles.headerGradient}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerEmoji}>📋</Text>
        <Text style={styles.headerTitle}>Quiz Generator</Text>
        <Text style={styles.headerSubtitle}>
          Test your knowledge with AI-generated quizzes
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Content Input */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.inputSection}>
          <Text style={styles.label}>Content to quiz on</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste notes, textbook content, or any material..."
            placeholderTextColor={colors.gray[400]}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </Animated.View>

        {/* Question Count */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.inputSection}>
          <Text style={styles.label}>Number of questions</Text>
          <View style={styles.countOptions}>
            {QUESTION_COUNT_OPTIONS.map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.countOption,
                  questionCount === count && styles.countOptionSelected,
                ]}
                onPress={() => setQuestionCount(count)}
              >
                <Text
                  style={[
                    styles.countText,
                    questionCount === count && styles.countTextSelected,
                  ]}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Animated.View entering={FadeInDown.delay(300)}>
          <TouchableOpacity
            style={[styles.generateButton, isLoading && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.buttonEmoji}>✨</Text>
                <Text style={styles.buttonText}>Generate Quiz</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 10,
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
    minHeight: 140,
  },
  countOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  countOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[50],
  },
  countOptionSelected: {
    borderColor: colors.success[500],
    backgroundColor: colors.success[50],
  },
  countText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[600],
  },
  countTextSelected: {
    color: colors.success[700],
  },
  error: {
    fontSize: 14,
    color: colors.danger[500],
    marginBottom: 16,
    textAlign: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success[500],
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonEmoji: {
    fontSize: 18,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Quiz header
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  exitButton: {
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
    backgroundColor: colors.success[500],
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  quizContent: {
    padding: 20,
    paddingBottom: 40,
  },
  questionCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[800],
    lineHeight: 26,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
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
  optionText: {
    fontSize: 16,
    color: colors.gray[700],
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  explanationCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary[700],
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: colors.primary[600],
    lineHeight: 20,
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
  // Result screen
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 40,
  },
  resultContent: {
    alignItems: 'center',
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: 16,
  },
  resultScore: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.primary[500],
  },
  resultPercentage: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 16,
  },
  resultMessage: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  restartButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
    ...shadows.md,
  },
  restartButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backToStudyButton: {
    paddingVertical: 12,
  },
  backToStudyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[600],
  },
});
