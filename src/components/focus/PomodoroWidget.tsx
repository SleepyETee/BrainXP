import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, borderRadius } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';
import { colors } from '../../theme/colors';

/**
 * PomodoroWidget - Enhanced Pomodoro Timer with ADHD-Friendly Features
 * 
 * Features:
 * - Multiple timer presets (Pomodoro, Short Focus, Starter, Deep Work)
 * - Visual progress ring
 * - Session history tracking
 * - Daily/weekly streak display
 * - Auto-break transitions
 * - Accessibility support with screen reader announcements
 * - Respects reduceMotion settings
 */

interface PomodoroSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  type: 'work' | 'break';
  completed: boolean;
}

interface PomodoroStats {
  todayPomodoros: number;
  todayMinutes: number;
  weekPomodoros: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionLength: number;
}

interface PomodoroWidgetProps {
  onSessionStart?: (duration: number) => void;
  onSessionComplete?: (session: PomodoroSession) => void;
  onBreakStart?: (duration: number) => void;
  onBreakComplete?: () => void;
  compact?: boolean;
  showStats?: boolean;
  initialPreset?: 'pomodoro' | 'short' | 'starter' | 'deep';
}

const PRESETS = {
  pomodoro: { work: 25, break: 5, label: 'Pomodoro', emoji: '🍅', description: 'Classic 25/5' },
  short: { work: 10, break: 3, label: '10-3 Rule', emoji: '⚡', description: 'Quick focus bursts' },
  starter: { work: 20, break: 5, label: 'Starter', emoji: '🚀', description: 'Build momentum' },
  deep: { work: 45, break: 15, label: 'Deep Work', emoji: '🧠', description: 'Extended focus' },
} as const;

type PresetKey = keyof typeof PRESETS;

export const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({
  onSessionStart,
  onSessionComplete,
  onBreakStart,
  onBreakComplete,
  compact = false,
  showStats = true,
  initialPreset = 'pomodoro',
}) => {
  const theme = useTheme();
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);
  const hapticFeedback = useSettingsStore((state) => state.settings.hapticFeedback);
  const largeText = useSettingsStore((state) => state.settings.largeText);

  // Timer state
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>(initialPreset);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(PRESETS[initialPreset].work * 60);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);

  // Session history
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null);

  // Stats
  const [stats, setStats] = useState<PomodoroStats>({
    todayPomodoros: 0,
    todayMinutes: 0,
    weekPomodoros: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageSessionLength: 0,
  });

  // Animation values
  const progressScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  const preset = PRESETS[selectedPreset];
  const totalSeconds = isBreak ? preset.break * 60 : preset.work * 60;
  const progress = 1 - timeRemaining / totalSeconds;

  // Text scaling for accessibility
  const textScale = largeText ? 1.15 : 1;

  // Timer countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeRemaining]);

  // Pulse animation when running
  useEffect(() => {
    if (isRunning && !isPaused && !reduceMotion) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseOpacity.value = withTiming(0.5, { duration: 300 });
    }
  }, [isRunning, isPaused, reduceMotion]);

  // Update stats when sessions change
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const todaySessions = sessions.filter(
      (s) => s.type === 'work' && s.completed && new Date(s.startTime) >= today
    );
    
    const weekSessions = sessions.filter(
      (s) => s.type === 'work' && s.completed && new Date(s.startTime) >= weekAgo
    );

    const totalMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const avgLength = weekSessions.length > 0
      ? weekSessions.reduce((sum, s) => sum + s.duration, 0) / weekSessions.length
      : 0;

    setStats({
      todayPomodoros: todaySessions.length,
      todayMinutes: totalMinutes,
      weekPomodoros: weekSessions.length,
      currentStreak: calculateStreak(sessions),
      longestStreak: calculateLongestStreak(sessions),
      averageSessionLength: Math.round(avgLength),
    });
  }, [sessions]);

  const calculateStreak = (sessions: PomodoroSession[]): number => {
    // Calculate consecutive days with at least one completed pomodoro
    const completedDays = new Set(
      sessions
        .filter((s) => s.type === 'work' && s.completed)
        .map((s) => new Date(s.startTime).toDateString())
    );

    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      
      if (completedDays.has(checkDate.toDateString())) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  const calculateLongestStreak = (sessions: PomodoroSession[]): number => {
    const completedDays = Array.from(
      new Set(
        sessions
          .filter((s) => s.type === 'work' && s.completed)
          .map((s) => new Date(s.startTime).toDateString())
      )
    ).sort();

    let maxStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    for (const dayStr of completedDays) {
      const day = new Date(dayStr);
      if (lastDate) {
        const diffDays = Math.round((day.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      lastDate = day;
    }

    return Math.max(maxStreak, currentStreak);
  };

  const handleTimerComplete = useCallback(() => {
    const now = new Date();
    
    if (!isBreak) {
      // Work session complete
      const session: PomodoroSession = {
        id: `${Date.now()}`,
        startTime: currentSessionStart || new Date(now.getTime() - preset.work * 60 * 1000),
        endTime: now,
        duration: preset.work,
        type: 'work',
        completed: true,
      };
      
      setSessions((prev) => [...prev, session]);
      setCompletedPomodoros((prev) => prev + 1);
      onSessionComplete?.(session);

      if (hapticFeedback) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      AccessibilityInfo.announceForAccessibility(
        `Pomodoro complete! You've finished ${completedPomodoros + 1} pomodoros. Starting ${preset.break} minute break.`
      );

      // Auto-start break
      setIsBreak(true);
      setTimeRemaining(preset.break * 60);
      onBreakStart?.(preset.break);
    } else {
      // Break complete
      if (hapticFeedback) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      AccessibilityInfo.announceForAccessibility(
        `Break complete! Ready for another focus session?`
      );

      setIsBreak(false);
      setIsRunning(false);
      setTimeRemaining(preset.work * 60);
      onBreakComplete?.();
    }
  }, [isBreak, currentSessionStart, preset, completedPomodoros, hapticFeedback, onSessionComplete, onBreakStart, onBreakComplete]);

  const startTimer = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    setCurrentSessionStart(new Date());
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    progressScale.value = withSpring(1.02, { damping: 15 });
    setTimeout(() => {
      progressScale.value = withSpring(1, { damping: 15 });
    }, 200);

    const duration = isBreak ? preset.break : preset.work;
    AccessibilityInfo.announceForAccessibility(
      `${isBreak ? 'Break' : 'Focus'} timer started. ${duration} minutes.`
    );
    
    if (!isBreak) {
      onSessionStart?.(preset.work);
    }
  }, [isBreak, preset, hapticFeedback, onSessionStart]);

  const pauseTimer = useCallback(() => {
    setIsPaused(true);
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    AccessibilityInfo.announceForAccessibility('Timer paused.');
  }, [hapticFeedback]);

  const resumeTimer = useCallback(() => {
    setIsPaused(false);
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    AccessibilityInfo.announceForAccessibility('Timer resumed.');
  }, [hapticFeedback]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setIsBreak(false);
    setTimeRemaining(preset.work * 60);
    setCurrentSessionStart(null);
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    AccessibilityInfo.announceForAccessibility('Timer reset.');
  }, [preset, hapticFeedback]);

  const selectPreset = useCallback((key: PresetKey) => {
    if (isRunning) return;
    
    setSelectedPreset(key);
    setTimeRemaining(PRESETS[key].work * 60);
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    AccessibilityInfo.announceForAccessibility(
      `Selected ${PRESETS[key].label}. ${PRESETS[key].work} minutes work, ${PRESETS[key].break} minutes break.`
    );
  }, [isRunning, hapticFeedback]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progressScale.value }],
  }));

  // Calculate progress ring
  const size = compact ? 120 : 180;
  const strokeWidth = compact ? 6 : 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.background.card,
      borderRadius: borderRadius.xl,
      padding: compact ? spacing[3] : spacing[4],
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing[3],
    },
    title: {
      fontSize: 18 * textScale,
      fontWeight: '700',
      color: theme.text.primary,
    },
    pomodoroCount: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
      backgroundColor: isBreak ? colors.success[50] : colors.primary[50],
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderRadius: borderRadius.full,
    },
    pomodoroCountText: {
      fontSize: 14 * textScale,
      fontWeight: '600',
      color: isBreak ? colors.success[700] : colors.primary[700],
    },
    presetRow: {
      flexDirection: 'row',
      gap: spacing[2],
      marginBottom: spacing[4],
    },
    presetButton: {
      flex: 1,
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[2],
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      backgroundColor: theme.background.secondary,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    presetButtonActive: {
      backgroundColor: colors.primary[50],
      borderColor: colors.primary[400],
    },
    presetButtonDisabled: {
      opacity: 0.5,
    },
    presetEmoji: {
      fontSize: 18,
      marginBottom: 2,
    },
    presetLabel: {
      fontSize: 11 * textScale,
      fontWeight: '600',
      color: theme.text.secondary,
    },
    presetLabelActive: {
      color: colors.primary[700],
    },
    timerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing[4],
    },
    timerRing: {
      position: 'relative',
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timerBackground: {
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: strokeWidth,
      borderColor: theme.palette.gray[200],
    },
    timerProgress: {
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: strokeWidth,
      borderColor: isBreak ? colors.success[500] : colors.primary[500],
      borderLeftColor: 'transparent',
      borderBottomColor: 'transparent',
      transform: [{ rotate: '-45deg' }],
    },
    pulseRing: {
      position: 'absolute',
      width: size + 20,
      height: size + 20,
      borderRadius: (size + 20) / 2,
      backgroundColor: isBreak ? colors.success[200] : colors.primary[200],
    },
    timerInner: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    timerText: {
      fontSize: (compact ? 32 : 44) * textScale,
      fontWeight: '200',
      color: theme.text.primary,
      fontVariant: ['tabular-nums'],
    },
    timerLabel: {
      fontSize: 14 * textScale,
      color: theme.text.secondary,
      marginTop: spacing[1],
    },
    controlsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing[3],
      marginBottom: showStats ? spacing[4] : 0,
    },
    controlButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playButton: {
      backgroundColor: isBreak ? colors.success[500] : colors.primary[500],
      width: 64,
      height: 64,
      borderRadius: 32,
    },
    pauseButton: {
      backgroundColor: colors.warning[500],
      width: 64,
      height: 64,
      borderRadius: 32,
    },
    resetButton: {
      backgroundColor: theme.palette.gray[200],
    },
    skipButton: {
      backgroundColor: theme.palette.gray[200],
    },
    statsContainer: {
      backgroundColor: theme.background.secondary,
      borderRadius: borderRadius.lg,
      padding: spacing[3],
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20 * textScale,
      fontWeight: '700',
      color: theme.text.primary,
    },
    statLabel: {
      fontSize: 11 * textScale,
      color: theme.text.secondary,
      marginTop: 2,
    },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
  });

  return (
    <Animated.View
      style={styles.container}
      entering={reduceMotion ? undefined : FadeIn.duration(300)}
      accessible
      accessibilityLabel={`Pomodoro timer. ${isRunning ? (isPaused ? 'Paused' : 'Running') : 'Ready'}. ${formatTime(timeRemaining)} remaining.`}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          🍅 Pomodoro
        </Text>
        <View 
          style={styles.pomodoroCount}
          accessibilityLabel={`${completedPomodoros} pomodoros completed today`}
        >
          <Text style={styles.pomodoroCountText}>{completedPomodoros}</Text>
          <Ionicons 
            name="checkmark-circle" 
            size={16} 
            color={isBreak ? colors.success[600] : colors.primary[600]} 
          />
        </View>
      </View>

      {/* Preset Selection */}
      {!compact && (
        <View 
          style={styles.presetRow}
          accessibilityRole="radiogroup"
          accessibilityLabel="Timer preset selection"
        >
          {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.presetButton,
                selectedPreset === key && styles.presetButtonActive,
                isRunning && styles.presetButtonDisabled,
              ]}
              onPress={() => selectPreset(key)}
              disabled={isRunning}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedPreset === key, disabled: isRunning }}
              accessibilityLabel={`${PRESETS[key].label}: ${PRESETS[key].description}`}
            >
              <Text style={styles.presetEmoji}>{PRESETS[key].emoji}</Text>
              <Text style={[styles.presetLabel, selectedPreset === key && styles.presetLabelActive]}>
                {PRESETS[key].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <Animated.View style={[styles.timerRing, animatedScaleStyle]}>
          {/* Pulse effect */}
          {isRunning && !isPaused && (
            <Animated.View style={[styles.pulseRing, animatedPulseStyle]} />
          )}
          
          {/* Background ring */}
          <View style={styles.timerBackground} />
          
          {/* Progress ring - simplified for RN */}
          <View
            style={[
              styles.timerProgress,
              {
                borderRightColor: isBreak ? colors.success[500] : colors.primary[500],
                borderTopColor: progress > 0.25 ? (isBreak ? colors.success[500] : colors.primary[500]) : 'transparent',
              },
            ]}
          />

          {/* Timer text */}
          <View 
            style={styles.timerInner}
            accessibilityRole="timer"
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            <Text style={styles.timerLabel}>
              {isBreak ? '☕ Break' : '🎯 Focus'}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.controlButton, styles.resetButton]}
          onPress={resetTimer}
          accessibilityRole="button"
          accessibilityLabel="Reset timer"
        >
          <Ionicons name="refresh" size={24} color={theme.text.secondary} />
        </TouchableOpacity>

        {!isRunning ? (
          <TouchableOpacity
            style={[styles.controlButton, styles.playButton]}
            onPress={startTimer}
            accessibilityRole="button"
            accessibilityLabel={`Start ${isBreak ? 'break' : 'focus'} timer`}
          >
            <Ionicons name="play" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        ) : isPaused ? (
          <TouchableOpacity
            style={[styles.controlButton, styles.playButton]}
            onPress={resumeTimer}
            accessibilityRole="button"
            accessibilityLabel="Resume timer"
          >
            <Ionicons name="play" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.controlButton, styles.pauseButton]}
            onPress={pauseTimer}
            accessibilityRole="button"
            accessibilityLabel="Pause timer"
          >
            <Ionicons name="pause" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.controlButton, styles.skipButton]}
          onPress={handleTimerComplete}
          disabled={!isRunning}
          accessibilityRole="button"
          accessibilityLabel={`Skip to ${isBreak ? 'next focus session' : 'break'}`}
          accessibilityState={{ disabled: !isRunning }}
        >
          <Ionicons 
            name="play-skip-forward" 
            size={24} 
            color={isRunning ? theme.text.secondary : theme.text.muted} 
          />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {showStats && !compact && (
        <View 
          style={styles.statsContainer}
          accessibilityLabel="Today's pomodoro statistics"
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.todayPomodoros}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.todayMinutes}m</Text>
              <Text style={styles.statLabel}>Focus Time</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.streakBadge}>
                <Text style={styles.statValue}>{stats.currentStreak}</Text>
                <Text style={{ fontSize: 16 }}>🔥</Text>
              </View>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

export default PomodoroWidget;
