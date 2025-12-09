// Study Hub - Main Study Screen
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
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useStudyStore } from '../../src/stores/studyStore';
import { StudySetCard } from '../../src/components/study/StudySetCard';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { colors, gradients, shadows } from '../../src/theme/colors';

export default function StudyHubScreen() {
  const router = useRouter();
  const studySets = useStudyStore((state) => state.studySets);
  const fetchStudySets = useStudyStore((state) => state.fetchStudySets);
  const fetchStats = useStudyStore((state) => state.fetchStats);
  const getDueCardsCount = useStudyStore((state) => state.getDueCardsCount);
  const [activeTab, setActiveTab] = useState<'sets' | 'quizzes'>('sets');

  useEffect(() => {
    fetchStudySets();
    fetchStats();
  }, []);

  // Calculate totals from actual cards arrays
  const totalDue = studySets.reduce((sum, set) => sum + getDueCardsCount(set.id), 0);
  const totalCards = studySets.reduce((sum, set) => sum + (set.cards?.length || 0), 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <LinearGradient
        colors={['#F0F7F6', '#FFFFFF']}
        style={styles.backgroundGradient}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn} style={styles.header}>
          <Text style={styles.title}>📚 Study Hub</Text>
          <Text style={styles.subtitle}>Learn smarter with spaced repetition</Text>
        </Animated.View>

        {/* Stats Overview */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <LinearGradient
            colors={gradients.focus as [string, string]}
            style={styles.statsCard}
          >
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{totalDue}</Text>
                <Text style={styles.statLabel}>Due Today</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{totalCards}</Text>
                <Text style={styles.statLabel}>Total Cards</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{studySets.length}</Text>
                <Text style={styles.statLabel}>Study Sets</Text>
              </View>
            </View>
            
            {totalDue > 0 && (
              <TouchableOpacity
                style={styles.studyNowButton}
                onPress={() => router.push('/study/review')}
              >
                <Text style={styles.studyNowText}>Start Review →</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/study/create')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary[100] }]}>
              <Text style={styles.quickActionEmoji}>➕</Text>
            </View>
            <Text style={styles.quickActionLabel}>New Set</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/study/generate')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.success[100] }]}>
              <Text style={styles.quickActionEmoji}>🤖</Text>
            </View>
            <Text style={styles.quickActionLabel}>AI Generate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/study/quiz')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.warning[100] }]}>
              <Text style={styles.quickActionEmoji}>📝</Text>
            </View>
            <Text style={styles.quickActionLabel}>Take Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/study/stats')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.danger[100] }]}>
              <Text style={styles.quickActionEmoji}>📊</Text>
            </View>
            <Text style={styles.quickActionLabel}>Stats</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Tabs */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sets' && styles.tabActive]}
            onPress={() => setActiveTab('sets')}
          >
            <Text style={[styles.tabText, activeTab === 'sets' && styles.tabTextActive]}>
              Study Sets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'quizzes' && styles.tabActive]}
            onPress={() => setActiveTab('quizzes')}
          >
            <Text style={[styles.tabText, activeTab === 'quizzes' && styles.tabTextActive]}>
              Quizzes
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Study Sets List */}
        {activeTab === 'sets' && (
          <View style={styles.setsList}>
            {studySets.length === 0 ? (
              <Animated.View entering={FadeInDown.delay(400)}>
                <GlassCard style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>📚</Text>
                  <Text style={styles.emptyTitle}>No Study Sets Yet</Text>
                  <Text style={styles.emptyText}>
                    Create your first study set or generate one with AI
                  </Text>
                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => router.push('/study/create')}
                  >
                    <Text style={styles.createButtonText}>+ Create Study Set</Text>
                  </TouchableOpacity>
                </GlassCard>
              </Animated.View>
            ) : (
              studySets.map((set, index) => (
                <StudySetCard
                  key={set.id}
                  studySet={set}
                  index={index}
                  onPress={() => router.push(`/study/${set.id}`)}
                />
              ))
            )}
          </View>
        )}

        {/* Quizzes Tab Content */}
        {activeTab === 'quizzes' && (
          <Animated.View entering={FadeInDown}>
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyTitle}>Quizzes</Text>
              <Text style={styles.emptyText}>
                Generate quizzes from your study sets or notes
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/study/quiz/generate')}
              >
                <Text style={styles.createButtonText}>Generate Quiz</Text>
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>
        )}

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
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray[500],
  },
  statsCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  studyNowButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  studyNowText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...shadows.sm,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[600],
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
  },
  tabTextActive: {
    color: colors.gray[800],
  },
  setsList: {
    paddingTop: 8,
  },
  emptyCard: {
    marginHorizontal: 16,
    alignItems: 'center',
    paddingVertical: 40,
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
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  createButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 40,
  },
});
