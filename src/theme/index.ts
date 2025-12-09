export * from './colors';
export * from './typography';
export * from './spacing';

import { colors, semanticColors } from './colors';
import { typography, fontSizes, fontWeights, lineHeights } from './typography';
import { spacing, borderRadius, shadows } from './spacing';

export const theme = {
  colors,
  semanticColors,
  typography,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
  borderRadius,
  shadows,
} as const;

export type Theme = typeof theme;
