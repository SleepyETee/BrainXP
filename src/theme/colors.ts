// BrainXP ADHD-Optimized Color System
// Based on research: calm blues/greens for focus, warm tones for energy/alerts
// Core palette: Zinnwaldite, Shadow Green, Beryl Green, Gray Nurse

// ═══════════════════════════════════════════════════════════════════════════════
// ADHD COLOR PSYCHOLOGY:
// - Cool tones (blue/green): Promote calm, reduce stress, aid sustained focus
// - Warm tones (coral/amber): Boost alertness for urgent tasks (use sparingly)
// - Muted tones: Reduce overstimulation and sensory overwhelm
// - High contrast: Helps with attention on important elements
// ═══════════════════════════════════════════════════════════════════════════════

// Core ADHD-Friendly Palette
export const adhdPalette = {
  // Zinnwaldite - Warm, soft coral (alerts, energy, gentle urgency)
  zinnwaldite: '#EBACA4',
  // Shadow Green - Calming teal (focus, completion, calm)
  shadowGreen: '#93C0BA',
  // Beryl Green - Light sage (success, growth, low-energy tasks)
  berylGreen: '#CEE4B8',
  // Gray Nurse - Neutral base (backgrounds, reduce fatigue)
  grayNurse: '#F2F4F1',
} as const;

export const colors = {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY - Shadow Green (Focus & Calm)
  // Used for: Main actions, focus states, navigation, progress
  // Psychology: Promotes concentration without overstimulation
  // ═══════════════════════════════════════════════════════════════════════════
  primary: {
    50: '#F0F7F6',
    100: '#E1EFED',
    200: '#C3DFDB',
    300: '#A5CFC9',
    400: '#93C0BA', // Shadow Green - main
    500: '#7AB0A8',
    600: '#5E9A91',
    700: '#4A7B74',
    800: '#375C57',
    900: '#243D3A',
    950: '#121F1D',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECONDARY - Beryl Green (Growth & Achievement)
  // Used for: Success states, completed items, positive feedback
  // Psychology: Gentle satisfaction without hyperactivity
  // ═══════════════════════════════════════════════════════════════════════════
  secondary: {
    50: '#F7FAF4',
    100: '#EFF5E9',
    200: '#DFEBD3',
    300: '#CEE4B8', // Beryl Green - main
    400: '#B8D89E',
    500: '#A2CC84',
    600: '#8BBF6A',
    700: '#6F9954',
    800: '#537340',
    900: '#384D2B',
    950: '#1C2615',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ACCENT - Zinnwaldite (Energy & Alerts)
  // Used for: Important alerts, urgent tasks, energy boosts (USE SPARINGLY)
  // Psychology: Increases alertness without harsh overstimulation
  // ═══════════════════════════════════════════════════════════════════════════
  accent: {
    50: '#FDF6F5',
    100: '#FBECEA',
    200: '#F7D9D5',
    300: '#EBACA4', // Zinnwaldite - main
    400: '#E08F85',
    500: '#D57266',
    600: '#C45647',
    700: '#9E4539',
    800: '#78342B',
    900: '#52231D',
    950: '#29120F',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SUCCESS - Extended Beryl Green (Completion & Rewards)
  // Used for: Task completion, habit streaks, achievements
  // Psychology: Satisfying without being jarring
  // ═══════════════════════════════════════════════════════════════════════════
  success: {
    50: '#F4F9F0',
    100: '#E8F3E1',
    200: '#D1E7C3',
    300: '#BADBA5',
    400: '#A3CF87',
    500: '#8CC369',
    600: '#70A850',
    700: '#58853F',
    800: '#40622E',
    900: '#283F1D',
    950: '#141F0F',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // WARNING - Soft Amber (Gentle Alerts)
  // Used for: Reminders, approaching deadlines, moderate priority
  // Psychology: Draws attention without anxiety
  // ═══════════════════════════════════════════════════════════════════════════
  warning: {
    50: '#FFFBF0',
    100: '#FEF7E1',
    200: '#FDEFC3',
    300: '#FCE7A5',
    400: '#FBDF87',
    500: '#F5C842',
    600: '#E0A820',
    700: '#B38619',
    800: '#866512',
    900: '#59430C',
    950: '#2D2206',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DANGER - Softened Coral (Urgent Without Panic)
  // Used for: Overdue items, critical alerts, delete actions
  // Psychology: Creates urgency without triggering anxiety
  // ═══════════════════════════════════════════════════════════════════════════
  danger: {
    50: '#FEF5F4',
    100: '#FDEBE9',
    200: '#FBD7D3',
    300: '#F4ACA4',
    400: '#E88B80',
    500: '#DC6A5C',
    600: '#C24B3C',
    700: '#9B3C30',
    800: '#742D24',
    900: '#4D1E18',
    950: '#270F0C',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GRAY - Based on Gray Nurse (Calm Neutrals)
  // Used for: Backgrounds, text, borders, disabled states
  // Psychology: Reduces visual noise and decision fatigue
  // ═══════════════════════════════════════════════════════════════════════════
  gray: {
    50: '#F8F9F7',  // Lightest - main backgrounds
    100: '#F2F4F1', // Gray Nurse - secondary backgrounds
    200: '#E5E8E3',
    300: '#D1D5CE',
    400: '#A8AEA4',
    500: '#7F867A',
    600: '#5F655B',
    700: '#484D45',
    800: '#31352F',
    900: '#1A1C19',
    950: '#0D0E0C',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT PRESETS - Calming, ADHD-Friendly Transitions
// ═══════════════════════════════════════════════════════════════════════════════
export const gradients: Record<string, string[]> = {
  // Primary gradients (calm focus)
  focus: ['#93C0BA', '#7AB0A8', '#5E9A91'],
  focusSoft: ['#E1EFED', '#C3DFDB', '#A5CFC9'],

  // Success gradients (achievement)
  growth: ['#CEE4B8', '#B8D89E', '#A2CC84'],
  complete: ['#8CC369', '#70A850', '#58853F'],

  // Energy gradients (use sparingly - for urgent/important)
  energy: ['#EBACA4', '#E08F85', '#D57266'],
  warmth: ['#F7D9D5', '#EBACA4', '#E08F85'],

  // Calm gradients (backgrounds, cards)
  calm: ['#F2F4F1', '#E5E8E3', '#D1D5CE'],
  serenity: ['#F0F7F6', '#E1EFED', '#C3DFDB'],

  // Mixed gradients (balanced energy)
  balance: ['#93C0BA', '#CEE4B8', '#A2CC84'],
  morning: ['#EBACA4', '#F2F4F1', '#CEE4B8'],

  // Premium feature gradients
  achievement: ['#93C0BA', '#CEE4B8'],
  streak: ['#F5C842', '#E0A820'],

  // Dark mode gradients
  darkCalm: ['#1A1C19', '#243D3A', '#375C57'],
  darkFocus: ['#121F1D', '#243D3A', '#4A7B74'],

  // Glass effects
  glassLight: ['rgba(242,244,241,0.95)', 'rgba(242,244,241,0.8)'],
  glassFocus: ['rgba(147,192,186,0.15)', 'rgba(147,192,186,0.05)'],

  // Night/cosmic gradient for rest/sleep UI
  cosmic: ['#1a1a2e', '#16213e', '#0f3460'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEMANTIC COLORS - Functional Color Assignments
// ═══════════════════════════════════════════════════════════════════════════════
export const semanticColors = {
  background: {
    primary: colors.gray[50],      // Main app background
    secondary: colors.gray[100],   // Gray Nurse - card backgrounds
    tertiary: colors.gray[200],    // Elevated sections
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    dark: colors.gray[900],
    darkSecondary: colors.gray[800],
  },
  
  text: {
    primary: colors.gray[900],     // Main text
    secondary: colors.gray[600],   // Secondary text
    tertiary: colors.gray[500],    // Placeholder, hints
    muted: colors.gray[400],       // Disabled text
    inverse: '#FFFFFF',
    accent: colors.primary[600],   // Links, emphasis
  },
  
  border: {
    light: colors.gray[200],
    default: colors.gray[300],
    focus: colors.primary[400],
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TASK PRIORITIES - Color-coded for quick recognition
  // Research: Red=urgent, Green=done, helps memory & organization
  // ═══════════════════════════════════════════════════════════════════════════
  priority: {
    urgent_important: colors.accent[400], // Zinnwaldite - highest urgency
    important: colors.warning[500],        // Amber - needs attention
    urgent: colors.accent[300],            // Softer coral - time-sensitive
    low: colors.primary[400],              // Shadow Green - can wait
    none: colors.gray[400],                // Neutral - no priority
  },
  
  // Energy levels for task matching
  energy: {
    low: colors.secondary[400],    // Beryl Green - gentle tasks
    medium: colors.primary[400],   // Shadow Green - balanced
    high: colors.accent[300],      // Zinnwaldite - demanding
  },
  
  // Task status colors
  status: {
    inbox: colors.gray[400],
    todo: colors.primary[500],
    in_progress: colors.warning[500],
    waiting: colors.gray[500],
    done: colors.success[500],     // Satisfying green for completion
    abandoned: colors.gray[300],
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MOOD COLORS - Soft, non-judgmental spectrum
  // ═══════════════════════════════════════════════════════════════════════════
  mood: {
    awful: colors.accent[400],     // Soft coral
    bad: colors.accent[300],       // Lighter coral
    okay: colors.warning[400],     // Neutral amber
    good: colors.secondary[400],   // Beryl green
    great: colors.success[500],    // Full green
  },
  
  // XP and gamification (use sparingly to maintain meaning)
  xp: {
    bronze: '#CD9B7A',            // Muted bronze
    silver: '#A8B0A8',            // Sage silver
    gold: '#D4AF37',              // Classic gold
    platinum: '#C4CFC4',          // Soft platinum
    diamond: colors.primary[300], // Shadow green diamond
  },
  
  // Badge rarity (subtle progression)
  rarity: {
    common: colors.gray[400],
    uncommon: colors.secondary[500],
    rare: colors.primary[500],
    epic: colors.accent[400],
    legendary: '#D4AF37',
  },
  
  // Focus session states
  focus: {
    ready: colors.gray[300],
    active: colors.primary[500],
    paused: colors.warning[400],
    complete: colors.success[500],
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SHADOWS - Soft, non-distracting depth
// ═══════════════════════════════════════════════════════════════════════════════
export const shadows = {
  sm: {
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 10,
  },
  // Colored shadows (subtle, for emphasis)
  focus: {
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 6,
  },
  success: {
    shadowColor: colors.success[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 6,
  },
  energy: {
    shadowColor: colors.accent[400],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 6,
  },
  // Soft glow for active states
  glow: {
    shadowColor: colors.primary[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// GLASSMORPHISM - Subtle, calming glass effects
// ═══════════════════════════════════════════════════════════════════════════════
export const glass = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  medium: {
    backgroundColor: 'rgba(242, 244, 241, 0.85)', // Gray Nurse base
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dark: {
    backgroundColor: 'rgba(26, 28, 25, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  focus: {
    backgroundColor: 'rgba(147, 192, 186, 0.12)', // Shadow Green tint
    borderWidth: 1,
    borderColor: 'rgba(147, 192, 186, 0.25)',
  },
  success: {
    backgroundColor: 'rgba(206, 228, 184, 0.12)', // Beryl Green tint
    borderWidth: 1,
    borderColor: 'rgba(206, 228, 184, 0.25)',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// ADHD-SPECIFIC UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

// Get appropriate background color based on task energy requirement
export const getTaskEnergyColor = (energy: 'low' | 'medium' | 'high') => {
  switch (energy) {
    case 'low': return `${colors.secondary[300]}20`;   // Very light Beryl Green
    case 'medium': return `${colors.primary[300]}20`; // Very light Shadow Green
    case 'high': return `${colors.accent[300]}15`;    // Very light Zinnwaldite
    default: return 'transparent';
  }
};

// Get calming vs energizing palette based on time of day
export const getTimeBasedPalette = () => {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) {
    // Morning: Gentle energy boost
    return {
      primary: colors.primary[500],
      accent: colors.secondary[400],
      background: colors.gray[50],
    };
  } else if (hour >= 12 && hour < 17) {
    // Afternoon: Peak focus
    return {
      primary: colors.primary[600],
      accent: colors.primary[400],
      background: colors.gray[50],
    };
  } else if (hour >= 17 && hour < 21) {
    // Evening: Wind down
    return {
      primary: colors.secondary[500],
      accent: colors.secondary[300],
      background: colors.gray[100],
    };
  } else {
    // Night: Maximum calm
    return {
      primary: colors.secondary[400],
      accent: colors.secondary[200],
      background: colors.gray[100],
    };
  }
};

// Priority color with appropriate intensity
export const getPriorityGradient = (priority: string): readonly [string, string] => {
  switch (priority) {
    case 'urgent_important':
      return [colors.accent[300], colors.accent[400]];
    case 'important':
      return [colors.warning[300], colors.warning[400]];
    case 'urgent':
      return [colors.accent[200], colors.accent[300]];
    case 'low':
      return [colors.primary[200], colors.primary[300]];
    default:
      return [colors.gray[200], colors.gray[300]];
  }
};

export type ColorPalette = typeof colors;
export type SemanticColors = typeof semanticColors;
export type Gradients = typeof gradients;
export type Shadows = typeof shadows;
export type ADHDPalette = typeof adhdPalette;
