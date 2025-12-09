// AI Tools Hub - Main Tools Screen
import React from 'react';
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
import { colors, gradients, shadows } from '../../src/theme/colors';

interface ToolCardProps {
  emoji: string;
  title: string;
  description: string;
  gradient: keyof typeof gradients;
  onPress: () => void;
  delay: number;
}

const ToolCard: React.FC<ToolCardProps> = ({
  emoji,
  title,
  description,
  gradient,
  onPress,
  delay,
}) => {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <TouchableOpacity
        style={styles.toolCard}
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={gradients[gradient] as [string, string]}
          style={styles.toolGradient}
        >
          <Text style={styles.toolEmoji}>{emoji}</Text>
          <Text style={styles.toolTitle}>{title}</Text>
          <Text style={styles.toolDescription}>{description}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function AIToolsScreen() {
  const router = useRouter();

  const tools = [
    {
      emoji: '🥄',
      title: 'Spoon Estimator',
      description: 'Estimate energy cost for any task',
      gradient: 'focus' as const,
      route: '/tools/spoons',
    },
    {
      emoji: '✍️',
      title: 'Tone Rewriter',
      description: 'Transform text to any tone',
      gradient: 'growth' as const,
      route: '/tools/tone',
    },
    {
      emoji: '📝',
      title: 'Note Compiler',
      description: 'Combine scattered notes into organized docs',
      gradient: 'balance' as const,
      route: '/tools/compile',
    },
    {
      emoji: '⏱️',
      title: 'Time Estimator',
      description: 'Smart time predictions for tasks',
      gradient: 'streak' as const,
      route: '/tools/time',
    },
    {
      emoji: '🎴',
      title: 'Flashcard Generator',
      description: 'Create study cards from any content',
      gradient: 'focus' as const,
      route: '/tools/flashcards',
    },
    {
      emoji: '📋',
      title: 'Quiz Generator',
      description: 'Generate quizzes from notes or docs',
      gradient: 'growth' as const,
      route: '/tools/quiz',
    },
  ];

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
          <Text style={styles.title}>🤖 AI Tools</Text>
          <Text style={styles.subtitle}>
            Powered by AI to help you work smarter
          </Text>
        </Animated.View>

        {/* Featured Tool */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => router.push('/tools/magic')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featuredGradient}
            >
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>✨ FEATURED</Text>
              </View>
              <Text style={styles.featuredEmoji}>🪄</Text>
              <Text style={styles.featuredTitle}>Magic Breakdown</Text>
              <Text style={styles.featuredDescription}>
                Break any overwhelming task into tiny, ADHD-friendly steps
              </Text>
              <View style={styles.featuredButton}>
                <Text style={styles.featuredButtonText}>Try It →</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Tools Grid */}
        <View style={styles.toolsGrid}>
          {tools.map((tool, index) => (
            <ToolCard
              key={tool.title}
              emoji={tool.emoji}
              title={tool.title}
              description={tool.description}
              gradient={tool.gradient}
              onPress={() => router.push(tool.route as `/tools/${string}`)}
              delay={200 + index * 80}
            />
          ))}
        </View>

        {/* Tips Section */}
        <Animated.View entering={FadeInDown.delay(700)} style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Tips for ADHD Success</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>🥄</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Check Your Spoons First</Text>
              <Text style={styles.tipText}>
                Before starting a task, estimate its energy cost. Match tasks to your current energy level.
              </Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>✂️</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Break It Down</Text>
              <Text style={styles.tipText}>
                Use Magic Breakdown to turn overwhelming tasks into tiny, achievable steps.
              </Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>🎴</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Learn with Spaced Repetition</Text>
              <Text style={styles.tipText}>
                Create flashcards from notes and let the AI schedule reviews for optimal retention.
              </Text>
            </View>
          </View>
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
    marginBottom: 24,
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
  featuredCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    ...shadows.xl,
  },
  featuredGradient: {
    padding: 24,
    alignItems: 'center',
  },
  featuredBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  featuredEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  featuredButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  featuredButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  toolCard: {
    width: '48%',
    marginHorizontal: '1%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
    ...shadows.md,
  },
  toolGradient: {
    padding: 20,
    minHeight: 140,
  },
  toolEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 16,
  },
  tipsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 16,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  tipEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 18,
  },
  bottomPadding: {
    height: 40,
  },
});
