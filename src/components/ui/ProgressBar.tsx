import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

type ProgressBarVariant = 'primary' | 'success' | 'warning' | 'danger' | 'gradient';
type ProgressBarSize = 'sm' | 'md' | 'lg';

interface ProgressBarProps {
  progress: number; // 0-100
  variant?: ProgressBarVariant;
  size?: ProgressBarSize;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  label,
  animated = true,
  style,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: clampedProgress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(clampedProgress);
    }
  }, [clampedProgress, animated]);

  const getBarColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary[500];
      case 'success':
        return colors.success[500];
      case 'warning':
        return colors.warning[500];
      case 'danger':
        return colors.danger[500];
      case 'gradient':
        if (clampedProgress >= 75) return colors.success[500];
        if (clampedProgress >= 50) return colors.primary[500];
        if (clampedProgress >= 25) return colors.warning[500];
        return colors.danger[500];
      default:
        return colors.primary[500];
    }
  };

  const containerStyles: ViewStyle[] = [
    styles.container,
    styles[`size_${size}` as keyof typeof styles] as ViewStyle,
    style,
  ].filter(Boolean) as ViewStyle[];

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.wrapper}>
      {(showLabel || label) && (
        <View style={styles.labelContainer}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showLabel && (
            <Text style={styles.percentage}>{Math.round(clampedProgress)}%</Text>
          )}
        </View>
      )}
      <View style={containerStyles}>
        <Animated.View
          style={[
            styles.bar,
            {
              width: widthInterpolation,
              backgroundColor: getBarColor(),
            },
          ]}
        />
      </View>
    </View>
  );
};

interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  variant?: ProgressBarVariant;
  showLabel?: boolean;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 80,
  strokeWidth = 8,
  variant = 'primary',
  showLabel = true,
  children,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  const getColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary[500];
      case 'success':
        return colors.success[500];
      case 'warning':
        return colors.warning[500];
      case 'danger':
        return colors.danger[500];
      case 'gradient':
        if (clampedProgress >= 75) return colors.success[500];
        if (clampedProgress >= 50) return colors.primary[500];
        if (clampedProgress >= 25) return colors.warning[500];
        return colors.danger[500];
      default:
        return colors.primary[500];
    }
  };

  return (
    <View style={[styles.circularContainer, { width: size, height: size }]}>
      <View style={styles.circularContent}>
        {children || (showLabel && (
          <Text style={styles.circularLabel}>{Math.round(clampedProgress)}%</Text>
        ))}
      </View>
      {/* Note: For full SVG support, install react-native-svg */}
      <View
        style={[
          styles.circularBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
  },
  container: {
    width: '100%',
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },

  // Sizes
  size_sm: {
    height: 4,
  },
  size_md: {
    height: 8,
  },
  size_lg: {
    height: 12,
  },

  // Circular progress
  circularContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  circularBackground: {
    borderColor: colors.gray[200],
  },
});

export default ProgressBar;
