// Accessibility-Aware Animation Wrapper
// Respects user's reduceMotion preference for sensory-friendly experience
import React, { useEffect } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  FadeOut,
} from 'react-native-reanimated';
import { useSettingsStore } from '../../stores/settingsStore';
import { springConfigs, timingConfigs } from '../../utils/animations';

interface AnimatedViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  // Animation type
  animation?: 'fadeIn' | 'fadeInDown' | 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scale' | 'none';
  // Delay in ms
  delay?: number;
  // Duration override
  duration?: number;
  // Whether to play animation
  enabled?: boolean;
  // Callback when animation completes
  onAnimationComplete?: () => void;
}

/**
 * AnimatedView - A wrapper that respects the user's motion preferences
 * 
 * ADHD/Neurodivergent UX Benefits:
 * - Reduces sensory overload for users with motion sensitivity
 * - Provides consistent, predictable behavior
 * - Maintains visual hierarchy without requiring motion
 * - Allows users to focus on content rather than animations
 */
export const AnimatedView: React.FC<AnimatedViewProps> = ({
  children,
  style,
  animation = 'fadeInDown',
  delay = 0,
  duration = 300,
  enabled = true,
  onAnimationComplete,
}) => {
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);

  // If motion is reduced or disabled, render without animation
  if (reduceMotion || !enabled) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  // Select entering animation based on type
  const getEnteringAnimation = () => {
    switch (animation) {
      case 'fadeIn':
        return FadeIn.delay(delay).duration(duration);
      case 'fadeInDown':
        return FadeInDown.delay(delay).duration(duration).springify();
      case 'fadeInUp':
        return FadeInUp.delay(delay).duration(duration).springify();
      case 'fadeInLeft':
        return FadeInLeft.delay(delay).duration(duration).springify();
      case 'fadeInRight':
        return FadeInRight.delay(delay).duration(duration).springify();
      case 'scale':
        return FadeIn.delay(delay).duration(duration);
      case 'none':
        return undefined;
      default:
        return FadeInDown.delay(delay).duration(duration).springify();
    }
  };

  return (
    <Animated.View 
      style={style} 
      entering={getEnteringAnimation()}
    >
      {children}
    </Animated.View>
  );
};

/**
 * useReducedMotion - Hook to check if motion should be reduced
 */
export const useReducedMotion = () => {
  return useSettingsStore((state) => state.settings.reduceMotion);
};

/**
 * useAccessibleAnimation - Hook for creating accessible animations
 * Returns animation values that respect reduceMotion setting
 */
export const useAccessibleAnimation = () => {
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);
  
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const scale = useSharedValue(reduceMotion ? 1 : 0.95);
  const translateY = useSharedValue(reduceMotion ? 0 : 20);

  const enter = (delay = 0) => {
    if (reduceMotion) {
      // Instant appearance
      opacity.value = 1;
      scale.value = 1;
      translateY.value = 0;
    } else {
      // Animated entrance
      opacity.value = withDelay(delay, withTiming(1, timingConfigs.entrance));
      scale.value = withDelay(delay, withSpring(1, springConfigs.gentle));
      translateY.value = withDelay(delay, withSpring(0, springConfigs.gentle));
    }
  };

  const exit = () => {
    if (reduceMotion) {
      opacity.value = 0;
    } else {
      opacity.value = withTiming(0, timingConfigs.exit);
      scale.value = withTiming(0.95, timingConfigs.exit);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  return {
    animatedStyle,
    enter,
    exit,
    opacity,
    scale,
    translateY,
    reduceMotion,
  };
};

/**
 * useAccessiblePress - Hook for accessible press animations
 */
export const useAccessiblePress = () => {
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);
  const scale = useSharedValue(1);

  const onPressIn = () => {
    if (!reduceMotion) {
      scale.value = withSpring(0.96, springConfigs.snappy);
    }
  };

  const onPressOut = () => {
    if (!reduceMotion) {
      scale.value = withSpring(1, springConfigs.bouncy);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    animatedStyle,
    onPressIn,
    onPressOut,
    scale,
  };
};

/**
 * AccessiblePressable - A pressable view with accessible animations
 */
interface AccessiblePressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'checkbox' | 'radio' | 'tab';
}

export const AccessiblePressable: React.FC<AccessiblePressableProps> = ({
  children,
  style,
  onPress,
  onLongPress,
  disabled,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
}) => {
  const { animatedStyle, onPressIn, onPressOut } = useAccessiblePress();

  return (
    <Animated.View style={[style, animatedStyle]}>
      {/* Note: In real implementation, wrap with TouchableOpacity or Pressable */}
      {children}
    </Animated.View>
  );
};

export default AnimatedView;
