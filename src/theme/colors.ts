export const colors = {
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Main primary
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  secondary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

export const semanticColors = {
  background: {
    primary: colors.gray[50],
    secondary: colors.gray[100],
    card: '#FFFFFF',
    dark: colors.gray[900],
  },
  text: {
    primary: colors.gray[800],
    secondary: colors.gray[500],
    muted: colors.gray[400],
    inverse: '#FFFFFF',
  },
  border: colors.gray[200],

  // Task priorities
  priority: {
    urgent_important: colors.danger[500],
    important: colors.warning[500],
    urgent: '#F97316', // orange-500
    low: colors.gray[400],
    none: colors.gray[300],
  },

  // Energy levels
  energy: {
    low: colors.success[500],
    medium: colors.warning[500],
    high: colors.danger[500],
  },

  // Status colors
  status: {
    inbox: colors.gray[400],
    todo: colors.primary[500],
    in_progress: colors.warning[500],
    waiting: colors.secondary[500],
    done: colors.success[500],
    abandoned: colors.gray[300],
  },
} as const;

export type ColorPalette = typeof colors;
export type SemanticColors = typeof semanticColors;
