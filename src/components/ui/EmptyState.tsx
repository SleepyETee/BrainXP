import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { AnimatedButton } from './AnimatedButton';
import { TOUCH_TARGETS } from '../../utils/uxHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EmptyStateProps {
  // Content
  emoji?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  // Action
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  // Appearance
  variant?: 'default' | 'compact' | 'fullscreen';
  illustration?: React.ReactNode;
  style?: ViewStyle;
  // Accessibility
  accessibilityLabel?: string;
}

/**
 * EmptyState Component
 * 
 * Displays helpful messaging when there's no content to show.
 * Follows UX best practices:
 * - Clear explanation of why it's empty
 * - Actionable next step
 * - Friendly, encouraging tone
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  emoji,
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
  illustration,
  style,
  accessibilityLabel,
}) => {
  const isCompact = variant === 'compact';
  const isFullscreen = variant === 'fullscreen';

  const containerStyles = [
    styles.container,
    isCompact && styles.containerCompact,
    isFullscreen && styles.containerFullscreen,
    style,
  ];

  return (
    <View 
      style={containerStyles}
      accessible
      accessibilityLabel={accessibilityLabel || `${title}. ${description || ''}`}
      accessibilityRole="text"
    >
      {/* Illustration or Icon */}
      <Animated.View 
        entering={FadeInDown.delay(100).springify()}
        style={styles.illustrationContainer}
      >
        {illustration ? (
          illustration
        ) : emoji ? (
          <View style={[styles.emojiContainer, isCompact && styles.emojiContainerCompact]}>
            <Text style={[styles.emoji, isCompact && styles.emojiCompact]}>{emoji}</Text>
          </View>
        ) : icon ? (
          <View style={[styles.iconContainer, isCompact && styles.iconContainerCompact]}>
            <Ionicons 
              name={icon} 
              size={isCompact ? 32 : 48} 
              color={colors.gray[400]} 
            />
          </View>
        ) : null}
      </Animated.View>

      {/* Text Content */}
      <Animated.View 
        entering={FadeInDown.delay(200).springify()}
        style={styles.textContainer}
      >
        <Text style={[styles.title, isCompact && styles.titleCompact]}>
          {title}
        </Text>
        {description && (
          <Text style={[styles.description, isCompact && styles.descriptionCompact]}>
            {description}
          </Text>
        )}
      </Animated.View>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <Animated.View 
          entering={FadeInUp.delay(300).springify()}
          style={[styles.actionsContainer, isCompact && styles.actionsContainerCompact]}
        >
          {actionLabel && onAction && (
            <AnimatedButton
              title={actionLabel}
              onPress={onAction}
              variant="primary"
              size={isCompact ? 'sm' : 'md'}
              style={styles.primaryAction}
            />
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <AnimatedButton
              title={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="ghost"
              size={isCompact ? 'sm' : 'md'}
            />
          )}
        </Animated.View>
      )}
    </View>
  );
};

/**
 * Pre-built empty states for common scenarios
 */

export const NoTasksEmptyState: React.FC<{ onAddTask?: () => void }> = ({ onAddTask }) => (
  <EmptyState
    emoji="✨"
    title="All caught up!"
    description="You have no tasks right now. Enjoy the moment or add something new."
    actionLabel="+ Add Task"
    onAction={onAddTask}
  />
);

export const NoHabitsEmptyState: React.FC<{ onAddHabit?: () => void }> = ({ onAddHabit }) => (
  <EmptyState
    emoji="🌱"
    title="Start building habits"
    description="Small daily actions lead to big changes. Create your first habit to get started."
    actionLabel="+ Create Habit"
    onAction={onAddHabit}
  />
);

export const NoSearchResultsEmptyState: React.FC<{ query?: string; onClear?: () => void }> = ({ 
  query, 
  onClear 
}) => (
  <EmptyState
    icon="search-outline"
    title="No results found"
    description={query ? `We couldn't find anything matching "${query}"` : 'Try adjusting your search terms'}
    actionLabel="Clear Search"
    onAction={onClear}
    variant="compact"
  />
);

export const ErrorEmptyState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    emoji="😅"
    title="Something went wrong"
    description="We had trouble loading this. Please try again."
    actionLabel="Retry"
    onAction={onRetry}
  />
);

export const OfflineEmptyState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    icon="cloud-offline-outline"
    title="You're offline"
    description="Check your connection and try again."
    actionLabel="Retry"
    onAction={onRetry}
  />
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  containerCompact: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  containerFullscreen: {
    flex: 1,
    paddingVertical: 0,
  },
  illustrationContainer: {
    marginBottom: 20,
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiContainerCompact: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  emoji: {
    fontSize: 40,
  },
  emojiCompact: {
    fontSize: 28,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerCompact: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  titleCompact: {
    fontSize: 16,
    marginBottom: 4,
  },
  description: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  descriptionCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionsContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  actionsContainerCompact: {
    marginTop: 16,
    gap: 8,
  },
  primaryAction: {
    minWidth: 160,
  },
});

export default EmptyState;
