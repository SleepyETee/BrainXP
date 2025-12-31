// AI Insights Card - ADHD-Friendly Smart Insights
// Color-coded for quick recognition without overstimulation
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeInDown,
  FadeInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, gradients, shadows, adhdPalette } from '../../theme/colors';
import { springConfigs } from '../../utils/animations';

export interface InsightItem {
  id: string;
  type: 'productivity' | 'pattern' | 'suggestion' | 'encouragement';
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionType?: string;
  actionData?: Record<string, unknown>;
}

interface AIInsightsCardProps {
  insights: InsightItem[];
  onInsightAction?: (insight: InsightItem) => void;
  onSeeAll?: () => void;
  animated?: boolean;
}

// ADHD-friendly color coding:
// - Productivity (tracking): Calming Shadow Green
// - Pattern (observations): Soft Beryl Green  
// - Suggestion (tips): Gentle amber
// - Encouragement: Warm but soft Zinnwaldite
const INSIGHT_GRADIENTS = {
  productivity: [adhdPalette.shadowGreen, colors.primary[500]] as const,
  pattern: [adhdPalette.berylGreen, colors.secondary[500]] as const,
  suggestion: [colors.warning[300], colors.warning[500]] as const,
  encouragement: [adhdPalette.zinnwaldite, colors.accent[400]] as const,
};

const InsightChip: React.FC<{
  insight: InsightItem;
  onPress: () => void;
  index: number;
}> = ({ insight, onPress, index }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springConfigs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfigs.gentle);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 80).springify()}
      style={animatedStyle}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={[...INSIGHT_GRADIENTS[insight.type]] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.chipGradient}
        >
          <Text style={styles.chipIcon}>{insight.icon}</Text>
          <View style={styles.chipContent}>
            <Text style={styles.chipTitle} numberOfLines={1}>
              {insight.title}
            </Text>
            <Text style={styles.chipMessage} numberOfLines={2}>
              {insight.message}
            </Text>
          </View>
          {insight.actionLabel && (
            <View style={styles.chipAction}>
              <Text style={styles.chipActionText}>→</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({
  insights,
  onInsightAction,
  onSeeAll,
  animated = true,
}) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    // Gentle breathing animation (calming)
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2500 }),
        withTiming(1, { duration: 2500 })
      ),
      -1,
      true
    );
  }, []);

  const headerPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleInsightPress = async (insight: InsightItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onInsightAction?.(insight);
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <Animated.View
      entering={animated ? FadeInDown.delay(200).springify() : undefined}
      style={[styles.container, shadows.md]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.View style={headerPulseStyle}>
            <Text style={styles.headerIcon}>🧠</Text>
          </Animated.View>
          <View>
            <Text style={styles.headerTitle}>AI Insights</Text>
            <Text style={styles.headerSubtitle}>Personalized for you</Text>
          </View>
        </View>
        {onSeeAll && insights.length > 2 && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Insights List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.insightsList}
      >
        {insights.slice(0, 5).map((insight, index) => (
          <InsightChip
            key={insight.id}
            insight={insight}
            onPress={() => handleInsightPress(insight)}
            index={index}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 1,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  insightsList: {
    gap: 10,
    paddingRight: 8,
  },
  chipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    minWidth: 240,
    maxWidth: 280,
    gap: 10,
  },
  chipIcon: {
    fontSize: 24,
  },
  chipContent: {
    flex: 1,
  },
  chipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  chipMessage: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 15,
  },
  chipAction: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default AIInsightsCard;

