// Premium Glass-morphism Card Component
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { colors, shadows } from '../../theme/colors';
import { springConfigs, timingConfigs } from '../../utils/animations';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  intensity?: 'light' | 'medium' | 'strong';
  tint?: 'light' | 'dark' | 'default';
  animated?: boolean;
  delay?: number;
  borderRadius?: number;
  padding?: number;
  borderColor?: string;
  backgroundColor?: string;
  // Accessibility
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'none';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  onPress,
  intensity = 'medium',
  tint = 'light',
  animated = true,
  delay = 0,
  borderRadius = 20,
  padding = 16,
  borderColor,
  backgroundColor,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = onPress ? 'button' : 'none',
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(animated ? 0 : 1);
  const translateY = useSharedValue(animated ? 20 : 0);

  useEffect(() => {
    if (animated) {
      opacity.value = withDelay(delay, withTiming(1, timingConfigs.entrance));
      translateY.value = withDelay(delay, withSpring(0, springConfigs.gentle));
    }
  }, [animated, delay]);

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, springConfigs.snappy);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, springConfigs.bouncy);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const getIntensityValue = () => {
    switch (intensity) {
      case 'light': return 20;
      case 'medium': return 40;
      case 'strong': return 80;
      default: return 40;
    }
  };

  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    switch (tint) {
      case 'light': return 'rgba(255, 255, 255, 0.85)';
      case 'dark': return 'rgba(15, 23, 42, 0.8)';
      default: return 'rgba(255, 255, 255, 0.75)';
    }
  };

  const getBorderColor = () => {
    if (borderColor) return borderColor;
    switch (tint) {
      case 'light': return 'rgba(255, 255, 255, 0.5)';
      case 'dark': return 'rgba(255, 255, 255, 0.1)';
      default: return 'rgba(255, 255, 255, 0.3)';
    }
  };

  const content = (
    <View
      style={[
        styles.inner,
        {
          borderRadius,
          padding,
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
      ]}
    >
      <View style={[styles.shine, { borderRadius }]} />
      {children}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole}
        style={[styles.container, { borderRadius }, shadows.lg, animatedStyle, style]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View
      style={[styles.container, { borderRadius }, shadows.md, animatedStyle, style]}
    >
      {content}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  inner: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});

export default GlassCard;
