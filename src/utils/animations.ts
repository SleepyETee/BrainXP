// BrainXP Premium Animation System
// Using react-native-reanimated for smooth 60fps animations

import {
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Spring configurations for different feels
export const springConfigs = {
  // Snappy - quick, responsive feedback
  snappy: {
    damping: 15,
    stiffness: 400,
    mass: 1,
  },
  // Bouncy - playful, fun interactions
  bouncy: {
    damping: 8,
    stiffness: 200,
    mass: 1,
  },
  // Gentle - smooth, subtle movements
  gentle: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },
  // Wobbly - exaggerated, attention-grabbing
  wobbly: {
    damping: 4,
    stiffness: 180,
    mass: 0.8,
  },
  // Slow - dramatic, deliberate
  slow: {
    damping: 25,
    stiffness: 80,
    mass: 1.2,
  },
  // Default
  default: {
    damping: 12,
    stiffness: 180,
    mass: 1,
  },
};

// Timing configurations
export const timingConfigs = {
  fast: {
    duration: 150,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  normal: {
    duration: 300,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  slow: {
    duration: 500,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  entrance: {
    duration: 400,
    easing: Easing.bezier(0, 0.55, 0.45, 1),
  },
  exit: {
    duration: 250,
    easing: Easing.bezier(0.55, 0, 1, 0.45),
  },
  bounce: {
    duration: 600,
    easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
  },
};

// Animation presets for common interactions
export const animations = {
  // Press feedback
  pressIn: (scale: SharedValue<number>) => {
    'worklet';
    scale.value = withSpring(0.95, springConfigs.snappy);
  },
  pressOut: (scale: SharedValue<number>) => {
    'worklet';
    scale.value = withSpring(1, springConfigs.bouncy);
  },

  // Entrance animations
  fadeIn: (opacity: SharedValue<number>, delay = 0) => {
    'worklet';
    opacity.value = withDelay(delay, withTiming(1, timingConfigs.entrance));
  },
  fadeOut: (opacity: SharedValue<number>) => {
    'worklet';
    opacity.value = withTiming(0, timingConfigs.exit);
  },

  slideInFromBottom: (
    translateY: SharedValue<number>,
    opacity: SharedValue<number>,
    delay = 0
  ) => {
    'worklet';
    translateY.value = withDelay(
      delay,
      withSpring(0, springConfigs.gentle)
    );
    opacity.value = withDelay(delay, withTiming(1, timingConfigs.entrance));
  },

  slideInFromRight: (
    translateX: SharedValue<number>,
    opacity: SharedValue<number>,
    delay = 0
  ) => {
    'worklet';
    translateX.value = withDelay(
      delay,
      withSpring(0, springConfigs.gentle)
    );
    opacity.value = withDelay(delay, withTiming(1, timingConfigs.entrance));
  },

  // Scale animations
  scaleIn: (scale: SharedValue<number>, delay = 0) => {
    'worklet';
    scale.value = withDelay(delay, withSpring(1, springConfigs.bouncy));
  },
  scaleOut: (scale: SharedValue<number>) => {
    'worklet';
    scale.value = withTiming(0, timingConfigs.exit);
  },

  // Pulse animation
  pulse: (scale: SharedValue<number>) => {
    'worklet';
    scale.value = withSequence(
      withTiming(1.1, { duration: 200 }),
      withSpring(1, springConfigs.bouncy)
    );
  },

  // Shake animation (for errors/attention)
  shake: (translateX: SharedValue<number>) => {
    'worklet';
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withSpring(0, springConfigs.snappy)
    );
  },

  // Bounce animation (for celebrations)
  bounce: (translateY: SharedValue<number>) => {
    'worklet';
    translateY.value = withSequence(
      withTiming(-20, { duration: 200 }),
      withSpring(0, springConfigs.wobbly)
    );
  },

  // Wiggle animation (for attention)
  wiggle: (rotation: SharedValue<number>) => {
    'worklet';
    rotation.value = withSequence(
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 100 }),
      withTiming(-5, { duration: 100 }),
      withTiming(5, { duration: 100 }),
      withSpring(0, springConfigs.snappy)
    );
  },

  // Floating animation (continuous)
  float: (translateY: SharedValue<number>) => {
    'worklet';
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  },

  // Glow pulse (continuous)
  glowPulse: (opacity: SharedValue<number>) => {
    'worklet';
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 1500 }),
        withTiming(0.8, { duration: 1500 })
      ),
      -1,
      true
    );
  },

  // Progress fill
  fillProgress: (progress: SharedValue<number>, toValue: number, duration = 1000) => {
    'worklet';
    progress.value = withTiming(toValue, { duration, easing: Easing.out(Easing.cubic) });
  },

  // Counter animation (for numbers)
  countTo: (
    value: SharedValue<number>,
    toValue: number,
    duration = 1000
  ) => {
    'worklet';
    value.value = withTiming(toValue, { duration, easing: Easing.out(Easing.cubic) });
  },

  // Ripple effect values
  ripple: (scale: SharedValue<number>, opacity: SharedValue<number>) => {
    'worklet';
    scale.value = 0;
    opacity.value = 0.5;
    scale.value = withTiming(4, { duration: 600 });
    opacity.value = withTiming(0, { duration: 600 });
  },
};

// Custom hooks for common animation patterns
export const useScaleOnPress = () => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    'worklet';
    scale.value = withSpring(0.95, springConfigs.snappy);
  };

  const onPressOut = () => {
    'worklet';
    scale.value = withSpring(1, springConfigs.bouncy);
  };

  return { animatedStyle, onPressIn, onPressOut, scale };
};

export const useEntrance = (delay = 0) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const enter = () => {
    opacity.value = withDelay(delay, withTiming(1, timingConfigs.entrance));
    translateY.value = withDelay(delay, withSpring(0, springConfigs.gentle));
  };

  return { animatedStyle, enter, opacity, translateY };
};

export const useShimmer = () => {
  const shimmerTranslate = useSharedValue(-SCREEN_WIDTH);

  const startShimmer = () => {
    shimmerTranslate.value = withRepeat(
      withTiming(SCREEN_WIDTH, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  };

  const stopShimmer = () => {
    cancelAnimation(shimmerTranslate);
  };

  return { shimmerTranslate, startShimmer, stopShimmer };
};

// Interpolation helpers
export const interpolations = {
  // For parallax scrolling
  parallax: (scrollY: SharedValue<number>, offset: number, speed = 0.5) => {
    'worklet';
    return interpolate(
      scrollY.value,
      [offset - SCREEN_HEIGHT, offset, offset + SCREEN_HEIGHT],
      [SCREEN_HEIGHT * speed, 0, -SCREEN_HEIGHT * speed],
      Extrapolation.CLAMP
    );
  },

  // For fade on scroll
  fadeOnScroll: (scrollY: SharedValue<number>, threshold: number) => {
    'worklet';
    return interpolate(
      scrollY.value,
      [0, threshold],
      [1, 0],
      Extrapolation.CLAMP
    );
  },

  // For scale on scroll
  scaleOnScroll: (scrollY: SharedValue<number>, threshold: number) => {
    'worklet';
    return interpolate(
      scrollY.value,
      [0, threshold],
      [1, 0.8],
      Extrapolation.CLAMP
    );
  },
};

// Stagger animation helper
export const staggerDelay = (index: number, baseDelay = 50) => index * baseDelay;

// XP counter animation
export const createXPCounter = (from: number, to: number, duration = 1000) => {
  const value = useSharedValue(from);

  const start = () => {
    value.value = from;
    value.value = withTiming(to, { duration, easing: Easing.out(Easing.cubic) });
  };

  const displayValue = useDerivedValue(() => Math.round(value.value));

  return { value, displayValue, start };
};

// Celebration burst animation helper
export const createBurst = (count = 12) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    angle: (360 / count) * i,
    delay: Math.random() * 100,
    distance: 80 + Math.random() * 40,
    scale: 0.5 + Math.random() * 0.5,
  }));
  return particles;
};

export {
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  cancelAnimation,
  runOnJS,
};
