// AI Coach Component - ADHD-Friendly AI Companion
// Uses calming colors to reduce overstimulation while maintaining engagement
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, gradients, shadows, adhdPalette } from '../../theme/colors';
import { springConfigs } from '../../utils/animations';

interface AICoachProps {
  message: string;
  type?: 'greeting' | 'encouragement' | 'tip' | 'celebration' | 'focus';
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
  animated?: boolean;
}

const COACH_EXPRESSIONS = {
  greeting: '🧠',
  encouragement: '💪',
  tip: '💡',
  celebration: '🎉',
  focus: '🎯',
};

// ADHD-friendly color combinations - calming with gentle energy
const COACH_COLORS = {
  greeting: [adhdPalette.shadowGreen, colors.primary[500]] as const,
  encouragement: [adhdPalette.berylGreen, colors.secondary[500]] as const,
  tip: [colors.warning[300], colors.warning[400]] as const,
  celebration: [adhdPalette.berylGreen, colors.success[500]] as const,
  focus: [adhdPalette.shadowGreen, colors.primary[600]] as const,
};

export const AICoach: React.FC<AICoachProps> = ({
  message,
  type = 'greeting',
  actionLabel,
  onAction,
  onDismiss,
  compact = false,
  animated = true,
}) => {
  const scale = useSharedValue(animated ? 0.9 : 1);
  const opacity = useSharedValue(animated ? 0 : 1);
  const translateY = useSharedValue(animated ? 20 : 0);
  const bobY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.2);

  useEffect(() => {
    if (animated) {
      // Gentle entrance animation
      scale.value = withDelay(100, withSpring(1, springConfigs.gentle));
      opacity.value = withDelay(50, withTiming(1, { duration: 400 }));
      translateY.value = withDelay(100, withSpring(0, springConfigs.gentle));
    }

    // Subtle breathing animation (calming)
    bobY.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Gentle glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 2500 }),
        withTiming(0.15, { duration: 2500 })
      ),
      -1,
      true
    );
  }, [animated]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleAction = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withSpring(0.97, springConfigs.snappy),
      withSpring(1, springConfigs.gentle)
    );
    onAction?.();
  };

  const handleDismiss = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    opacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0.95, { duration: 200 });
    setTimeout(() => onDismiss?.(), 200);
  };

  if (compact) {
    return (
      <Animated.View style={[styles.compactContainer, containerStyle]}>
        <LinearGradient
          colors={[...COACH_COLORS[type]] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.compactGradient}
        >
          <Animated.Text style={[styles.compactEmoji, avatarStyle]}>
            {COACH_EXPRESSIONS[type]}
          </Animated.Text>
          <Text style={styles.compactMessage} numberOfLines={2}>
            {message}
          </Text>
          {onDismiss && (
            <TouchableOpacity onPress={handleDismiss} style={styles.compactDismiss}>
              <Text style={styles.dismissText}>×</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, shadows.lg, containerStyle]}>
      {/* Subtle glow effect */}
      <Animated.View style={[styles.glow, glowStyle]}>
        <LinearGradient
          colors={[`${COACH_COLORS[type][0]}40`, 'transparent']}
          style={styles.glowInner}
        />
      </Animated.View>

      <LinearGradient
        colors={[...COACH_COLORS[type]] as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Animated.View style={[styles.avatarContainer, avatarStyle]}>
            <View style={styles.avatarGlow} />
            <Text style={styles.emoji}>{COACH_EXPRESSIONS[type]}</Text>
          </Animated.View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.coachTitle}>BrainXP Coach</Text>
            <Text style={styles.coachSubtitle}>
              {type === 'greeting' && 'Your AI companion'}
              {type === 'encouragement' && 'Cheering you on'}
              {type === 'tip' && 'Pro tip for you'}
              {type === 'celebration' && 'Celebrating with you'}
              {type === 'focus' && 'Focus mode'}
            </Text>
          </View>

          {onDismiss && (
            <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
              <Text style={styles.dismissText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.message}>{message}</Text>
        </View>

        {/* Action button */}
        {actionLabel && onAction && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAction}
            activeOpacity={0.8}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  glow: {
    position: 'absolute',
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    borderRadius: 35,
    overflow: 'hidden',
  },
  glowInner: {
    flex: 1,
    borderRadius: 35,
  },
  gradient: {
    padding: 18,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    top: -3,
    left: -3,
  },
  emoji: {
    fontSize: 36,
  },
  titleContainer: {
    flex: 1,
  },
  coachTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 1,
  },
  coachSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -1,
  },
  messageContainer: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  message: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    gap: 8,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionArrow: {
    fontSize: 16,
    color: '#FFFFFF',
  },

  // Compact styles
  compactContainer: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  compactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  compactEmoji: {
    fontSize: 24,
  },
  compactMessage: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 18,
  },
  compactDismiss: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AICoach;
