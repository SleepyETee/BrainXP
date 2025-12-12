// Flashcard Generator & Study Tool Screen
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, gradients, shadows } from '../../src/theme/colors';
import { useStudyStore } from '../../src/stores/studyStore';
import { generateFlashcards } from '../../src/services/api/aiTools';
import { FlashcardGeneratorOutput } from '../../src/types/aiTools';
import { Flashcard, REVIEW_QUALITY } from '../../src/types/study';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

type ViewMode = 'generate' | 'preview' | 'study';

interface StudyProgress {
  total: number;
  reviewed: number;
  correct: number;
  incorrect: number;
}

export default function FlashcardGeneratorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ studySetId?: string; mode?: string }>();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>(params.mode === 'study' ? 'study' : 'generate');
  const [content, setContent] = useState('');
  const [cardCount, setCardCount] = useState<5 | 10 | 15 | 20>(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<FlashcardGeneratorOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [setTitle, setSetTitle] = useState('');
  
  // Study mode state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [studyProgress, setStudyProgress] = useState<StudyProgress>({
    total: 0,
    reviewed: 0,
    correct: 0,
    incorrect: 0,
  });
  const [sessionComplete, setSessionComplete] = useState(false);
  
  // Store
  const {
    createStudySet,
    addFlashcard,
    getStudySetById,
    getCardsForReview,
    reviewFlashcard,
    startStudySession,
    endStudySession,
    recordCardResult,
  } = useStudyStore();
  
  // Animation values
  const flipRotation = useSharedValue(0);
  const translateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  const CARD_COUNT_OPTIONS = [5, 10, 15, 20] as const;
  const DIFFICULTY_OPTIONS = [
    { value: 'easy' as const, label: 'Easy', emoji: '🟢' },
    { value: 'medium' as const, label: 'Medium', emoji: '🟡' },
    { value: 'hard' as const, label: 'Hard', emoji: '🔴' },
  ];

  // Initialize study mode if studySetId provided
  React.useEffect(() => {
    if (params.studySetId && params.mode === 'study') {
      const studySet = getStudySetById(params.studySetId);
      if (studySet) {
        const cards = getCardsForReview(params.studySetId);
        if (cards.length > 0) {
          setStudyCards(cards);
          setStudyProgress({
            total: cards.length,
            reviewed: 0,
            correct: 0,
            incorrect: 0,
          });
          setViewMode('study');
          startStudySession(params.studySetId, 'review');
        } else {
          Alert.alert('No cards due', 'All cards are up to date! Come back later.');
          router.back();
        }
      }
    }
  }, [params.studySetId, params.mode]);

  const handleGenerate = async () => {
    if (!content.trim()) {
      setError('Please enter some content to generate flashcards from');
      return;
    }

    if (content.trim().length < 50) {
      setError('Please enter more content (at least 50 characters) for better flashcards');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await generateFlashcards({
        content: content.trim(),
        cardCount,
        difficulty,
        includeExplanations: true,
      });
      
      setGeneratedData(result);
      setViewMode('preview');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Flashcard generation error:', err);
      setError('Failed to generate flashcards. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToStudySet = async () => {
    if (!generatedData) return;
    
    try {
      const title = setTitle.trim() || 'AI Generated Set';
      
      // Create a new study set
      const studySet = createStudySet({
        title,
        description: `${generatedData.flashcards.length} cards generated from your content`,
        icon: '🤖',
        color: colors.primary[500],
      });
      
      // Add each flashcard to the study set
      for (const card of generatedData.flashcards) {
        addFlashcard(studySet.id, card.front, card.back, {
          hint: card.hint,
          explanation: card.explanation,
          tags: card.tags,
          aiGenerated: true,
        });
      }
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Ask if user wants to study now
      Alert.alert(
        'Cards Saved! 🎉',
        `${generatedData.flashcards.length} cards have been saved to "${title}"`,
        [
          { text: 'Study Now', onPress: () => router.push(`/study/${studySet.id}`) },
          { text: 'Go to Study Hub', onPress: () => router.push('/study') },
        ]
      );
    } catch (err) {
      setError('Failed to save study set');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleStudyGeneratedCards = () => {
    if (!generatedData) return;
    
    // Convert generated cards to Flashcard format for studying
    const cards: Flashcard[] = generatedData.flashcards.map((card, index) => ({
      id: `temp_${index}`,
      studySetId: 'temp',
      front: card.front,
      back: card.back,
      hint: card.hint,
      explanation: card.explanation,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      learningState: 'new',
      lapses: 0,
      tags: card.tags || [],
      order: index,
      aiGenerated: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    
    setStudyCards(cards);
    setStudyProgress({
      total: cards.length,
      reviewed: 0,
      correct: 0,
      incorrect: 0,
    });
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowAnswer(false);
    setViewMode('study');
  };

  // Flip card animation
  const flipCard = useCallback(() => {
    setIsFlipped(!isFlipped);
    setShowAnswer(!showAnswer);
    flipRotation.value = withSpring(isFlipped ? 0 : 180, {
      damping: 15,
      stiffness: 100,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isFlipped, showAnswer]);

  // Handle answer quality selection
  const handleAnswer = useCallback((quality: number) => {
    const isCorrect = quality >= 3;
    
    setStudyProgress((prev) => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));
    
    // If studying a saved set, update the card
    if (params.studySetId && studyCards[currentCardIndex]) {
      reviewFlashcard(params.studySetId, studyCards[currentCardIndex].id, quality);
    }
    
    Haptics.notificationAsync(
      isCorrect
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );
    
    // Move to next card
    if (currentCardIndex < studyCards.length - 1) {
      cardOpacity.value = withTiming(0, { duration: 150 }, () => {
        runOnJS(setCurrentCardIndex)(currentCardIndex + 1);
        runOnJS(setIsFlipped)(false);
        runOnJS(setShowAnswer)(false);
        flipRotation.value = 0;
        cardOpacity.value = withTiming(1, { duration: 150 });
      });
    } else {
      setSessionComplete(true);
      if (params.studySetId) {
        endStudySession();
      }
    }
  }, [currentCardIndex, studyCards, params.studySetId]);

  // Swipe gesture for cards
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!showAnswer) return;
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (!showAnswer) return;
      
      if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe right = correct
        translateX.value = withSpring(SCREEN_WIDTH, {}, () => {
          runOnJS(handleAnswer)(REVIEW_QUALITY.CORRECT);
          translateX.value = 0;
        });
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe left = incorrect
        translateX.value = withSpring(-SCREEN_WIDTH, {}, () => {
          runOnJS(handleAnswer)(REVIEW_QUALITY.INCORRECT);
          translateX.value = 0;
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  // Animated styles
  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(flipRotation.value, [0, 180], [0, 180])}deg` },
    ],
    backfaceVisibility: 'hidden',
    opacity: cardOpacity.value,
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(flipRotation.value, [0, 180], [180, 360])}deg` },
    ],
    backfaceVisibility: 'hidden',
    opacity: cardOpacity.value,
  }));

  const swipeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const swipeIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const currentCard = studyCards[currentCardIndex];

  // ═══════════════════════════════════════════════════════════════════════════════
  // STUDY SESSION COMPLETE
  // ═══════════════════════════════════════════════════════════════════════════════
  
  if (sessionComplete) {
    const percentage = Math.round((studyProgress.correct / studyProgress.total) * 100);
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.resultContainer}>
          <Animated.View entering={FadeIn} style={styles.resultContent}>
            <Text style={styles.resultEmoji}>
              {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪'}
            </Text>
            <Text style={styles.resultTitle}>Session Complete!</Text>
            <Text style={styles.resultScore}>
              {studyProgress.correct} / {studyProgress.total}
            </Text>
            <Text style={styles.resultPercentage}>{percentage}% correct</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{studyProgress.reviewed}</Text>
                <Text style={styles.statLabel}>Reviewed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.success[500] }]}>
                  {studyProgress.correct}
                </Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.danger[500] }]}>
                  {studyProgress.incorrect}
                </Text>
                <Text style={styles.statLabel}>To Review</Text>
              </View>
            </View>
            
            <Text style={styles.resultMessage}>
              {percentage >= 80
                ? 'Excellent! Your spaced repetition schedule has been updated.'
                : percentage >= 60
                ? 'Good progress! Cards you missed will appear more frequently.'
                : 'Keep practicing! Difficult cards will be shown again soon.'}
            </Text>
            
            <TouchableOpacity
              style={styles.restartButton}
              onPress={() => {
                if (generatedData) {
                  handleStudyGeneratedCards();
                } else {
                  setSessionComplete(false);
                  setCurrentCardIndex(0);
                  setStudyProgress({ total: studyCards.length, reviewed: 0, correct: 0, incorrect: 0 });
                }
              }}
            >
              <Text style={styles.restartButtonText}>Study Again</Text>
            </TouchableOpacity>
            
            {generatedData && (
              <TouchableOpacity
                style={styles.saveAfterStudyButton}
                onPress={handleSaveToStudySet}
              >
                <Text style={styles.saveAfterStudyButtonText}>💾 Save These Cards</Text>
              </TouchableOpacity>
            )}
            
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // STUDY MODE
  // ═══════════════════════════════════════════════════════════════════════════════
  
  if (viewMode === 'study' && currentCard) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.studyHeader}>
          <TouchableOpacity onPress={() => {
            if (params.studySetId) endStudySession();
            router.back();
          }}>
            <Text style={styles.exitButton}>✕</Text>
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentCardIndex + 1) / studyCards.length) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {currentCardIndex + 1} / {studyCards.length}
            </Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreText, { color: colors.success[500] }]}>
              ✓ {studyProgress.correct}
            </Text>
            <Text style={[styles.scoreText, { color: colors.danger[500] }]}>
              ✗ {studyProgress.incorrect}
            </Text>
          </View>
        </View>

        {/* Swipe indicators */}
        <Animated.View style={[styles.swipeIndicatorLeft, swipeIndicatorStyle]}>
          <Text style={styles.swipeIndicatorText}>✗ Again</Text>
        </Animated.View>
        <Animated.View style={[styles.swipeIndicatorRight, swipeIndicatorStyle]}>
          <Text style={styles.swipeIndicatorText}>✓ Got it</Text>
        </Animated.View>

        {/* Flashcard */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.cardContainer, swipeAnimatedStyle]}>
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={flipCard}
              style={styles.cardTouchable}
            >
              {/* Front of card */}
              <Animated.View style={[styles.flashcard, styles.cardFront, frontAnimatedStyle]}>
                <View style={styles.cardContent}>
                  {currentCard.tags && currentCard.tags.length > 0 && (
                    <View style={styles.cardTags}>
                      {currentCard.tags.slice(0, 2).map((tag, i) => (
                        <View key={i} style={styles.miniTag}>
                          <Text style={styles.miniTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <Text style={styles.cardLabel}>Question</Text>
                  <Text style={styles.cardMainText}>{currentCard.front}</Text>
                  {currentCard.hint && (
                    <View style={styles.hintContainer}>
                      <Text style={styles.hintLabel}>💡 Hint</Text>
                      <Text style={styles.hintText}>{currentCard.hint}</Text>
                    </View>
                  )}
                  <Text style={styles.tapHint}>Tap to reveal answer</Text>
                </View>
              </Animated.View>

              {/* Back of card */}
              <Animated.View style={[styles.flashcard, styles.cardBack, backAnimatedStyle]}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Answer</Text>
                  <Text style={styles.cardMainText}>{currentCard.back}</Text>
                  {currentCard.explanation && (
                    <View style={styles.explanationContainer}>
                      <Text style={styles.explanationLabel}>📚 Explanation</Text>
                      <Text style={styles.explanationText}>{currentCard.explanation}</Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>

        {/* Answer buttons */}
        {showAnswer && (
          <Animated.View entering={FadeInUp} style={styles.answerButtons}>
            <TouchableOpacity
              style={[styles.answerButton, styles.againButton]}
              onPress={() => handleAnswer(REVIEW_QUALITY.INCORRECT)}
            >
              <Text style={styles.answerButtonEmoji}>😓</Text>
              <Text style={styles.answerButtonText}>Again</Text>
              <Text style={styles.answerButtonHint}>&lt;1 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.answerButton, styles.hardButton]}
              onPress={() => handleAnswer(REVIEW_QUALITY.CORRECT_HARD)}
            >
              <Text style={styles.answerButtonEmoji}>🤔</Text>
              <Text style={styles.answerButtonText}>Hard</Text>
              <Text style={styles.answerButtonHint}>~10 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.answerButton, styles.goodButton]}
              onPress={() => handleAnswer(REVIEW_QUALITY.CORRECT)}
            >
              <Text style={styles.answerButtonEmoji}>😊</Text>
              <Text style={styles.answerButtonText}>Good</Text>
              <Text style={styles.answerButtonHint}>~1 day</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.answerButton, styles.easyButton]}
              onPress={() => handleAnswer(REVIEW_QUALITY.PERFECT)}
            >
              <Text style={styles.answerButtonEmoji}>🎯</Text>
              <Text style={styles.answerButtonText}>Easy</Text>
              <Text style={styles.answerButtonHint}>4+ days</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {!showAnswer && (
          <View style={styles.showAnswerContainer}>
            <TouchableOpacity style={styles.showAnswerButton} onPress={flipCard}>
              <Text style={styles.showAnswerText}>Show Answer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PREVIEW MODE
  // ═══════════════════════════════════════════════════════════════════════════════
  
  if (viewMode === 'preview' && generatedData) {
    const generatedCards = generatedData.flashcards || [];
    
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={() => setViewMode('generate')}>
            <Text style={styles.backArrow}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.previewTitle}>Generated Cards</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn}>
            <View style={styles.successBanner}>
              <Text style={styles.successEmoji}>✅</Text>
              <Text style={styles.successText}>
                Generated {generatedCards.length} flashcards!
              </Text>
            </View>

            {/* Set Title Input */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Study Set Title</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Enter a name for this study set..."
                placeholderTextColor={colors.gray[400]}
                value={setTitle}
                onChangeText={setSetTitle}
              />
            </View>

            {/* Metadata */}
            {generatedData.metadata && (
              <View style={styles.metadataCard}>
                <Text style={styles.metadataTitle}>📊 Study Set Info</Text>
                <Text style={styles.metadataItem}>
                  📚 Topics: {generatedData.metadata.topics?.join(', ') || 'General'}
                </Text>
                <Text style={styles.metadataItem}>
                  ⏱️ Est. study time: {generatedData.metadata.estimatedStudyTime} min
                </Text>
                <Text style={styles.metadataItem}>
                  📈 Difficulty: {generatedData.metadata.difficulty}
                </Text>
              </View>
            )}

            {/* Study Tips */}
            {generatedData.studyTips && generatedData.studyTips.length > 0 && (
              <View style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>💡 Study Tips</Text>
                {generatedData.studyTips.map((tip, index) => (
                  <Text key={index} style={styles.tipItem}>• {tip}</Text>
                ))}
              </View>
            )}

            {/* Cards Preview */}
            <Text style={styles.sectionTitle}>Preview Cards</Text>
            {generatedCards.slice(0, 5).map((card, index) => (
              <Animated.View
                key={card.id || index}
                entering={FadeInDown.delay(index * 80)}
                style={styles.cardPreview}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTagsRow}>
                    {card.tags?.slice(0, 2).map((tag, i) => (
                      <View key={i} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={[styles.difficultyBadge, styles[`difficulty_${card.difficulty}`]]}>
                    <Text style={styles.difficultyBadgeText}>{card.difficulty}</Text>
                  </View>
                </View>
                <View style={styles.cardSide}>
                  <Text style={styles.cardSideLabel}>Front</Text>
                  <Text style={styles.cardText} numberOfLines={3}>
                    {card.front}
                  </Text>
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.cardSide}>
                  <Text style={styles.cardSideLabel}>Back</Text>
                  <Text style={styles.cardText} numberOfLines={3}>
                    {card.back}
                  </Text>
                </View>
                {card.hint && (
                  <View style={styles.hintSection}>
                    <Text style={styles.hintLabel}>💡 Hint:</Text>
                    <Text style={styles.hintPreviewText}>{card.hint}</Text>
                  </View>
                )}
              </Animated.View>
            ))}

            {generatedCards.length > 5 && (
              <Text style={styles.moreCards}>
                + {generatedCards.length - 5} more cards
              </Text>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.studyNowButton}
                onPress={handleStudyGeneratedCards}
              >
                <Text style={styles.studyNowButtonText}>📖 Study Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveToStudySet}
              >
                <Text style={styles.saveButtonText}>💾 Save to Study Sets</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={() => {
                  setGeneratedData(null);
                  setViewMode('generate');
                }}
              >
                <Text style={styles.regenerateButtonText}>Generate New Cards</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GENERATE MODE (Initial Screen)
  // ═══════════════════════════════════════════════════════════════════════════════
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={[...gradients.focus]}
        style={styles.headerGradient}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerEmoji}>🎴</Text>
        <Text style={styles.headerTitle}>Flashcard Generator</Text>
        <Text style={styles.headerSubtitle}>
          Turn any content into study cards with AI
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Content Input */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.inputSection}>
          <Text style={styles.label}>Paste your content</Text>
          <Text style={styles.labelHint}>
            Notes, articles, textbook sections, or any text you want to learn
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Paste your study material here..."
            placeholderTextColor={colors.gray[400]}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </Animated.View>

        {/* Card Count */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.inputSection}>
          <Text style={styles.label}>Number of cards to generate</Text>
          <View style={styles.countOptions}>
            {CARD_COUNT_OPTIONS.map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.countOption,
                  cardCount === count && styles.countOptionSelected,
                ]}
                onPress={() => setCardCount(count)}
              >
                <Text
                  style={[
                    styles.countText,
                    cardCount === count && styles.countTextSelected,
                  ]}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Difficulty */}
        <Animated.View entering={FadeInDown.delay(250)} style={styles.inputSection}>
          <Text style={styles.label}>Difficulty level</Text>
          <View style={styles.countOptions}>
            {DIFFICULTY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.countOption,
                  difficulty === option.value && styles.countOptionSelected,
                ]}
                onPress={() => setDifficulty(option.value)}
              >
                <Text style={styles.difficultyEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.difficultyText,
                    difficulty === option.value && styles.countTextSelected,
                  ]}
                >
                  {option.label}
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
                <Text style={styles.buttonText}>Generate Flashcards</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Tips */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips for best results</Text>
          <Text style={styles.tipItem}>• Use clear, well-organized content</Text>
          <Text style={styles.tipItem}>• Include definitions and key concepts</Text>
          <Text style={styles.tipItem}>• Longer content = better cards</Text>
          <Text style={styles.tipItem}>• Cards use spaced repetition (SM-2) for optimal learning</Text>
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
    marginBottom: 4,
  },
  labelHint: {
    fontSize: 13,
    color: colors.gray[500],
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
    minHeight: 160,
  },
  titleInput: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray[800],
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
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  countText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[600],
  },
  countTextSelected: {
    color: colors.primary[700],
  },
  difficultyEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[600],
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
    backgroundColor: colors.primary[500],
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
  tipsCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary[700],
    marginBottom: 10,
  },
  tipItem: {
    fontSize: 14,
    color: colors.primary[600],
    marginBottom: 4,
    lineHeight: 20,
  },
  // Preview styles
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backArrow: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success[50],
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  successEmoji: {
    fontSize: 24,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success[700],
  },
  metadataCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  metadataTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 10,
  },
  metadataItem: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 4,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 12,
  },
  cardPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[700],
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  difficulty_easy: {
    backgroundColor: colors.success[100],
  },
  difficulty_medium: {
    backgroundColor: colors.warning[100],
  },
  difficulty_hard: {
    backgroundColor: colors.danger[100],
  },
  difficultyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[700],
    textTransform: 'capitalize',
  },
  cardSide: {
    paddingVertical: 8,
  },
  cardSideLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[400],
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 21,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 8,
  },
  hintSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  hintLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 2,
  },
  hintPreviewText: {
    fontSize: 13,
    color: colors.gray[600],
    fontStyle: 'italic',
  },
  moreCards: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    marginVertical: 12,
  },
  actions: {
    marginTop: 20,
    gap: 12,
  },
  studyNowButton: {
    backgroundColor: colors.success[500],
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...shadows.md,
  },
  studyNowButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...shadows.sm,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  regenerateButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  regenerateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[600],
  },
  // Study mode styles
  studyHeader: {
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
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  swipeIndicatorLeft: {
    position: 'absolute',
    left: 20,
    top: '45%',
    backgroundColor: colors.danger[100],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  swipeIndicatorRight: {
    position: 'absolute',
    right: 20,
    top: '45%',
    backgroundColor: colors.success[100],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  swipeIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardTouchable: {
    width: '100%',
    height: 320,
  },
  flashcard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    ...shadows.lg,
  },
  cardFront: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.primary[200],
  },
  cardBack: {
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[300],
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  cardTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    position: 'absolute',
    top: 16,
    left: 24,
  },
  miniTag: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[700],
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[400],
    textTransform: 'uppercase',
    marginBottom: 12,
    textAlign: 'center',
  },
  cardMainText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[800],
    textAlign: 'center',
    lineHeight: 28,
  },
  hintContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: colors.warning[50],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  hintText: {
    fontSize: 14,
    color: colors.warning[700],
    fontStyle: 'italic',
    textAlign: 'center',
  },
  tapHint: {
    fontSize: 13,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 20,
  },
  explanationContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 10,
  },
  explanationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    color: colors.primary[700],
    lineHeight: 20,
  },
  answerButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 8,
  },
  answerButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  againButton: {
    backgroundColor: colors.danger[100],
  },
  hardButton: {
    backgroundColor: colors.warning[100],
  },
  goodButton: {
    backgroundColor: colors.success[100],
  },
  easyButton: {
    backgroundColor: colors.primary[100],
  },
  answerButtonEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  answerButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[700],
  },
  answerButtonHint: {
    fontSize: 10,
    color: colors.gray[500],
    marginTop: 2,
  },
  showAnswerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  showAnswerButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...shadows.md,
  },
  showAnswerText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Result styles
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
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[800],
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  resultMessage: {
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
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
  saveAfterStudyButton: {
    backgroundColor: colors.success[500],
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  saveAfterStudyButtonText: {
    fontSize: 15,
    fontWeight: '600',
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
