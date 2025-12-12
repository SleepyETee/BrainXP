// filepath: /Users/sleepyet/BrainXP/src/components/ui/ProgressStepper.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface Step {
  title: string;
  subtitle?: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
  variant?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

/**
 * ProgressStepper Component
 * 
 * Breaks down complex processes into manageable steps.
 * Follows UX best practices:
 * - Clear progress indication
 * - Visual feedback for completed steps
 * - Reduces cognitive load
 */
export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  currentStep,
  variant = 'horizontal',
  showLabels = true,
  size = 'md',
  style,
}) => {
  const sizeConfig = {
    sm: { circle: 24, fontSize: 11, iconSize: 14, lineHeight: 2 },
    md: { circle: 32, fontSize: 13, iconSize: 18, lineHeight: 3 },
    lg: { circle: 40, fontSize: 15, iconSize: 22, lineHeight: 4 },
  };

  const config = sizeConfig[size];
  const isVertical = variant === 'vertical';

  const getStepStatus = (index: number): 'completed' | 'current' | 'upcoming' => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'upcoming';
  };

  const renderStepIndicator = (index: number) => {
    const status = getStepStatus(index);

    return (
      <View
        style={[
          styles.stepCircle,
          {
            width: config.circle,
            height: config.circle,
            borderRadius: config.circle / 2,
          },
          status === 'completed' && styles.stepCompleted,
          status === 'current' && styles.stepCurrent,
          status === 'upcoming' && styles.stepUpcoming,
        ]}
        accessible
        accessibilityRole="text"
        accessibilityLabel={`Step ${index + 1} of ${steps.length}: ${steps[index].title}, ${status}`}
      >
        {status === 'completed' ? (
          <Ionicons name="checkmark" size={config.iconSize} color="#FFFFFF" />
        ) : (
          <Text
            style={[
              styles.stepNumber,
              { fontSize: config.fontSize },
              status === 'current' && styles.stepNumberCurrent,
              status === 'upcoming' && styles.stepNumberUpcoming,
            ]}
          >
            {index + 1}
          </Text>
        )}
      </View>
    );
  };

  const renderConnector = (index: number) => {
    if (index === steps.length - 1) return null;

    const isCompleted = index < currentStep;

    if (isVertical) {
      return (
        <View
          style={[
            styles.verticalConnector,
            { width: config.lineHeight },
            isCompleted && styles.connectorCompleted,
          ]}
        />
      );
    }

    return (
      <View
        style={[
          styles.horizontalConnector,
          { height: config.lineHeight },
          isCompleted && styles.connectorCompleted,
        ]}
      />
    );
  };

  if (isVertical) {
    return (
      <View style={[styles.verticalContainer, style]}>
        {steps.map((step, index) => (
          <View key={index} style={styles.verticalStep}>
            <View style={styles.verticalIndicatorColumn}>
              {renderStepIndicator(index)}
              {renderConnector(index)}
            </View>
            {showLabels && (
              <View style={styles.verticalLabels}>
                <Text
                  style={[
                    styles.stepTitle,
                    { fontSize: config.fontSize + 1 },
                    getStepStatus(index) === 'current' && styles.stepTitleCurrent,
                    getStepStatus(index) === 'upcoming' && styles.stepTitleUpcoming,
                  ]}
                >
                  {step.title}
                </Text>
                {step.subtitle && (
                  <Text style={[styles.stepSubtitle, { fontSize: config.fontSize - 1 }]}>
                    {step.subtitle}
                  </Text>
                )}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.horizontalContainer, style]}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <View style={styles.horizontalStep}>
            {renderStepIndicator(index)}
            {showLabels && (
              <Text
                style={[
                  styles.horizontalLabel,
                  { fontSize: config.fontSize - 1 },
                  getStepStatus(index) === 'current' && styles.stepTitleCurrent,
                  getStepStatus(index) === 'upcoming' && styles.stepTitleUpcoming,
                ]}
                numberOfLines={1}
              >
                {step.title}
              </Text>
            )}
          </View>
          {renderConnector(index)}
        </React.Fragment>
      ))}
    </View>
  );
};

/**
 * Simple progress bar variant
 */
interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  animated?: boolean;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color = colors.primary[500],
  backgroundColor = colors.gray[200],
  showLabel = false,
  animated = true,
  style,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const animatedStyle = useAnimatedStyle(() => ({
    width: animated
      ? withSpring(`${clampedProgress}%`, { damping: 15, stiffness: 100 })
      : `${clampedProgress}%`,
  }));

  return (
    <View style={style}>
      <View
        style={[
          styles.progressBarContainer,
          { height, backgroundColor, borderRadius: height / 2 },
        ]}
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: clampedProgress }}
      >
        <Animated.View
          style={[
            styles.progressBarFill,
            { backgroundColor: color, borderRadius: height / 2 },
            animatedStyle,
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.progressLabel}>{Math.round(clampedProgress)}%</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Horizontal layout
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  horizontalStep: {
    alignItems: 'center',
    flex: 0,
  },
  horizontalConnector: {
    flex: 1,
    backgroundColor: colors.gray[200],
    marginHorizontal: 8,
    marginTop: 16, // Half of default circle size
    alignSelf: 'flex-start',
  },
  horizontalLabel: {
    marginTop: 8,
    color: colors.gray[700],
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 80,
  },

  // Vertical layout
  verticalContainer: {
    flexDirection: 'column',
  },
  verticalStep: {
    flexDirection: 'row',
  },
  verticalIndicatorColumn: {
    alignItems: 'center',
  },
  verticalConnector: {
    flex: 1,
    minHeight: 32,
    backgroundColor: colors.gray[200],
    marginVertical: 4,
  },
  verticalLabels: {
    marginLeft: 16,
    paddingTop: 4,
    flex: 1,
  },

  // Step circle
  stepCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stepCompleted: {
    backgroundColor: colors.success[500],
    borderColor: colors.success[500],
  },
  stepCurrent: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  stepUpcoming: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.gray[300],
  },

  // Step number
  stepNumber: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepNumberCurrent: {
    color: '#FFFFFF',
  },
  stepNumberUpcoming: {
    color: colors.gray[400],
  },

  // Step text
  stepTitle: {
    fontWeight: '600',
    color: colors.gray[800],
  },
  stepTitleCurrent: {
    color: colors.primary[600],
  },
  stepTitleUpcoming: {
    color: colors.gray[400],
  },
  stepSubtitle: {
    color: colors.gray[500],
    marginTop: 2,
  },

  // Connector completed state
  connectorCompleted: {
    backgroundColor: colors.success[500],
  },

  // Progress bar
  progressBarContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  progressLabel: {
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'right',
  },
});

export default ProgressStepper;
