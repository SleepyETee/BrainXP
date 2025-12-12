import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, borderRadius } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';

/**
 * Body Doubling Session Component
 * 
 * Body doubling is an ADHD productivity technique where having another person
 * present (even virtually) helps maintain focus and accountability.
 * 
 * This component provides:
 * - Virtual co-working presence simulation
 * - Ambient focus sounds
 * - Periodic check-ins
 * - Session statistics
 * - Pomodoro integration
 * - Full accessibility support
 */

interface VirtualCompanion {
  id: string;
  name: string;
  avatar: string;
  status: 'focusing' | 'break' | 'away';
  task?: string;
  focusMinutes: number;
}

interface SessionStats {
  totalSessions: number;
  totalMinutes: number;
  averageSessionLength: number;
  longestSession: number;
  checkInsCompleted: number;
  productiveStreak: number;
}

interface BodyDoublingSessionProps {
  onSessionStart?: () => void;
  onSessionEnd?: (duration: number, stats: { checkIns: number; companions: number }) => void;
  onCheckIn?: (response: 'good' | 'struggling' | 'break') => void;
  checkInInterval?: number; // minutes between check-ins
  enableAmbientSounds?: boolean;
  pomodoroMode?: boolean; // Enable Pomodoro-style sessions
  workDuration?: number; // Work duration in minutes (for Pomodoro)
  breakDuration?: number; // Break duration in minutes (for Pomodoro)
}

// Simulated virtual companions for body doubling effect
const virtualCompanions: VirtualCompanion[] = [
  { id: '1', name: 'Alex', avatar: '👨‍💻', status: 'focusing', task: 'Writing report', focusMinutes: 45 },
  { id: '2', name: 'Sam', avatar: '👩‍🎨', status: 'focusing', task: 'Design work', focusMinutes: 32 },
  { id: '3', name: 'Jordan', avatar: '🧑‍🔬', status: 'break', task: 'Research', focusMinutes: 28 },
  { id: '4', name: 'Taylor', avatar: '👨‍🏫', status: 'focusing', task: 'Lesson planning', focusMinutes: 51 },
  { id: '5', name: 'Casey', avatar: '👩‍💼', status: 'focusing', task: 'Email processing', focusMinutes: 19 },
  { id: '6', name: 'Morgan', avatar: '🧑‍💻', status: 'focusing', task: 'Coding', focusMinutes: 67 },
  { id: '7', name: 'Riley', avatar: '👩‍🔬', status: 'focusing', task: 'Data analysis', focusMinutes: 38 },
];

const ambientOptions = [
  { id: 'cafe', icon: '☕', label: 'Coffee Shop', description: 'Gentle cafe ambiance' },
  { id: 'library', icon: '📚', label: 'Library', description: 'Quiet study atmosphere' },
  { id: 'rain', icon: '🌧️', label: 'Rainy Day', description: 'Calming rain sounds' },
  { id: 'nature', icon: '🌳', label: 'Nature', description: 'Forest and birds' },
  { id: 'lofi', icon: '🎵', label: 'Lo-Fi', description: 'Chill beats to focus' },
  { id: 'white', icon: '🔊', label: 'White Noise', description: 'Consistent background' },
];

// Pomodoro session phases
type SessionPhase = 'work' | 'break' | 'idle';

export const BodyDoublingSession: React.FC<BodyDoublingSessionProps> = ({
  onSessionStart,
  onSessionEnd,
  onCheckIn,
  checkInInterval = 15,
  enableAmbientSounds = true,
  pomodoroMode = false,
  workDuration = 25,
  breakDuration = 5,
}) => {
  const theme = useTheme();
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);
  const hapticFeedback = useSettingsStore((state) => state.settings.hapticFeedback);
  const largeText = useSettingsStore((state) => state.settings.largeText);

  const [isActive, setIsActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [companions, setCompanions] = useState<VirtualCompanion[]>([]);
  const [selectedAmbient, setSelectedAmbient] = useState<string | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInCount, setCheckInCount] = useState(0);
  const [myTask, setMyTask] = useState('');
  
  // Pomodoro state
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('idle');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(0);
  
  // Session statistics
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalSessions: 0,
    totalMinutes: 0,
    averageSessionLength: 0,
    longestSession: 0,
    checkInsCompleted: 0,
    productiveStreak: 0,
  });

  // Accessibility - track screen reader status
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const lastAnnouncementRef = useRef<string>('');

  // Animation values
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  // Check screen reader status
  useEffect(() => {
    const checkScreenReader = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(enabled);
    };
    checkScreenReader();

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );
    return () => subscription.remove();
  }, []);

  // Announce for accessibility without repeating
  const announce = useCallback((message: string, force = false) => {
    if (force || message !== lastAnnouncementRef.current) {
      lastAnnouncementRef.current = message;
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, []);

  // Breathing animation for active session
  useEffect(() => {
    if (isActive && !reduceMotion) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 3000 }),
          withTiming(0.3, { duration: 3000 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
      glowOpacity.value = 0.3;
    }
  }, [isActive, reduceMotion]);

  // Session timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
        
        // Pomodoro countdown
        if (pomodoroMode && sessionPhase !== 'idle') {
          setPhaseTimeRemaining((prev) => {
            if (prev <= 1) {
              handlePhaseComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, pomodoroMode, sessionPhase]);

  // Check-in prompt
  useEffect(() => {
    if (isActive && sessionSeconds > 0 && sessionSeconds % (checkInInterval * 60) === 0) {
      setShowCheckIn(true);
      if (hapticFeedback) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      announce('Check-in time: How is your focus?', true);
    }
  }, [sessionSeconds, isActive, checkInInterval, hapticFeedback, announce]);

  // Periodic status announcements for screen reader users
  useEffect(() => {
    if (isActive && isScreenReaderEnabled && sessionSeconds > 0 && sessionSeconds % 300 === 0) {
      const mins = Math.floor(sessionSeconds / 60);
      const focusingCount = companions.filter(c => c.status === 'focusing').length;
      announce(`${mins} minutes elapsed. ${focusingCount} companions focusing with you.`);
    }
  }, [sessionSeconds, isActive, isScreenReaderEnabled, companions, announce]);

  // Simulate companion activity updates
  useEffect(() => {
    if (isActive) {
      const updateInterval = setInterval(() => {
        setCompanions((prev) =>
          prev.map((c) => ({
            ...c,
            focusMinutes: c.status === 'focusing' ? c.focusMinutes + 1 : c.focusMinutes,
            status: Math.random() > 0.95 ? (c.status === 'focusing' ? 'break' : 'focusing') : c.status,
          }))
        );
      }, 60000);
      return () => clearInterval(updateInterval);
    }
  }, [isActive]);

  const handlePhaseComplete = useCallback(() => {
    if (sessionPhase === 'work') {
      setPomodoroCount((prev) => prev + 1);
      setSessionPhase('break');
      setPhaseTimeRemaining(breakDuration * 60);
      if (hapticFeedback) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      announce(`Work session complete! Pomodoro ${pomodoroCount + 1} finished. Starting ${breakDuration} minute break.`, true);
    } else if (sessionPhase === 'break') {
      setSessionPhase('work');
      setPhaseTimeRemaining(workDuration * 60);
      if (hapticFeedback) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      announce(`Break complete! Starting ${workDuration} minute focus session.`, true);
    }
  }, [sessionPhase, pomodoroCount, workDuration, breakDuration, hapticFeedback, announce]);

  const startSession = useCallback(() => {
    setIsActive(true);
    setSessionSeconds(0);
    setCompanions(virtualCompanions.slice(0, 3 + Math.floor(Math.random() * 4)));
    setCheckInCount(0);
    
    if (pomodoroMode) {
      setSessionPhase('work');
      setPhaseTimeRemaining(workDuration * 60);
      setPomodoroCount(0);
    }
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    const companionCount = 3 + Math.floor(Math.random() * 4);
    announce(
      `Body doubling session started. You are now working alongside ${companionCount} virtual companions.${
        pomodoroMode ? ` First ${workDuration} minute focus session beginning.` : ''
      }`,
      true
    );
    onSessionStart?.();
  }, [hapticFeedback, onSessionStart, pomodoroMode, workDuration, announce]);

  const endSession = useCallback(() => {
    setIsActive(false);
    setSessionPhase('idle');
    
    const sessionMinutes = Math.floor(sessionSeconds / 60);
    
    // Update stats
    setSessionStats((prev) => ({
      totalSessions: prev.totalSessions + 1,
      totalMinutes: prev.totalMinutes + sessionMinutes,
      averageSessionLength: Math.round((prev.totalMinutes + sessionMinutes) / (prev.totalSessions + 1)),
      longestSession: Math.max(prev.longestSession, sessionMinutes),
      checkInsCompleted: prev.checkInsCompleted + checkInCount,
      productiveStreak: checkInCount > 0 ? prev.productiveStreak + 1 : 0,
    }));
    
    if (hapticFeedback) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    announce(
      `Session ended. You focused for ${sessionMinutes} minutes${
        pomodoroMode ? ` and completed ${pomodoroCount} pomodoros` : ''
      }. Great work!`,
      true
    );
    onSessionEnd?.(sessionSeconds, { checkIns: checkInCount, companions: companions.length });
  }, [hapticFeedback, sessionSeconds, onSessionEnd, pomodoroMode, pomodoroCount, checkInCount, companions.length, announce]);

  const handleCheckIn = useCallback((response: 'good' | 'struggling' | 'break') => {
    setShowCheckIn(false);
    setCheckInCount((prev) => prev + 1);
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onCheckIn?.(response);

    const messages = {
      good: 'Great! Keep up the excellent work. Your focus is strong.',
      struggling: "It's okay to struggle. Your companions are here with you. Consider taking a short mental break.",
      break: 'Taking a break is a smart choice. Good job recognizing your needs! Rest well.',
    };
    announce(messages[response], true);
  }, [hapticFeedback, onCheckIn, announce]);

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhaseTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Dynamic text sizing for accessibility
  const textScale = largeText ? 1.2 : 1;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.primary,
    },
    header: {
      padding: spacing[4],
      paddingTop: spacing[6],
    },
    title: {
      fontSize: 24 * textScale,
      fontWeight: '700',
      color: theme.text.primary,
      marginBottom: spacing[1],
    },
    subtitle: {
      fontSize: 14 * textScale,
      color: theme.text.secondary,
    },
    sessionCard: {
      margin: spacing[4],
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
    },
    sessionGradient: {
      padding: spacing[5],
    },
    sessionTimer: {
      fontSize: 48 * textScale,
      fontWeight: '200',
      color: '#FFFFFF',
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },
    sessionStatus: {
      fontSize: 16 * textScale,
      color: 'rgba(255,255,255,0.8)',
      textAlign: 'center',
      marginTop: spacing[2],
    },
    pomodoroInfo: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing[3],
      gap: spacing[4],
    },
    pomodoroPhase: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: borderRadius.lg,
    },
    pomodoroPhaseText: {
      color: '#FFFFFF',
      fontSize: 14 * textScale,
      fontWeight: '600',
    },
    pomodoroCount: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 14 * textScale,
    },
    glowEffect: {
      position: 'absolute',
      top: -20,
      left: -20,
      right: -20,
      bottom: -20,
      borderRadius: borderRadius.xl + 20,
      backgroundColor: theme.palette.primary[500],
    },
    companionsSection: {
      padding: spacing[4],
    },
    sectionTitle: {
      fontSize: 16 * textScale,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: spacing[3],
    },
    companionsList: {
      gap: spacing[2],
    },
    companionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background.card,
      padding: spacing[3],
      borderRadius: borderRadius.lg,
    },
    companionAvatar: {
      fontSize: 28,
      marginRight: spacing[3],
    },
    companionInfo: {
      flex: 1,
    },
    companionName: {
      fontSize: 15 * textScale,
      fontWeight: '600',
      color: theme.text.primary,
    },
    companionTask: {
      fontSize: 13 * textScale,
      color: theme.text.secondary,
      marginTop: 2,
    },
    companionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 12 * textScale,
      color: theme.text.muted,
    },
    statsSection: {
      padding: spacing[4],
      backgroundColor: theme.background.secondary,
      margin: spacing[4],
      borderRadius: borderRadius.lg,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing[3],
    },
    statItem: {
      width: '45%',
    },
    statValue: {
      fontSize: 20 * textScale,
      fontWeight: '700',
      color: theme.text.primary,
    },
    statLabel: {
      fontSize: 12 * textScale,
      color: theme.text.secondary,
      marginTop: 2,
    },
    ambientSection: {
      padding: spacing[4],
    },
    ambientGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing[2],
    },
    ambientOption: {
      width: '30%',
      aspectRatio: 1,
      backgroundColor: theme.background.card,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing[2],
    },
    ambientOptionSelected: {
      backgroundColor: theme.palette.primary[100],
      borderWidth: 2,
      borderColor: theme.palette.primary[500],
    },
    ambientIcon: {
      fontSize: 24,
      marginBottom: spacing[1],
    },
    ambientLabel: {
      fontSize: 11 * textScale,
      color: theme.text.secondary,
      textAlign: 'center',
    },
    controlsSection: {
      padding: spacing[4],
      paddingBottom: spacing[8],
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing[3],
    },
    startButton: {
      flex: 1,
      backgroundColor: theme.palette.primary[500],
      paddingVertical: spacing[4],
      borderRadius: borderRadius.xl,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing[2],
    },
    endButton: {
      backgroundColor: theme.palette.danger[500],
    },
    pauseButton: {
      backgroundColor: theme.palette.warning[500],
      flex: 0.4,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 18 * textScale,
      fontWeight: '600',
    },
    checkInOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing[4],
    },
    checkInCard: {
      backgroundColor: theme.background.card,
      borderRadius: borderRadius.xl,
      padding: spacing[5],
      width: '100%',
      maxWidth: 340,
    },
    checkInTitle: {
      fontSize: 20 * textScale,
      fontWeight: '700',
      color: theme.text.primary,
      textAlign: 'center',
      marginBottom: spacing[2],
    },
    checkInSubtitle: {
      fontSize: 14 * textScale,
      color: theme.text.secondary,
      textAlign: 'center',
      marginBottom: spacing[4],
    },
    checkInOptions: {
      gap: spacing[2],
    },
    checkInOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing[3],
      borderRadius: borderRadius.lg,
      gap: spacing[3],
      minHeight: 56,
    },
    checkInGood: {
      backgroundColor: theme.palette.success[50],
    },
    checkInStruggling: {
      backgroundColor: theme.palette.warning[50],
    },
    checkInBreak: {
      backgroundColor: theme.palette.accent[50],
    },
    checkInOptionText: {
      fontSize: 15 * textScale,
      fontWeight: '500',
      color: theme.text.primary,
    },
    infoSection: {
      padding: spacing[4],
      backgroundColor: theme.background.secondary,
      margin: spacing[4],
      borderRadius: borderRadius.lg,
    },
    infoTitle: {
      fontSize: 14 * textScale,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: spacing[2],
    },
    infoText: {
      fontSize: 13 * textScale,
      color: theme.text.secondary,
      lineHeight: 20 * textScale,
    },
    tipCard: {
      backgroundColor: theme.palette.accent[50],
      padding: spacing[3],
      borderRadius: borderRadius.lg,
      marginTop: spacing[3],
      borderLeftWidth: 3,
      borderLeftColor: theme.palette.accent[500],
    },
    tipText: {
      fontSize: 13 * textScale,
      color: theme.palette.accent[700],
      fontStyle: 'italic',
    },
  });

  return (
    <View 
      style={styles.container}
      accessible
      accessibilityLabel="Body Doubling Session"
    >
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            👥 Body Doubling
          </Text>
          <Text style={styles.subtitle}>
            Work alongside others for accountability and focus
          </Text>
        </View>

        {isActive ? (
          <>
            <Animated.View 
              style={[styles.sessionCard, !reduceMotion && animatedContainerStyle]}
              accessibilityRole="timer"
              accessibilityLabel={`Session timer: ${formatDuration(sessionSeconds)}`}
              accessibilityLiveRegion="polite"
            >
              {!reduceMotion && <Animated.View style={[styles.glowEffect, animatedGlowStyle]} />}
              <LinearGradient
                colors={
                  sessionPhase === 'break'
                    ? [theme.palette.success[600], theme.palette.success[500]]
                    : [theme.palette.primary[600], theme.palette.primary[500]]
                }
                style={styles.sessionGradient}
              >
                <Text style={styles.sessionTimer}>{formatDuration(sessionSeconds)}</Text>
                <Text style={styles.sessionStatus}>
                  🟢 Focusing with {companions.length} others
                </Text>
                
                {pomodoroMode && (
                  <View style={styles.pomodoroInfo}>
                    <View style={styles.pomodoroPhase}>
                      <Text style={styles.pomodoroPhaseText}>
                        {sessionPhase === 'work' ? '🎯 Focus' : '☕ Break'}: {formatPhaseTime(phaseTimeRemaining)}
                      </Text>
                    </View>
                    <Text style={styles.pomodoroCount}>
                      🍅 {pomodoroCount} completed
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>

            <View style={styles.companionsSection}>
              <Text 
                style={styles.sectionTitle}
                accessibilityRole="header"
              >
                Working Together ({companions.filter((c) => c.status === 'focusing').length} focusing)
              </Text>
              <View 
                style={styles.companionsList}
                accessibilityRole="list"
              >
                {companions.map((companion) => (
                  <View 
                    key={companion.id} 
                    style={styles.companionCard}
                    accessible
                    accessibilityLabel={`${companion.name}, ${companion.status === 'focusing' ? `focusing for ${companion.focusMinutes} minutes on ${companion.task}` : 'on break'}`}
                  >
                    <Text style={styles.companionAvatar} aria-hidden>
                      {companion.avatar}
                    </Text>
                    <View style={styles.companionInfo}>
                      <Text style={styles.companionName}>{companion.name}</Text>
                      <Text style={styles.companionTask}>{companion.task}</Text>
                    </View>
                    <View style={styles.companionStatus}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              companion.status === 'focusing'
                                ? theme.palette.success[500]
                                : companion.status === 'break'
                                ? theme.palette.warning[500]
                                : theme.palette.gray[400],
                          },
                        ]}
                        importantForAccessibility="no"
                      />
                      <Text style={styles.statusText}>
                        {companion.status === 'focusing'
                          ? `${companion.focusMinutes}m`
                          : companion.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
            
            {/* Session Tips */}
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>
                💡 Tip: If you feel distracted, glance at your companions. Seeing others work can help you refocus.
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* Session Stats */}
            {sessionStats.totalSessions > 0 && (
              <View 
                style={styles.statsSection}
                accessible
                accessibilityLabel="Your session statistics"
              >
                <Text style={styles.sectionTitle} accessibilityRole="header">
                  📊 Your Stats
                </Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{sessionStats.totalSessions}</Text>
                    <Text style={styles.statLabel}>Sessions</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{sessionStats.totalMinutes}m</Text>
                    <Text style={styles.statLabel}>Total Focus</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{sessionStats.longestSession}m</Text>
                    <Text style={styles.statLabel}>Longest Session</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{sessionStats.productiveStreak}🔥</Text>
                    <Text style={styles.statLabel}>Productive Streak</Text>
                  </View>
                </View>
              </View>
            )}

            {enableAmbientSounds && (
              <View style={styles.ambientSection}>
                <Text style={styles.sectionTitle} accessibilityRole="header">
                  🎧 Ambient Environment
                </Text>
                <View 
                  style={styles.ambientGrid}
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Choose ambient sound"
                >
                  {ambientOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.ambientOption,
                        selectedAmbient === option.id && styles.ambientOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedAmbient(option.id === selectedAmbient ? null : option.id);
                        if (hapticFeedback) {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                      accessibilityRole="radio"
                      accessibilityLabel={`${option.label}: ${option.description}`}
                      accessibilityState={{ selected: selectedAmbient === option.id }}
                      accessibilityHint={`Double tap to ${selectedAmbient === option.id ? 'deselect' : 'select'}`}
                    >
                      <Text style={styles.ambientIcon} aria-hidden>
                        {option.icon}
                      </Text>
                      <Text style={styles.ambientLabel}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle} accessibilityRole="header">
                💡 What is Body Doubling?
              </Text>
              <Text style={styles.infoText}>
                Body doubling is an ADHD-friendly productivity technique where having another
                person present (even virtually) helps maintain focus. The presence of others
                creates gentle accountability without pressure.
              </Text>
              {pomodoroMode && (
                <View style={styles.tipCard}>
                  <Text style={styles.tipText}>
                    🍅 Pomodoro mode is enabled: {workDuration}min work / {breakDuration}min break cycles
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        <View style={styles.controlsSection}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.startButton, isActive && styles.endButton]}
              onPress={isActive ? endSession : startSession}
              accessibilityRole="button"
              accessibilityLabel={isActive ? 'End session' : 'Start body doubling session'}
              accessibilityHint={
                isActive
                  ? `Ends your session after ${formatDuration(sessionSeconds)}`
                  : `Starts a new focus session${pomodoroMode ? ' with Pomodoro timer' : ''}`
              }
            >
              <Ionicons
                name={isActive ? 'stop' : 'people'}
                size={24}
                color="#FFFFFF"
                accessibilityHidden
              />
              <Text style={styles.buttonText}>
                {isActive ? 'End Session' : 'Start Session'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Check-in Modal */}
      {showCheckIn && (
        <View 
          style={styles.checkInOverlay}
          accessibilityViewIsModal
          accessible
          accessibilityLabel="Focus check-in"
        >
          <Animated.View 
            style={styles.checkInCard}
            entering={reduceMotion ? undefined : FadeIn.duration(200)}
          >
            <Text style={styles.checkInTitle} accessibilityRole="header">
              🕐 Check-in Time
            </Text>
            <Text style={styles.checkInSubtitle}>
              You've been focusing for {checkInInterval} minutes. How's it going?
            </Text>
            <View style={styles.checkInOptions}>
              <TouchableOpacity
                style={[styles.checkInOption, styles.checkInGood]}
                onPress={() => handleCheckIn('good')}
                accessibilityRole="button"
                accessibilityLabel="I'm doing great"
                accessibilityHint="Continue your session with positive feedback"
              >
                <Text style={{ fontSize: 24 }} importantForAccessibility="no">😊</Text>
                <Text style={styles.checkInOptionText}>Doing great!</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.checkInOption, styles.checkInStruggling]}
                onPress={() => handleCheckIn('struggling')}
                accessibilityRole="button"
                accessibilityLabel="I'm struggling a bit"
                accessibilityHint="Get encouragement and continue"
              >
                <Text style={{ fontSize: 24 }} importantForAccessibility="no">😅</Text>
                <Text style={styles.checkInOptionText}>Struggling a bit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.checkInOption, styles.checkInBreak]}
                onPress={() => handleCheckIn('break')}
                accessibilityRole="button"
                accessibilityLabel="I need a break"
                accessibilityHint="Acknowledge that you need rest"
              >
                <Text style={{ fontSize: 24 }} importantForAccessibility="no">🧘</Text>
                <Text style={styles.checkInOptionText}>Need a break</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

export default BodyDoublingSession;
