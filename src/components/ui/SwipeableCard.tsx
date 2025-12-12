import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { useSettingsStore } from '../../stores/settingsStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 80;

interface SwipeAction {
  icon: string;
  label?: string;
  color: string;
  onPress: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
  style?: ViewStyle;
  enabled?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = SWIPE_THRESHOLD,
  style,
  enabled = true,
}) => {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const { settings } = useSettingsStore();

  const triggerHaptic = useCallback(
    (impactStyle: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
      if (settings.hapticFeedback) {
        Haptics.impactAsync(impactStyle);
      }
    },
    [settings.hapticFeedback]
  );

  const maxLeftSwipe = leftActions.length * ACTION_WIDTH;
  const maxRightSwipe = rightActions.length * ACTION_WIDTH;

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const newValue = startX.value + event.translationX;
      
      // Limit swipe based on available actions
      if (newValue > 0 && leftActions.length === 0) {
        translateX.value = 0;
      } else if (newValue < 0 && rightActions.length === 0) {
        translateX.value = 0;
      } else {
        // Apply resistance at the edges
        if (newValue > maxLeftSwipe) {
          translateX.value = maxLeftSwipe + (newValue - maxLeftSwipe) * 0.3;
        } else if (newValue < -maxRightSwipe) {
          translateX.value = -maxRightSwipe + (newValue + maxRightSwipe) * 0.3;
        } else {
          translateX.value = newValue;
        }
      }
    })
    .onEnd((event) => {
      // Check for full swipe actions
      if (event.translationX > swipeThreshold * 2 && onSwipeRight) {
        runOnJS(triggerHaptic)(Haptics.ImpactFeedbackStyle.Medium);
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 });
        runOnJS(onSwipeRight)();
        return;
      }
      
      if (event.translationX < -swipeThreshold * 2 && onSwipeLeft) {
        runOnJS(triggerHaptic)(Haptics.ImpactFeedbackStyle.Medium);
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
        runOnJS(onSwipeLeft)();
        return;
      }

      // Snap to action buttons or close
      if (translateX.value > swipeThreshold && leftActions.length > 0) {
        runOnJS(triggerHaptic)(Haptics.ImpactFeedbackStyle.Light);
        translateX.value = withSpring(maxLeftSwipe, { damping: 20 });
      } else if (translateX.value < -swipeThreshold && rightActions.length > 0) {
        runOnJS(triggerHaptic)(Haptics.ImpactFeedbackStyle.Light);
        translateX.value = withSpring(-maxRightSwipe, { damping: 20 });
      } else {
        translateX.value = withSpring(0, { damping: 20 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftActionsStyle = useAnimatedStyle(() => {
    const width = interpolate(
      translateX.value,
      [0, maxLeftSwipe],
      [0, maxLeftSwipe],
      Extrapolation.CLAMP
    );
    return {
      width: Math.max(0, width),
      opacity: interpolate(translateX.value, [0, 40], [0, 1], Extrapolation.CLAMP),
    };
  });

  const rightActionsStyle = useAnimatedStyle(() => {
    const width = interpolate(
      translateX.value,
      [-maxRightSwipe, 0],
      [maxRightSwipe, 0],
      Extrapolation.CLAMP
    );
    return {
      width: Math.max(0, width),
      opacity: interpolate(translateX.value, [-40, 0], [1, 0], Extrapolation.CLAMP),
    };
  });

  const handleActionPress = useCallback((action: SwipeAction) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    translateX.value = withSpring(0, { damping: 20 });
    action.onPress();
  }, [triggerHaptic]);

  const renderAction = (action: SwipeAction, index: number, isLeft: boolean) => (
    <Animated.View
      key={index}
      style={[
        styles.actionButton,
        { backgroundColor: action.color },
        isLeft ? styles.leftAction : styles.rightAction,
      ]}
    >
      <Text
        style={styles.actionIcon}
        onPress={() => handleActionPress(action)}
      >
        {action.icon}
      </Text>
      {action.label && <Text style={styles.actionLabel}>{action.label}</Text>}
    </Animated.View>
  );

  if (!enabled) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={[styles.container, style]}>
      {/* Left actions (shown when swiping right) */}
      {leftActions.length > 0 && (
        <Animated.View style={[styles.actionsContainer, styles.leftActions, leftActionsStyle]}>
          {leftActions.map((action, index) => renderAction(action, index, true))}
        </Animated.View>
      )}

      {/* Right actions (shown when swiping left) */}
      {rightActions.length > 0 && (
        <Animated.View style={[styles.actionsContainer, styles.rightActions, rightActionsStyle]}>
          {rightActions.map((action, index) => renderAction(action, index, false))}
        </Animated.View>
      )}

      {/* Main card content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// Pre-configured swipeable variants
interface TaskSwipeableProps {
  children: React.ReactNode;
  onComplete?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  style?: ViewStyle;
}

export const TaskSwipeable: React.FC<TaskSwipeableProps> = ({
  children,
  onComplete,
  onDelete,
  onEdit,
  style,
}) => {
  const leftActions: SwipeAction[] = onComplete
    ? [{ icon: '✓', label: 'Done', color: colors.success[500], onPress: onComplete }]
    : [];

  const rightActions: SwipeAction[] = [
    ...(onEdit ? [{ icon: '✏️', color: colors.primary[500], onPress: onEdit }] : []),
    ...(onDelete ? [{ icon: '🗑️', color: colors.danger[500], onPress: onDelete }] : []),
  ];

  return (
    <SwipeableCard
      leftActions={leftActions}
      rightActions={rightActions}
      onSwipeRight={onComplete}
      style={style}
    >
      {children}
    </SwipeableCard>
  );
};

export const HabitSwipeable: React.FC<TaskSwipeableProps> = ({
  children,
  onComplete,
  onDelete,
  onEdit,
  style,
}) => {
  const leftActions: SwipeAction[] = onComplete
    ? [{ icon: '🎯', label: 'Log', color: colors.accent[500], onPress: onComplete }]
    : [];

  const rightActions: SwipeAction[] = [
    ...(onEdit ? [{ icon: '⚙️', color: colors.gray[500], onPress: onEdit }] : []),
    ...(onDelete ? [{ icon: '🗑️', color: colors.danger[500], onPress: onDelete }] : []),
  ];

  return (
    <SwipeableCard
      leftActions={leftActions}
      rightActions={rightActions}
      onSwipeRight={onComplete}
      style={style}
    >
      {children}
    </SwipeableCard>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...shadows.sm,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 12,
  },
  leftActions: {
    left: 0,
    justifyContent: 'flex-start',
  },
  rightActions: {
    right: 0,
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: ACTION_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftAction: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  rightAction: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
});

export default SwipeableCard;
