import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, shadows } from '../../theme/colors';
import { StudyMode } from '../../types/study';

interface StudyProgressProps {
  current: number;
  total: number;
  correct: number;
  mode: StudyMode;
  timeElapsed?: number; // seconds
}

export const StudyProgress: React.FC<StudyProgressProps> = ({
  current,
  total,
  correct,
  mode,
  timeElapsed,
}) => {
  const progress = total > 0 ? (current / total) * 100 : 0;
  const accuracy = current > 0 ? (correct / current) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeInfo = () => {
    switch (mode) {
      case 'review':
        return { emoji: '🔄', label: 'Review Session', color: gradients.focus };
      case 'learn':
        return { emoji: '📚', label: 'Learning', color: gradients.growth };
      case 'cram':
        return { emoji: '⚡', label: 'Cram Mode', color: gradients.energy };
      case 'test':
        return { emoji: '📝', label: 'Test', color: gradients.balance };
      default:
        return { emoji: '📚', label: 'Study', color: gradients.focus };
    }
  };

  const modeInfo = getModeInfo();

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.container}>
      {/* Mode Badge */}
      <View style={styles.modeBadge}>
        <Text style={styles.modeEmoji}>{modeInfo.emoji}</Text>
        <Text style={styles.modeLabel}>{modeInfo.label}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={[...modeInfo.color] as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progress}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {current} / {total}
        </Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {/* Correct */}
        <View style={styles.stat}>
          <View style={[styles.statIcon, styles.statIconCorrect]}>
            <Text style={styles.statIconText}>✓</Text>
          </View>
          <View>
            <Text style={styles.statValue}>{correct}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
        </View>

        {/* Accuracy */}
        <View style={styles.stat}>
          <View style={[styles.statIcon, styles.statIconAccuracy]}>
            <Text style={styles.statIconText}>%</Text>
          </View>
          <View>
            <Text style={styles.statValue}>{Math.round(accuracy)}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>

        {/* Time */}
        {timeElapsed !== undefined && (
          <View style={styles.stat}>
            <View style={[styles.statIcon, styles.statIconTime]}>
              <Text style={styles.statIconText}>⏱</Text>
            </View>
            <View>
              <Text style={styles.statValue}>{formatTime(timeElapsed)}</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
          </View>
        )}

        {/* Remaining */}
        <View style={styles.stat}>
          <View style={[styles.statIcon, styles.statIconRemaining]}>
            <Text style={styles.statIconText}>📋</Text>
          </View>
          <View>
            <Text style={styles.statValue}>{total - current}</Text>
            <Text style={styles.statLabel}>Left</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    ...shadows.md,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    gap: 6,
  },
  modeEmoji: {
    fontSize: 14,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[600],
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: colors.gray[100],
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[700],
    minWidth: 60,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconCorrect: {
    backgroundColor: colors.success[100],
  },
  statIconAccuracy: {
    backgroundColor: colors.primary[100],
  },
  statIconTime: {
    backgroundColor: colors.warning[100],
  },
  statIconRemaining: {
    backgroundColor: colors.gray[100],
  },
  statIconText: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray[800],
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray[500],
  },
});

export default StudyProgress;
