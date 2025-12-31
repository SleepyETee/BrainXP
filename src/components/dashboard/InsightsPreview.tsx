import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import { InsightItem } from '../ai/AIInsightsCard';
import { DashboardCard } from './DashboardCard';
import { SectionHeader } from './SectionHeader';

type InsightsPreviewProps = {
  insights: InsightItem[];
  maxItems?: number;
  onPressInsight?: (insight: InsightItem) => void;
  onSeeAll?: () => void;
};

export function InsightsPreview({
  insights,
  maxItems = 2,
  onPressInsight,
  onSeeAll,
}: InsightsPreviewProps) {
  const theme = useTheme();

  if (insights.length === 0) return null;

  return (
    <View style={styles.container}>
      <SectionHeader title="AI Insights" rightLabel={onSeeAll ? 'See all' : undefined} onPressRight={onSeeAll} />

      <DashboardCard padding={0}>
        <View style={styles.list}>
          {insights.slice(0, maxItems).map((insight, idx, arr) => (
            <TouchableOpacity
              key={insight.id}
              onPress={() => onPressInsight?.(insight)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Insight: ${insight.title}`}
              style={[
                styles.row,
                idx !== arr.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 },
              ]}
            >
              <Text style={styles.icon}>{insight.icon}</Text>
              <View style={styles.textCol}>
                <Text style={[styles.title, { color: theme.text.primary }]} numberOfLines={1}>
                  {insight.title}
                </Text>
                <Text style={[styles.message, { color: theme.text.secondary }]} numberOfLines={2}>
                  {insight.message}
                </Text>
              </View>
              <Text style={[styles.chev, { color: theme.text.muted }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </DashboardCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  list: {
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  icon: {
    fontSize: 18,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  message: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  chev: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
});
