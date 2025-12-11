import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { colors, semanticColors } from './colors';
import { paletteMap, PaletteMode } from './palettes';
import { useSettingsStore } from '../stores/settingsStore';

type ThemeName = 'light' | 'dark';

// Generic color scale type for theme palette
type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
};

type ThemePalette = {
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  danger: ColorScale;
  gray: ColorScale;
};

interface ThemeValue {
  name: ThemeName;
  isDark: boolean;
  background: {
    primary: string;
    secondary: string;
    card: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  border: string;
  palette: ThemePalette;
}

const ThemeContext = createContext<ThemeValue>({
  name: 'light',
  isDark: false,
  background: {
    primary: semanticColors.background.primary,
    secondary: semanticColors.background.secondary,
    card: semanticColors.background.card,
  },
  text: {
    primary: semanticColors.text.primary,
    secondary: semanticColors.text.secondary,
    muted: semanticColors.text.muted,
    inverse: semanticColors.text.inverse,
  },
  border: semanticColors.border.light,
  palette: colors,
});

const buildLightTheme = (): ThemeValue => ({
  name: 'light',
  isDark: false,
  background: {
    primary: semanticColors.background.primary,
    secondary: semanticColors.background.secondary,
    card: semanticColors.background.card,
  },
  text: {
    primary: semanticColors.text.primary,
    secondary: semanticColors.text.secondary,
    muted: semanticColors.text.muted,
    inverse: semanticColors.text.inverse,
  },
  border: semanticColors.border.light,
  palette: colors,
});

const buildDarkTheme = (): ThemeValue => ({
  name: 'dark',
  isDark: true,
  background: {
    primary: semanticColors.background.dark,
    secondary: semanticColors.background.darkSecondary,
    card: '#1F2420',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#E5E8E3',
    muted: '#A8AEA4',
    inverse: semanticColors.text.primary,
  },
  border: colors.gray[700],
  palette: colors,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const settingsTheme = useSettingsStore((state) => state.settings.theme);
  const paletteMode = useSettingsStore((state) => state.settings.paletteMode);
  const highContrast = useSettingsStore((state) => state.settings.highContrast);
  const dimBrightColors = useSettingsStore((state) => state.settings.dimBrightColors);

  const isDark = settingsTheme === 'dark' || (settingsTheme === 'auto' && systemScheme === 'dark');
  const palette = paletteMap[paletteMode as PaletteMode] || colors;

  const value = useMemo<ThemeValue>(() => {
    const base = isDark ? buildDarkTheme() : buildLightTheme();
    const paletteApplied: ThemeValue = {
      ...base,
      palette,
    };

    // High contrast: increase contrast by darkening borders and using stronger text
    const contrastAdjusted: ThemeValue = highContrast
      ? {
          ...paletteApplied,
          text: {
            ...paletteApplied.text,
            primary: isDark ? '#FFFFFF' : palette.gray[900],
            secondary: isDark ? '#F2F4F1' : palette.gray[700],
          },
          border: isDark ? palette.gray[600] : palette.gray[400],
        }
      : paletteApplied;

    // Dim bright colors: desaturate accents slightly
    if (dimBrightColors) {
      return {
        ...contrastAdjusted,
        palette: {
          ...palette,
          accent: {
            ...palette.accent,
            300: `${palette.accent[300]}DD`,
            400: `${palette.accent[400]}DD`,
          },
          warning: {
            ...palette.warning,
            400: `${palette.warning[400]}DD`,
            500: `${palette.warning[500]}DD`,
          },
        },
      };
    }

    return contrastAdjusted;
  }, [isDark, highContrast, dimBrightColors, palette]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
