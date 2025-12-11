import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  FadeIn,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

type ProgressBarVariant = 'primary' | 'success' | 'warning' | 'danger' | 'gradient' | 'rainbow';
type ProgressBarSize = 'xs' | 'sm' | 'md' | 'lg';

interface ProgressBarProps {
  progress: number; // 0-100
  variant?: ProgressBarVariant;
  size?: ProgressBarSize;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  striped?: boolean;
  indeterminate?: boolean;
  glowing?: boolean;
  style?: ViewStyle;
}

const springConfig = {
  damping: 15,
  stiffness: 100,
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  label,
  animated = true,
  striped = false,
  indeterminate = false,
  glowing = false,
  style,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const progressWidth = useSharedValue(0);
  const indeterminatePosition = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (indeterminate) {
      indeterminatePosition.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        false
      );
    } else if (animated) {
      progressWidth.value = withSpring(clampedProgress, springConfig);
    } else {
      progressWidth.value = clampedProgress;
    }
  }, [clampedProgress, animated, indeterminate]);

  useEffect(() => {
    if (glowing && clampedProgress > 0) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [glowing, clampedProgress]);

  const getBarColor = (): string => {
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
      case 'rainbow':
        if (clampedProgress >= 75) return colors.success[500];
        if (clampedProgress >= 50) return colors.primary[500];
        if (clampedProgress >= 25) return colors.warning[500];
        return colors.danger[500];
      default:
        return colors.primary[500];
    }
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const indeterminateStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(indeterminatePosition.value * 200 - 50, { duration: 0 }) },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const containerStyles: ViewStyle[] = [
    styles.container,
    styles[`size_${size}` as keyof typeof styles] as ViewStyle,
    style,
  ].filter(Boolean) as ViewStyle[];

  const isGradient = variant === 'gradient' || variant === 'rainbow';
  const gradientColors: [string, string] = variant === 'rainbow' 
    ? [colors.primary[500], colors.success[500]]
    : [getBarColor(), getBarColor()];

  return (
    <View style={styles.wrapper}>
      {(showLabel || label) && (
        <Animated.View entering={FadeIn} style={styles.labelContainer}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showLabel && !indeterminate && (
            <Text style={[styles.percentage, { color: getBarColor() }]}>
              {Math.round(clampedProgress)}%
            </Text>
          )}
        </Animated.View>
      )}
      <View style={containerStyles}>
        {indeterminate ? (
          <Animated.View style={[styles.indeterminateBar, indeterminateStyle]}>
            <LinearGradient
              colors={[`${getBarColor()}00`, getBarColor(), `${getBarColor()}00`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.indeterminateGradient}
            />
          </Animated.View>
        ) : isGradient ? (
          <Animated.View style={[styles.barContainer, progressStyle]}>
            <LinearGradient
              colors={variant === 'rainbow' 
                ? [colors.danger[400], colors.warning[400], colors.success[400]]
                : gradientColors
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBar}
            />
            {glowing && (
              <Animated.View style={[styles.glow, glowStyle, { backgroundColor: getBarColor() }]} />
            )}
          </Animated.View>
        ) : (
          <Animated.View
            style={[
              styles.bar,
              progressStyle,
              { backgroundColor: getBarColor() },
              striped && styles.stripedBar,
            ]}
          >
            {glowing && (
              <Animated.View style={[styles.glow, glowStyle, { backgroundColor: getBarColor() }]} />
            )}
          </Animated.View>
        )}
      </View>
    </View>
  );
};

// Segmented Progress - for step-based progress
interface SegmentedProgressProps {
  steps: number;
  currentStep: number;
  variant?: ProgressBarVariant;
  size?: ProgressBarSize;
  labels?: string[];
}

export const SegmentedProgress: React.FC<SegmentedProgressProps> = ({
  steps,
  currentStep,
  variant = 'primary',
  size = 'md',
  labels,
}) => {
  const getColor = (stepIndex: number) => {
    const baseColor = variant === 'primary' ? colors.primary[500] :
                      variant === 'success' ? colors.success[500] :
                      variant === 'warning' ? colors.warning[500] :
                      colors.danger[500];
    
    return stepIndex < currentStep ? baseColor : colors.gray[200];
  };

  return (
    <View style={styles.segmentedWrapper}>
      <View style={styles.segmentedContainer}>
        {Array.from({ length: steps }).map((_, index) => (
          <React.Fragment key={index}>
            <Animated.View
              entering={FadeIn.delay(index * 100)}
              style={[
                styles.segment,
                styles[`size_${size}` as keyof typeof styles] as ViewStyle,
                { backgroundColor: getColor(index) },
                index === currentStep - 1 && styles.segmentActive,
              ]}
            />
            {index < steps - 1 && <View style={styles.segmentGap} />}
          </React.Fragment>
        ))}
      </View>
      {labels && labels.length === steps && (
        <View style={styles.segmentLabels}>
          {labels.map((label, index) => (
            <Text
              key={index}
              style={[
                styles.segmentLabel,
                index < currentStep && styles.segmentLabelActive,
              ]}
            >
              {label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

// Circular Progress with better styling
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
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withSpring(clampedProgress, springConfig);
  }, [clampedProgress]);

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

  // Calculate progress arc (simplified without SVG)
  const innerSize = size - strokeWidth * 2;

  return (
    <View style={[styles.circularContainer, { width: size, height: size }]}>
      {/* Background circle */}
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
      {/* Progress indicator (visual representation) */}
      <View
        style={[
          styles.circularProgress,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: getColor(),
            borderTopColor: 'transparent',
            borderRightColor: clampedProgress > 25 ? getColor() : 'transparent',
            borderBottomColor: clampedProgress > 50 ? getColor() : 'transparent',
            borderLeftColor: clampedProgress > 75 ? getColor() : 'transparent',
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
      {/* Content */}
      <View style={[styles.circularContent, { width: innerSize, height: innerSize }]}>
        {children || (showLabel && (
          <View style={styles.circularLabelContainer}>
            <Text style={[styles.circularValue, { color: getColor() }]}>
              {Math.round(clampedProgress)}
            </Text>
            <Text style={styles.circularPercent}>%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// XP Progress Bar - gamified variant
interface XPProgressBarProps {
  currentXP: number;
  requiredXP: number;
  level: number;
  size?: ProgressBarSize;
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  currentXP,
  requiredXP,
  level,
  size = 'md',
}) => {
  const progress = (currentXP / requiredXP) * 100;

  return (
    <View style={styles.xpWrapper}>
      <View style={styles.xpHeader}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv.{level}</Text>
        </View>
        <Text style={styles.xpText}>
          {currentXP.toLocaleString()} / {requiredXP.toLocaleString()} XP
        </Text>
      </View>
      <ProgressBar
        progress={progress}
        variant="gradient"
        size={size}
        glowing={progress > 80}
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
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  percentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  container: {
    width: '100%',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  barContainer: {
    height: '100%',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  gradientBar: {
    flex: 1,
    borderRadius: borderRadius.full,
  },
  stripedBar: {
    // Striped effect would need a pattern or gradient
  },
  glow: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: '140%',
    borderRadius: 4,
    opacity: 0.6,
  },
  indeterminateBar: {
    position: 'absolute',
    width: '50%',
    height: '100%',
  },
  indeterminateGradient: {
    flex: 1,
    borderRadius: borderRadius.full,
  },

  // Sizes
  size_xs: {
    height: 4,
  },
  size_sm: {
    height: 6,
  },
  size_md: {
    height: 10,
  },
  size_lg: {
    height: 14,
  },

  // Segmented progress
  segmentedWrapper: {
    width: '100%',
  },
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segment: {
    flex: 1,
    borderRadius: borderRadius.full,
  },
  segmentActive: {
    transform: [{ scaleY: 1.2 }],
  },
  segmentGap: {
    width: 4,
  },
  segmentLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  segmentLabel: {
    fontSize: 11,
    color: colors.gray[400],
    textAlign: 'center',
    flex: 1,
  },
  segmentLabelActive: {
    color: colors.gray[700],
    fontWeight: '600',
  },

  // Circular progress
  circularContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularBackground: {
    position: 'absolute',
    borderColor: colors.gray[100],
  },
  circularProgress: {
    position: 'absolute',
  },
  circularContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularLabelContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  circularValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  circularPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 4,
  },

  // XP Progress Bar
  xpWrapper: {
    width: '100%',
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  xpText: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: '600',
  },
});

export default ProgressBar;
