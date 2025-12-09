// Study Stats Screen
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useStudyStore } from '../../src/stores/studyStore';
import { colors, gradients, shadows } from '../../src/theme/colors';

export default function StudyStatsScreen() {
  const router = useRouter();
  const studySets = useStudyStore((state) => state.studySets);
  const flashcards = useStudyStore((state) => state.flashcards);
  const stats = useStudyStore((state) => state.stats);

  // Calculate derived stats
  const totalCards = useMemo(() => {
    return Object.values(flashcards).reduce((sum, cards) => sum + cards.length, 0);
  }, [flashcards]);

  const masteredCards = useMemo(() => {
    let count = 0;
    Object.values(flashcards).forEach((cards) => {
      cards.forEach((card) => {
        if (card.learningState === 'review' && card.interval >= 21) {
          count++;
        }
      });
    });
    return count;
  }, [flashcards]);

  const dueToday = useMemo(() => {
    const now = new Date();
    let count = 0;
    Object.values(flashcards).forEach((cards) => {
      cards.forEach((card) => {
        if (!card.nextReview || new Date(card.nextReview) <= now) {
          count++;
        }
      });
    });
    return count;
  }, [flashcards]);

  const learningCards = useMemo(() => {
    let count = 0;
    Object.values(flashcards).forEach((cards) => {
      cards.forEach((card) => {
        if (card.learningState === 'learning' || card.learningState === 'relearning') {
          count++;
        }
      });
    });
    return count;
  }, [flashcards]);

  const masteryPercentage = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={gradients.focus as [string, string]}
        style={styles.headerGradient}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerEmoji}>📊</Text>
        <Text style={styles.headerTitle}>Study Stats</Text>
        <Text style={styles.headerSubtitle}>Your learning progress</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Stats Grid */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalCards}</Text>
            <Text style={styles.statLabel}>Total Cards</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success[600] }]}>
              {masteredCards}
            </Text>
            <Text style={styles.statLabel}>Mastered</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.warning[600] }]}>
              {dueToday}
            </Text>
            <Text style={styles.statLabel}>Due Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primary[600] }]}>
              {learningCards}
            </Text>
            <Text style={styles.statLabel}>Learning</Text>
          </View>
        </Animated.View>

        {/* Mastery Progress */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.masteryCard}>
          <Text style={styles.cardTitle}>Overall Mastery</Text>
          <View style={styles.masteryContent}>
            <View style={styles.masteryCircle}>
              <Text style={styles.masteryPercentage}>{masteryPercentage}%</Text>
            </View>
            <View style={styles.masteryInfo}>
              <Text style={styles.masteryText}>
                {masteredCards} of {totalCards} cards mastered
              </Text>
              <View style={styles.masteryBar}>
                <View style={[styles.masteryFill, { width: `${masteryPercentage}%` }]} />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Study Sets Progress */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Study Sets</Text>
          {studySets.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No study sets yet</Text>
            </View>
          ) : (
            studySets.map((set, index) => {
              const cards = flashcards[set.id] || [];
              const mastered = cards.filter(
                (c) => c.learningState === 'review' && c.interval >= 21
              ).length;
              const progress = cards.length > 0 ? (mastered / cards.length) * 100 : 0;

              return (
                <Animated.View
                  key={set.id}
                  entering={FadeInDown.delay(350 + index * 50)}
                >
                  <TouchableOpacity
                    style={styles.setCard}
                    onPress={() => router.push(`/study/${set.id}`)}
                  >
                    <View style={[styles.setIcon, { backgroundColor: set.color || colors.primary[500] }]}>
                      <Text style={styles.setEmoji}>{set.icon || '📚'}</Text>
                    </View>
                    <View style={styles.setInfo}>
                      <Text style={styles.setTitle}>{set.title}</Text>
                      <View style={styles.setProgress}>
                        <View style={styles.setProgressBar}>
                          <View
                            style={[styles.setProgressFill, { width: `${progress}%` }]}
                          />
                        </View>
                        <Text style={styles.setProgressText}>
                          {mastered}/{cards.length}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </Animated.View>

        {/* Tips */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Study Tips</Text>
          <Text style={styles.tipItem}>• Review due cards daily for best retention</Text>
          <Text style={styles.tipItem}>• Cards you struggle with appear more often</Text>
          <Text style={styles.tipItem}>• Mastery = 21+ day interval between reviews</Text>
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
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.gray[800],
  },
  statLabel: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  masteryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...shadows.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 16,
  },
  masteryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  masteryCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success[50],
    borderWidth: 4,
    borderColor: colors.success[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  masteryPercentage: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.success[600],
  },
  masteryInfo: {
    flex: 1,
  },
  masteryText: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 12,
  },
  masteryBar: {
    height: 10,
    backgroundColor: colors.gray[200],
    borderRadius: 5,
    overflow: 'hidden',
  },
  masteryFill: {
    height: '100%',
    backgroundColor: colors.success[500],
    borderRadius: 5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 16,
  },
  setCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  setIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  setEmoji: {
    fontSize: 22,
  },
  setInfo: {
    flex: 1,
  },
  setTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 8,
  },
  setProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  setProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  setProgressFill: {
    height: '100%',
    backgroundColor: colors.success[500],
    borderRadius: 3,
  },
  setProgressText: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.gray[500],
  },
  tipsCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 14,
    padding: 16,
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
});
