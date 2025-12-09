import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  size = 'md',
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  disabled = false,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputContainerStyles: ViewStyle[] = [
    styles.inputContainer,
    styles[`size_${size}` as keyof typeof styles] as ViewStyle,
    isFocused && styles.focused,
    error && styles.error,
    disabled && styles.disabled,
  ].filter(Boolean) as ViewStyle[];

  const textInputStyles: TextStyle[] = [
    styles.input,
    styles[`inputText_${size}` as keyof typeof styles] as TextStyle,
    leftIcon && styles.inputWithLeftIcon,
    rightIcon && styles.inputWithRightIcon,
    inputStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={inputContainerStyles}>
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <TextInput
          style={textInputStyles}
          placeholderTextColor={colors.gray[400]}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />

        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
};

interface TextAreaProps extends InputProps {
  rows?: number;
}

export const TextArea: React.FC<TextAreaProps> = ({
  rows = 4,
  ...props
}) => {
  return (
    <Input
      {...props}
      multiline
      numberOfLines={rows}
      textAlignVertical="top"
      inputStyle={[{ minHeight: rows * 24 }, props.inputStyle]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.base,
  },
  focused: {
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  error: {
    borderColor: colors.danger[500],
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
    paddingLeft: 12,
    paddingRight: 8,
  },
  rightIconContainer: {
    paddingRight: 12,
    paddingLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger[500],
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },

  // Sizes
  size_sm: {
    height: 36,
    paddingHorizontal: 10,
  },
  size_md: {
    height: 44,
    paddingHorizontal: 12,
  },
  size_lg: {
    height: 52,
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
