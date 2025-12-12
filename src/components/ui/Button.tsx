import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Pressable,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { TOUCH_TARGETS } from '../../utils/uxHelpers';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps {
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
  gradient?: boolean;
  rounded?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const springConfig = {
  damping: 15,
  stiffness: 400,
};

// Size config with minimum touch targets (following Apple/Material guidelines)
const SIZE_CONFIG = {
  xs: { 
    minHeight: TOUCH_TARGETS.minimum, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    fontSize: 12,
    iconSize: 14,
  },
  sm: { 
    minHeight: TOUCH_TARGETS.minimum, 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    fontSize: 14,
    iconSize: 16,
  },
  md: { 
    minHeight: TOUCH_TARGETS.recommended, 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    fontSize: 16,
    iconSize: 18,
  },
  lg: { 
    minHeight: TOUCH_TARGETS.comfortable, 
    paddingVertical: 16, 
    paddingHorizontal: 28, 
    fontSize: 18,
    iconSize: 20,
  },
};

export const Button: React.FC<ButtonProps> = ({
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
  gradient = false,
  rounded = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const sizeConfig = SIZE_CONFIG[size];

  const handlePressIn = () => {
    scale.value = withSpring(0.96, springConfig);
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
    opacity.value = withTiming(1, { duration: 150 });
  };

  const handlePress = async () => {
    if (haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const buttonStyles: ViewStyle[] = [
    styles.base,
    {
      minHeight: sizeConfig.minHeight,
      paddingVertical: sizeConfig.paddingVertical,
      paddingHorizontal: sizeConfig.paddingHorizontal,
    },
    rounded && styles.rounded,
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    !gradient && (styles[`variant_${variant}` as keyof typeof styles] as ViewStyle),
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    { fontSize: sizeConfig.fontSize },
    styles[`text_${variant}` as keyof typeof styles] as TextStyle,
    textStyle,
  ].filter(Boolean) as TextStyle[];

  const getLoaderColor = () => {
    if (variant === 'primary' || variant === 'danger' || variant === 'success' || gradient) {
      return '#FFFFFF';
    }
    return colors.primary[500];
  };

  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case 'primary':
        return [colors.primary[500], colors.primary[600]];
      case 'danger':
        return [colors.danger[500], colors.danger[600]];
      case 'success':
        return [colors.success[500], colors.success[600]];
      default:
        return [colors.primary[500], colors.primary[600]];
    }
  };

  // Accessibility state
  const a11yState = {
    disabled,
    busy: loading,
  };

  const content = (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator color={getLoaderColor()} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View style={styles.iconWrapper}>{icon}</View>}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && <View style={styles.iconWrapper}>{icon}</View>}
        </>
      )}
    </View>
  );

  if (gradient && (variant === 'primary' || variant === 'danger' || variant === 'success')) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[animatedStyle, fullWidth && styles.fullWidth]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityState={a11yState}
        testID={testID}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            buttonStyles,
            styles.gradientContainer,
            disabled && styles.disabled,
          ]}
        >
          {content}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      style={[buttonStyles, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={a11yState}
      testID={testID}
    >
      {content}
    </AnimatedPressable>
  );
};

// Icon Button variant
interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
  accessibilityLabel: string; // Required for icon-only buttons
  testID?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  haptic = true,
  style,
  accessibilityLabel,
  testID,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handlePress = async () => {
    if (haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Ensure minimum touch target of 44x44
  const sizeMap = {
    xs: TOUCH_TARGETS.minimum,
    sm: TOUCH_TARGETS.minimum,
    md: TOUCH_TARGETS.recommended,
    lg: TOUCH_TARGETS.comfortable,
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.iconButton,
        styles[`variant_${variant}` as keyof typeof styles] as ViewStyle,
        {
          width: sizeMap[size],
          height: sizeMap[size],
          borderRadius: sizeMap[size] / 2,
        },
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      testID={testID}
    >
      {icon}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rounded: {
    borderRadius: 50,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  gradientContainer: {
    overflow: 'hidden',
  },

  // Variants
  variant_primary: {
    backgroundColor: colors.primary[500],
  },
  variant_secondary: {
    backgroundColor: colors.gray[100],
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.gray[300],
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  variant_danger: {
    backgroundColor: colors.danger[500],
  },
  variant_success: {
    backgroundColor: colors.success[500],
  },

  // Text base
  text: {
    fontWeight: '600',
  },

  // Text variants
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: colors.gray[700],
  },
  text_outline: {
    color: colors.gray[700],
  },
  text_ghost: {
    color: colors.primary[500],
  },
  text_danger: {
    color: '#FFFFFF',
  },
  text_success: {
    color: '#FFFFFF',
  },

  // Icon button
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;
