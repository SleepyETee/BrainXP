import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, gradients, shadows } from '../../theme/colors';
import { TOUCH_TARGETS, THUMB_ZONES } from '../../utils/uxHelpers';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FABAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  // For expandable FAB
  actions?: FABAction[];
  // Appearance
  size?: 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'gradient';
  gradientColors?: readonly string[];
  // Position (thumb-friendly by default)
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  // Accessibility
  accessibilityLabel?: string;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const springConfig = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

/**
 * Floating Action Button
 * 
 * Placed in the thumb zone for easy one-handed use.
 * Supports single action or expandable menu.
 */
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon = 'add',
  onPress,
  actions,
  size = 'lg',
  variant = 'gradient',
  gradientColors = gradients.focus,
  position = 'bottom-right',
  accessibilityLabel = 'Action button',
  testID,
}) => {
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const expansion = useSharedValue(0);

  const sizeConfig = {
    md: { size: TOUCH_TARGETS.comfortable, iconSize: 24 },
    lg: { size: TOUCH_TARGETS.large, iconSize: 28 },
  };

  const config = sizeConfig[size];

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, springConfig);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, springConfig);
  }, []);

  const handlePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (actions && actions.length > 0) {
      setIsExpanded(prev => !prev);
      rotation.value = withSpring(isExpanded ? 0 : 45, springConfig);
      expansion.value = withSpring(isExpanded ? 0 : 1, springConfig);
    } else {
      onPress?.();
    }
  }, [actions, isExpanded, onPress]);

  const handleActionPress = useCallback(async (action: FABAction) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(false);
    rotation.value = withSpring(0, springConfig);
    expansion.value = withSpring(0, springConfig);
    action.onPress();
  }, []);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expansion.value, [0, 1], [0, 0.5]),
    pointerEvents: expansion.value > 0 ? 'auto' : 'none',
  }));

  // Position styles (thumb-friendly placement)
  const getPositionStyle = () => {
    const bottom = insets.bottom + 24;
    switch (position) {
      case 'bottom-left':
        return { bottom, left: 20 };
      case 'bottom-center':
        return { bottom, left: SCREEN_WIDTH / 2 - config.size / 2 };
      case 'bottom-right':
      default:
        return { bottom, right: 20 };
    }
  };

  const renderButton = () => {
    const buttonContent = (
      <Ionicons name={icon} size={config.iconSize} color="#FFFFFF" />
    );

    if (variant === 'gradient') {
      return (
        <LinearGradient
          colors={gradientColors as LinearGradientProps['colors']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            {
              width: config.size,
              height: config.size,
              borderRadius: config.size / 2,
            },
          ]}
        >
          {buttonContent}
        </LinearGradient>
      );
    }

    return (
      <View
        style={[
          styles.button,
          {
            width: config.size,
            height: config.size,
            borderRadius: config.size / 2,
            backgroundColor: variant === 'primary' ? colors.primary[500] : colors.gray[700],
          },
        ]}
      >
        {buttonContent}
      </View>
    );
  };

  return (
    <>
      {/* Backdrop for expanded state */}
      {actions && actions.length > 0 && (
        <Animated.View
          style={[styles.backdrop, animatedBackdropStyle]}
          onTouchEnd={() => {
            setIsExpanded(false);
            rotation.value = withSpring(0, springConfig);
            expansion.value = withSpring(0, springConfig);
          }}
        />
      )}

      <View style={[styles.container, getPositionStyle()]}>
        {/* Action items */}
        {actions && actions.length > 0 && (
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => {
              const animatedActionStyle = useAnimatedStyle(() => {
                const translateY = interpolate(
                  expansion.value,
                  [0, 1],
                  [50, 0],
                  Extrapolation.CLAMP
                );
                const opacity = interpolate(
                  expansion.value,
                  [0, 0.5, 1],
                  [0, 0, 1],
                  Extrapolation.CLAMP
                );
                const scale = interpolate(
                  expansion.value,
                  [0, 1],
                  [0.5, 1],
                  Extrapolation.CLAMP
                );

                return {
                  transform: [{ translateY }, { scale }],
                  opacity,
                };
              });

              return (
                <Animated.View
                  key={index}
                  style={[styles.actionItem, animatedActionStyle]}
                >
                  <View style={styles.actionLabelContainer}>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleActionPress(action)}
                    style={[
                      styles.actionButton,
                      { backgroundColor: action.color || colors.gray[700] },
                    ]}
                  >
                    <Ionicons name={action.icon} size={20} color="#FFFFFF" />
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Main FAB */}
        <AnimatedPressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.fabContainer, shadows.lg, animatedButtonStyle]}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
          testID={testID}
        >
          {renderButton()}
        </AnimatedPressable>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 100,
  },
  fabContainer: {
    borderRadius: 100,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 99,
  },
  actionsContainer: {
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabelContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 12,
    ...shadows.sm,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
  },
  actionButton: {
    width: TOUCH_TARGETS.recommended,
    height: TOUCH_TARGETS.recommended,
    borderRadius: TOUCH_TARGETS.recommended / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
});

export default FloatingActionButton;
