// Export colors (has shadows with semantic colors)
export {
  adhdPalette,
  colors,
  gradients,
  semanticColors,
  shadows,
  glass,
  getTaskEnergyColor,
  getTimeBasedPalette,
  getPriorityGradient,
} from './colors';
export type { ColorPalette, SemanticColors, Gradients, Shadows, ADHDPalette } from './colors';

// Export typography
export * from './typography';

// Export spacing (rename shadows to spacingShadows to avoid conflict)
export { spacing, borderRadius } from './spacing';
export { shadows as spacingShadows } from './spacing';
export type { Spacing, BorderRadius } from './spacing';
export { ThemeProvider, useTheme } from './theme';
export type { PaletteMode } from './palettes';

import { colors, semanticColors, shadows } from './colors';
import { typography, fontSizes, fontWeights, lineHeights } from './typography';
import { spacing, borderRadius } from './spacing';

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
