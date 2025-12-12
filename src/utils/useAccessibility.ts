import { useState, useEffect, useCallback, useRef } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * useAccessibility - Comprehensive accessibility hook for ADHD-friendly apps
 * 
 * This hook provides:
 * - Screen reader status detection
 * - Reduced motion preference
 * - Haptic feedback helpers
 * - Accessibility announcements
 * - Text scaling
 * - Focus management helpers
 * 
 * Usage:
 * const { announce, haptic, isScreenReaderEnabled, textScale, reduceMotion } = useAccessibility();
 */

interface UseAccessibilityOptions {
  /** Debounce announcements to avoid spam (ms) */
  announcementDebounce?: number;
}

interface AccessibilityHelpers {
  // State
  isScreenReaderEnabled: boolean;
  reduceMotion: boolean;
  largeText: boolean;
  highContrast: boolean;
  textScale: number;
  
  // Haptic helpers
  haptic: {
    light: () => Promise<void>;
    medium: () => Promise<void>;
    heavy: () => Promise<void>;
    success: () => Promise<void>;
    warning: () => Promise<void>;
    error: () => Promise<void>;
    selection: () => Promise<void>;
  };
  
  // Announcement helpers
  announce: (message: string, options?: { force?: boolean; polite?: boolean }) => void;
  announceForScreenReader: (message: string) => void;
  
  // Animation helpers
  getAnimationDuration: (baseDuration: number) => number;
  shouldAnimate: boolean;
  
  // Text helpers
  scaledFontSize: (baseSize: number) => number;
  
  // Focus helpers
  focusOnElement: (ref: React.RefObject<any>) => void;
}

export const useAccessibility = (
  options: UseAccessibilityOptions = {}
): AccessibilityHelpers => {
  const { announcementDebounce = 500 } = options;

  // Get settings from store
  const settings = useSettingsStore((state) => state.settings);
  const {
    reduceMotion,
    largeText,
    highContrast,
    textScaling,
    hapticFeedback,
    animationSpeed,
  } = settings;

  // Screen reader state
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  
  // Track last announcement to prevent duplicates
  const lastAnnouncementRef = useRef<string>('');
  const lastAnnouncementTimeRef = useRef<number>(0);

  // Check screen reader status on mount
  useEffect(() => {
    const checkScreenReader = async () => {
      try {
        const enabled = await AccessibilityInfo.isScreenReaderEnabled();
        setIsScreenReaderEnabled(enabled);
      } catch (error) {
        console.warn('Failed to check screen reader status:', error);
      }
    };

    checkScreenReader();

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    return () => subscription.remove();
  }, []);

  // Haptic feedback helpers
  const haptic = {
    light: useCallback(async () => {
      if (hapticFeedback) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, [hapticFeedback]),

    medium: useCallback(async () => {
      if (hapticFeedback) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }, [hapticFeedback]),

    heavy: useCallback(async () => {
      if (hapticFeedback) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }, [hapticFeedback]),

    success: useCallback(async () => {
      if (hapticFeedback) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, [hapticFeedback]),

    warning: useCallback(async () => {
      if (hapticFeedback) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }, [hapticFeedback]),

    error: useCallback(async () => {
      if (hapticFeedback) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }, [hapticFeedback]),

    selection: useCallback(async () => {
      if (hapticFeedback) {
        await Haptics.selectionAsync();
      }
    }, [hapticFeedback]),
  };

  // Announcement helper with debouncing
  const announce = useCallback(
    (message: string, options: { force?: boolean; polite?: boolean } = {}) => {
      const { force = false, polite = true } = options;
      const now = Date.now();

      // Skip duplicate announcements unless forced
      if (!force) {
        if (message === lastAnnouncementRef.current) {
          return;
        }
        if (now - lastAnnouncementTimeRef.current < announcementDebounce) {
          return;
        }
      }

      lastAnnouncementRef.current = message;
      lastAnnouncementTimeRef.current = now;

      AccessibilityInfo.announceForAccessibility(message);
    },
    [announcementDebounce]
  );

  // Screen reader only announcement (for important updates)
  const announceForScreenReader = useCallback(
    (message: string) => {
      if (isScreenReaderEnabled) {
        announce(message, { force: true });
      }
    },
    [isScreenReaderEnabled, announce]
  );

  // Animation duration based on settings
  const getAnimationDuration = useCallback(
    (baseDuration: number): number => {
      if (reduceMotion || animationSpeed === 'none') {
        return 0;
      }

      const multipliers: Record<string, number> = {
        slow: 1.5,
        normal: 1,
        fast: 0.5,
        none: 0,
      };

      return baseDuration * (multipliers[animationSpeed] || 1);
    },
    [reduceMotion, animationSpeed]
  );

  // Whether animations should run
  const shouldAnimate = !reduceMotion && animationSpeed !== 'none';

  // Scaled font size helper
  const scaledFontSize = useCallback(
    (baseSize: number): number => {
      const scale = largeText ? 1.2 : textScaling || 1;
      return Math.round(baseSize * scale);
    },
    [largeText, textScaling]
  );

  // Focus management helper
  const focusOnElement = useCallback((ref: React.RefObject<any>) => {
    if (ref.current && isScreenReaderEnabled) {
      // For React Native, we use AccessibilityInfo.setAccessibilityFocus
      if (Platform.OS === 'ios') {
        AccessibilityInfo.setAccessibilityFocus(ref.current);
      } else {
        // Android: sendAccessibilityEvent is handled differently
        ref.current.focus?.();
      }
    }
  }, [isScreenReaderEnabled]);

  return {
    // State
    isScreenReaderEnabled,
    reduceMotion,
    largeText,
    highContrast,
    textScale: textScaling || 1,

    // Helpers
    haptic,
    announce,
    announceForScreenReader,
    getAnimationDuration,
    shouldAnimate,
    scaledFontSize,
    focusOnElement,
  };
};

/**
 * useReducedMotion - Simple hook for checking reduced motion preference
 */
export const useReducedMotion = (): boolean => {
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);
  return reduceMotion;
};

/**
 * useLargeText - Hook for checking large text preference
 */
export const useLargeText = (): { enabled: boolean; scale: number } => {
  const largeText = useSettingsStore((state) => state.settings.largeText);
  const textScaling = useSettingsStore((state) => state.settings.textScaling);
  
  return {
    enabled: largeText,
    scale: largeText ? 1.2 : textScaling || 1,
  };
};

/**
 * useHaptics - Simple haptic feedback hook
 */
export const useHaptics = () => {
  const hapticFeedback = useSettingsStore((state) => state.settings.hapticFeedback);

  return {
    enabled: hapticFeedback,
    impact: useCallback(
      async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
        if (!hapticFeedback) return;
        const styleMap = {
          light: Haptics.ImpactFeedbackStyle.Light,
          medium: Haptics.ImpactFeedbackStyle.Medium,
          heavy: Haptics.ImpactFeedbackStyle.Heavy,
        };
        await Haptics.impactAsync(styleMap[style]);
      },
      [hapticFeedback]
    ),
    notification: useCallback(
      async (type: 'success' | 'warning' | 'error' = 'success') => {
        if (!hapticFeedback) return;
        const typeMap = {
          success: Haptics.NotificationFeedbackType.Success,
          warning: Haptics.NotificationFeedbackType.Warning,
          error: Haptics.NotificationFeedbackType.Error,
        };
        await Haptics.notificationAsync(typeMap[type]);
      },
      [hapticFeedback]
    ),
    selection: useCallback(async () => {
      if (!hapticFeedback) return;
      await Haptics.selectionAsync();
    }, [hapticFeedback]),
  };
};

export default useAccessibility;
