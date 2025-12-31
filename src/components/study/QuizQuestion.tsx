import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { QuizQuestion as QuizQuestionType } from '../../types/study';
import { colors, shadows } from '../../theme/colors';
import { springConfigs } from '../../utils/animations';

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string | string[]) => void;
  showResult?: boolean;
  userAnswer?: string | string[];
  isCorrect?: boolean;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  showResult = false,
  userAnswer,
  isCorrect,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const shakeX = useSharedValue(0);

  const handleSelectOption = async (option: string) => {
    if (showResult) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAnswer(option);
  };

  const handleSubmit = async () => {
    if (question.type === 'written' || question.type === 'fill_blank') {
      if (!writtenAnswer.trim()) {
        shakeX.value = withSequence(
          withSpring(-10, { damping: 2 }),
          withSpring(10, { damping: 2 }),
          withSpring(-10, { damping: 2 }),
          withSpring(0, { damping: 2 })
        );
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      onAnswer(writtenAnswer.trim());
    } else {
      if (!selectedAnswer) {
        shakeX.value = withSequence(
          withSpring(-10, { damping: 2 }),
          withSpring(10, { damping: 2 }),
          withSpring(-10, { damping: 2 }),
          withSpring(0, { damping: 2 })
        );
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      onAnswer(selectedAnswer);
    }
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const getOptionStyle = (option: string) => {
    if (!showResult) {
      return selectedAnswer === option ? styles.optionSelected : styles.option;
    }
    
    const isCorrectOption = option === question.correctAnswer;
    const isUserSelection = option === userAnswer;
    
    if (isCorrectOption) {
      return [styles.option, styles.optionCorrect];
    }
    if (isUserSelection && !isCorrectOption) {
      return [styles.option, styles.optionIncorrect];
    }
    return styles.option;
  };

  const renderMultipleChoice = () => (
    <View style={styles.optionsContainer}>
      {question.options?.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={getOptionStyle(option)}
          onPress={() => handleSelectOption(option)}
          disabled={showResult}
          activeOpacity={0.8}
        >
          <View style={styles.optionLetter}>
            <Text style={styles.optionLetterText}>
              {String.fromCharCode(65 + index)}
            </Text>
          </View>
          <Text style={styles.optionText}>{option}</Text>
          {showResult && option === question.correctAnswer && (
            <Text style={styles.correctIcon}>✓</Text>
          )}
          {showResult && option === userAnswer && option !== question.correctAnswer && (
            <Text style={styles.incorrectIcon}>✗</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTrueFalse = () => (
    <View style={styles.trueFalseContainer}>
      <TouchableOpacity
        style={[
          styles.trueFalseButton,
          selectedAnswer === 'true' && styles.trueFalseSelected,
          showResult && question.correctAnswer === 'true' && styles.optionCorrect,
          showResult && userAnswer === 'true' && question.correctAnswer !== 'true' && styles.optionIncorrect,
        ]}
        onPress={() => handleSelectOption('true')}
        disabled={showResult}
      >
        <Text style={styles.trueFalseEmoji}>✅</Text>
        <Text style={styles.trueFalseText}>True</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.trueFalseButton,
          selectedAnswer === 'false' && styles.trueFalseSelected,
          showResult && question.correctAnswer === 'false' && styles.optionCorrect,
          showResult && userAnswer === 'false' && question.correctAnswer !== 'false' && styles.optionIncorrect,
        ]}
        onPress={() => handleSelectOption('false')}
        disabled={showResult}
      >
        <Text style={styles.trueFalseEmoji}>❌</Text>
        <Text style={styles.trueFalseText}>False</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWritten = () => (
    <View style={styles.writtenContainer}>
      <TextInput
        style={[
          styles.writtenInput,
          showResult && isCorrect && styles.writtenCorrect,
          showResult && !isCorrect && styles.writtenIncorrect,
        ]}
        placeholder="Type your answer..."
        placeholderTextColor={colors.gray[400]}
        value={writtenAnswer}
        onChangeText={setWrittenAnswer}
        multiline
        editable={!showResult}
      />
      {showResult && (
        <View style={styles.correctAnswerContainer}>
          <Text style={styles.correctAnswerLabel}>Correct Answer:</Text>
          <Text style={styles.correctAnswerText}>
            {Array.isArray(question.correctAnswer) 
              ? question.correctAnswer.join(', ') 
              : question.correctAnswer}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <Animated.View entering={FadeIn} style={[styles.container, shakeStyle]}>
      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(questionNumber / totalQuestions) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {questionNumber} / {totalQuestions}
        </Text>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <View style={styles.questionBadge}>
          <Text style={styles.questionBadgeText}>
            {question.type === 'multiple_choice' && '📝 Multiple Choice'}
            {question.type === 'true_false' && '⚖️ True or False'}
            {question.type === 'written' && '✍️ Written'}
            {question.type === 'fill_blank' && '📝 Fill in the Blank'}
          </Text>
          <Text style={styles.pointsBadge}>{question.points} pts</Text>
        </View>
        
        <Text style={styles.questionText}>{question.question}</Text>
        
        {question.imageUrl && (
          <View style={styles.questionImage}>
            {/* Image placeholder */}
          </View>
        )}
      </View>

      {/* Answer Options */}
      {question.type === 'multiple_choice' && renderMultipleChoice()}
      {question.type === 'true_false' && renderTrueFalse()}
      {(question.type === 'written' || question.type === 'fill_blank') && renderWritten()}

      {/* Explanation (shown after answer) */}
      {showResult && question.explanation && (
        <View style={styles.explanationContainer}>
          <Text style={styles.explanationLabel}>💡 Explanation</Text>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </View>
      )}

      {/* Submit Button */}
      {!showResult && (
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Answer</Text>
        </TouchableOpacity>
      )}

      {/* Result Feedback */}
      {showResult && (
        <View style={[styles.resultBadge, isCorrect ? styles.resultCorrect : styles.resultIncorrect]}>
          <Text style={styles.resultEmoji}>{isCorrect ? '🎉' : '😔'}</Text>
          <Text style={styles.resultText}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  questionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
    backgroundColor: colors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning[600],
    backgroundColor: colors.warning[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[800],
    lineHeight: 28,
  },
  questionImage: {
    width: '100%',
    height: 150,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    marginTop: 16,
  },
  optionsContainer: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  optionSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary[400],
    ...shadows.sm,
  },
  optionCorrect: {
    backgroundColor: colors.success[50],
    borderColor: colors.success[400],
  },
  optionIncorrect: {
    backgroundColor: colors.danger[50],
    borderColor: colors.danger[400],
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[600],
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[700],
  },
  correctIcon: {
    fontSize: 20,
    color: colors.success[600],
    fontWeight: '700',
  },
  incorrectIcon: {
    fontSize: 20,
    color: colors.danger[600],
    fontWeight: '700',
  },
  trueFalseContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  trueFalseButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  trueFalseSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[400],
  },
  trueFalseEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  trueFalseText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[700],
  },
  writtenContainer: {
    gap: 16,
  },
  writtenInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.gray[200],
    padding: 16,
    fontSize: 16,
    color: colors.gray[800],
    minHeight: 120,
    textAlignVertical: 'top',
    ...shadows.sm,
  },
  writtenCorrect: {
    borderColor: colors.success[400],
    backgroundColor: colors.success[50],
  },
  writtenIncorrect: {
    borderColor: colors.danger[400],
    backgroundColor: colors.danger[50],
  },
  correctAnswerContainer: {
    backgroundColor: colors.success[50],
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  correctAnswerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success[600],
    marginBottom: 4,
  },
  correctAnswerText: {
    fontSize: 15,
    color: colors.success[800],
  },
  explanationContainer: {
    backgroundColor: colors.primary[50],
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  explanationLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary[600],
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: colors.primary[800],
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
    ...shadows.md,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    marginTop: 16,
    gap: 8,
  },
  resultCorrect: {
    backgroundColor: colors.success[100],
  },
  resultIncorrect: {
    backgroundColor: colors.danger[100],
  },
  resultEmoji: {
    fontSize: 24,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[800],
  },
});

export default QuizQuestion;

