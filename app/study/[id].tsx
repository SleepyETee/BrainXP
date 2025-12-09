// Study Set Detail Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useStudyStore } from '../../src/stores/studyStore';
import { FlashcardView } from '../../src/components/study/FlashcardView';
import { StudyProgress } from '../../src/components/study/StudyProgress';
import { colors, gradients, shadows } from '../../src/theme/colors';
import { Flashcard, ReviewQuality } from '../../src/types/study';

export default function StudySetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getStudySetById,
    flashcards,
    startStudySession,
    reviewCard,
    skipCard,
    endStudySession,
    activeSession,
    sessionCards,
    currentCardIndex,
    getSessionProgress,
    createFlashcard,
  } = useStudyStore();

  const [isStudying, setIsStudying] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const studySet = getStudySetById(id || '');
  const cards = flashcards[id || ''] || [];
  const progress = getSessionProgress();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStudying && activeSession) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStudying, activeSession]);

  const handleStartStudy = async (mode: 'review' | 'learn' | 'cram') => {
    await startStudySession(id || '', mode);
    setIsStudying(true);
    setTimeElapsed(0);
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
    await endStudySession();
    setIsStudying(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (!studySet) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Study set not found</Text>
      </View>
    );
  }

  // Active Study Session View
  if (isStudying && activeSession && sessionCards.length > 0) {
    const currentCard = sessionCards[currentCardIndex];
    
    if (!currentCard) {
      // Session complete
      return (
        <View style={styles.container}>
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
              
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => {
                  setIsStudying(false);
                  router.back();
                }}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
        </View>
      );
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

  // Study Set Overview
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: studySet.color || colors.primary[500] },
            ]}
          >
            <Text style={styles.icon}>{studySet.icon || '📚'}</Text>
          </View>
          
          <Text style={styles.title}>{studySet.title}</Text>
          {studySet.description && (
            <Text style={styles.description}>{studySet.description}</Text>
          )}
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{cards.length}</Text>
              <Text style={styles.statLabel}>Cards</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.success[600] }]}>
                {cards.filter((c) => c.learningState === 'review' && c.interval >= 21).length}
              </Text>
              <Text style={styles.statLabel}>Mastered</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.warning[600] }]}>
                {cards.filter((c) => !c.nextReview || new Date(c.nextReview) <= new Date()).length}
              </Text>
              <Text style={styles.statLabel}>Due</Text>
            </View>
          </View>
        </Animated.View>

        {/* Study Options */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.studyOptions}>
          <Text style={styles.sectionTitle}>Study Options</Text>
          
          <TouchableOpacity
            style={[styles.studyOption, styles.studyOptionPrimary]}
            onPress={() => handleStartStudy('review')}
          >
            <View style={styles.studyOptionContent}>
              <Text style={styles.studyOptionEmoji}>🔄</Text>
              <View>
                <Text style={styles.studyOptionTitle}>Review Due Cards</Text>
                <Text style={styles.studyOptionDesc}>
                  Practice cards that need review
                </Text>
              </View>
            </View>
            <Text style={styles.studyOptionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.studyOption}
            onPress={() => handleStartStudy('learn')}
          >
            <View style={styles.studyOptionContent}>
              <Text style={styles.studyOptionEmoji}>📖</Text>
              <View>
                <Text style={styles.studyOptionTitleDark}>Learn New Cards</Text>
                <Text style={styles.studyOptionDescDark}>
                  Study cards you haven't seen yet
                </Text>
              </View>
            </View>
            <Text style={styles.studyOptionArrowDark}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.studyOption}
            onPress={() => handleStartStudy('cram')}
          >
            <View style={styles.studyOptionContent}>
              <Text style={styles.studyOptionEmoji}>⚡</Text>
              <View>
                <Text style={styles.studyOptionTitleDark}>Cram Mode</Text>
                <Text style={styles.studyOptionDescDark}>
                  Study all cards without affecting schedule
                </Text>
              </View>
            </View>
            <Text style={styles.studyOptionArrowDark}>→</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Cards Preview */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.cardsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cards ({cards.length})</Text>
            <TouchableOpacity
              onPress={() => router.push(`/study/${id}/add`)}
            >
              <Text style={styles.addCardText}>+ Add Card</Text>
            </TouchableOpacity>
          </View>

          {cards.length === 0 ? (
            <View style={styles.noCards}>
              <Text style={styles.noCardsEmoji}>🎴</Text>
              <Text style={styles.noCardsText}>No cards yet</Text>
              <TouchableOpacity
                style={styles.addCardButton}
                onPress={() => router.push(`/study/${id}/add`)}
              >
                <Text style={styles.addCardButtonText}>Add Your First Card</Text>
              </TouchableOpacity>
            </View>
          ) : (
            cards.slice(0, 5).map((card, index) => (
              <Animated.View
                key={card.id}
                entering={FadeInDown.delay(350 + index * 50)}
                style={styles.cardPreview}
              >
                <Text style={styles.cardFront} numberOfLines={1}>
                  {card.front}
                </Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardState}>
                    {card.learningState === 'new' && '🆕'}
                    {card.learningState === 'learning' && '📖'}
                    {card.learningState === 'review' && '✅'}
                    {card.learningState === 'relearning' && '🔄'}
                  </Text>
                  {card.nextReview && (
                    <Text style={styles.cardNext}>
                      {new Date(card.nextReview) <= new Date()
                        ? 'Due now'
                        : `In ${card.interval}d`}
                    </Text>
                  )}
                </View>
              </Animated.View>
            ))
          )}

          {cards.length > 5 && (
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>
                View all {cards.length} cards
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 0,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...shadows.lg,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
  },
  statsCard: {
    marginHorizontal: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray[800],
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  studyOptions: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 12,
  },
  studyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  studyOptionPrimary: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  studyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studyOptionEmoji: {
    fontSize: 24,
  },
  studyOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  studyOptionTitleDark: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[800],
  },
  studyOptionDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  studyOptionDescDark: {
    fontSize: 13,
    color: colors.gray[500],
  },
  studyOptionArrow: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  studyOptionArrowDark: {
    fontSize: 18,
    color: colors.gray[400],
  },
  cardsSection: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  noCards: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.gray[50],
    borderRadius: 14,
  },
  noCardsEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  noCardsText: {
    fontSize: 15,
    color: colors.gray[500],
    marginBottom: 16,
  },
  addCardButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addCardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  cardFront: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[700],
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardState: {
    fontSize: 14,
  },
  cardNext: {
    fontSize: 12,
    color: colors.gray[500],
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  bottomPadding: {
    height: 40,
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
  doneButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: colors.danger[500],
    textAlign: 'center',
    marginTop: 100,
  },
});
