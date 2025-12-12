// filepath: /Users/sleepyet/BrainXP/src/utils/accessibility.ts
// Accessibility Utilities - Reusable hooks and functions for accessibility support
import { useEffect, useCallback, useRef } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';

// ============================================================================
// Screen Reader Announcements
// ============================================================================

/**
 * Announce a message to screen readers with debouncing to prevent spam
 */
export const announce = (message: string, delay = 0): void => {
  if (delay > 0) {
    setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(message);
    }, delay);
  } else {
    AccessibilityInfo.announceForAccessibility(message);
  }
};

/**
 * Hook for making announcements with automatic cleanup
 */
export const useAccessibilityAnnouncement = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const announceWithDelay = useCallback((message: string, delay = 0) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        AccessibilityInfo.announceForAccessibility(message);
      }, delay);
    } else {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { announce: announceWithDelay };
};

// ============================================================================
// Timer Announcements
// ============================================================================

/**
 * Format time remaining for screen reader announcement
 */
export const formatTimeForAnnouncement = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''} remaining`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
  }

  return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''} remaining`;
};

/**
 * Hook for announcing timer progress at key intervals
 */
export const useTimerAnnouncements = (
  remainingSeconds: number,
  isActive: boolean,
  isPaused: boolean
) => {
  const { announce: makeAnnouncement } = useAccessibilityAnnouncement();
  const lastAnnouncedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || isPaused) return;

    // Announce at key milestones
    const milestones = [
      { seconds: 60 * 30, message: '30 minutes remaining' },
      { seconds: 60 * 15, message: '15 minutes remaining' },
      { seconds: 60 * 10, message: '10 minutes remaining' },
      { seconds: 60 * 5, message: '5 minutes remaining' },
      { seconds: 60 * 2, message: '2 minutes remaining' },
      { seconds: 60, message: '1 minute remaining' },
      { seconds: 30, message: '30 seconds remaining' },
      { seconds: 10, message: '10 seconds remaining' },
    ];

    const milestone = milestones.find((m) => m.seconds === remainingSeconds);
    if (milestone && lastAnnouncedRef.current !== remainingSeconds) {
      makeAnnouncement(milestone.message);
      lastAnnouncedRef.current = remainingSeconds;
    }

    // Announce completion
    if (remainingSeconds === 0 && lastAnnouncedRef.current !== 0) {
      makeAnnouncement('Timer complete. Great work!');
      lastAnnouncedRef.current = 0;
    }
  }, [remainingSeconds, isActive, isPaused, makeAnnouncement]);
};

// ============================================================================
// Reduced Motion Support
// ============================================================================

/**
 * Hook that returns whether reduced motion is preferred
 * Combines system preference with app settings
 */
export const useReducedMotion = (): boolean => {
  const settingsReduceMotion = useSettingsStore((state) => state.settings.reduceMotion);
  return settingsReduceMotion;
};

/**
 * Get animation duration based on reduced motion preference
 */
export const getAnimationDuration = (
  normalDuration: number,
  reduceMotion: boolean
): number => {
  return reduceMotion ? 0 : normalDuration;
};

/**
 * Get animation config based on reduced motion preference
 */
export const getAnimationConfig = (reduceMotion: boolean) => ({
  duration: reduceMotion ? 0 : undefined,
  skipAnimation: reduceMotion,
});

// ============================================================================
// Focus Management
// ============================================================================

/**
 * Accessibility roles mapped by component type
 */
export const accessibilityRoles = {
  timer: 'timer' as const,
  progressBar: 'progressbar' as const,
  button: 'button' as const,
  header: 'header' as const,
  alert: 'alert' as const,
  status: 'text' as const,
} as const;

/**
 * Generate accessibility label for a focus session
 */
export const getFocusSessionLabel = (
  remainingSeconds: number,
  isActive: boolean,
  isPaused: boolean,
  taskDescription?: string
): string => {
  const timeLabel = formatTimeForAnnouncement(remainingSeconds);
  const statusLabel = isPaused ? 'Paused' : isActive ? 'Active' : 'Ready';
  const taskLabel = taskDescription ? `, working on ${taskDescription}` : '';

  return `Focus timer. ${statusLabel}. ${timeLabel}${taskLabel}`;
};

// ============================================================================
// Body Doubling Accessibility
// ============================================================================

/**
 * Generate accessibility label for body doubling companion
 */
export const getBodyDoublingLabel = (
  isConnected: boolean,
  companionName?: string,
  companionStatus?: 'focusing' | 'break' | 'idle'
): string => {
  if (!isConnected) {
    return 'Body doubling companion not connected. Tap to find a focus partner.';
  }

  const statusText = {
    focusing: 'currently focusing',
    break: 'on a break',
    idle: 'available',
  }[companionStatus || 'idle'];

  return `Connected with ${companionName || 'a companion'}, ${statusText}. You are not alone.`;
};

/**
 * Announce body doubling status changes
 */
export const announceBodyDoublingChange = (
  event: 'connected' | 'disconnected' | 'companion_started' | 'companion_finished' | 'companion_break',
  companionName?: string
): void => {
  const messages = {
    connected: `Connected with ${companionName || 'a focus companion'}. You're not alone!`,
    disconnected: 'Focus companion disconnected.',
    companion_started: `${companionName || 'Your companion'} started focusing. Let's focus together!`,
    companion_finished: `${companionName || 'Your companion'} finished their session. Great teamwork!`,
    companion_break: `${companionName || 'Your companion'} is taking a break.`,
  };

  announce(messages[event]);
};

// ============================================================================
// Haptic Feedback Helpers
// ============================================================================

export const hapticPatterns = {
  /** Light tap for selections */
  selection: 'selection' as const,
  /** Success feedback */
  success: 'success' as const,
  /** Warning feedback */
  warning: 'warning' as const,
  /** Error feedback */
  error: 'error' as const,
  /** Light impact */
  light: 'light' as const,
  /** Medium impact */
  medium: 'medium' as const,
  /** Heavy impact */
  heavy: 'heavy' as const,
} as const;

export type HapticPattern = keyof typeof hapticPatterns;

// ============================================================================
// Live Region Helpers
// ============================================================================

/**
 * Props for accessible live regions
 */
export const getLiveRegionProps = (priority: 'polite' | 'assertive' = 'polite') => ({
  accessibilityLiveRegion: priority,
  accessible: true,
});

/**
 * Props for accessible buttons
 */
export const getButtonAccessibilityProps = (
  label: string,
  hint?: string,
  disabled = false
) => ({
  accessible: true,
  accessibilityRole: 'button' as const,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityState: { disabled },
});

/**
 * Props for accessible progress indicators
 */
export const getProgressAccessibilityProps = (
  current: number,
  max: number,
  label?: string
) => ({
  accessible: true,
  accessibilityRole: 'progressbar' as const,
  accessibilityLabel: label || `Progress: ${Math.round((current / max) * 100)}%`,
  accessibilityValue: {
    min: 0,
    max,
    now: current,
  },
});
