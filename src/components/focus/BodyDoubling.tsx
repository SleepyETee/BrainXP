// filepath: /Users/sleepyet/BrainXP/src/components/focus/BodyDoubling.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, borderRadius } from '../../theme';

type BodyDoublingMode = 'virtual' | 'ambient' | 'accountability';

interface VirtualPartner {
  id: string;
  name: string;
  avatar: string;
  status: 'focusing' | 'break' | 'offline';
  task?: string;
}

interface BodyDoublingProps {
  onStartSession?: (mode: BodyDoublingMode) => void;
  onEndSession?: () => void;
  currentTask?: string;
}

/**
 * Body Doubling Component
 * 
 * Provides virtual co-working presence for ADHD users who benefit from
 * having someone "present" while working. Research shows body doubling
 * helps with focus, accountability, and task initiation.
 */
export const BodyDoubling: React.FC<BodyDoublingProps> = ({
  onStartSession,
  onEndSession,
  currentTask,
}) => {
  const theme = useTheme();
  const [activeMode, setActiveMode] = useState<BodyDoublingMode | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [virtualPartners, setVirtualPartners] = useState<VirtualPartner[]>([]);
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Simulated virtual partners for demo
  useEffect(() => {
    if (activeMode === 'virtual') {
      setVirtualPartners([
        { id: '1', name: 'Alex', avatar: '👤', status: 'focusing', task: 'Writing report' },
        { id: '2', name: 'Jordan', avatar: '👤', status: 'focusing', task: 'Coding' },
        { id: '3', name: 'Sam', avatar: '👤', status: 'break' },
      ]);
    }
  }, [activeMode]);

  // Session timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isSessionActive) {
      interval = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  // Pulse animation for active presence indicator
  useEffect(() => {
    if (isSessionActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isSessionActive, pulseAnim]);

  const startSession = useCallback((mode: BodyDoublingMode) => {
    setActiveMode(mode);
    setIsSessionActive(true);
    setSessionDuration(0);
    onStartSession?.(mode);
    AccessibilityInfo.announceForAccessibility(`Body doubling session started in ${mode} mode`);
  }, [onStartSession]);

  const endSession = useCallback(() => {
    setIsSessionActive(false);
    setActiveMode(null);
    setVirtualPartners([]);
    onEndSession?.();
    AccessibilityInfo.announceForAccessibility('Body doubling session ended');
  }, [onEndSession]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const modes: { mode: BodyDoublingMode; icon: keyof typeof Ionicons.glyphMap; title: string; description: string }[] = [
    {
      mode: 'virtual',
      icon: 'people-outline',
      title: 'Virtual Co-Working',
      description: 'Work alongside virtual partners in real-time',
    },
    {
      mode: 'ambient',
      icon: 'cafe-outline',
      title: 'Ambient Presence',
      description: 'Subtle background presence sounds and visuals',
    },
    {
      mode: 'accountability',
      icon: 'checkmark-circle-outline',
      title: 'Accountability Partner',
      description: 'Share progress updates with a buddy',
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.primary,
    },
    header: {
      padding: spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text.primary,
      marginBottom: spacing[2],
    },
    subtitle: {
      fontSize: 14,
      color: theme.text.secondary,
      lineHeight: 20,
    },
    modeSelector: {
      padding: spacing[4],
    },
    modeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing[4],
      backgroundColor: theme.background.card,
      borderRadius: borderRadius.lg,
      marginBottom: spacing[3],
      borderWidth: 2,
      borderColor: 'transparent',
    },
    modeCardActive: {
      borderColor: theme.palette.primary[500],
      backgroundColor: theme.palette.primary[50],
    },
    modeIcon: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.full,
      backgroundColor: theme.palette.primary[100],
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing[3],
    },
    modeContent: {
      flex: 1,
    },
    modeTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: spacing[1],
    },
    modeDescription: {
      fontSize: 13,
      color: theme.text.secondary,
    },
    sessionContainer: {
      flex: 1,
      padding: spacing[4],
    },
    sessionHeader: {
      alignItems: 'center',
      marginBottom: spacing[6],
    },
    presenceIndicator: {
      width: 80,
      height: 80,
      borderRadius: borderRadius.full,
      backgroundColor: theme.palette.success[500],
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing[4],
    },
    sessionStatus: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: spacing[2],
    },
    sessionDuration: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.palette.primary[600],
    },
    currentTaskContainer: {
      backgroundColor: theme.background.card,
      padding: spacing[4],
      borderRadius: borderRadius.md,
      marginBottom: spacing[4],
    },
    currentTaskLabel: {
      fontSize: 12,
      color: theme.text.muted,
      marginBottom: spacing[1],
    },
    currentTaskText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text.primary,
    },
    partnersSection: {
      marginBottom: spacing[4],
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: spacing[3],
    },
    partnerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background.card,
      padding: spacing[3],
      borderRadius: borderRadius.md,
      marginBottom: spacing[2],
    },
    partnerAvatar: {
      fontSize: 24,
      marginRight: spacing[3],
    },
    partnerInfo: {
      flex: 1,
    },
    partnerName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text.primary,
    },
    partnerTask: {
      fontSize: 12,
      color: theme.text.secondary,
    },
    statusBadge: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderRadius: borderRadius.full,
    },
    statusFocusing: {
      backgroundColor: theme.palette.success[100],
    },
    statusBreak: {
      backgroundColor: theme.palette.warning[100],
    },
    statusText: {
      fontSize: 11,
      fontWeight: '500',
    },
    endButton: {
      backgroundColor: theme.palette.danger[500],
      padding: spacing[4],
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: 'auto',
    },
    endButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    tipsContainer: {
      backgroundColor: theme.palette.accent[50],
      padding: spacing[4],
      borderRadius: borderRadius.md,
      margin: spacing[4],
    },
    tipsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.palette.accent[700],
      marginBottom: spacing[2],
    },
    tipText: {
      fontSize: 13,
      color: theme.palette.accent[600],
      lineHeight: 20,
    },
    findPartnerSection: {
      padding: spacing[4],
      backgroundColor: theme.background.card,
      margin: spacing[4],
      borderRadius: borderRadius.lg,
    },
    findTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: spacing[2],
    },
    findDescription: {
      fontSize: 13,
      color: theme.text.secondary,
      marginBottom: spacing[3],
    },
    findButton: {
      backgroundColor: theme.palette.primary[500],
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[4],
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    findButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
  });

  if (isSessionActive) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.sessionContainer}>
          <View style={styles.sessionHeader}>
            <Animated.View
              style={[styles.presenceIndicator, { transform: [{ scale: pulseAnim }] }]}
              accessibilityLabel="Session active indicator"
            >
              <Ionicons name="body-outline" size={36} color="#FFFFFF" />
            </Animated.View>
            <Text style={styles.sessionStatus}>You're in focus mode</Text>
            <Text style={styles.sessionDuration}>{formatDuration(sessionDuration)}</Text>
          </View>

          {currentTask && (
            <View style={styles.currentTaskContainer}>
              <Text style={styles.currentTaskLabel}>Currently working on</Text>
              <Text style={styles.currentTaskText}>{currentTask}</Text>
            </View>
          )}

          {activeMode === 'virtual' && virtualPartners.length > 0 && (
            <View style={styles.partnersSection}>
              <Text style={styles.sectionTitle}>Co-Working With</Text>
              {virtualPartners.map((partner) => (
                <View key={partner.id} style={styles.partnerCard}>
                  <Text style={styles.partnerAvatar}>{partner.avatar}</Text>
                  <View style={styles.partnerInfo}>
                    <Text style={styles.partnerName}>{partner.name}</Text>
                    {partner.task && <Text style={styles.partnerTask}>{partner.task}</Text>}
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      partner.status === 'focusing' ? styles.statusFocusing : styles.statusBreak,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            partner.status === 'focusing'
                              ? theme.palette.success[700]
                              : theme.palette.warning[700],
                        },
                      ]}
                    >
                      {partner.status === 'focusing' ? 'Focusing' : 'On Break'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.endButton}
            onPress={endSession}
            accessibilityRole="button"
            accessibilityLabel="End body doubling session"
          >
            <Text style={styles.endButtonText}>End Session</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Body Doubling</Text>
        <Text style={styles.subtitle}>
          Work alongside others to boost focus and accountability. Body doubling is proven to help
          with task initiation and sustained attention.
        </Text>
      </View>

      <View style={styles.modeSelector}>
        {modes.map((item) => (
          <TouchableOpacity
            key={item.mode}
            style={[styles.modeCard, activeMode === item.mode && styles.modeCardActive]}
            onPress={() => startSession(item.mode)}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}: ${item.description}`}
          >
            <View style={styles.modeIcon}>
              <Ionicons name={item.icon} size={24} color={theme.palette.primary[600]} />
            </View>
            <View style={styles.modeContent}>
              <Text style={styles.modeTitle}>{item.title}</Text>
              <Text style={styles.modeDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.text.muted} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Tips for Effective Body Doubling</Text>
        <Text style={styles.tipText}>
          • Set a clear intention for what you'll work on{'\n'}
          • Keep distractions minimal during the session{'\n'}
          • Take breaks together to maintain momentum{'\n'}
          • Celebrate small wins with your co-working partners
        </Text>
      </View>

      <View style={styles.findPartnerSection}>
        <Text style={styles.findTitle}>Find a Real Partner</Text>
        <Text style={styles.findDescription}>
          Connect with other BrainXP users for live body doubling sessions
        </Text>
        <TouchableOpacity
          style={styles.findButton}
          accessibilityRole="button"
          accessibilityLabel="Browse available partners"
        >
          <Text style={styles.findButtonText}>Browse Partners</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default BodyDoubling;
