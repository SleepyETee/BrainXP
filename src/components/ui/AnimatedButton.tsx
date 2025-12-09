// Premium Animated Button Component
import React, { useCallback } from 'react';
import {
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Pressable,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
  useDerivedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, gradients, shadows } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { springConfigs } from '../../utils/animations';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'gradient';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: readonly [string, string, ...string[]];
  glow?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  haptic = true,
  style,
  textStyle,
  gradientColors,
  glow = false,
}) => {
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, springConfigs.snappy);
    pressed.value = withTiming(1, { duration: 100 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, springConfigs.bouncy);
    pressed.value = withTiming(0, { duration: 200 });
  }, []);

  const handlePress = useCallback(async () => {
    if (disabled || loading) return;
    
    if (haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Success ripple animation
    scale.value = withSequence(
      withSpring(0.95, springConfigs.snappy),
      withSpring(1.02, springConfigs.bouncy),
      withSpring(1, springConfigs.gentle)
    );
    
    onPress();
  }, [disabled, loading, haptic, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedInnerStyle = useAnimatedStyle(() => {
    if (variant === 'primary' || variant === 'gradient') {
      return {
        backgroundColor: interpolateColor(
          pressed.value,
          [0, 1],
          [colors.primary[500], colors.primary[600]]
        ),
      };
    }
    return {};
  });

  const sizeStyles = {
    sm: styles.sizeSm,
    md: styles.sizeMd,
    lg: styles.sizeLg,
    xl: styles.sizeXl,
  };

  const textSizeStyles = {
    sm: styles.textSm,
    md: styles.textMd,
    lg: styles.textLg,
    xl: styles.textXl,
  };

  const getBackgroundStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.primary[500] };
      case 'secondary':
        return { backgroundColor: colors.gray[100] };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.primary[500] };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'danger':
        return { backgroundColor: colors.danger[500] };
      case 'success':
        return { backgroundColor: colors.success[500] };
      case 'gradient':
        return {};
      default:
        return { backgroundColor: colors.primary[500] };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'danger':
      case 'success':
      case 'gradient':
        return '#FFFFFF';
      case 'secondary':
        return colors.gray[700];
      case 'outline':
      case 'ghost':
        return colors.primary[600];
      default:
        return '#FFFFFF';
    }
  };

  const getShadowStyle = (): ViewStyle => {
    if (disabled) return {};
    if (variant === 'gradient' || glow) {
      return shadows.focus;
    }
    if (variant === 'primary') {
      return shadows.md;
    }
    if (variant === 'danger') {
      return {
        ...shadows.md,
        shadowColor: colors.danger[500],
      };
    }
    if (variant === 'success') {
      return {
        ...shadows.md,
        shadowColor: colors.success[500],
      };
    }
    return {};
  };

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator 
          color={getTextColor()} 
          size={size === 'sm' ? 'small' : 'small'} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            style={[
              styles.text,
              textSizeStyles[size],
              { color: getTextColor() },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </>
      )}
    </>
  );

  const buttonContent = variant === 'gradient' ? (
    <LinearGradient
      colors={[...(gradientColors || gradients.focus)] as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.base,
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        styles.gradientInner,
      ]}
    >
      {renderContent()}
    </LinearGradient>
  ) : (
    <Animated.View
      style={[
        styles.base,
        sizeStyles[size],
        getBackgroundStyle(),
        fullWidth && styles.fullWidth,
        animatedInnerStyle,
      ]}
    >
      {renderContent()}
    </Animated.View>
  );

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.container,
        getShadowStyle(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {buttonContent}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  gradientInner: {
    borderRadius: 16,
  },

  // Sizes
  sizeSm: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  sizeMd: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  sizeLg: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  sizeXl: {
    paddingVertical: 22,
    paddingHorizontal: 40,
    borderRadius: 20,
  },

  // Text
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textSm: {
    fontSize: 14,
  },
  textMd: {
    fontSize: 16,
  },
  textLg: {
    fontSize: 18,
  },
  textXl: {
    fontSize: 20,
  },

  // Icons
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default AnimatedButton;
