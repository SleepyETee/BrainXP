// Premium XP Popup - ADHD-Friendly Celebration
// Uses calming colors while maintaining reward dopamine boost
// Respects reduceMotion for sensory-sensitive users
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, gradients, shadows, adhdPalette } from '../../theme/colors';
import { springConfigs } from '../../utils/animations';
import { useSettingsStore } from '../../stores/settingsStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface XPPopupProps {
  amount: number;
  source: string;
  visible: boolean;
  onHide: () => void;
  variant?: 'default' | 'bonus' | 'streak' | 'achievement';
}

// ADHD-friendly: calming greens for regular XP, warmer for special
const VARIANT_CONFIG = {
  default: {
    gradient: [adhdPalette.shadowGreen, colors.primary[600]] as const,
    icon: '⭐',
    label: 'XP Earned',
  },
  bonus: {
    gradient: [colors.warning[400], colors.warning[500]] as const,
    icon: '🎁',
    label: 'Bonus XP',
  },
  streak: {
    gradient: [adhdPalette.zinnwaldite, colors.accent[500]] as const,
    icon: '🔥',
    label: 'Streak Bonus',
  },
  achievement: {
    gradient: [adhdPalette.berylGreen, colors.success[500]] as const,
    icon: '🏆',
    label: 'Achievement',
  },
};

export const XPPopup: React.FC<XPPopupProps> = ({
  amount,
  source,
  visible,
  onHide,
  variant = 'default',
}) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const iconScale = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const shimmer = useSharedValue(0);

  // Accessibility settings
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);
  const hapticFeedback = useSettingsStore((state) => state.settings.hapticFeedback);
  const showXPPopups = useSettingsStore((state) => state.settings.showXPPopups);

  const config = VARIANT_CONFIG[variant];

  useEffect(() => {
    // Don't show if XP popups are disabled
    if (!showXPPopups && visible) {
      onHide();
      return;
    }

    if (visible) {
      // Gentle haptic - not overwhelming (respects settings)
      if (hapticFeedback) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Reset values
      translateY.value = reduceMotion ? 0 : -100;
      opacity.value = 0;
      scale.value = reduceMotion ? 1 : 0.8;
      iconScale.value = reduceMotion ? 1 : 0;
      iconRotation.value = 0;

      if (reduceMotion) {
        // Simple fade in/out for reduced motion
        opacity.value = withTiming(1, { duration: 150 });
      } else {
        // Smooth entrance (not jarring)
        translateY.value = withSpring(0, springConfigs.gentle);
        opacity.value = withTiming(1, { duration: 250 });
        scale.value = withSpring(1, springConfigs.gentle);

        // Icon animation (subtle)
        iconScale.value = withDelay(150, withSpring(1, springConfigs.bouncy));
        iconRotation.value = withDelay(
          150,
          withSequence(
            withTiming(-10, { duration: 80 }),
            withTiming(10, { duration: 80 }),
            withTiming(-5, { duration: 80 }),
            withSpring(0, springConfigs.gentle)
          )
        );

        // Gentle shimmer
        shimmer.value = withRepeat(
          withTiming(1, { duration: 2000, easing: Easing.linear }),
          2,
          false
        );
      }

      // Auto-hide after display time
      const hideTimeout = setTimeout(() => {
        if (reduceMotion) {
          opacity.value = withTiming(0, { duration: 150 });
        } else {
          translateY.value = withTiming(-100, { duration: 250 });
          opacity.value = withTiming(0, { duration: 250 });
          scale.value = withTiming(0.9, { duration: 250 });
        }

        setTimeout(() => {
          runOnJS(onHide)();
        }, reduceMotion ? 150 : 250);
      }, 2500);

      return () => clearTimeout(hideTimeout);
    }
  }, [visible, amount, reduceMotion, hapticFeedback, showXPPopups]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmer.value,
      [0, 1],
      [-SCREEN_WIDTH, SCREEN_WIDTH]
    );
    return {
      transform: [{ translateX }],
    };
  });

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LinearGradient
        colors={[...config.gradient] as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {/* Shimmer overlay */}
        <Animated.View style={[styles.shimmer, shimmerStyle]}>
          <LinearGradient
            colors={[
              'rgba(255,255,255,0)',
              'rgba(255,255,255,0.25)',
              'rgba(255,255,255,0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Icon */}
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <Text style={styles.icon}>{config.icon}</Text>
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.label}>{config.label}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>+{amount}</Text>
            <Text style={styles.xpLabel}>XP</Text>
          </View>
          <Text style={styles.source}>{source}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 10000,
    ...shadows.xl,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  xpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  source: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
});

export default XPPopup;
