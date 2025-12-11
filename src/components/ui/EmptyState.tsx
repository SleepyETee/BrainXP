// filepath: /Users/sleepyet/BrainXP/src/components/ui/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from './Button';
import { colors } from '../../theme/colors';

type EmptyStateVariant = 'default' | 'minimal' | 'illustrated' | 'celebration';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  variant?: EmptyStateVariant;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
  animated?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  variant = 'default',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
  animated = true,
}) => {
  const floatY = useSharedValue(0);

  React.useEffect(() => {
    if (animated && variant !== 'minimal') {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [animated, variant]);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const containerStyles = [
    styles.container,
    styles[`variant_${variant}` as keyof typeof styles],
    style,
  ];

  const renderIcon = () => {
    if (!icon) return null;

    if (variant === 'illustrated') {
      return (
        <Animated.View
          entering={animated ? FadeInDown.delay(100).springify() : undefined}
          style={[styles.illustratedIconContainer, floatingStyle]}
        >
          <LinearGradient
            colors={[colors.primary[100], colors.primary[50]]}
            style={styles.illustratedIconBg}
          >
            <Text style={styles.illustratedIcon}>{icon}</Text>
          </LinearGradient>
        </Animated.View>
      );
    }

    if (variant === 'celebration') {
      return (
        <Animated.View
          entering={animated ? FadeIn.delay(100).springify() : undefined}
          style={[styles.celebrationIconContainer, floatingStyle]}
        >
          <Text style={styles.celebrationIcon}>{icon}</Text>
          <View style={styles.sparkles}>
            <Text style={styles.sparkle}>✨</Text>
            <Text style={[styles.sparkle, styles.sparkleRight]}>✨</Text>
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        entering={animated ? FadeIn.delay(100) : undefined}
        style={styles.iconContainer}
      >
        <Text style={styles.icon}>{icon}</Text>
      </Animated.View>
    );
  };

  return (
    <View style={containerStyles}>
      {renderIcon()}

      <Animated.Text
        entering={animated ? FadeInUp.delay(200) : undefined}
        style={[
          styles.title,
          variant === 'minimal' && styles.titleMinimal,
          variant === 'celebration' && styles.titleCelebration,
        ]}
      >
        {title}
      </Animated.Text>

      {message && (
        <Animated.Text
          entering={animated ? FadeInUp.delay(300) : undefined}
          style={[styles.message, variant === 'minimal' && styles.messageMinimal]}
        >
          {message}
        </Animated.Text>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <Animated.View
          entering={animated ? FadeInUp.delay(400) : undefined}
          style={styles.actions}
        >
          {actionLabel && onAction && (
            <Button
              title={actionLabel}
              onPress={onAction}
              variant="primary"
              size="md"
              gradient
            />
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              title={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="ghost"
              size="md"
            />
          )}
        </Animated.View>
      )}
    </View>
  );
};

// Preset empty states for common scenarios
interface PresetEmptyStateProps {
  onAction?: () => void;
  style?: ViewStyle;
}

export const NoTasksEmptyState: React.FC<PresetEmptyStateProps> = ({ onAction, style }) => (
  <EmptyState
    icon="📋"
    title="No tasks yet"
    message="Add your first task to get started on your productivity journey!"
    actionLabel="+ Add Task"
    onAction={onAction}
    variant="illustrated"
    style={style}
  />
);

export const NoHabitsEmptyState: React.FC<PresetEmptyStateProps> = ({ onAction, style }) => (
  <EmptyState
    icon="🌱"
    title="Start a new habit"
    message="Build routines that stick. Small steps lead to big changes!"
    actionLabel="+ Create Habit"
    onAction={onAction}
    variant="illustrated"
    style={style}
  />
);

export const AllDoneEmptyState: React.FC<PresetEmptyStateProps> = ({ onAction, style }) => (
  <EmptyState
    icon="🎉"
    title="All caught up!"
    message="Amazing work! You've completed everything. Take a well-deserved break."
    variant="celebration"
    actionLabel="View Analytics"
    onAction={onAction}
    style={style}
  />
);

export const NoSearchResultsEmptyState: React.FC<{ query?: string; style?: ViewStyle }> = ({
  query,
  style,
}) => (
  <EmptyState
    icon="🔍"
    title="No results found"
    message={query ? `We couldn't find anything matching "${query}"` : 'Try a different search term'}
    variant="minimal"
    style={style}
  />
);

export const ErrorEmptyState: React.FC<PresetEmptyStateProps & { message?: string }> = ({
  onAction,
  message,
  style,
}) => (
  <EmptyState
    icon="😕"
    title="Something went wrong"
    message={message || "We're having trouble loading this. Please try again."}
    actionLabel="Try Again"
    onAction={onAction}
    variant="default"
    style={style}
  />
);

export const OfflineEmptyState: React.FC<PresetEmptyStateProps> = ({ onAction, style }) => (
  <EmptyState
    icon="📡"
    title="You're offline"
    message="Check your internet connection and try again."
    actionLabel="Retry"
    onAction={onAction}
    variant="default"
    style={style}
  />
);

export const ComingSoonEmptyState: React.FC<{ feature?: string; style?: ViewStyle }> = ({
  feature,
  style,
}) => (
  <EmptyState
    icon="🚀"
    title="Coming Soon!"
    message={feature ? `${feature} is on its way. Stay tuned!` : "We're working on something awesome!"}
    variant="illustrated"
    style={style}
  />
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  variant_default: {},
  variant_minimal: {
    padding: 24,
  },
  variant_illustrated: {
    paddingVertical: 48,
  },
  variant_celebration: {
    paddingVertical: 48,
  },

  // Icon styles
  iconContainer: {
    marginBottom: 20,
  },
  icon: {
    fontSize: 56,
  },
  illustratedIconContainer: {
    marginBottom: 28,
  },
  illustratedIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustratedIcon: {
    fontSize: 48,
  },
  celebrationIconContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  celebrationIcon: {
    fontSize: 72,
  },
  sparkles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 20,
    top: -10,
    left: -15,
  },
  sparkleRight: {
    left: 'auto',
    right: -15,
    top: 5,
  },

  // Text styles
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[800],
    textAlign: 'center',
    marginBottom: 10,
  },
  titleMinimal: {
    fontSize: 18,
  },
  titleCelebration: {
    fontSize: 26,
    color: colors.primary[600],
  },
  message: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  messageMinimal: {
    fontSize: 14,
    maxWidth: 240,
  },

  // Actions
  actions: {
    marginTop: 28,
    gap: 12,
    alignItems: 'center',
  },
});

export default EmptyState;
