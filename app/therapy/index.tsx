import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useTherapyStore } from '../../src/stores/therapyStore';
import { ThoughtPatternInsights } from '../../src/components/therapy';
import { Card } from '../../src/components/ui/Card';
import { THERAPY_DISCLAIMER } from '../../src/types/therapy';

const THERAPY_SECTIONS = [
  {
    id: 'cbt',
    title: 'CBT Tools',
    subtitle: 'Manage unhelpful thoughts',
    emoji: '🧠',
    color: colors.primary[500],
    route: '/therapy/cbt',
  },
  {
    id: 'mindfulness',
    title: 'Mindfulness',
    subtitle: 'Ground yourself & breathe',
    emoji: '🧘',
    color: colors.secondary[500],
    route: '/therapy/mindfulness',
  },
  {
    id: 'learn',
    title: 'ADHD Cards',
    subtitle: 'Understand your brain',
    emoji: '📚',
    color: colors.warning[500],
    route: '/therapy/learn',
  },
  {
    id: 'cognitive',
    title: 'Brain Training',
    subtitle: 'Build working memory',
    emoji: '💪',
    color: colors.accent[400],
    route: '/therapy/cognitive',
  },
  {
    id: 'tdcs',
    title: 'tDCS Tracking',
    subtitle: 'For supervised studies only',
    emoji: '⚡',
    color: colors.gray[500],
    route: '/therapy/tdcs',
  },
];

export default function TherapyIndexScreen() {
  const router = useRouter();
  const {
    getPatternInsights,
    sessions,
    progress,
    getMindfulnessStreak,
  } = useTherapyStore();
  
  const insights = getPatternInsights();
  const mindfulnessStreak = getMindfulnessStreak();
  const todayMindfulness = sessions.filter(
    (s) => s.startedAt.startsWith(new Date().toISOString().split('T')[0]) && s.completed
  ).length;
  const cardsViewed = progress?.cardsViewed.length || 0;
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Wellness Tools</Text>
        </View>
        
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayMindfulness}</Text>
            <Text style={styles.statLabel}>Mindful{'\n'}sessions today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{mindfulnessStreak}</Text>
            <Text style={styles.statLabel}>Day{'\n'}streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{cardsViewed}</Text>
            <Text style={styles.statLabel}>ADHD cards{'\n'}read</Text>
          </View>
        </View>
        
        {/* CBT Insights Preview */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Thought Patterns</Text>
            <ThoughtPatternInsights />
          </View>
        )}
        
        {/* Feature Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tools</Text>
          <View style={styles.cardsGrid}>
            {THERAPY_SECTIONS.map((section) => (
              <TouchableOpacity
                key={section.id}
                style={styles.featureCard}
                onPress={() => router.push(section.route as any)}
              >
                <View style={[styles.featureIcon, { backgroundColor: section.color + '15' }]}>
                  <Text style={styles.featureEmoji}>{section.emoji}</Text>
                </View>
                <Text style={styles.featureTitle}>{section.title}</Text>
                <Text style={styles.featureSubtitle}>{section.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/therapy/grounding' as any)}
            >
              <Text style={styles.quickEmoji}>🌿</Text>
              <Text style={styles.quickText}>Quick grounding</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/therapy/breathing' as any)}
            >
              <Text style={styles.quickEmoji}>🫁</Text>
              <Text style={styles.quickText}>3 breaths</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimer}>
            {THERAPY_DISCLAIMER.cbt}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 12,
  },
  backButton: {
    fontSize: 16,
    color: colors.primary[600],
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.gray[900],
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary[600],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  quickEmoji: {
    fontSize: 24,
  },
  quickText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[700],
  },
  disclaimerContainer: {
    padding: 20,
  },
  disclaimer: {
    fontSize: 11,
    color: colors.gray[400],
    textAlign: 'center',
    lineHeight: 16,
  },
});

