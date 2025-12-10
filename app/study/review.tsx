// Study Review Session Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useStudyStore } from '../../src/stores/studyStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { FlashcardView } from '../../src/components/study/FlashcardView';
import { StudyProgress } from '../../src/components/study/StudyProgress';
import { colors, gradients, shadows } from '../../src/theme/colors';
import { Flashcard, ReviewQuality } from '../../src/types/study';

export default function StudyReviewScreen() {
  const router = useRouter();
  const {
    studySets,
    flashcards,
    getDueCardsCount,
    startStudySession,
    reviewCard,
    skipCard,
    endStudySession,
    activeSession,
    sessionCards,
    currentCardIndex,
    getSessionProgress,
  } = useStudyStore();
  
  const addXP = useProgressStore((state) => state.addXP);
  
  const [isStudying, setIsStudying] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Get all due cards across all study sets
  const getAllDueCards = (): Flashcard[] => {
    const dueCards: Flashcard[] = [];
    const now = new Date();
    
    Object.entries(flashcards).forEach(([setId, cards]) => {
      cards.forEach((card) => {
        if (!card.nextReview || new Date(card.nextReview) <= now) {
          dueCards.push(card);
        }
      });
    });
    
    return dueCards;
  };

  const dueCards = getAllDueCards();
  const totalDue = dueCards.length;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStudying && activeSession) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStudying, activeSession]);

  const handleStartReview = async () => {
    if (dueCards.length === 0) return;
    
    // Start with the first study set that has due cards
    const setWithDueCards = studySets.find((set) => getDueCardsCount(set.id) > 0);
    if (setWithDueCards) {
      await startStudySession(setWithDueCards.id, 'review');
      setIsStudying(true);
      setTimeElapsed(0);
    }
  };

  const handleReview = async (quality: ReviewQuality) => {
    await reviewCard(quality);
    
    // Check if session is complete
    if (currentCardIndex >= sessionCards.length - 1) {
      await handleEndSession();
    }
  };

  const handleSkip = () => {
    skipCard();
    if (currentCardIndex >= sessionCards.length - 1) {
      handleEndSession();
    }
  };

  const handleEndSession = async () => {
    const currentSession = activeSession;
    endStudySession();

    if (currentSession) {
      const xpEarned = currentSession.cardsCorrect * 5 + currentSession.cardsReviewed * 2;
      await addXP(xpEarned, 'study_session', 'Completed study session');
    }

    setIsStudying(false);
    setSessionComplete(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Session Complete Screen
  if (sessionComplete && activeSession) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={gradients.focus as [string, string]}
          style={styles.completeGradient}
        >
          <Animated.View entering={FadeIn} style={styles.completeContent}>
            <Text style={styles.completeEmoji}>🎉</Text>
            <Text style={styles.completeTitle}>Session Complete!</Text>
            <Text style={styles.completeStats}>
              {activeSession.cardsCorrect} / {activeSession.cardsReviewed} correct
            </Text>
            <Text style={styles.completeXP}>+{activeSession.xpEarned} XP</Text>
            
            <View style={styles.completeActions}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => {
                  setSessionComplete(false);
                  handleStartReview();
                }}
              >
                <Text style={styles.continueButtonText}>Continue Reviewing</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => router.back()}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  // Active Study Session
  if (isStudying && activeSession && sessionCards.length > 0) {
    const currentCard = sessionCards[currentCardIndex];
    const progress = getSessionProgress();
    
    if (!currentCard) {
      handleEndSession();
      return null;
    }

    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Progress Header */}
        <StudyProgress
          current={progress.current}
          total={progress.total}
          correct={progress.correct}
          mode={activeSession.mode}
          timeElapsed={timeElapsed}
        />

        {/* Flashcard */}
        <FlashcardView
          card={currentCard}
          onReview={handleReview}
          onSkip={handleSkip}
        />

        {/* End Session Button */}
        <TouchableOpacity
          style={styles.endSessionButton}
          onPress={handleEndSession}
        >
          <Text style={styles.endSessionText}>End Session</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Start Screen
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Session</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.startContent}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.dueCard}>
          <Text style={styles.dueEmoji}>📚</Text>
          <Text style={styles.dueNumber}>{totalDue}</Text>
          <Text style={styles.dueLabel}>cards due for review</Text>
        </Animated.View>

        {totalDue > 0 ? (
          <>
            <Animated.View entering={FadeInDown.delay(200)}>
              <Text style={styles.infoText}>
                Review cards from all your study sets using spaced repetition for optimal learning.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300)}>
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartReview}
              >
                <Text style={styles.startButtonText}>Start Review</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          <Animated.View entering={FadeInDown.delay(200)}>
            <View style={styles.noCardsCard}>
              <Text style={styles.noCardsEmoji}>✅</Text>
              <Text style={styles.noCardsTitle}>All caught up!</Text>
              <Text style={styles.noCardsText}>
                No cards are due for review right now. Check back later or add new cards.
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push('/study')}
              >
                <Text style={styles.browseButtonText}>Browse Study Sets</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>
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
  backButton: {
    fontSize: 16,
    color: colors.primary[600],
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[900],
  },
  placeholder: {
    width: 60,
  },
  startContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: colors.primary[100],
  },
  dueEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  dueNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.primary[600],
  },
  dueLabel: {
    fontSize: 16,
    color: colors.primary[500],
    marginTop: 4,
  },
  infoText: {
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  startButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 16,
    ...shadows.md,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noCardsCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  noCardsEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  noCardsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 8,
  },
  noCardsText: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  endSessionButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: colors.gray[100],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  endSessionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[600],
  },
  completeGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeContent: {
    alignItems: 'center',
    padding: 40,
  },
  completeEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  completeStats: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  completeXP: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 32,
  },
  completeActions: {
    width: '100%',
    gap: 12,
  },
  continueButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  doneButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
});
