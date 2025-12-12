// filepath: /Users/sleepyet/BrainXP/src/components/ui/Toast.tsx
import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, shadows } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss: () => void;
  position?: 'top' | 'bottom';
}

const toastConfig: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }> = {
  success: {
    icon: 'checkmark-circle',
    color: colors.success[600],
    bgColor: colors.success[50],
  },
  error: {
    icon: 'close-circle',
    color: colors.danger[600],
    bgColor: colors.danger[50],
  },
  warning: {
    icon: 'warning',
    color: colors.warning[600],
    bgColor: colors.warning[50],
  },
  info: {
    icon: 'information-circle',
    color: colors.primary[600],
    bgColor: colors.primary[50],
  },
};

/**
 * Toast Component
 * 
 * Non-intrusive notifications with:
 * - Auto-dismiss with configurable duration
 * - Haptic feedback
 * - Action button support
 * - Swipe to dismiss
 * - Accessible announcements
 */
export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  title,
  duration = 4000,
  action,
  onDismiss,
  position = 'bottom',
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(position === 'top' ? -100 : 100);
  const opacity = useSharedValue(0);

  const config = toastConfig[type];

  const show = useCallback(() => {
    translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });

    // Haptic feedback based on type
    if (type === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'warning') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [type, position]);

  const hide = useCallback(() => {
    translateY.value = withSpring(position === 'top' ? -100 : 100, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)();
      }
    });
  }, [position, onDismiss]);

  useEffect(() => {
    if (visible) {
      show();

      if (duration > 0) {
        const timeout = setTimeout(() => {
          hide();
        }, duration);
        return () => clearTimeout(timeout);
      }
    } else {
      hide();
    }
  }, [visible, duration, show, hide]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleActionPress = useCallback(() => {
    action?.onPress();
    hide();
  }, [action, hide]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? { top: insets.top + 8 } : { bottom: insets.bottom + 16 },
        animatedStyle,
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Pressable onPress={hide} style={[styles.toast, { backgroundColor: config.bgColor }, shadows.md]}>
        <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
          <Ionicons name={config.icon} size={20} color="#FFFFFF" />
        </View>

        <View style={styles.content}>
          {title && <Text style={[styles.title, { color: config.color }]}>{title}</Text>}
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>

        {action && (
          <Pressable
            onPress={handleActionPress}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.actionText, { color: config.color }]}>{action.label}</Text>
          </Pressable>
        )}

        <Pressable
          onPress={hide}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Dismiss notification"
        >
          <Ionicons name="close" size={18} color={colors.gray[400]} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    maxWidth: SCREEN_WIDTH - 32,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
});

/**
 * Hook for managing toast state
 */
export const useToast = () => {
  const [toastState, setToastState] = React.useState<{
    visible: boolean;
    message: string;
    type: ToastType;
    title?: string;
    duration?: number;
    action?: { label: string; onPress: () => void };
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback((
    message: string,
    options?: {
      type?: ToastType;
      title?: string;
      duration?: number;
      action?: { label: string; onPress: () => void };
    }
  ) => {
    setToastState({
      visible: true,
      message,
      type: options?.type || 'info',
      title: options?.title,
      duration: options?.duration,
      action: options?.action,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastState(prev => ({ ...prev, visible: false }));
  }, []);

  const success = useCallback((message: string, options?: Omit<Parameters<typeof showToast>[1], 'type'>) => {
    showToast(message, { ...options, type: 'success' });
  }, [showToast]);

  const error = useCallback((message: string, options?: Omit<Parameters<typeof showToast>[1], 'type'>) => {
    showToast(message, { ...options, type: 'error' });
  }, [showToast]);

  const warning = useCallback((message: string, options?: Omit<Parameters<typeof showToast>[1], 'type'>) => {
    showToast(message, { ...options, type: 'warning' });
  }, [showToast]);

  const info = useCallback((message: string, options?: Omit<Parameters<typeof showToast>[1], 'type'>) => {
    showToast(message, { ...options, type: 'info' });
  }, [showToast]);

  return {
    toastState,
    showToast,
    hideToast,
    success,
    error,
    warning,
    info,
  };
};

export default Toast;
