// Premium Gradient Card Component with Glass-morphism
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolateColor,
  useDerivedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, shadows, glass } from '../../theme/colors';
import { springConfigs, timingConfigs } from '../../utils/animations';

interface GradientCardProps {
  children: React.ReactNode;
  gradient?: keyof typeof gradients;
  style?: ViewStyle;
  onPress?: () => void;
  animated?: boolean;
  delay?: number;
  glassEffect?: boolean;
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: number;
  padding?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GradientCard: React.FC<GradientCardProps> = ({
  children,
  gradient = 'primary',
  style,
  onPress,
  animated = true,
  delay = 0,
  glassEffect = false,
  elevation = 'lg',
  borderRadius = 24,
  padding = 20,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(animated ? 0 : 1);
  const translateY = useSharedValue(animated ? 30 : 0);

  useEffect(() => {
    if (animated) {
      opacity.value = withDelay(delay, withTiming(1, timingConfigs.entrance));
      translateY.value = withDelay(delay, withSpring(0, springConfigs.gentle));
    }
  }, [animated, delay]);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springConfigs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfigs.bouncy);
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const shadowStyle = elevation !== 'none' ? shadows[elevation] : {};

  const gradientColors = gradients[gradient as keyof typeof gradients];

  const content = (
    <LinearGradient
      colors={[...gradientColors] as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.gradient,
        { borderRadius, padding },
        glassEffect && styles.glassOverlay,
      ]}
    >
      {glassEffect && (
        <View style={[styles.glassShine, { borderRadius }]} />
      )}
      {children}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.container, shadowStyle, { borderRadius }, animatedContainerStyle, style]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View
      style={[styles.container, shadowStyle, { borderRadius }, animatedContainerStyle, style]}
    >
      {content}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gradient: {
    overflow: 'hidden',
  },
  glassOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default GradientCard;
