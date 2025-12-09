// AI-Powered Daily Summary Component
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, gradients, shadows } from '../../theme/colors';
import { springConfigs } from '../../utils/animations';
import { AnimatedButton } from '../ui/AnimatedButton';
import { ParticleExplosion } from '../gamification/ParticleExplosion';

interface DailySummaryProps {
  visible: boolean;
  onClose: () => void;
  data: {
    tasksCompleted: number;
    totalTasks: number;
    focusMinutes: number;
    habitsCompleted: number;
    totalHabits: number;
    xpEarned: number;
    streak: number;
    aiSummary?: {
      headline: string;
      highlights: string[];
      insights: string;
      suggestion: string;
      closingMessage: string;
    };
  };
}

export const DailySummary: React.FC<DailySummaryProps> = ({
  visible,
  onClose,
  data,
}) => {
  const [showParticles, setShowParticles] = useState(false);
  
  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const statsProgress = useSharedValue(0);
  const confettiTrigger = useSharedValue(0);

  const isGoodDay = 
    (data.tasksCompleted / Math.max(data.totalTasks, 1)) >= 0.6 ||
    data.focusMinutes >= 60 ||
    (data.habitsCompleted / Math.max(data.totalHabits, 1)) >= 0.7;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      backdropOpacity.value = withTiming(1, { duration: 300 });
      cardScale.value = withDelay(100, withSpring(1, springConfigs.bouncy));
      cardOpacity.value = withDelay(100, withTiming(1, { duration: 200 }));
      
      // Animate stats counting
      statsProgress.value = withDelay(
        500,
        withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) })
      );

      // Show celebration particles if good day
      if (isGoodDay) {
        setTimeout(() => setShowParticles(true), 800);
      }
    }
  }, [visible, isGoodDay]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const handleClose = () => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    cardScale.value = withTiming(0.8, { duration: 200 });
    cardOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(onClose, 250);
  };

  if (!visible) return null;

  const summary = data.aiSummary || {
    headline: isGoodDay ? "You crushed it today! 🎉" : "Every step counts! 💪",
    highlights: [
      data.tasksCompleted > 0 ? `Completed ${data.tasksCompleted} tasks` : null,
      data.focusMinutes > 0 ? `${data.focusMinutes} minutes of focused work` : null,
      data.habitsCompleted > 0 ? `Maintained ${data.habitsCompleted} habits` : null,
    ].filter(Boolean) as string[],
    insights: isGoodDay 
      ? "Your consistency is paying off! Keep building on this momentum."
      : "Remember: progress isn't always linear. You showed up, and that matters.",
    suggestion: "Try starting tomorrow with your most important task when your energy is fresh.",
    closingMessage: "Rest well. Tomorrow is a fresh opportunity! 🌟",
  };

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <LinearGradient
            colors={['rgba(79, 70, 229, 0.95)', 'rgba(139, 92, 246, 0.98)']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Celebration particles */}
        <ParticleExplosion
          visible={showParticles}
          onComplete={() => setShowParticles(false)}
          type="stars"
          particleCount={30}
          duration={3000}
        />

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Card */}
          <Animated.View style={[styles.card, cardStyle]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerEmoji}>
                {isGoodDay ? '🏆' : '🌱'}
              </Text>
              <Text style={styles.headerTitle}>Daily Summary</Text>
              <Text style={styles.headerDate}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            </View>

            {/* AI Headline */}
            <Animated.View 
              entering={FadeInDown.delay(400).springify()}
              style={styles.headlineContainer}
            >
              <LinearGradient
                colors={isGoodDay ? ['#10B981', '#34D399'] : ['#8B5CF6', '#A78BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headlineGradient}
              >
                <Text style={styles.headline}>{summary.headline}</Text>
              </LinearGradient>
            </Animated.View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatBox
                emoji="✅"
                value={data.tasksCompleted}
                total={data.totalTasks}
                label="Tasks"
                delay={500}
              />
              <StatBox
                emoji="⏱️"
                value={data.focusMinutes}
                suffix="m"
                label="Focus"
                delay={600}
              />
              <StatBox
                emoji="🔄"
                value={data.habitsCompleted}
                total={data.totalHabits}
                label="Habits"
                delay={700}
              />
              <StatBox
                emoji="⭐"
                value={data.xpEarned}
                label="XP Earned"
                delay={800}
              />
            </View>

            {/* Streak */}
            {data.streak > 0 && (
              <Animated.View 
                entering={FadeInDown.delay(900).springify()}
                style={styles.streakContainer}
              >
                <LinearGradient
                  colors={['#F59E0B', '#FBBF24']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.streakGradient}
                >
                  <Text style={styles.streakEmoji}>🔥</Text>
                  <View>
                    <Text style={styles.streakValue}>{data.streak} Day Streak</Text>
                    <Text style={styles.streakLabel}>Keep it going!</Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* Highlights */}
            {summary.highlights.length > 0 && (
              <Animated.View 
                entering={FadeInDown.delay(1000).springify()}
                style={styles.section}
              >
                <Text style={styles.sectionTitle}>✨ Today's Highlights</Text>
                {summary.highlights.map((highlight, index) => (
                  <View key={index} style={styles.highlightItem}>
                    <Text style={styles.highlightBullet}>•</Text>
                    <Text style={styles.highlightText}>{highlight}</Text>
                  </View>
                ))}
              </Animated.View>
            )}

            {/* AI Insight */}
            <Animated.View 
              entering={FadeInDown.delay(1100).springify()}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>💡 Insight</Text>
              <Text style={styles.insightText}>{summary.insights}</Text>
            </Animated.View>

            {/* Suggestion */}
            <Animated.View 
              entering={FadeInDown.delay(1200).springify()}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>🎯 For Tomorrow</Text>
              <Text style={styles.suggestionText}>{summary.suggestion}</Text>
            </Animated.View>

            {/* Closing Message */}
            <Animated.View 
              entering={FadeInDown.delay(1300).springify()}
              style={styles.closingContainer}
            >
              <Text style={styles.closingMessage}>{summary.closingMessage}</Text>
            </Animated.View>

            {/* Close Button */}
            <Animated.View entering={FadeInDown.delay(1400).springify()}>
              <AnimatedButton
                title="Close & Rest Well 😴"
                onPress={handleClose}
                variant="gradient"
                gradientColors={gradients.cosmic as unknown as [string, string, ...string[]]}
                size="lg"
                fullWidth
              />
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Stat box component
const StatBox: React.FC<{
  emoji: string;
  value: number;
  total?: number;
  suffix?: string;
  label: string;
  delay: number;
}> = ({ emoji, value, total, suffix, label, delay }) => {
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).springify()}
      style={styles.statBox}
    >
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>
        {value}{suffix}
        {total !== undefined && (
          <Text style={styles.statTotal}>/{total}</Text>
        )}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    ...shadows.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.gray[900],
  },
  headerDate: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
  headlineContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  headlineGradient: {
    padding: 16,
    alignItems: 'center',
  },
  headline: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray[800],
  },
  statTotal: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.gray[400],
  },
  statLabel: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  streakContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  streakGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  streakEmoji: {
    fontSize: 36,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 10,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  highlightBullet: {
    fontSize: 16,
    color: colors.primary[500],
    fontWeight: '700',
  },
  highlightText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 22,
  },
  insightText: {
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 24,
    backgroundColor: colors.primary[50],
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
  },
  suggestionText: {
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 24,
    backgroundColor: colors.success[50],
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.success[500],
  },
  closingContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  closingMessage: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default DailySummary;
