// WCAG Contrast Testing Utility
// Provides automated testing for color contrast ratios to ensure WCAG AA compliance

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 (no contrast) and 21 (maximum contrast)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error(`Invalid color format: ${color1} or ${color2}`);
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard
 * - Normal text (small): 4.5:1 minimum
 * - Large text (18pt+ or 14pt+ bold): 3:1 minimum
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standard
 * - Normal text (small): 7:1 minimum
 * - Large text (18pt+ or 14pt+ bold): 4.5:1 minimum
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Get WCAG compliance level for a color pair
 */
export type WCAGLevel = 'AAA' | 'AA' | 'AA-Large' | 'Fail';

export function getWCAGLevel(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): WCAGLevel {
  const ratio = getContrastRatio(foreground, background);

  if (isLargeText) {
    if (ratio >= 4.5) return 'AAA';
    if (ratio >= 3) return 'AA-Large';
    return 'Fail';
  } else {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    return 'Fail';
  }
}

/**
 * Test color combinations from theme
 */
export interface ContrastTestResult {
  foreground: string;
  background: string;
  ratio: number;
  level: WCAGLevel;
  isLargeText: boolean;
  passes: boolean;
}

export function testColorContrast(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): ContrastTestResult {
  const ratio = getContrastRatio(foreground, background);
  const level = getWCAGLevel(foreground, background, isLargeText);
  const passes = level !== 'Fail';

  return {
    foreground,
    background,
    ratio: Math.round(ratio * 100) / 100,
    level,
    isLargeText,
    passes,
  };
}

/**
 * Test all text/background combinations from a color palette
 */
export function testPaletteContrast(
  textColors: string[],
  backgroundColors: string[],
  isLargeText: boolean = false
): ContrastTestResult[] {
  const results: ContrastTestResult[] = [];

  textColors.forEach((textColor) => {
    backgroundColors.forEach((bgColor) => {
      results.push(testColorContrast(textColor, bgColor, isLargeText));
    });
  });

  return results;
}

/**
 * Find the closest accessible color that meets WCAG AA
 * Adjusts brightness to achieve minimum contrast
 */
export function findAccessibleColor(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): string {
  const targetRatio = isLargeText ? 3 : 4.5;
  const currentRatio = getContrastRatio(foreground, background);

  if (currentRatio >= targetRatio) {
    return foreground; // Already accessible
  }

  // Try darkening or lightening the foreground
  const rgb = hexToRgb(foreground);
  if (!rgb) return foreground;

  // Determine if we need to darken or lighten
  const bgRgb = hexToRgb(background);
  if (!bgRgb) return foreground;

  const fgLum = getLuminance(rgb.r, rgb.g, rgb.b);
  const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

  // If foreground is lighter than background, darken it
  // If foreground is darker than background, lighten it
  const shouldDarken = fgLum > bgLum;

  let adjusted = { ...rgb };
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    const ratio = getContrastRatio(
      `#${adjusted.r.toString(16).padStart(2, '0')}${adjusted.g.toString(16).padStart(2, '0')}${adjusted.b.toString(16).padStart(2, '0')}`,
      background
    );

    if (ratio >= targetRatio) {
      return `#${adjusted.r.toString(16).padStart(2, '0')}${adjusted.g.toString(16).padStart(2, '0')}${adjusted.b.toString(16).padStart(2, '0')}`;
    }

    // Adjust color
    if (shouldDarken) {
      adjusted.r = Math.max(0, adjusted.r - 10);
      adjusted.g = Math.max(0, adjusted.g - 10);
      adjusted.b = Math.max(0, adjusted.b - 10);
    } else {
      adjusted.r = Math.min(255, adjusted.r + 10);
      adjusted.g = Math.min(255, adjusted.g + 10);
      adjusted.b = Math.min(255, adjusted.b + 10);
    }

    attempts++;
  }

  return foreground; // Return original if can't find accessible version
}

/**
 * Generate contrast report for theme colors
 */
export interface ContrastReport {
  passed: ContrastTestResult[];
  failed: ContrastTestResult[];
  total: number;
  passRate: number;
}

export function generateContrastReport(
  results: ContrastTestResult[]
): ContrastReport {
  const passed = results.filter((r) => r.passes);
  const failed = results.filter((r) => !r.passes);
  const total = results.length;
  const passRate = total > 0 ? (passed.length / total) * 100 : 0;

  return {
    passed,
    failed,
    total,
    passRate: Math.round(passRate * 100) / 100,
  };
}
