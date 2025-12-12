import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../../theme/colors';

export interface XPEvent {
  id: string;
  source: 'task' | 'focus' | 'habit' | 'routine' | 'mood' | 'study' | 'inbox' | 'breathing' | 'bonus';
  amount: number;
  description: string;
  timestamp: Date;
}

interface XPHistoryProps {
  events: XPEvent[];
  dailyGoal?: number;
  dailyProgress?: number;
}

const SOURCE_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  task: { emoji: '✅', color: colors.success[500], label: 'Task' },
  focus: { emoji: '⏱️', color: colors.primary[500], label: 'Focus' },
  habit: { emoji: '🔄', color: colors.secondary[500], label: 'Habit' },
  routine: { emoji: '📋', color: colors.warning[500], label: 'Routine' },
  mood: { emoji: '😊', color: colors.primary[400], label: 'Mood' },
  study: { emoji: '📚', color: colors.primary[600], label: 'Study' },
  inbox: { emoji: '📥', color: colors.gray[500], label: 'Inbox' },
  breathing: { emoji: '🧘', color: colors.success[400], label: 'Breathing' },
  bonus: { emoji: '⭐', color: colors.warning[400], label: 'Bonus' },
};

const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
};

export const XPHistory: React.FC<XPHistoryProps> = ({
  events,
  dailyGoal = 100,
  dailyProgress = 0,
}) => {
  const goalProgress = Math.min((dailyProgress / dailyGoal) * 100, 100);
  const goalMet = dailyProgress >= dailyGoal;

  return (
    <View style={styles.container}>
      {/* Daily Goal Card */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>🎯 Daily XP Goal</Text>
          <Text style={[styles.goalStatus, goalMet && styles.goalMet]}>
            {goalMet ? '✓ Complete!' : `${dailyProgress}/${dailyGoal} XP`}
          </Text>
        </View>
        <View style={styles.goalProgressBar}>
          <View 
            style={[
              styles.goalProgressFill, 
              { width: `${goalProgress}%` },
              goalMet && styles.goalProgressComplete
            ]} 
          />
        </View>
        {!goalMet && (
          <Text style={styles.goalHint}>
            {dailyGoal - dailyProgress} XP to go! Keep it up! 💪
          </Text>
        )}
      </Animated.View>

      {/* XP Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.sectionTitle}>📊 Today's XP Sources</Text>
        <View style={styles.breakdownGrid}>
          {Object.entries(SOURCE_CONFIG).map(([source, config]) => {
            const total = events
              .filter(e => e.source === source)
              .reduce((sum, e) => sum + e.amount, 0);
            if (total === 0) return null;
            return (
              <View key={source} style={styles.breakdownItem}>
                <Text style={styles.breakdownEmoji}>{config.emoji}</Text>
                <Text style={[styles.breakdownValue, { color: config.color }]}>
                  +{total}
                </Text>
                <Text style={styles.breakdownLabel}>{config.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activityCard}>
        <Text style={styles.sectionTitle}>⚡ Recent Activity</Text>
        <ScrollView style={styles.activityList} showsVerticalScrollIndicator={false}>
          {events.length === 0 ? (
            <Text style={styles.emptyText}>
              No XP earned yet today. Complete a task to get started! 🚀
            </Text>
          ) : (
            events.slice(0, 10).map((event, index) => {
              const config = SOURCE_CONFIG[event.source] || SOURCE_CONFIG.bonus;
              return (
                <Animated.View
                  key={event.id}
                  entering={FadeInDown.delay(index * 50)}
                  style={styles.activityItem}
                >
                  <View style={[styles.activityIcon, { backgroundColor: `${config.color}15` }]}>
                    <Text style={styles.activityEmoji}>{config.emoji}</Text>
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityDescription} numberOfLines={1}>
                      {event.description}
                    </Text>
                    <Text style={styles.activityTime}>{formatTime(event.timestamp)}</Text>
                  </View>
                  <Text style={[styles.activityXP, { color: config.color }]}>
                    +{event.amount} XP
                  </Text>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
  },
  goalStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
  },
  goalMet: {
    color: colors.success[500],
  },
  goalProgressBar: {
    height: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 6,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 6,
  },
  goalProgressComplete: {
    backgroundColor: colors.success[500],
  },
  goalHint: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 8,
    textAlign: 'center',
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 16,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  breakdownItem: {
    alignItems: 'center',
    minWidth: 70,
    padding: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
  },
  breakdownEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  breakdownLabel: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 2,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  activityList: {
    maxHeight: 300,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[800],
  },
  activityTime: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 2,
  },
  activityXP: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default XPHistory;
