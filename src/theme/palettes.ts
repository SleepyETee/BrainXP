import { colors } from './colors';

// Generic color scale type that accepts any string colors
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

type Palette = {
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  danger: ColorScale;
  gray: ColorScale;
};

const buildScale = (base: { [k: number]: string }): ColorScale => ({
  50: base[50] ?? '#FFFFFF',
  100: base[100] ?? '#F5F5F5',
  200: base[200] ?? '#E5E5E5',
  300: base[300] ?? '#D4D4D4',
  400: base[400] ?? '#A3A3A3',
  500: base[500] ?? '#737373',
  600: base[600] ?? '#525252',
  700: base[700] ?? '#404040',
  800: base[800] ?? '#262626',
  900: base[900] ?? '#171717',
  950: base[950] ?? base[900] ?? '#0A0A0A',
});

// Minimal (current) uses existing colors
export const paletteMinimal = colors;

// Game / Gamified: brighter, higher saturation
export const paletteGame: Palette = {
  ...colors,
  primary: buildScale({
    50: '#F3F1FF',
    100: '#E7E3FF',
    200: '#CFC6FF',
    300: '#B7A8FF',
    400: '#9F8BFF',
    500: '#866EFF',
    600: '#6C5CE7',
    700: '#5B4CCC',
    800: '#4A3DB2',
    900: '#392F99',
    950: '#241C70',
  }),
  secondary: buildScale({
    50: '#F3F1FF',
    100: '#E7E3FF',
    200: '#CFC6FF',
    300: '#B7A8FF',
    400: '#9F8BFF',
    500: '#866EFF',
    600: '#6C5CE7',
    700: '#5B4CCC',
    800: '#4A3DB2',
    900: '#392F99',
    950: '#241C70',
  }),
  accent: buildScale({
    50: '#FFF2F2',
    100: '#FFE4E4',
    200: '#FFBFC1',
    300: '#FF9AA0',
    400: '#FF747D',
    500: '#FF5E57',
    600: '#E54B45',
    700: '#CC3934',
    800: '#B32624',
    900: '#991514',
    950: '#5C0C0C',
  }),
  success: buildScale({
    50: '#ECFFF3',
    100: '#D8FFE7',
    200: '#B2FCD1',
    300: '#8CF9BC',
    400: '#66F6A6',
    500: '#2ECC71',
    600: '#25A85E',
    700: '#1C844B',
    800: '#146137',
    900: '#0B3D24',
    950: '#062317',
  }),
  warning: buildScale({
    50: '#FFF7EB',
    100: '#FFEFD6',
    200: '#FFDCA8',
    300: '#FFC87A',
    400: '#FFB44D',
    500: '#F39C12',
    600: '#D3820A',
    700: '#B36808',
    800: '#944E06',
    900: '#743404',
    950: '#421D02',
  }),
  danger: buildScale({
    50: '#FFF1F0',
    100: '#FFE0DC',
    200: '#FFB8B3',
    300: '#FF8F89',
    400: '#F86A63',
    500: '#E74C3C',
    600: '#CC3E31',
    700: '#B13227',
    800: '#96261D',
    900: '#7B1B14',
    950: '#3F0C09',
  }),
};

// Study / Calm focus: cooler blues/purples
export const paletteStudy: Palette = {
  ...colors,
  primary: buildScale({
    50: '#EEF3FF',
    100: '#DFE8FF',
    200: '#C0D2FF',
    300: '#A0BCFF',
    400: '#81A7FF',
    500: '#4C6FFF',
    600: '#3E5DD6',
    700: '#304BAD',
    800: '#223883',
    900: '#14265A',
    950: '#0D183A',
  }),
  secondary: buildScale({
    50: '#EEF3FF',
    100: '#DFE8FF',
    200: '#C0D2FF',
    300: '#A0BCFF',
    400: '#81A7FF',
    500: '#4C6FFF',
    600: '#3E5DD6',
    700: '#304BAD',
    800: '#223883',
    900: '#14265A',
    950: '#0D183A',
  }),
  accent: buildScale({
    50: '#F4F0FF',
    100: '#E6DDFF',
    200: '#C8B5FF',
    300: '#AA8EFF',
    400: '#8C66FF',
    500: '#7C3AED',
    600: '#632ECC',
    700: '#4A23A3',
    800: '#32187A',
    900: '#1C0E52',
    950: '#100834',
  }),
  success: buildScale({
    50: '#ECFDF3',
    100: '#D1FAE0',
    200: '#A7F3C8',
    300: '#6EE7A1',
    400: '#34D883',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#0B301A',
  }),
  warning: buildScale({
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
    950: '#451A03',
  }),
  danger: buildScale({
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
    950: '#450A0A',
  }),
};

export type PaletteMode = 'minimal' | 'game' | 'study';
export const paletteMap: Record<PaletteMode, Palette> = {
  minimal: paletteMinimal,
  game: paletteGame,
  study: paletteStudy,
};
