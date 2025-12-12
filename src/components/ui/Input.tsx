import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  TextInputProps,
  ViewStyle,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { TOUCH_TARGETS, getKeyboardType, getAutoCapitalize } from '../../utils/uxHelpers';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outlined' | 'filled' | 'underlined';
  clearable?: boolean;
  fieldType?: 'email' | 'phone' | 'number' | 'url' | 'search' | 'default';
  capitalizeContext?: 'name' | 'sentence' | 'word' | 'none';
  required?: boolean;
  disabled?: boolean;
  success?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  size = 'md',
  variant = 'outlined',
  clearable = false,
  fieldType = 'default',
  capitalizeContext = 'sentence',
  required = false,
  disabled = false,
  success = false,
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const labelPosition = useRef(new Animated.Value(value ? 1 : 0)).current;
  const borderColor = useRef(new Animated.Value(0)).current;

  // Size configurations (thumb-friendly)
  const sizeConfig = {
    sm: { height: TOUCH_TARGETS.minimum, fontSize: 14, labelSize: 12, padding: 12 },
    md: { height: TOUCH_TARGETS.recommended, fontSize: 16, labelSize: 13, padding: 14 },
    lg: { height: TOUCH_TARGETS.comfortable, fontSize: 18, labelSize: 14, padding: 16 },
  };

  const config = sizeConfig[size];

  // Animate label on focus/blur
  const animateLabel = useCallback((toValue: number) => {
    Animated.timing(labelPosition, {
      toValue,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [labelPosition]);

  // Animate border on focus/blur
  const animateBorder = useCallback((toValue: number) => {
    Animated.timing(borderColor, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [borderColor]);

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    animateLabel(1);
    animateBorder(1);
    Haptics.selectionAsync();
    onFocus?.(e);
  }, [animateLabel, animateBorder, onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    if (!value) {
      animateLabel(0);
    }
    animateBorder(0);
    onBlur?.(e);
  }, [animateLabel, animateBorder, value, onBlur]);

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeText?.('');
    inputRef.current?.focus();
  }, [onChangeText]);

  const handleContainerPress = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Interpolate colors
  const interpolatedBorderColor = borderColor.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? colors.danger[400] : success ? colors.success[400] : colors.gray[300],
      error ? colors.danger[500] : success ? colors.success[500] : colors.primary[500],
    ],
  });

  const interpolatedLabelTop = labelPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [config.height / 2 - config.labelSize / 2, -config.labelSize / 2 - 2],
  });

  const interpolatedLabelSize = labelPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [config.fontSize, config.labelSize - 1],
  });

  // Get input-specific props
  const keyboardType = getKeyboardType(fieldType);
  const autoCapitalize = getAutoCapitalize(capitalizeContext);

  // Determine right icon to show
  const showClearButton = clearable && value && value.length > 0 && !disabled;
  const displayRightIcon = showClearButton ? 'close-circle' : rightIcon;
  const handleRightIconPress = showClearButton ? handleClear : onRightIconPress;

  // Accessibility label
  const accessibilityLabel = `${label || placeholder}${required ? ', required' : ''}${error ? `, error: ${error}` : ''}`;

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleContainerPress}
        disabled={disabled}
        accessible={false}
      >
        <Animated.View
          style={[
            styles.inputContainer,
            styles[`variant_${variant}`],
            {
              height: config.height,
              borderColor: interpolatedBorderColor,
              backgroundColor: disabled 
                ? colors.gray[100] 
                : variant === 'filled' 
                  ? colors.gray[50] 
                  : '#FFFFFF',
            },
          ]}
        >
          {/* Left Icon */}
          {leftIcon && (
            <View style={[styles.iconContainer, { width: config.height - 8 }]}>
              <Ionicons 
                name={leftIcon} 
                size={20} 
                color={isFocused ? colors.primary[500] : colors.gray[400]} 
              />
            </View>
          )}

          {/* Floating Label */}
          {label && (
            <Animated.Text
              style={[
                styles.floatingLabel,
                {
                  top: interpolatedLabelTop,
                  fontSize: interpolatedLabelSize,
                  left: leftIcon ? config.height - 4 : config.padding,
                  color: error 
                    ? colors.danger[500] 
                    : isFocused 
                      ? colors.primary[500] 
                      : colors.gray[500],
                  backgroundColor: variant === 'filled' ? colors.gray[50] : '#FFFFFF',
                },
              ]}
              numberOfLines={1}
            >
              {label}{required && ' *'}
            </Animated.Text>
          )}

          {/* Text Input */}
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                fontSize: config.fontSize,
                paddingLeft: leftIcon ? config.height - 8 : config.padding,
                paddingRight: displayRightIcon ? config.height - 8 : config.padding,
                paddingTop: label ? 8 : 0,
                color: disabled ? colors.gray[400] : colors.gray[900],
              },
              inputStyle,
            ]}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isFocused || !label ? placeholder : ''}
            placeholderTextColor={colors.gray[400]}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            editable={!disabled}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={hint}
            accessibilityState={{ disabled }}
            {...rest}
          />

          {/* Right Icon / Clear Button */}
          {displayRightIcon && (
            <TouchableOpacity
              style={[styles.iconContainer, styles.rightIcon, { width: config.height - 8 }]}
              onPress={handleRightIconPress}
              disabled={!handleRightIconPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={showClearButton ? 'Clear input' : undefined}
              accessibilityRole="button"
            >
              <Ionicons
                name={displayRightIcon}
                size={20}
                color={
                  showClearButton 
                    ? colors.gray[400] 
                    : success 
                      ? colors.success[500] 
                      : error 
                        ? colors.danger[500] 
                        : colors.gray[400]
                }
              />
            </TouchableOpacity>
          )}

          {/* Success indicator */}
          {success && !displayRightIcon && (
            <View style={[styles.iconContainer, styles.rightIcon, { width: config.height - 8 }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success[500]} />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Error or Hint Message */}
      {(error || hint) && (
        <View style={styles.messageContainer}>
          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color={colors.danger[500]} />
              <Text 
                style={styles.errorText}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {error}
              </Text>
            </View>
          ) : hint ? (
            <Text style={styles.hintText}>{hint}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  variant_outlined: {
    borderWidth: 1.5,
  },
  variant_filled: {
    borderWidth: 0,
    borderBottomWidth: 2,
    borderRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  variant_underlined: {
    borderWidth: 0,
    borderBottomWidth: 1.5,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    height: '100%',
    fontWeight: '500',
  },
  iconContainer: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIcon: {
    position: 'absolute',
    right: 0,
  },
  floatingLabel: {
    position: 'absolute',
    paddingHorizontal: 4,
    fontWeight: '500',
    zIndex: 1,
  },
  messageContainer: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger[500],
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
    color: colors.gray[500],
  },
});

// TextArea component for multiline input
interface TextAreaProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  hint,
  containerStyle,
  inputStyle,
  rows = 4,
  required = false,
  disabled = false,
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    Haptics.selectionAsync();
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  }, [onBlur]);

  const minHeight = rows * 24;

  return (
    <View style={[textAreaStyles.container, containerStyle]}>
      {label && (
        <Text style={[
          textAreaStyles.label,
          { color: error ? colors.danger[500] : isFocused ? colors.primary[500] : colors.gray[600] }
        ]}>
          {label}{required && ' *'}
        </Text>
      )}
      <TextInput
        ref={inputRef}
        style={[
          textAreaStyles.input,
          {
            minHeight,
            borderColor: error 
              ? colors.danger[400] 
              : isFocused 
                ? colors.primary[500] 
                : colors.gray[300],
            backgroundColor: disabled ? colors.gray[100] : '#FFFFFF',
            color: disabled ? colors.gray[400] : colors.gray[900],
          },
          inputStyle,
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.gray[400]}
        multiline
        textAlignVertical="top"
        editable={!disabled}
        accessibilityLabel={`${label || placeholder}${required ? ', required' : ''}${error ? `, error: ${error}` : ''}`}
        accessibilityHint={hint}
        {...rest}
      />
      {(error || hint) && (
        <View style={textAreaStyles.messageContainer}>
          {error ? (
            <View style={textAreaStyles.errorRow}>
              <Ionicons name="alert-circle" size={14} color={colors.danger[500]} />
              <Text style={textAreaStyles.errorText}>{error}</Text>
            </View>
          ) : hint ? (
            <Text style={textAreaStyles.hintText}>{hint}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const textAreaStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  messageContainer: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger[500],
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
    color: colors.gray[500],
  },
});

export default Input;
