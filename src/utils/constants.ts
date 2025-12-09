// Supportive, non-judgmental messages
export const SUPPORTIVE_MESSAGES = {
  taskOverdue: "This task needs your attention",
  noTasksToday: "Your day is clear! Time to plan or relax.",
  streakBroken: "Let's start fresh today!",
  partialComplete: "Progress is progress! Great job.",
  missedHabit: "Tomorrow is a new opportunity.",
  lowEnergy: "It's okay to take it easy sometimes.",
  frustration: "It's okay—this happens to everyone. What might help?",
  procrastination: "What's the smallest step you can take right now?",
  overwhelmed: "Let's focus on just one thing.",
  taskComplete: "Nice work! You did it!",
  habitComplete: "Way to show up for yourself!",
  focusComplete: "Great focus session!",
  welcome: "Welcome back! Ready to tackle today?",
} as const;

// Encouragement messages for different scenarios
export const ENCOURAGEMENT_MESSAGES = {
  firstTask: [
    "Great start to the day!",
    "First task down!",
    "You're on a roll!",
  ],
  streak: [
    "You're building momentum!",
    "Consistency is key!",
    "Keep it going!",
  ],
  allHabits: [
    "All habits checked off!",
    "Perfect day for habits!",
    "You showed up for yourself today!",
  ],
  longFocus: [
    "Deep work accomplished!",
    "Impressive focus!",
    "You crushed that session!",
  ],
  overcomingProcrastination: [
    "Starting is the hardest part - you did it!",
    "Look at you, getting things done!",
    "That wasn't so bad, right?",
  ],
} as const;

// XP Rewards configuration
export const XP_REWARDS = {
  completeTask: { min: 10, max: 50 },
  completeSubtask: 5,
  focusSession: { min: 15, max: 30 },
  logHabit: 10,
  partialHabit: 5,
  completeRoutine: 25,
  moodCheckIn: 5,
  logWin: 5,
  processInbox: 3,
  breathingExercise: 10,
  firstTaskBonus: 10,
  allHabitsBonus: 20,
  consistencyBonus3Day: 15,
  consistencyBonus7Day: 50,
} as const;

// Level titles
export const LEVEL_TITLES: Record<number, string> = {
  1: 'Beginner',
  2: 'Explorer',
  3: 'Achiever',
  4: 'Focused',
  5: 'Dedicated',
  6: 'Consistent',
  7: 'Determined',
  8: 'Skilled',
  9: 'Expert',
  10: 'Master',
  11: 'Champion',
  12: 'Legend',
  13: 'Unstoppable',
  14: 'Elite',
  15: 'Transcendent',
  16: 'Mythic',
  17: 'Godlike',
  18: 'Cosmic',
  19: 'Ultimate',
  20: 'Perfection',
};

// Focus session presets (in minutes)
export const FOCUS_PRESETS = [
  { label: '15 min', value: 15, description: 'Quick sprint' },
  { label: '25 min', value: 25, description: 'Pomodoro' },
  { label: '45 min', value: 45, description: 'Deep work' },
  { label: '60 min', value: 60, description: 'Extended focus' },
  { label: '90 min', value: 90, description: 'Ultra focus' },
] as const;

// Background sounds for focus
export const BACKGROUND_SOUNDS = [
  { id: 'none', label: 'None', icon: '🔇' },
  { id: 'white_noise', label: 'White Noise', icon: '📻' },
  { id: 'brown_noise', label: 'Brown Noise', icon: '🌊' },
  { id: 'rain', label: 'Rain', icon: '🌧️' },
  { id: 'forest', label: 'Forest', icon: '🌲' },
  { id: 'cafe', label: 'Café', icon: '☕' },
  { id: 'ocean', label: 'Ocean', icon: '🌊' },
  { id: 'fireplace', label: 'Fireplace', icon: '🔥' },
  { id: 'lo_fi', label: 'Lo-Fi Beats', icon: '🎧' },
] as const;

// Time estimate presets (in minutes)
export const TIME_ESTIMATE_PRESETS = [5, 15, 25, 30, 45, 60, 90, 120] as const;

// Priority labels and colors
export const PRIORITY_CONFIG = {
  urgent_important: { label: 'Urgent & Important', color: '#EF4444', emoji: '🔴' },
  important: { label: 'Important', color: '#F59E0B', emoji: '🟠' },
  urgent: { label: 'Urgent', color: '#F97316', emoji: '🟡' },
  low: { label: 'Low', color: '#9CA3AF', emoji: '⚪' },
  none: { label: 'None', color: '#D1D5DB', emoji: '' },
} as const;

// Energy level configuration
export const ENERGY_CONFIG = {
  low: { label: 'Low Energy', color: '#22C55E', emoji: '🌱' },
  medium: { label: 'Medium Energy', color: '#F59E0B', emoji: '⚡' },
  high: { label: 'High Energy', color: '#EF4444', emoji: '🔥' },
} as const;

// Days of week
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
] as const;

// Mood levels
export const MOOD_LEVELS = [
  { value: 1, label: 'Struggling', emoji: '😢' },
  { value: 2, label: 'Down', emoji: '😔' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Great', emoji: '😊' },
] as const;

// Energy levels for mood tracking
export const ENERGY_LEVELS = [
  { value: 1, label: 'Exhausted', emoji: '😴' },
  { value: 2, label: 'Tired', emoji: '🥱' },
  { value: 3, label: 'Moderate', emoji: '😌' },
  { value: 4, label: 'Energized', emoji: '⚡' },
  { value: 5, label: 'Supercharged', emoji: '🔥' },
] as const;

// Onboarding options
export const ADHD_EXPERIENCE_OPTIONS = [
  { value: 'newly_diagnosed', label: 'Newly diagnosed' },
  { value: 'diagnosed_years', label: 'Diagnosed for years' },
  { value: 'self_identified', label: 'Self-identified' },
  { value: 'exploring', label: 'Still exploring' },
] as const;

export const PRIMARY_GOALS = [
  'Complete tasks on time',
  'Build better habits',
  'Improve focus',
  'Reduce procrastination',
  'Better time awareness',
  'Manage overwhelm',
  'Track progress',
  'Stay organized',
] as const;

export const BIGGEST_CHALLENGES = [
  'Starting tasks',
  'Finishing tasks',
  'Estimating time',
  'Remembering things',
  'Staying focused',
  'Managing energy',
  'Feeling overwhelmed',
  'Maintaining routines',
] as const;
