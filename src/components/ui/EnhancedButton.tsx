// filepath: /Users/sleepyet/BrainXP/src/components/ui/EnhancedButton.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// ENHANCED BUTTON
// A fully accessible button with:
// - Multiple variants and sizes
// - Loading states
// - Haptic feedback
// - Icon support
// - Proper touch targets (44pt minimum)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import {
  StyleSheet,
  Pressable,
  Text,
  View,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { hapticFeedback as haptics, TOUCH_TARGETS } from '../../utils/uxHelpers';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Touch target constants for button sizes
const TouchTarget = {
  MINIMUM: TOUCH_TARGETS.minimum,
  COMFORTABLE: TOUCH_TARGETS.comfortable,
  LARGE: TOUCH_TARGETS.large,
  EXTRA_LARGE: 72,
  HIT_SLOP: { top: 8, bottom: 8, left: 8, right: 8 },
};

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface EnhancedButtonProps {
  // Content
  title: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  // Behavior
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  // Appearance
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  // Haptics
  hapticFeedback?: boolean;
  // Accessibility
  accessibilityHint?: string;
  // Style
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  title,
  leftIcon,
  rightIcon,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  hapticFeedback = true,
  accessibilityHint,
  style,
  textStyle,
}) => {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    if (hapticFeedback) {
      haptics.tap();
    }
    onPress();
  }, [disabled, loading, hapticFeedback, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Get variant colors
  const getVariantColors = () => {
    const variants = {
      primary: {
        bg: colors.primary[500],
        bgPressed: colors.primary[600],
        text: '#FFFFFF',
        border: 'transparent',
      },
      secondary: {
        bg: colors.gray[100],
        bgPressed: colors.gray[200],
        text: colors.gray[800],
        border: 'transparent',
      },
      outline: {
        bg: 'transparent',
        bgPressed: colors.gray[50],
        text: colors.primary[500],
        border: colors.primary[500],
      },
      ghost: {
        bg: 'transparent',
        bgPressed: colors.gray[100],
        text: colors.gray[700],
        border: 'transparent',
      },
      danger: {
        bg: '#EF4444',
        bgPressed: '#DC2626',
        text: '#FFFFFF',
        border: 'transparent',
      },
    };
    return variants[variant];
  };

  // Get size dimensions
  const getSizeDimensions = () => {
    const sizes = {
      sm: { height: TouchTarget.MINIMUM, paddingH: 16, fontSize: 14, iconSize: 16 },
      md: { height: TouchTarget.COMFORTABLE, paddingH: 20, fontSize: 16, iconSize: 18 },
      lg: { height: TouchTarget.LARGE, paddingH: 24, fontSize: 17, iconSize: 20 },
      xl: { height: TouchTarget.EXTRA_LARGE, paddingH: 28, fontSize: 18, iconSize: 22 },
    };
    return sizes[size];
  };

  const variantColors = getVariantColors();
  const sizeDimensions = getSizeDimensions();
  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          backgroundColor: variantColors.bg,
          borderColor: variantColors.border,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          height: sizeDimensions.height,
          paddingHorizontal: sizeDimensions.paddingH,
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint || 'Double tap to activate'}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={TouchTarget.HIT_SLOP}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantColors.text}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={sizeDimensions.iconSize}
              color={variantColors.text}
              style={styles.leftIcon}
            />
          )}
          <Text
            style={[
              styles.text,
              {
                color: variantColors.text,
                fontSize: sizeDimensions.fontSize,
              },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={sizeDimensions.iconSize}
              color={variantColors.text}
              style={styles.rightIcon}
            />
          )}
        </View>
      )}
    </AnimatedPressable>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ICON BUTTON
// A circular button for icon-only actions
// ═══════════════════════════════════════════════════════════════════════════════

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  accessibilityLabel: string;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  disabled = false,
  variant = 'ghost',
  size = 'md',
  accessibilityLabel,
  style,
}) => {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    if (disabled) return;
    haptics.tap();
    onPress();
  }, [disabled, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getSize = () => {
    const sizes = { sm: 36, md: TouchTarget.MINIMUM, lg: TouchTarget.LARGE };
    return sizes[size];
  };

  const getIconSize = () => {
    const sizes = { sm: 18, md: 22, lg: 26 };
    return sizes[size];
  };

  const getColors = () => {
    const variants = {
      primary: { bg: colors.primary[500], icon: '#FFFFFF' },
      secondary: { bg: colors.gray[100], icon: colors.gray[700] },
      ghost: { bg: 'transparent', icon: colors.gray[600] },
    };
    return variants[variant];
  };

  const buttonSize = getSize();
  const iconSize = getIconSize();
  const buttonColors = getColors();

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      disabled={disabled}
      style={[
        styles.iconButton,
        {
          width: buttonSize,
          height: buttonSize,
          backgroundColor: buttonColors.bg,
        },
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to activate"
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      hitSlop={TouchTarget.HIT_SLOP}
    >
      <Ionicons name={icon} size={iconSize} color={buttonColors.icon} />
    </AnimatedPressable>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FAB (Floating Action Button)
// Primary action button positioned in thumb-friendly zone
// ═══════════════════════════════════════════════════════════════════════════════

interface FABProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label?: string;
  extended?: boolean;
  position?: 'bottomRight' | 'bottomCenter' | 'bottomLeft';
  accessibilityLabel: string;
  style?: ViewStyle;
}

export const FAB: React.FC<FABProps> = ({
  icon,
  onPress,
  label,
  extended = false,
  position = 'bottomRight',
  accessibilityLabel,
  style,
}) => {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    haptics.confirm();
    onPress();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getPositionStyle = (): ViewStyle => {
    const positions = {
      bottomRight: { right: 16, bottom: 100 },
      bottomCenter: { alignSelf: 'center' as const, bottom: 100 },
      bottomLeft: { left: 16, bottom: 100 },
    };
    return positions[position];
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      style={[
        styles.fab,
        extended && styles.fabExtended,
        getPositionStyle(),
        animatedStyle,
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to activate"
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={24} color="#FFFFFF" />
      {extended && label && (
        <Text style={styles.fabLabel}>{label}</Text>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabExtended: {
    width: 'auto',
    paddingHorizontal: 20,
    borderRadius: 28,
  },
  fabLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default EnhancedButton;
