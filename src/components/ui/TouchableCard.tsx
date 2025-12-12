// filepath: /Users/sleepyet/BrainXP/src/components/ui/TouchableCard.tsx
import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, shadows } from '../../theme/colors';
import { TOUCH_TARGETS } from '../../utils/uxHelpers';

interface TouchableCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  // Appearance
  variant?: 'elevated' | 'outlined' | 'filled' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl';
  // Feedback
  haptic?: boolean;
  hapticStyle?: 'light' | 'medium' | 'heavy' | 'selection';
  scaleOnPress?: boolean;
  highlightOnPress?: boolean;
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'menuitem' | 'none';
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const springConfig = {
  damping: 15,
  stiffness: 400,
  mass: 0.8,
};

export const TouchableCard: React.FC<TouchableCardProps> = ({
  children,
  onPress,
  onLongPress,
  disabled = false,
  style,
  variant = 'elevated',
  padding = 'md',
  borderRadius = 'lg',
  haptic = true,
  hapticStyle = 'light',
  scaleOnPress = true,
  highlightOnPress = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  testID,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const elevation = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (scaleOnPress) {
      scale.value = withSpring(0.97, springConfig);
    }
    if (highlightOnPress) {
      opacity.value = withTiming(0.85, { duration: 100 });
    }
    elevation.value = withTiming(0.5, { duration: 100 });
  }, [scaleOnPress, highlightOnPress]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, springConfig);
    opacity.value = withTiming(1, { duration: 150 });
    elevation.value = withTiming(1, { duration: 150 });
  }, []);

  const handlePress = useCallback(async () => {
    if (haptic && !disabled) {
      const hapticMap = {
        light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
        heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
        selection: () => Haptics.selectionAsync(),
      };
      await hapticMap[hapticStyle]();
    }
    onPress?.();
  }, [haptic, hapticStyle, disabled, onPress]);

  const handleLongPress = useCallback(async () => {
    if (haptic && !disabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onLongPress?.();
  }, [haptic, disabled, onLongPress]);

  const animatedStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(elevation.value, [0.5, 1], [0.05, 0.1]);
    const shadowRadius = interpolate(elevation.value, [0.5, 1], [4, 8]);
    
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
      ...(Platform.OS === 'ios' && variant === 'elevated' ? {
        shadowOpacity,
        shadowRadius,
      } : {}),
    };
  });

  const paddingMap = {
    none: 0,
    sm: 12,
    md: 16,
    lg: 20,
  };

  const borderRadiusMap = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  };

  const variantStyles: Record<string, ViewStyle> = {
    elevated: {
      backgroundColor: '#FFFFFF',
      ...shadows.md,
    },
    outlined: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: colors.gray[200],
    },
    filled: {
      backgroundColor: colors.gray[50],
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  };

  return (
    <AnimatedPressable
      onPress={onPress ? handlePress : undefined}
      onLongPress={onLongPress ? handleLongPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || (!onPress && !onLongPress)}
      style={[
        styles.base,
        variantStyles[variant],
        {
          padding: paddingMap[padding],
          borderRadius: borderRadiusMap[borderRadius],
          minHeight: TOUCH_TARGETS.minimum,
        },
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={onPress ? accessibilityRole : 'none'}
      accessibilityState={{ disabled }}
      testID={testID}
    >
      {children}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default TouchableCard;
