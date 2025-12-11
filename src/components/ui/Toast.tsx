// filepath: /Users/sleepyet/BrainXP/src/components/ui/Toast.tsx
import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  SlideInUp,
  SlideOutUp,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'achievement';

interface ToastProps {
  visible: boolean;
  type?: ToastType;
  title: string;
  message?: string;
  icon?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss: () => void;
}

const toastConfig: Record<ToastType, { icon: string; colors: [string, string]; haptic: Haptics.NotificationFeedbackType }> = {
  success: {
    icon: '✓',
    colors: [colors.success[500], colors.success[600]],
    haptic: Haptics.NotificationFeedbackType.Success,
  },
  error: {
    icon: '✕',
    colors: [colors.danger[500], colors.danger[600]],
    haptic: Haptics.NotificationFeedbackType.Error,
  },
  warning: {
    icon: '⚠',
    colors: [colors.warning[500], colors.warning[600]],
    haptic: Haptics.NotificationFeedbackType.Warning,
  },
  info: {
    icon: 'ℹ',
    colors: [colors.primary[500], colors.primary[600]],
    haptic: Haptics.NotificationFeedbackType.Success,
  },
  achievement: {
    icon: '🏆',
    colors: ['#FFD700', '#FFA500'],
    haptic: Haptics.NotificationFeedbackType.Success,
  },
};

export const Toast: React.FC<ToastProps> = ({
  visible,
  type = 'info',
  title,
  message,
  icon,
  duration = 4000,
  action,
  onDismiss,
}) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const config = toastConfig[type];
  const displayIcon = icon || config.icon;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(config.haptic);
      translateY.value = withSpring(0, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 12 });

      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    translateY.value = withTiming(-100, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0.9, { duration: 200 }, () => {
      runOnJS(onDismiss)();
    });
  }, [onDismiss]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY < 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY < -50) {
        runOnJS(handleDismiss)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <LinearGradient
          colors={config.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{displayIcon}</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            {message && <Text style={styles.message}>{message}</Text>}
          </View>
          {action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                action.onPress();
                handleDismiss();
              }}
            >
              <Text style={styles.actionText}>{action.label}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.dismissIcon}>✕</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
};

// Achievement Toast - special variant for gamification
interface AchievementToastProps {
  visible: boolean;
  title: string;
  xpEarned?: number;
  streakCount?: number;
  onDismiss: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  visible,
  title,
  xpEarned,
  streakCount,
  onDismiss,
}) => {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
      rotate.value = withSequence(
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );

      const timer = setTimeout(onDismiss, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.achievementContainer}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onDismiss}>
        <Animated.View style={[styles.achievementCard, animatedStyle]}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.achievementGradient}
          >
            <Text style={styles.achievementIcon}>🏆</Text>
            <Text style={styles.achievementTitle}>{title}</Text>
            <View style={styles.achievementStats}>
              {xpEarned && (
                <View style={styles.achievementStat}>
                  <Text style={styles.achievementStatValue}>+{xpEarned}</Text>
                  <Text style={styles.achievementStatLabel}>XP</Text>
                </View>
              )}
              {streakCount && (
                <View style={styles.achievementStat}>
                  <Text style={styles.achievementStatValue}>🔥 {streakCount}</Text>
                  <Text style={styles.achievementStatLabel}>Streak</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Snackbar - simpler bottom notification
interface SnackbarProps {
  visible: boolean;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  duration?: number;
  onDismiss: () => void;
}

export const Snackbar: React.FC<SnackbarProps> = ({
  visible,
  message,
  action,
  duration = 3000,
  onDismiss,
}) => {
  const translateY = useSharedValue(100);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15 });
      
      if (duration > 0) {
        const timer = setTimeout(() => {
          translateY.value = withTiming(100, { duration: 200 });
          setTimeout(onDismiss, 200);
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.snackbar, animatedStyle]}>
      <Text style={styles.snackbarMessage}>{message}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text style={styles.snackbarAction}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  message: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    padding: 4,
  },
  dismissIcon: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Achievement Toast
  achievementContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  achievementCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  achievementGradient: {
    padding: 32,
    alignItems: 'center',
    minWidth: 250,
  },
  achievementIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  achievementTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  achievementStats: {
    flexDirection: 'row',
    gap: 24,
  },
  achievementStat: {
    alignItems: 'center',
  },
  achievementStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  achievementStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },

  // Snackbar
  snackbar: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: colors.gray[800],
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  snackbarMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  snackbarAction: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary[400],
    marginLeft: 16,
  },
});

export default Toast;
