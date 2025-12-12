// filepath: /Users/sleepyet/BrainXP/src/components/ui/SearchInput.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Keyboard,
  ViewStyle,
  Platform,
  TextStyle,
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
import * as Haptics from 'expo-haptics';
import { colors, shadows } from '../../theme/colors';
import { TOUCH_TARGETS } from '../../utils/uxHelpers';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClear?: () => void;
  // Behavior
  debounceMs?: number;
  autoFocus?: boolean;
  showCancelButton?: boolean;
  // Appearance
  variant?: 'default' | 'filled' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  // Accessibility
  accessibilityLabel?: string;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * SearchInput Component
 * 
 * Optimized search input with:
 * - Debounced search for performance
 * - Clear button for quick reset
 * - Animated focus states
 * - Accessible
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onSubmit,
  onFocus,
  onBlur,
  onClear,
  debounceMs = 300,
  autoFocus = false,
  showCancelButton = true,
  variant = 'default',
  size = 'md',
  style,
  accessibilityLabel = 'Search',
  testID,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const focusAnimation = useSharedValue(0);
  const clearButtonScale = useSharedValue(0);

  const sizeConfig = {
    sm: { height: TOUCH_TARGETS.minimum, fontSize: 14, iconSize: 18, padding: 12 },
    md: { height: TOUCH_TARGETS.recommended, fontSize: 16, iconSize: 20, padding: 14 },
    lg: { height: TOUCH_TARGETS.comfortable, fontSize: 18, iconSize: 22, padding: 16 },
  };

  const config = sizeConfig[size];

  // Sync external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (localValue !== value) {
        onChangeText(localValue);
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localValue, debounceMs, value, onChangeText]);

  // Clear button animation
  useEffect(() => {
    clearButtonScale.value = withSpring(localValue.length > 0 ? 1 : 0, {
      damping: 15,
      stiffness: 300,
    });
  }, [localValue]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    focusAnimation.value = withSpring(1, { damping: 15, stiffness: 200 });
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    focusAnimation.value = withSpring(0, { damping: 15, stiffness: 200 });
    onBlur?.();
  }, [onBlur]);

  const handleClear = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalValue('');
    onChangeText('');
    onClear?.();
    inputRef.current?.focus();
  }, [onChangeText, onClear]);

  const handleCancel = useCallback(() => {
    Keyboard.dismiss();
    handleClear();
  }, [handleClear]);

  const handleSubmit = useCallback(() => {
    onSubmit?.(localValue);
  }, [localValue, onSubmit]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = interpolate(
      focusAnimation.value,
      [0, 1],
      [0, 1]
    );

    return {
      borderColor: borderColor === 1 ? colors.primary[500] : colors.gray[200],
      transform: [
        {
          scale: interpolate(
            focusAnimation.value,
            [0, 1],
            [1, 1.01],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const animatedClearStyle = useAnimatedStyle(() => ({
    transform: [{ scale: clearButtonScale.value }],
    opacity: clearButtonScale.value,
  }));

  const getContainerStyle = () => {
    switch (variant) {
      case 'filled':
        return styles.containerFilled;
      case 'minimal':
        return styles.containerMinimal;
      default:
        return styles.containerDefault;
    }
  };

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View
        style={[
          styles.container,
          getContainerStyle(),
          { height: config.height, paddingHorizontal: config.padding },
          animatedContainerStyle,
        ]}
      >
        <Ionicons
          name="search-outline"
          size={config.iconSize}
          color={isFocused ? colors.primary[500] : colors.gray[400]}
          style={styles.searchIcon}
        />

        <TextInput
          ref={inputRef}
          value={localValue}
          onChangeText={setLocalValue}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            styles.input,
            { fontSize: config.fontSize },
          ]}
          accessible
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="search"
          testID={testID}
        />

        <AnimatedPressable
          onPress={handleClear}
          style={[styles.clearButton, animatedClearStyle]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <View style={styles.clearButtonInner}>
            <Ionicons name="close" size={14} color="#FFFFFF" />
          </View>
        </AnimatedPressable>
      </Animated.View>

      {showCancelButton && isFocused && (
        <Pressable
          onPress={handleCancel}
          style={styles.cancelButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Animated.Text
            style={styles.cancelText}
            entering={require('react-native-reanimated').FadeInRight.duration(200)}
          >
            Cancel
          </Animated.Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
  },
  containerDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.gray[200],
  },
  containerFilled: {
    backgroundColor: colors.gray[100],
    borderColor: 'transparent',
  },
  containerMinimal: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    borderRadius: 0,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.gray[900],
    fontWeight: '500',
    paddingVertical: 0,
  } as TextStyle,
  clearButton: {
    marginLeft: 8,
  },
  clearButtonInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.gray[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    marginLeft: 12,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    color: colors.primary[500],
    fontWeight: '600',
  },
});

export default SearchInput;
