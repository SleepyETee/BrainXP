// BrainXP Premium Typography System
// ═══════════════════════════════════════════════════════════════════════════════
// NEURODIVERGENT-FRIENDLY TYPOGRAPHY:
// - Clear sans-serif fonts for readability
// - Generous line heights reduce visual crowding
// - Consistent spacing aids scanning
// - Strong hierarchy helps focus
// - Left-aligned text (not justified) for predictable spacing
// ═══════════════════════════════════════════════════════════════════════════════

import { TextStyle, Platform } from 'react-native';
import { colors } from './colors';

// ═══════════════════════════════════════════════════════════════════════════════
// FONT FAMILY RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════════
// Default: System font (San Francisco on iOS, Roboto on Android)
// Both are highly readable and optimized for screens
// For dyslexia: Consider OpenDyslexic or similar when enabled
export const fontFamilies = {
  // Default system fonts - optimal for readability
  default: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  // Monospace for numbers/codes - aids alignment
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
  // Note: OpenDyslexic would need to be added via expo-font
  dyslexic: 'System', // Fallback until font is loaded
};

// Font weights
export const fontWeights = {
  thin: '100' as const,
  extraLight: '200' as const,
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
  black: '900' as const,
};

// ═══════════════════════════════════════════════════════════════════════════════
// FONT SIZES - Slightly larger base for better readability
// ═══════════════════════════════════════════════════════════════════════════════
export const fontSizes = {
  '2xs': 11,    // Increased from 10
  xs: 13,       // Increased from 12
  sm: 15,       // Increased from 14
  base: 17,     // Increased from 16 - better for mobile reading
  lg: 19,       // Increased from 18
  xl: 21,       // Increased from 20
  '2xl': 25,    // Increased from 24
  '3xl': 31,    // Increased from 30
  '4xl': 37,    // Increased from 36
  '5xl': 49,    // Increased from 48
  '6xl': 61,    // Increased from 60
  '7xl': 73,    // Increased from 72
};

// ═══════════════════════════════════════════════════════════════════════════════
// LINE HEIGHTS - More generous for reduced crowding
// Research: 1.5-1.75 line height optimal for neurodivergent readers
// ═══════════════════════════════════════════════════════════════════════════════
export const lineHeights = {
  tight: 1.2,     // Increased from 1.1 - headings
  snug: 1.35,     // Increased from 1.25 - subheadings
  normal: 1.6,    // Increased from 1.5 - body text
  relaxed: 1.75,  // Increased from 1.625 - longer paragraphs
  loose: 2.0,     // Same - maximum breathing room
};

// ═══════════════════════════════════════════════════════════════════════════════
// LETTER SPACING - Slightly wider for clarity
// ═══════════════════════════════════════════════════════════════════════════════
export const letterSpacing = {
  tighter: -0.3,   // Less tight than before
  tight: -0.15,    // Less tight
  normal: 0.15,    // Slightly positive for better readability
  wide: 0.5,       // Same
  wider: 1,        // Same
  widest: 2,       // Same
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACCESSIBILITY SCALING
// ═══════════════════════════════════════════════════════════════════════════════
export const getScaledFontSize = (baseSize: number, scaleFactor: number = 1): number => {
  return Math.round(baseSize * scaleFactor);
};

// Pre-defined scale factors for accessibility
export const textScaleFactors = {
  small: 0.85,
  default: 1.0,
  large: 1.15,
  extraLarge: 1.3,
  maximum: 1.5,
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY PRESETS - Optimized for Neurodivergent Users
// ═══════════════════════════════════════════════════════════════════════════════
export const typography = {
  // Display styles (hero text, big numbers)
  display: {
    xl: {
      fontSize: fontSizes['7xl'],
      fontWeight: fontWeights.bold,
      lineHeight: fontSizes['7xl'] * lineHeights.tight,
      letterSpacing: letterSpacing.tight,
      color: colors.gray[900],
    } as TextStyle,
    lg: {
      fontSize: fontSizes['6xl'],
      fontWeight: fontWeights.bold,
      lineHeight: fontSizes['6xl'] * lineHeights.tight,
      letterSpacing: letterSpacing.tight,
      color: colors.gray[900],
    } as TextStyle,
    md: {
      fontSize: fontSizes['5xl'],
      fontWeight: fontWeights.bold,
      lineHeight: fontSizes['5xl'] * lineHeights.tight,
      letterSpacing: letterSpacing.tight,
      color: colors.gray[900],
    } as TextStyle,
    sm: {
      fontSize: fontSizes['4xl'],
      fontWeight: fontWeights.bold,
      lineHeight: fontSizes['4xl'] * lineHeights.snug,
      color: colors.gray[900],
    } as TextStyle,
  },

  // Headings - Clear hierarchy for scanning
  heading: {
    h1: {
      fontSize: fontSizes['3xl'],
      fontWeight: fontWeights.bold,
      lineHeight: fontSizes['3xl'] * lineHeights.snug,
      letterSpacing: letterSpacing.normal,
      color: colors.gray[900],
    } as TextStyle,
    h2: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.semiBold,
      lineHeight: fontSizes['2xl'] * lineHeights.snug,
      letterSpacing: letterSpacing.normal,
      color: colors.gray[900],
    } as TextStyle,
    h3: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.semiBold,
      lineHeight: fontSizes.xl * lineHeights.normal,
      letterSpacing: letterSpacing.normal,
      color: colors.gray[800],
    } as TextStyle,
    h4: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.semiBold,
      lineHeight: fontSizes.lg * lineHeights.normal,
      letterSpacing: letterSpacing.normal,
      color: colors.gray[800],
    } as TextStyle,
    h5: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.semiBold,
      lineHeight: fontSizes.base * lineHeights.normal,
      letterSpacing: letterSpacing.normal,
      color: colors.gray[700],
    } as TextStyle,
    h6: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.semiBold,
      lineHeight: fontSizes.sm * lineHeights.normal,
      letterSpacing: letterSpacing.normal,
      color: colors.gray[700],
    } as TextStyle,
  },

  // Body text - Generous line heights for readability
  body: {
    lg: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.lg * lineHeights.relaxed,
      letterSpacing: letterSpacing.normal,
      color: colors.gray[700],
    } as TextStyle,
    md: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.base * lineHeights.relaxed,
      letterSpacing: letterSpacing.normal,
      color: colors.gray[700],
    } as TextStyle,
    sm: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.sm * lineHeights.relaxed,
      letterSpacing: letterSpacing.normal,
      color: colors.gray[600],
    } as TextStyle,
    xs: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.regular,
      lineHeight: fontSizes.xs * lineHeights.relaxed,
      letterSpacing: letterSpacing.normal,
      color: colors.gray[500],
    } as TextStyle,
  },

  // Labels - Clear and distinct
  label: {
    lg: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.medium,
      lineHeight: fontSizes.base * lineHeights.normal,
      letterSpacing: letterSpacing.wide,
      color: colors.gray[700],
    } as TextStyle,
    md: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.medium,
      lineHeight: fontSizes.sm * lineHeights.normal,
      letterSpacing: letterSpacing.wide,
      color: colors.gray[700],
    } as TextStyle,
    sm: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.medium,
      lineHeight: fontSizes.xs * lineHeights.normal,
      letterSpacing: letterSpacing.wide,
      color: colors.gray[600],
    } as TextStyle,
  },

  // Special styles
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.xs * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    color: colors.gray[500],
  } as TextStyle,

  overline: {
    fontSize: fontSizes['2xs'],
    fontWeight: fontWeights.semiBold,
    lineHeight: fontSizes['2xs'] * lineHeights.normal,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase',
    color: colors.gray[500],
  } as TextStyle,

  // Numbers (for stats, timers) - Tabular for alignment
  number: {
    hero: {
      fontSize: fontSizes['7xl'],
      fontWeight: fontWeights.thin,
      fontVariant: ['tabular-nums'],
      letterSpacing: letterSpacing.tight,
      color: colors.gray[900],
    } as TextStyle,
    display: {
      fontSize: fontSizes['5xl'],
      fontWeight: fontWeights.light,
      fontVariant: ['tabular-nums'],
      letterSpacing: letterSpacing.tight,
      color: colors.gray[800],
    } as TextStyle,
    stat: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      fontVariant: ['tabular-nums'],
      letterSpacing: letterSpacing.normal,
      color: colors.gray[800],
    } as TextStyle,
    badge: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.bold,
      fontVariant: ['tabular-nums'],
      letterSpacing: letterSpacing.normal,
      color: colors.gray[700],
    } as TextStyle,
  },

  // Button text - Clear and actionable
  button: {
    lg: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.semiBold,
      letterSpacing: letterSpacing.wide,
    } as TextStyle,
    md: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.semiBold,
      letterSpacing: letterSpacing.wide,
    } as TextStyle,
    sm: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.semiBold,
      letterSpacing: letterSpacing.wide,
    } as TextStyle,
  },

  // Link text
  link: {
    default: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.medium,
      color: colors.primary[600],
      textDecorationLine: 'none',
    } as TextStyle,
    underlined: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.medium,
      color: colors.primary[600],
      textDecorationLine: 'underline',
    } as TextStyle,
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ADHD-SPECIFIC PRESETS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // For instructions - very clear, scannable
  instruction: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.base * lineHeights.loose,
    letterSpacing: letterSpacing.normal,
    color: colors.gray[700],
  } as TextStyle,
  
  // For tips/hints - friendly, approachable
  tip: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.sm * lineHeights.relaxed,
    letterSpacing: letterSpacing.normal,
    color: colors.primary[700],
  } as TextStyle,
  
  // For important callouts
  callout: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semiBold,
    lineHeight: fontSizes.base * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    color: colors.gray[800],
  } as TextStyle,
};

export type Typography = typeof typography;
