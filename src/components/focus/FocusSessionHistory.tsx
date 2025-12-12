import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, borderRadius } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';
import { colors } from '../../theme/colors';

/**
 * FocusSessionHistory - Display past focus sessions with insights
 * 
 * Features:
 * - Daily/weekly/monthly views
 * - Session duration visualization
 * - Productivity trends
 * - Best focus times identification
 * - Accessibility support
 */

interface FocusSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  type: 'pomodoro' | 'deep' | 'short' | 'custom';
  taskDescription?: string;
  completed: boolean;
  rating?: number; // 1-5
  distractions?: number;
}

interface DailyStats {
  date: string;
  totalMinutes: number;
  sessionCount: number;
  completionRate: number;
  avgSessionLength: number;
  bestHour?: number;
}

interface FocusSessionHistoryProps {
  sessions: FocusSession[];
  onSessionPress?: (session: FocusSession) => void;
  view?: 'day' | 'week' | 'month';
  showInsights?: boolean;
}

// Helper to get hour label
const getHourLabel = (hour: number): string => {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  return hour > 12 ? `${hour - 12}pm` : `${hour}am`;
};

// Helper to format duration
const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

// Session type colors and icons
const SESSION_TYPES = {
  pomodoro: { color: colors.danger[500], icon: '🍅', label: 'Pomodoro' },
  deep: { color: colors.primary[500], icon: '🧠', label: 'Deep Work' },
  short: { color: colors.warning[500], icon: '⚡', label: 'Quick Focus' },
  custom: { color: colors.success[500], icon: '⏱️', label: 'Custom' },
};

// Daily summary component
const DaySummary: React.FC<{
  stats: DailyStats;
  sessions: FocusSession[];
  onSessionPress?: (session: FocusSession) => void;
  textScale: number;
  reduceMotion: boolean;
}> = ({ stats, sessions, onSessionPress, textScale, reduceMotion }) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    dayContainer: {
      marginBottom: spacing[4],
    },
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing[2],
    },
    dayDate: {
      fontSize: 14 * textScale,
      fontWeight: '600',
      color: theme.text.primary,
    },
    dayTotal: {
      fontSize: 14 * textScale,
      fontWeight: '700',
      color: theme.palette.primary[600],
    },
    sessionsList: {
      gap: spacing[2],
    },
    sessionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing[3],
      gap: spacing[3],
    },
    sessionIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sessionInfo: {
      flex: 1,
    },
    sessionTime: {
      fontSize: 13 * textScale,
      color: theme.text.secondary,
    },
    sessionTask: {
      fontSize: 14 * textScale,
      fontWeight: '500',
      color: theme.text.primary,
      marginTop: 2,
    },
    sessionDuration: {
      alignItems: 'flex-end',
    },
    durationText: {
      fontSize: 16 * textScale,
      fontWeight: '700',
      color: theme.text.primary,
    },
    durationLabel: {
      fontSize: 11 * textScale,
      color: theme.text.muted,
    },
    ratingStars: {
      flexDirection: 'row',
      marginTop: 4,
    },
  });

  const formatSessionTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <View style={styles.dayContainer}>
      <View 
        style={styles.dayHeader}
        accessible
        accessibilityLabel={`${stats.date}: ${stats.sessionCount} sessions, ${formatDuration(stats.totalMinutes)} total focus time`}
      >
        <Text style={styles.dayDate}>{stats.date}</Text>
        <Text style={styles.dayTotal}>{formatDuration(stats.totalMinutes)}</Text>
      </View>
      <View style={styles.sessionsList}>
        {sessions.map((session, index) => {
          const typeInfo = SESSION_TYPES[session.type];
          return (
            <Animated.View
              key={session.id}
              entering={reduceMotion ? undefined : FadeInDown.delay(index * 50).duration(200)}
            >
              <TouchableOpacity
                style={styles.sessionCard}
                onPress={() => onSessionPress?.(session)}
                accessibilityRole="button"
                accessibilityLabel={`${typeInfo.label} session, ${formatDuration(session.duration)}, ${session.taskDescription || 'No task description'}`}
              >
                <View style={[styles.sessionIcon, { backgroundColor: `${typeInfo.color}20` }]}>
                  <Text style={{ fontSize: 20 }}>{typeInfo.icon}</Text>
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTime}>
                    {formatSessionTime(new Date(session.startTime))} - {formatSessionTime(new Date(session.endTime))}
                  </Text>
                  {session.taskDescription && (
                    <Text style={styles.sessionTask} numberOfLines={1}>
                      {session.taskDescription}
                    </Text>
                  )}
                </View>
                <View style={styles.sessionDuration}>
                  <Text style={styles.durationText}>{formatDuration(session.duration)}</Text>
                  {session.rating && (
                    <View style={styles.ratingStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= session.rating! ? 'star' : 'star-outline'}
                          size={12}
                          color={star <= session.rating! ? colors.warning[500] : theme.text.muted}
                        />
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

// Insights card component
const InsightsCard: React.FC<{
  sessions: FocusSession[];
  textScale: number;
}> = ({ sessions, textScale }) => {
  const theme = useTheme();

  const insights = useMemo(() => {
    if (sessions.length === 0) return null;

    // Calculate best focus hour
    const hourCounts: Record<number, { count: number; totalMinutes: number }> = {};
    sessions.forEach((s) => {
      const hour = new Date(s.startTime).getHours();
      if (!hourCounts[hour]) hourCounts[hour] = { count: 0, totalMinutes: 0 };
      hourCounts[hour].count++;
      hourCounts[hour].totalMinutes += s.duration;
    });

    const bestHour = Object.entries(hourCounts).sort(
      (a, b) => b[1].totalMinutes - a[1].totalMinutes
    )[0];

    // Calculate average session length
    const avgDuration = Math.round(
      sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
    );

    // Calculate completion rate
    const completionRate = Math.round(
      (sessions.filter((s) => s.completed).length / sessions.length) * 100
    );

    // Most used session type
    const typeCounts: Record<string, number> = {};
    sessions.forEach((s) => {
      typeCounts[s.type] = (typeCounts[s.type] || 0) + 1;
    });
    const favoriteType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      bestHour: bestHour ? parseInt(bestHour[0]) : null,
      avgDuration,
      completionRate,
      favoriteType: favoriteType ? favoriteType[0] as keyof typeof SESSION_TYPES : null,
      totalSessions: sessions.length,
    };
  }, [sessions]);

  if (!insights) return null;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.background.card,
      borderRadius: borderRadius.xl,
      padding: spacing[4],
      marginBottom: spacing[4],
    },
    title: {
      fontSize: 16 * textScale,
      fontWeight: '700',
      color: theme.text.primary,
      marginBottom: spacing[3],
    },
    insightsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing[3],
    },
    insightItem: {
      width: '45%',
      backgroundColor: theme.background.secondary,
      borderRadius: borderRadius.lg,
      padding: spacing[3],
    },
    insightIcon: {
      fontSize: 24,
      marginBottom: spacing[1],
    },
    insightValue: {
      fontSize: 18 * textScale,
      fontWeight: '700',
      color: theme.text.primary,
    },
    insightLabel: {
      fontSize: 12 * textScale,
      color: theme.text.secondary,
      marginTop: 2,
    },
  });

  return (
    <View 
      style={styles.container}
      accessible
      accessibilityLabel="Focus insights"
    >
      <Text style={styles.title} accessibilityRole="header">
        💡 Insights
      </Text>
      <View style={styles.insightsGrid}>
        {insights.bestHour !== null && (
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>⏰</Text>
            <Text style={styles.insightValue}>{getHourLabel(insights.bestHour)}</Text>
            <Text style={styles.insightLabel}>Best Focus Time</Text>
          </View>
        )}
        <View style={styles.insightItem}>
          <Text style={styles.insightIcon}>📊</Text>
          <Text style={styles.insightValue}>{formatDuration(insights.avgDuration)}</Text>
          <Text style={styles.insightLabel}>Avg Session</Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightIcon}>✅</Text>
          <Text style={styles.insightValue}>{insights.completionRate}%</Text>
          <Text style={styles.insightLabel}>Completion Rate</Text>
        </View>
        {insights.favoriteType && (
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>{SESSION_TYPES[insights.favoriteType].icon}</Text>
            <Text style={styles.insightValue}>{SESSION_TYPES[insights.favoriteType].label}</Text>
            <Text style={styles.insightLabel}>Favorite Mode</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export const FocusSessionHistory: React.FC<FocusSessionHistoryProps> = ({
  sessions,
  onSessionPress,
  view = 'week',
  showInsights = true,
}) => {
  const theme = useTheme();
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);
  const largeText = useSettingsStore((state) => state.settings.largeText);
  const textScale = largeText ? 1.15 : 1;

  // Group sessions by day
  const groupedSessions = useMemo(() => {
    const groups: Record<string, { stats: DailyStats; sessions: FocusSession[] }> = {};

    sessions.forEach((session) => {
      const date = new Date(session.startTime);
      const dateKey = date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      if (!groups[dateKey]) {
        groups[dateKey] = {
          stats: {
            date: dateKey,
            totalMinutes: 0,
            sessionCount: 0,
            completionRate: 0,
            avgSessionLength: 0,
          },
          sessions: [],
        };
      }

      groups[dateKey].sessions.push(session);
      groups[dateKey].stats.totalMinutes += session.duration;
      groups[dateKey].stats.sessionCount++;
    });

    // Calculate completion rates
    Object.values(groups).forEach((group) => {
      const completed = group.sessions.filter((s) => s.completed).length;
      group.stats.completionRate = Math.round((completed / group.sessions.length) * 100);
      group.stats.avgSessionLength = Math.round(
        group.stats.totalMinutes / group.sessions.length
      );
    });

    return groups;
  }, [sessions]);

  const sortedDays = useMemo(() => {
    return Object.keys(groupedSessions).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [groupedSessions]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.primary,
    },
    header: {
      padding: spacing[4],
      paddingBottom: spacing[2],
    },
    title: {
      fontSize: 20 * textScale,
      fontWeight: '700',
      color: theme.text.primary,
    },
    subtitle: {
      fontSize: 14 * textScale,
      color: theme.text.secondary,
      marginTop: spacing[1],
    },
    content: {
      padding: spacing[4],
      paddingTop: 0,
    },
    emptyState: {
      alignItems: 'center',
      padding: spacing[8],
    },
    emptyEmoji: {
      fontSize: 48,
      marginBottom: spacing[3],
    },
    emptyText: {
      fontSize: 16 * textScale,
      color: theme.text.secondary,
      textAlign: 'center',
    },
    totalCard: {
      backgroundColor: theme.palette.primary[50],
      borderRadius: borderRadius.xl,
      padding: spacing[4],
      marginBottom: spacing[4],
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    totalItem: {
      alignItems: 'center',
    },
    totalValue: {
      fontSize: 24 * textScale,
      fontWeight: '800',
      color: theme.palette.primary[700],
    },
    totalLabel: {
      fontSize: 12 * textScale,
      color: theme.palette.primary[600],
      marginTop: 2,
    },
  });

  // Calculate totals
  const totals = useMemo(() => {
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.completed).length;
    return { totalMinutes, totalSessions, completedSessions };
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            📅 Session History
          </Text>
        </View>
        <View 
          style={styles.emptyState}
          accessible
          accessibilityLabel="No focus sessions yet. Start a session to see your history."
        >
          <Text style={styles.emptyEmoji}>🧘</Text>
          <Text style={styles.emptyText}>
            No focus sessions yet.{'\n'}Start a session to see your history!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          📅 Session History
        </Text>
        <Text style={styles.subtitle}>
          Your focus journey this {view}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Totals summary */}
        <View 
          style={styles.totalCard}
          accessible
          accessibilityLabel={`Total: ${formatDuration(totals.totalMinutes)} focus time across ${totals.totalSessions} sessions`}
        >
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>{formatDuration(totals.totalMinutes)}</Text>
            <Text style={styles.totalLabel}>Total Focus</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>{totals.totalSessions}</Text>
            <Text style={styles.totalLabel}>Sessions</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>
              {Math.round((totals.completedSessions / totals.totalSessions) * 100)}%
            </Text>
            <Text style={styles.totalLabel}>Completed</Text>
          </View>
        </View>

        {/* Insights */}
        {showInsights && (
          <InsightsCard sessions={sessions} textScale={textScale} />
        )}

        {/* Daily sessions */}
        {sortedDays.map((day) => (
          <DaySummary
            key={day}
            stats={groupedSessions[day].stats}
            sessions={groupedSessions[day].sessions}
            onSessionPress={onSessionPress}
            textScale={textScale}
            reduceMotion={reduceMotion}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default FocusSessionHistory;
