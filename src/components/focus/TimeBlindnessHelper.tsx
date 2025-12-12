import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, borderRadius } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';

interface TimeBlindnessHelperProps {
  taskDuration?: number; // Expected task duration in minutes
  onTimeCheck?: (elapsedMinutes: number) => void;
  reminderInterval?: number; // How often to remind (in minutes)
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
}

/**
 * Time Blindness Helper
 * 
 * ADHD users often struggle with time perception. This component provides:
 * - Visual time progression with color changes
 * - Gentle periodic reminders of time passing
 * - "Time anchors" showing what else could be done in elapsed time
 * - Non-judgmental time awareness prompts
 */
export const TimeBlindnessHelper: React.FC<TimeBlindnessHelperProps> = ({
  taskDuration = 30,
  onTimeCheck,
  reminderInterval = 10,
  onStart,
  onPause,
  onReset,
}) => {
  const theme = useTheme();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showTimeAnchor, setShowTimeAnchor] = useState(false);
  const progressAnim = useState(new Animated.Value(0))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Get accessibility settings
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);
  const hapticFeedback = useSettingsStore((state) => state.settings.hapticFeedback);

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const progress = Math.min(elapsedSeconds / (taskDuration * 60), 1);

  // Time anchors - relatable comparisons for elapsed time
  const timeAnchors: Record<number, string[]> = {
    5: ['☕ Enough time to make coffee', '🎵 About 1-2 songs'],
    10: ['🚿 A quick shower', '📧 Check and respond to emails'],
    15: ['🍳 Cook a simple meal', '🚶 A short walk around the block'],
    20: ['📺 A sitcom episode (no ads)', '🧘 A meditation session'],
    30: ['🏃 A light workout', '📖 Read a chapter of a book'],
    45: ['🎬 Half a movie', '🧹 Clean a room thoroughly'],
    60: ['🍿 A full movie', '🚗 A short commute'],
  };

  const getTimeAnchor = useCallback((): string => {
    const anchorMinutes = Object.keys(timeAnchors)
      .map(Number)
      .filter((m) => m <= elapsedMinutes)
      .sort((a, b) => b - a)[0];
    
    if (anchorMinutes) {
      const anchors = timeAnchors[anchorMinutes];
      return anchors[Math.floor(Math.random() * anchors.length)];
    }
    return '';
  }, [elapsedMinutes]);

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Progress animation
  useEffect(() => {
    if (!reduceMotion) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, progressAnim, reduceMotion]);

  // Reminder at intervals
  useEffect(() => {
    if (isRunning && elapsedMinutes > 0 && elapsedMinutes % reminderInterval === 0 && elapsedSeconds % 60 === 0) {
      // Gentle vibration reminder (respects haptic settings)
      if (hapticFeedback) {
        Vibration.vibrate([0, 100, 50, 100]);
      }
      setShowTimeAnchor(true);
      onTimeCheck?.(elapsedMinutes);
      
      // Pulse animation (respects reduced motion)
      if (!reduceMotion) {
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      }

      AccessibilityInfo.announceForAccessibility(`${elapsedMinutes} minutes have passed`);

      // Hide time anchor after 5 seconds
      setTimeout(() => setShowTimeAnchor(false), 5000);
    }
  }, [elapsedMinutes, elapsedSeconds, isRunning, reminderInterval, onTimeCheck, pulseAnim, reduceMotion, hapticFeedback]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = (): string => {
    if (progress < 0.5) return theme.palette.success[500];
    if (progress < 0.75) return theme.palette.warning[500];
    if (progress < 1) return theme.palette.warning[600];
    return theme.palette.danger[500];
  };

  const getStatusMessage = (): string => {
    if (!isRunning && elapsedSeconds === 0) return 'Ready to start';
    if (progress < 0.25) return 'Just getting started';
    if (progress < 0.5) return 'Making good progress';
    if (progress < 0.75) return 'Past halfway';
    if (progress < 1) return 'Almost at expected time';
    return 'Taking longer than expected (that\'s okay!)';
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      AccessibilityInfo.announceForAccessibility('Timer started');
      onStart?.();
    } else {
      AccessibilityInfo.announceForAccessibility('Timer paused');
      onPause?.();
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setShowTimeAnchor(false);
    AccessibilityInfo.announceForAccessibility('Timer reset');
    onReset?.();
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.background.card,
      borderRadius: borderRadius.xl,
      padding: spacing[5],
      margin: spacing[4],
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing[4],
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text.primary,
    },
    settingsButton: {
      padding: spacing[2],
    },
    timerContainer: {
      alignItems: 'center',
      marginBottom: spacing[4],
    },
    timerText: {
      fontSize: 48,
      fontWeight: '700',
      color: theme.text.primary,
      fontVariant: ['tabular-nums'],
    },
    statusText: {
      fontSize: 14,
      color: theme.text.secondary,
      marginTop: spacing[2],
      textAlign: 'center',
    },
    progressContainer: {
      height: 8,
      backgroundColor: theme.background.secondary,
      borderRadius: borderRadius.full,
      marginBottom: spacing[4],
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: borderRadius.full,
    },
    expectedTimeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing[4],
    },
    expectedTimeLabel: {
      fontSize: 12,
      color: theme.text.muted,
    },
    expectedTimeValue: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.text.secondary,
    },
    timeAnchorContainer: {
      backgroundColor: theme.palette.accent[50],
      padding: spacing[3],
      borderRadius: borderRadius.md,
      marginBottom: spacing[4],
      borderLeftWidth: 3,
      borderLeftColor: theme.palette.accent[500],
    },
    timeAnchorLabel: {
      fontSize: 11,
      color: theme.palette.accent[600],
      marginBottom: spacing[1],
    },
    timeAnchorText: {
      fontSize: 14,
      color: theme.palette.accent[700],
      fontWeight: '500',
    },
    controlsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing[3],
    },
    controlButton: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playButton: {
      backgroundColor: theme.palette.primary[500],
    },
    pauseButton: {
      backgroundColor: theme.palette.warning[500],
    },
    resetButton: {
      backgroundColor: theme.background.secondary,
    },
    tipsSection: {
      marginTop: spacing[4],
      paddingTop: spacing[4],
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    tipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing[2],
    },
    tipIcon: {
      marginRight: spacing[2],
    },
    tipText: {
      fontSize: 13,
      color: theme.text.secondary,
      flex: 1,
    },
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      <View style={styles.header}>
        <Text style={styles.title}>⏰ Time Awareness</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          accessibilityLabel="Timer settings"
          accessibilityRole="button"
        >
          <Ionicons name="settings-outline" size={20} color={theme.text.muted} />
        </TouchableOpacity>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timerText} accessibilityLabel={`Elapsed time: ${formatTime(elapsedSeconds)}`}>
          {formatTime(elapsedSeconds)}
        </Text>
        <Text style={styles.statusText}>{getStatusMessage()}</Text>
      </View>

      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: getProgressColor(),
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <View style={styles.expectedTimeRow}>
        <Text style={styles.expectedTimeLabel}>Expected duration</Text>
        <Text style={styles.expectedTimeValue}>{taskDuration} minutes</Text>
      </View>

      {showTimeAnchor && (
        <View style={styles.timeAnchorContainer}>
          <Text style={styles.timeAnchorLabel}>Time perspective</Text>
          <Text style={styles.timeAnchorText}>{getTimeAnchor()}</Text>
        </View>
      )}

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.controlButton, styles.resetButton]}
          onPress={resetTimer}
          accessibilityRole="button"
          accessibilityLabel="Reset timer"
        >
          <Ionicons name="refresh" size={24} color={theme.text.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, isRunning ? styles.pauseButton : styles.playButton]}
          onPress={toggleTimer}
          accessibilityRole="button"
          accessibilityLabel={isRunning ? 'Pause timer' : 'Start timer'}
        >
          <Ionicons 
            name={isRunning ? 'pause' : 'play'} 
            size={28} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.tipsSection}>
        <View style={styles.tipRow}>
          <Ionicons name="bulb-outline" size={16} color={theme.palette.warning[500]} style={styles.tipIcon} />
          <Text style={styles.tipText}>
            Gentle reminders every {reminderInterval} minutes help maintain time awareness
          </Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="heart-outline" size={16} color={theme.palette.danger[400]} style={styles.tipIcon} />
          <Text style={styles.tipText}>
            Taking longer is okay - this is for awareness, not judgment
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

export default TimeBlindnessHelper;
