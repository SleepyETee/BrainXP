// Theme Context - Provides dark mode and theme support
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme, ColorSchemeName } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import { colors } from '../theme/colors';

// Dark mode colors
const darkColors = {
  background: '#0F1419',
  surface: '#1A1F26',
  surfaceElevated: '#242A33',
  text: {
    primary: '#F7F9F9',
    secondary: '#8B98A5',
    tertiary: '#6E767D',
  },
  border: '#2F3336',
  primary: {
    50: '#1A3A4A',
    100: '#234B5C',
    200: '#2D5C6E',
    300: '#3A7A8F',
    400: '#4A9AAF',
    500: '#5AB5CC',
    600: '#7BC4D9',
    700: '#9DD3E5',
    800: '#BEE2F0',
    900: '#E0F1F8',
  },
  success: {
    50: '#1A3A2E',
    100: '#234B3C',
    200: '#2D5C4A',
    300: '#3A7A62',
    400: '#4A9A7A',
    500: '#5AB592',
    600: '#7BC4A8',
    700: '#9DD3BE',
    800: '#BEE2D4',
    900: '#E0F1EA',
  },
  danger: {
    50: '#3A1A1E',
    100: '#4B232A',
    200: '#5C2D35',
    300: '#7A3A44',
    400: '#9A4A56',
    500: '#B55A68',
    600: '#C47B87',
    700: '#D39DA6',
    800: '#E2BEC5',
    900: '#F1E0E3',
  },
  warning: {
    50: '#3A2E1A',
    100: '#4B3C23',
    200: '#5C4A2D',
    300: '#7A623A',
    400: '#9A7A4A',
    500: '#B5925A',
    600: '#C4A87B',
    700: '#D3BE9D',
    800: '#E2D4BE',
    900: '#F1EAE0',
  },
  gray: {
    50: '#1A1F26',
    100: '#242A33',
    200: '#2F3336',
    300: '#3F4549',
    400: '#6E767D',
    500: '#8B98A5',
    600: '#A8B3BD',
    700: '#C4CED6',
    800: '#E1E8ED',
    900: '#F7F9F9',
  },
};

// Light mode colors (use default colors)
const lightColors = {
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceElevated: '#FFFFFF',
  text: {
    primary: colors.gray[800],
    secondary: colors.gray[500],
    tertiary: colors.gray[400],
  },
  border: colors.gray[200],
  primary: colors.primary,
  success: colors.success,
  danger: colors.danger,
  warning: colors.warning,
  gray: colors.gray,
};

export type ThemeColors = typeof lightColors;

// Cast darkColors to ThemeColors for type compatibility
const darkTheme: ThemeColors = darkColors as ThemeColors;

interface ThemeContextValue {
  isDark: boolean;
  theme: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const toggleThemeSetting = useSettingsStore((state) => state.toggleTheme);

  // Determine if dark mode should be active
  const isDark = useMemo(() => {
    if (settings.theme === 'auto') {
      return systemColorScheme === 'dark';
    }
    return settings.theme === 'dark';
  }, [settings.theme, systemColorScheme]);

  // Get current theme colors
  const theme = useMemo(() => {
    return isDark ? darkTheme : lightColors;
  }, [isDark]);

  const setTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    updateSettings({ theme: newTheme });
  };

  const contextValue: ThemeContextValue = {
    isDark,
    theme,
    toggleTheme: toggleThemeSetting,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hook for getting themed styles
export const useThemedStyles = <T extends Record<string, any>>(
  styleFactory: (theme: ThemeColors, isDark: boolean) => T
): T => {
  const { theme, isDark } = useTheme();
  return useMemo(() => styleFactory(theme, isDark), [theme, isDark, styleFactory]);
};

export default ThemeContext;
