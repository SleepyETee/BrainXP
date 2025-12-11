import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'default' | 'filled' | 'outline';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: InputSize;
  variant?: InputVariant;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
  success?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  floatingLabel?: boolean;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  size = 'md',
  variant = 'default',
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  disabled = false,
  success = false,
  clearable = false,
  onClear,
  floatingLabel = false,
  value,
  onChangeText,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Animation values
  const borderWidth = useSharedValue(1);
  const labelPosition = useSharedValue(value ? 1 : 0);
  const shakeX = useSharedValue(0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    borderWidth.value = withSpring(2);
    if (floatingLabel) {
      labelPosition.value = withSpring(1);
    }
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    borderWidth.value = withSpring(1);
    if (floatingLabel && !value) {
      labelPosition.value = withSpring(0);
    }
    onBlur?.(e);
  };

  const handleClear = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeText?.('');
    onClear?.();
    inputRef.current?.focus();
  };

  // Shake animation for error
  React.useEffect(() => {
    if (error) {
      shakeX.value = withSpring(10, { damping: 2 }, () => {
        shakeX.value = withSpring(0);
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [error]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    borderWidth: borderWidth.value,
    transform: [{ translateX: shakeX.value }],
  }));

  const floatingLabelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withTiming(labelPosition.value === 1 ? -24 : 0) },
      { scale: withTiming(labelPosition.value === 1 ? 0.85 : 1) },
    ],
    color: withTiming(
      isFocused ? colors.primary[500] : error ? colors.danger[500] : colors.gray[500]
    ),
  }));

  const getBorderColor = () => {
    if (error) return colors.danger[500];
    if (success) return colors.success[500];
    if (isFocused) return colors.primary[500];
    return colors.gray[300];
  };

  const inputContainerStyles: ViewStyle[] = [
    styles.inputContainer,
    styles[`size_${size}` as keyof typeof styles] as ViewStyle,
    styles[`variant_${variant}` as keyof typeof styles] as ViewStyle,
    { borderColor: getBorderColor() },
    disabled && styles.disabled,
  ].filter(Boolean) as ViewStyle[];

  const textInputStyles: TextStyle[] = [
    styles.input,
    styles[`inputText_${size}` as keyof typeof styles] as TextStyle,
    leftIcon && styles.inputWithLeftIcon,
    (rightIcon || clearable) && styles.inputWithRightIcon,
    inputStyle,
  ].filter(Boolean) as TextStyle[];

  const showClearButton = clearable && value && value.length > 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && !floatingLabel && (
        <Text style={[styles.label, error && styles.labelError]}>{label}</Text>
      )}

      <Animated.View style={[inputContainerStyles, containerAnimatedStyle]}>
        {floatingLabel && label && (
          <Animated.Text style={[styles.floatingLabel, floatingLabelStyle]}>
            {label}
          </Animated.Text>
        )}

        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <TextInput
          ref={inputRef}
          style={textInputStyles}
          placeholderTextColor={colors.gray[400]}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          onChangeText={onChangeText}
          {...textInputProps}
        />

        {showClearButton && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}

        {rightIcon && !showClearButton && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}

        {success && !rightIcon && !showClearButton && (
          <Animated.View entering={FadeIn} style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </Animated.View>
        )}
      </Animated.View>

      {error && (
        <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.errorText}>
          {error}
        </Animated.Text>
      )}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
};

interface TextAreaProps extends InputProps {
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  rows = 4,
  maxLength,
  showCharCount = false,
  value,
  ...props
}) => {
  const charCount = value?.length || 0;

  return (
    <View>
      <Input
        {...props}
        value={value}
        multiline
        numberOfLines={rows}
        textAlignVertical="top"
        maxLength={maxLength}
        inputStyle={{ minHeight: rows * 24, paddingTop: 12, ...props.inputStyle }}
      />
      {showCharCount && maxLength && (
        <Text style={[styles.charCount, charCount >= maxLength && styles.charCountMax]}>
          {charCount}/{maxLength}
        </Text>
      )}
    </View>
  );
};

// Search Input variant
interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onSearch?: (query: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  onSearch,
  value,
  onChangeText,
  ...props
}) => {
  const handleSubmit = () => {
    if (value && onSearch) {
      onSearch(value);
    }
  };

  return (
    <Input
      {...props}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      leftIcon={<Text style={styles.searchIcon}>🔍</Text>}
      clearable
      returnKeyType="search"
      onSubmitEditing={handleSubmit}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 6,
  },
  labelError: {
    color: colors.danger[500],
  },
  floatingLabel: {
    position: 'absolute',
    left: 12,
    fontSize: 16,
    color: colors.gray[500],
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  disabled: {
    backgroundColor: colors.gray[100],
    opacity: 0.7,
  },
  input: {
    flex: 1,
    color: colors.gray[800],
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  leftIconContainer: {
    paddingLeft: 14,
    paddingRight: 10,
  },
  rightIconContainer: {
    paddingRight: 14,
    paddingLeft: 10,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearIcon: {
    fontSize: 14,
    color: colors.gray[400],
    fontWeight: '600',
  },
  successIcon: {
    paddingRight: 14,
    paddingLeft: 10,
  },
  successIconText: {
    fontSize: 16,
    color: colors.success[500],
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    color: colors.danger[500],
    marginTop: 6,
    marginLeft: 4,
  },
  hintText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 6,
    marginLeft: 4,
  },
  charCount: {
    fontSize: 11,
    color: colors.gray[400],
    textAlign: 'right',
    marginTop: 4,
  },
  charCountMax: {
    color: colors.danger[500],
  },
  searchIcon: {
    fontSize: 16,
  },

  // Variants
  variant_default: {
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  variant_filled: {
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.gray[300],
  },

  // Sizes
  size_sm: {
    height: 40,
    paddingHorizontal: 12,
  },
  size_md: {
    height: 48,
    paddingHorizontal: 14,
  },
  size_lg: {
    height: 56,
    paddingHorizontal: 16,
  },
  inputText_sm: {
    fontSize: 14,
  },
  inputText_md: {
    fontSize: 16,
  },
  inputText_lg: {
    fontSize: 18,
  },
});

export default Input;
