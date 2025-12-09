import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useTherapyStore } from '../../stores/therapyStore';
import { ThoughtPatternTag, THERAPY_DISCLAIMER } from '../../types/therapy';
import { Card } from '../ui/Card';

interface ThoughtPatternInsightsProps {
  onViewTrick?: (pattern: ThoughtPatternTag) => void;
}

const PATTERN_INFO: Record<ThoughtPatternTag, { emoji: string; label: string; color: string }> = {
  perfectionism: { emoji: '🎯', label: 'Perfectionism', color: colors.accent[400] },
  fear_of_criticism: { emoji: '👀', label: 'Fear of Criticism', color: colors.warning[500] },
  boredom: { emoji: '😴', label: 'Boredom', color: colors.gray[500] },
  overwhelm: { emoji: '😵', label: 'Overwhelm', color: colors.danger[400] },
  imposter_syndrome: { emoji: '🎭', label: 'Imposter Syndrome', color: colors.primary[500] },
  black_and_white_thinking: { emoji: '⚫⚪', label: 'All-or-Nothing', color: colors.gray[700] },
  catastrophizing: { emoji: '🌪️', label: 'Catastrophizing', color: colors.danger[500] },
  should_statements: { emoji: '📜', label: 'Should Statements', color: colors.warning[600] },
};

const CBT_TRICKS: Record<ThoughtPatternTag, { title: string; steps: string[] }> = {
  perfectionism: {
    title: '80% Rule',
    steps: [
      'Ask: "What would 80% good enough look like?"',
      'Set a time limit and stop when it\'s up',
      'Remember: Done > Perfect',
    ],
  },
  fear_of_criticism: {
    title: 'Evidence Check',
    steps: [
      'List 3 times feedback helped you grow',
      'Ask: "What\'s the worst that could happen?"',
      'Remember: Criticism is data, not judgment',
    ],
  },
  boredom: {
    title: 'Gamify It',
    steps: [
      'Set a 10-minute challenge timer',
      'Add music or change your environment',
      'Reward yourself after each section',
    ],
  },
  overwhelm: {
    title: 'Brain Dump + Pick One',
    steps: [
      'Write down everything on your mind',
      'Circle the ONE smallest step',
      'Hide the rest of the list',
    ],
  },
  imposter_syndrome: {
    title: 'Evidence Collection',
    steps: [
      'List 3 things you\'ve accomplished',
      'Ask: "What would I tell a friend?"',
      'Remember: You\'re learning, not failing',
    ],
  },
  black_and_white_thinking: {
    title: 'Gray Area Finder',
    steps: [
      'Scale it 0-10 instead of pass/fail',
      'Ask: "What\'s the middle ground?"',
      'Find one small positive aspect',
    ],
  },
  catastrophizing: {
    title: 'Probability Check',
    steps: [
      'Ask: "How likely is the worst case?"',
      'What would you do IF it happened?',
      'What\'s the most likely outcome?',
    ],
  },
  should_statements: {
    title: 'Could vs Should',
    steps: [
      'Replace "should" with "could"',
      'Ask: "Says who? Why?"',
      'Accept where you are right now',
    ],
  },
};

export const ThoughtPatternInsights: React.FC<ThoughtPatternInsightsProps> = ({
  onViewTrick,
}) => {
  const interventions = useTherapyStore((state) => state.interventions);
  const thoughtLogs = useTherapyStore((state) => state.thoughtLogs);
  const getPatternInsights = useTherapyStore((state) => state.getPatternInsights);
  
  // Memoize to prevent infinite re-renders
  const insights = React.useMemo(() => getPatternInsights(), [interventions, thoughtLogs]);
  
  if (insights.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Text style={styles.emptyEmoji}>🧠</Text>
        <Text style={styles.emptyTitle}>No patterns yet</Text>
        <Text style={styles.emptyText}>
          As you use the CBT tools, we'll help you spot thinking patterns
          that show up frequently.
        </Text>
      </Card>
    );
  }
  
  const topPattern = insights[0];
  const topPatternInfo = PATTERN_INFO[topPattern.pattern];
  const topTrick = CBT_TRICKS[topPattern.pattern];
  
  return (
    <View style={styles.container}>
      {/* Main Insight Card */}
      <Card style={[styles.mainCard, { borderLeftColor: topPatternInfo.color }]}>
        <View style={styles.mainHeader}>
          <Text style={styles.mainEmoji}>{topPatternInfo.emoji}</Text>
          <View style={styles.mainHeaderText}>
            <Text style={styles.mainLabel}>Most common pattern</Text>
            <Text style={styles.mainTitle}>{topPatternInfo.label}</Text>
          </View>
          <View style={[styles.percentageBadge, { backgroundColor: topPatternInfo.color + '20' }]}>
            <Text style={[styles.percentageText, { color: topPatternInfo.color }]}>
              {Math.round(topPattern.percentage)}%
            </Text>
          </View>
        </View>
        
        {topTrick && (
          <View style={styles.trickContainer}>
            <Text style={styles.trickLabel}>Try this 2-min trick:</Text>
            <Text style={styles.trickTitle}>{topTrick.title}</Text>
            <View style={styles.trickSteps}>
              {topTrick.steps.map((step, index) => (
                <View key={index} style={styles.trickStep}>
                  <Text style={styles.trickStepNumber}>{index + 1}</Text>
                  <Text style={styles.trickStepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Card>
      
      {/* Other Patterns */}
      {insights.length > 1 && (
        <View style={styles.otherPatterns}>
          <Text style={styles.otherLabel}>Other patterns</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.otherList}>
              {insights.slice(1, 5).map((insight) => {
                const info = PATTERN_INFO[insight.pattern];
                return (
                  <TouchableOpacity
                    key={insight.pattern}
                    style={styles.otherCard}
                    onPress={() => onViewTrick?.(insight.pattern)}
                  >
                    <Text style={styles.otherEmoji}>{info.emoji}</Text>
                    <Text style={styles.otherTitle}>{info.label}</Text>
                    <Text style={styles.otherCount}>{insight.count}x</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}
      
      <Text style={styles.disclaimer}>{THERAPY_DISCLAIMER.cbt}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  mainCard: {
    borderLeftWidth: 4,
    padding: 16,
  },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  mainHeaderText: {
    flex: 1,
  },
  mainLabel: {
    fontSize: 12,
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  percentageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
  },
  trickContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
  },
  trickLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 4,
  },
  trickTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 12,
  },
  trickSteps: {
    gap: 10,
  },
  trickStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  trickStepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary[100],
    color: colors.primary[700],
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    marginRight: 10,
  },
  trickStepText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
  },
  otherPatterns: {
    marginTop: 8,
  },
  otherLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  otherList: {
    flexDirection: 'row',
    gap: 10,
  },
  otherCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.gray[200],
    minWidth: 100,
  },
  otherEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  otherTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[700],
    textAlign: 'center',
    marginBottom: 4,
  },
  otherCount: {
    fontSize: 11,
    color: colors.gray[400],
  },
  disclaimer: {
    fontSize: 11,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ThoughtPatternInsights;
