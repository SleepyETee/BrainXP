// filepath: /Users/sleepyet/BrainXP/src/utils/uxHelpers.ts
// ═══════════════════════════════════════════════════════════════════════════════
// UX HELPER UTILITIES
// Implements mobile-first UX/UI best practices:
// - Thumb-friendly design zones
// - Accessibility helpers
// - Touch target sizing
// - Cognitive load reducers
// ═══════════════════════════════════════════════════════════════════════════════

import { Dimensions, Platform, PixelRatio, AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT CONSTANTS
// Screen padding and spacing values for consistent layouts
// ═══════════════════════════════════════════════════════════════════════════════

export const Layout = {
  SCREEN_PADDING: 16,
  SCREEN_PADDING_LARGE: 24,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  CONTENT_MAX_WIDTH: 600,
  BOTTOM_TAB_HEIGHT: 80,
  HEADER_HEIGHT: 56,
};

// ═══════════════════════════════════════════════════════════════════════════════
// THUMB ZONE HELPERS
// Based on Steven Hoober's thumb zone research for one-handed mobile use
// ═══════════════════════════════════════════════════════════════════════════════

export const THUMB_ZONES = {
  // Easy reach zone (green)
  easy: {
    y: { min: SCREEN_HEIGHT * 0.6, max: SCREEN_HEIGHT },
    x: { min: SCREEN_WIDTH * 0.2, max: SCREEN_WIDTH * 0.8 },
  },
  // Ok reach zone (yellow)
  ok: {
    y: { min: SCREEN_HEIGHT * 0.3, max: SCREEN_HEIGHT * 0.6 },
    x: { min: SCREEN_WIDTH * 0.1, max: SCREEN_WIDTH * 0.9 },
  },
  // Hard reach zone (red) - avoid placing primary actions here
  hard: {
    y: { min: 0, max: SCREEN_HEIGHT * 0.3 },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOUCH TARGET SIZING
// Following Apple (44pt) and Material (48dp) guidelines
// ═══════════════════════════════════════════════════════════════════════════════

export const TOUCH_TARGETS = {
  minimum: 44,
  recommended: 48,
  comfortable: 56,
  large: 64,
};

export const getTouchTargetSize = (
  importance: 'primary' | 'secondary' | 'tertiary'
): number => {
  switch (importance) {
    case 'primary':
      return TOUCH_TARGETS.comfortable;
    case 'secondary':
      return TOUCH_TARGETS.recommended;
    case 'tertiary':
      return TOUCH_TARGETS.minimum;
    default:
      return TOUCH_TARGETS.recommended;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COGNITIVE LOAD REDUCERS
// Helpers to minimize mental effort
// ═══════════════════════════════════════════════════════════════════════════════

export const COGNITIVE_LIMITS = {
  listItemsInitial: 5,
  gridItemsInitial: 6,
  navigationItems: 5,
  formFieldsPerSection: 4,
  choiceOptions: 7,
  notificationsVisible: 3,
};

export const progressiveDisclosure = <T,>(
  items: T[],
  limit: number = COGNITIVE_LIMITS.listItemsInitial
): { visible: T[]; hidden: T[]; hiddenCount: number; hasMore: boolean } => {
  const visible = items.slice(0, limit);
  const hidden = items.slice(limit);
  return {
    visible,
    hidden,
    hiddenCount: hidden.length,
    hasMore: hidden.length > 0,
  };
};

export const chunkItems = <T,>(items: T[], chunkSize: number = 3): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
};

// ═══════════════════════════════════════════════════════════════════════════════
// HAPTIC FEEDBACK PATTERNS
// Consistent haptic language across the app
// ═══════════════════════════════════════════════════════════════════════════════

export const hapticFeedback = {
  selection: () => Haptics.selectionAsync(),
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  confirm: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  important: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIMING HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export const ANIMATION_DURATIONS = {
  instant: 100,
  fast: 150,
  normal: 250,
  slow: 350,
  emphasis: 500,
};

export const getStaggerDelay = (index: number, baseDelay: number = 50): number => {
  return Math.min(index * baseDelay, 500);
};

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSIVE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export const BREAKPOINTS = {
  small: 375,
  medium: 414,
  large: 428,
  tablet: 768,
};

export const getDeviceSize = (): 'small' | 'medium' | 'large' | 'tablet' => {
  if (SCREEN_WIDTH >= BREAKPOINTS.tablet) return 'tablet';
  if (SCREEN_WIDTH >= BREAKPOINTS.large) return 'large';
  if (SCREEN_WIDTH >= BREAKPOINTS.medium) return 'medium';
  return 'small';
};

export const getResponsiveSpacing = (baseSpacing: number): number => {
  const deviceSize = getDeviceSize();
  const multipliers = {
    small: 0.9,
    medium: 1,
    large: 1.1,
    tablet: 1.25,
  };
  return Math.round(baseSpacing * multipliers[deviceSize]);
};

export const getResponsiveFontSize = (baseFontSize: number): number => {
  const deviceSize = getDeviceSize();
  const multipliers = {
    small: 0.95,
    medium: 1,
    large: 1.05,
    tablet: 1.15,
  };
  return Math.round(baseFontSize * multipliers[deviceSize]);
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACCESSIBILITY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export const CONTRAST_RATIOS = {
  normalText: 4.5,
  largeText: 3,
  enhancedNormalText: 7,
  enhancedLargeText: 4.5,
};

export const generateAccessibleLabel = (parts: {
  type?: string;
  title: string;
  state?: string;
  hint?: string;
}): string => {
  const { type, title, state, hint } = parts;
  let label = '';
  if (type) label += `${type}: `;
  label += title;
  if (state) label += `, ${state}`;
  return label;
};

export const formatNumberForA11y = (num: number, context: string): string => {
  if (num === 0) return `No ${context}`;
  if (num === 1) return `1 ${context.replace(/s$/, '')}`;
  return `${num} ${context}`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number = 16
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// FORM HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export const getKeyboardType = (
  fieldType: 'email' | 'phone' | 'number' | 'url' | 'search' | 'default'
): 'email-address' | 'phone-pad' | 'numeric' | 'url' | 'web-search' | 'default' => {
  const mapping = {
    email: 'email-address' as const,
    phone: 'phone-pad' as const,
    number: 'numeric' as const,
    url: 'url' as const,
    search: 'web-search' as const,
    default: 'default' as const,
  };
  return mapping[fieldType];
};

export const getAutoCapitalize = (
  context: 'name' | 'sentence' | 'word' | 'none'
): 'none' | 'sentences' | 'words' | 'characters' => {
  const mapping = {
    name: 'words' as const,
    sentence: 'sentences' as const,
    word: 'words' as const,
    none: 'none' as const,
  };
  return mapping[context];
};

export default {
  THUMB_ZONES,
  TOUCH_TARGETS,
  COGNITIVE_LIMITS,
  ANIMATION_DURATIONS,
  BREAKPOINTS,
  CONTRAST_RATIOS,
  Layout,
  getTouchTargetSize,
  progressiveDisclosure,
  chunkItems,
  hapticFeedback,
  getStaggerDelay,
  getDeviceSize,
  getResponsiveSpacing,
  getResponsiveFontSize,
  generateAccessibleLabel,
  formatNumberForA11y,
  debounce,
  throttle,
  getKeyboardType,
  getAutoCapitalize,
};
