// AI Tools Hub Screen
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, shadows } from '../../src/theme/colors';

interface AITool {
  id: string;
  title: string;
  description: string;
  emoji: string;
  route: string;
  color: string;
  tags: string[];
}

const AI_TOOLS: AITool[] = [
  {
    id: 'magic-breakdown',
    title: 'Magic Task Breakdown',
    description: 'Break overwhelming tasks into tiny, manageable steps',
    emoji: '✨',
    route: '/tools/magic',
    color: colors.primary[500],
    tags: ['tasks', 'productivity'],
  },
  {
    id: 'spoon-estimator',
    title: 'Spoon Estimator',
    description: 'Estimate how much energy a task will take',
    emoji: '🥄',
    route: '/tools/spoons',
    color: colors.warning[500],
    tags: ['energy', 'planning'],
  },
  {
    id: 'tone-rewriter',
    title: 'Tone Rewriter',
    description: 'Rewrite text in different tones - formal, casual, friendly',
    emoji: '✍️',
    route: '/tools/tone',
    color: colors.secondary[500],
    tags: ['writing', 'communication'],
  },
  {
    id: 'note-compiler',
    title: 'Note Compiler',
    description: 'Combine scattered notes into organized documents',
    emoji: '📝',
    route: '/tools/notes',
    color: colors.success[500],
    tags: ['notes', 'organization'],
  },
  {
    id: 'flashcard-generator',
    title: 'Flashcard Generator',
    description: 'Turn any text into study flashcards instantly',
    emoji: '🎴',
    route: '/tools/flashcards',
    color: colors.primary[600],
    tags: ['study', 'learning'],
  },
  {
    id: 'quiz-generator',
    title: 'Quiz Generator',
    description: 'Generate quizzes from your study materials',
    emoji: '📝',
    route: '/tools/quiz',
    color: colors.danger[400],
    tags: ['study', 'testing'],
  },
  {
    id: 'ai-coach',
    title: 'AI Coach Chat',
    description: 'Get personalized ADHD-friendly advice and support',
    emoji: '🧠',
    route: '/tools/coach',
    color: colors.primary[400],
    tags: ['support', 'advice'],
  },
];

export default function AIToolsScreen() {
  const router = useRouter();

  const handleToolPress = async (tool: AITool) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(tool.route as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Tools</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeIn} style={styles.hero}>
          <Text style={styles.heroEmoji}>🤖</Text>
          <Text style={styles.heroTitle}>Your AI Assistant</Text>
          <Text style={styles.heroSubtitle}>
            ADHD-friendly tools powered by AI to help you stay productive
          </Text>
        </Animated.View>

        {/* Tools Grid */}
        <View style={styles.toolsGrid}>
          {AI_TOOLS.map((tool, index) => (
            <Animated.View
              key={tool.id}
              entering={FadeInDown.delay(100 + index * 50)}
              style={styles.toolCardWrapper}
            >
              <TouchableOpacity
                style={styles.toolCard}
                onPress={() => handleToolPress(tool)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.toolIconContainer, { backgroundColor: tool.color }]}
                >
                  <Text style={styles.toolEmoji}>{tool.emoji}</Text>
                </View>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Text style={styles.toolDescription}>{tool.description}</Text>
                <View style={styles.toolTags}>
                  {tool.tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Pro Tip */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Pro Tip</Text>
          <Text style={styles.tipText}>
            Feeling overwhelmed? Start with the Spoon Estimator to understand your
            energy costs, then use Magic Breakdown to make tasks manageable.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[800],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.gray[800],
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  toolCardWrapper: {
    width: '47%',
  },
  toolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  toolIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  toolEmoji: {
    fontSize: 24,
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 6,
  },
  toolDescription: {
    fontSize: 12,
    color: colors.gray[500],
    lineHeight: 18,
    marginBottom: 10,
  },
  toolTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    color: colors.gray[600],
    fontWeight: '500',
  },
  tipCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary[700],
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: colors.primary[600],
    lineHeight: 20,
  },
});
