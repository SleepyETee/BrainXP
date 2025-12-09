// Premium Animated Floating Action Button with Micro-interactions
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
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
import { colors, gradients, shadows } from '../../theme/colors';
import { springConfigs } from '../../utils/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FABOption {
  id: string;
  icon: string;
  label: string;
  gradient: readonly [string, string, ...string[]];
  onPress: () => void;
}

interface FABProps {
  options?: FABOption[];
  onPress?: () => void;
  mainIcon?: string;
  position?: { bottom: number; right: number };
  showOptions?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DEFAULT_OPTIONS: FABOption[] = [
  {
    id: 'task',
    icon: '✅',
    label: 'New Task',
    gradient: ['#8B5CF6', '#A78BFA'],
    onPress: () => {},
  },
  {
    id: 'habit',
    icon: '🔄',
    label: 'New Habit',
    gradient: ['#10B981', '#34D399'],
    onPress: () => {},
  },
  {
    id: 'capture',
    icon: '💭',
    label: 'Quick Capture',
    gradient: ['#06B6D4', '#22D3EE'],
    onPress: () => {},
  },
  {
    id: 'focus',
    icon: '🎯',
    label: 'Focus',
    gradient: ['#F59E0B', '#FBBF24'],
    onPress: () => {},
  },
];

export const FAB: React.FC<FABProps> = ({
  options = DEFAULT_OPTIONS,
  onPress,
  mainIcon = '+',
  position = { bottom: 100, right: 20 },
  showOptions: controlledShowOptions,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const showOptions = controlledShowOptions !== undefined ? controlledShowOptions : options.length > 0;

  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const optionsOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  // Continuous subtle animations
  useEffect(() => {
    if (!isOpen) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 2000 }),
          withTiming(1, { duration: 2000 })
        ),
        -1,
        true
      );

      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1500 }),
          withTiming(0.2, { duration: 1500 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1);
      glowOpacity.value = withTiming(0);
    }
  }, [isOpen]);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (showOptions) {
      setIsOpen(!isOpen);
      rotation.value = withSpring(isOpen ? 0 : 45, springConfigs.bouncy);
      optionsOpacity.value = withTiming(isOpen ? 0 : 1, { duration: 200 });
      backdropOpacity.value = withTiming(isOpen ? 0 : 1, { duration: 200 });
    } else {
      // Bounce animation
      scale.value = withSequence(
        withSpring(0.9, springConfigs.snappy),
        withSpring(1.1, springConfigs.bouncy),
        withSpring(1, springConfigs.gentle)
      );
      onPress?.();
    }
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.9, springConfigs.snappy);
  };

  const handlePressOut = () => {
    if (!showOptions) {
      scale.value = withSpring(1, springConfigs.bouncy);
    }
  };

  const handleOptionPress = async (option: FABOption) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Close menu
    setIsOpen(false);
    rotation.value = withSpring(0, springConfigs.bouncy);
    optionsOpacity.value = withTiming(0, { duration: 150 });
    backdropOpacity.value = withTiming(0, { duration: 150 });

    // Execute callback
    setTimeout(() => option.onPress(), 150);
  };

  const handleBackdropPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(false);
    rotation.value = withSpring(0, springConfigs.bouncy);
    optionsOpacity.value = withTiming(0, { duration: 150 });
    backdropOpacity.value = withTiming(0, { duration: 150 });
  };

  // Animated styles
  const mainButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pulseScale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: pulseScale.value * 1.3 }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: backdropOpacity.value > 0 ? 'auto' : 'none',
  }));

  const optionsContainerStyle = useAnimatedStyle(() => ({
    opacity: optionsOpacity.value,
    pointerEvents: optionsOpacity.value > 0 ? 'auto' : 'none',
  }));

  return (
    <>
      {/* Backdrop */}
      {showOptions && (
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress} />
        </Animated.View>
      )}

      {/* Options */}
      {showOptions && (
        <Animated.View
          style={[
            styles.optionsContainer,
            { bottom: position.bottom + 70, right: position.right },
            optionsContainerStyle,
          ]}
        >
          {options.map((option, index) => (
            <OptionButton
              key={option.id}
              option={option}
              index={index}
              onPress={() => handleOptionPress(option)}
              isOpen={isOpen}
            />
          ))}
        </Animated.View>
      )}

      {/* Main FAB */}
      <View style={[styles.fabWrapper, position]}>
        {/* Glow effect */}
        <Animated.View style={[styles.glow, glowStyle]}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.6)', 'transparent']}
            style={styles.glowGradient}
          />
        </Animated.View>

        <AnimatedPressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.fabButton, shadows.xl, mainButtonStyle]}
        >
          <LinearGradient
            colors={[...gradients.focus] as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Text style={styles.fabIcon}>{mainIcon}</Text>
          </LinearGradient>
        </AnimatedPressable>
      </View>
    </>
  );
};

// Option button component
const OptionButton: React.FC<{
  option: FABOption;
  index: number;
  onPress: () => void;
  isOpen: boolean;
}> = ({ option, index, onPress, isOpen }) => {
  const translateY = useSharedValue(50);
  const scale = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    if (isOpen) {
      translateY.value = withDelay(
        index * 50,
        withSpring(0, springConfigs.bouncy)
      );
      scale.value = withDelay(
        index * 50,
        withSpring(1, springConfigs.bouncy)
      );
    } else {
      translateY.value = withTiming(50, { duration: 150 });
      scale.value = withTiming(0, { duration: 150 });
    }
  }, [isOpen, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value * buttonScale.value },
    ],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.9, springConfigs.snappy);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, springConfigs.bouncy);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.optionButton, shadows.lg, animatedStyle]}
    >
      <LinearGradient
        colors={[...option.gradient] as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.optionGradient}
      >
        <Text style={styles.optionIcon}>{option.icon}</Text>
        <Text style={styles.optionLabel}>{option.label}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    zIndex: 998,
  },
  fabWrapper: {
    position: 'absolute',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 50,
  },
  fabButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  fabGradient: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
  optionsContainer: {
    position: 'absolute',
    zIndex: 999,
    alignItems: 'flex-end',
    gap: 12,
  },
  optionButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  optionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 10,
  },
  optionIcon: {
    fontSize: 22,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FAB;
