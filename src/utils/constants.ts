/**
 * Supportive, non-judgmental messages for various situations
 * Language designed specifically for ADHD users
 */
export const SUPPORTIVE_MESSAGES = {
  // Task-related
  taskOverdue: "This task needs your attention",
  noTasksToday: "Your day is clear! Time to plan or relax.",
  taskCompleted: "Great job! You did it!",
  taskAbandoned: "It's okay to let go of tasks that no longer serve you.",
  
  // Streaks and habits
  streakBroken: "Let's start fresh today!",
  streakMaintained: "You're on fire! Keep it up!",
  partialComplete: "Progress is progress! Great job.",
  missedHabit: "Tomorrow is a new opportunity.",
  
  // Energy and mood
  lowEnergy: "It's okay to take it easy sometimes.",
  highEnergy: "Great energy today! What would you like to tackle?",
  frustration: "It's okay—this happens to everyone. What might help?",
  overwhelmed: "Let's break this down into smaller pieces.",
  
  // Focus sessions
  focusComplete: "Amazing focus session! You crushed it!",
  focusInterrupted: "Interruptions happen. Ready to refocus?",
  sessionShort: "Every minute of focus counts!",
  
  // Encouragement
  dailyStart: "You've got this today!",
  firstTask: "Starting is the hardest part—well done!",
  endOfDay: "Great effort today. Rest well!",
  comeback: "Welcome back! Ready to pick up where you left off?",
} as const;

/**
 * XP rewards for various actions
 * Designed to provide frequent dopamine hits
 */
export const XP_REWARDS = {
  // Task-related
  completeTask: { min: 10, max: 50 },
  completeSubtask: 5,
  createTask: 2,
  startTask: 3,
  
  // Focus sessions
  focusSession: { min: 15, max: 30 },
  focusSessionComplete: 20,
  longFocusBonus: 15, // For sessions > 45 min
  noInterruptionBonus: 10,
  
  // Habits
  logHabit: 10,
  partialHabit: 5,
  habitStreakBonus: { 3: 15, 7: 50, 14: 100, 30: 200 },
  
  // Routines
  completeRoutine: 25,
  completeRoutineStep: 5,
  
  // Wellness
  moodCheckIn: 5,
  logWin: 5,
  breathingExercise: 10,
  
  // Capture/Inbox
  processInbox: 3,
  
  // Daily bonuses
  firstTaskBonus: 10,
  allHabitsBonus: 20,
  consistencyBonus3Day: 15,
  consistencyBonus7Day: 50,
  loginBonus: 5,
} as const;

/**
 * Level thresholds
 */
export const LEVEL_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  500,   // Level 4
  850,   // Level 5
  1300,  // Level 6
  1850,  // Level 7
  2500,  // Level 8
  3300,  // Level 9
  4200,  // Level 10
  5200,  // Level 11
  6400,  // Level 12
  7800,  // Level 13
  9400,  // Level 14
  11200, // Level 15
  13200, // Level 16
  15400, // Level 17
  17800, // Level 18
  20400, // Level 19
  23200, // Level 20
] as const;

/**
 * Default timer durations (in minutes)
 */
export const TIMER_PRESETS = [
  { label: '5 min', value: 5, description: 'Quick task' },
  { label: '15 min', value: 15, description: 'Short focus' },
  { label: '25 min', value: 25, description: 'Pomodoro' },
  { label: '45 min', value: 45, description: 'Deep work' },
  { label: '60 min', value: 60, description: 'Extended' },
] as const;

/**
 * Background sounds for focus sessions
 */
export const BACKGROUND_SOUNDS = [
  { id: 'none', name: 'None', icon: '🔇' },
  { id: 'rain', name: 'Rain', icon: '🌧️' },
  { id: 'forest', name: 'Forest', icon: '🌲' },
  { id: 'ocean', name: 'Ocean Waves', icon: '🌊' },
  { id: 'cafe', name: 'Coffee Shop', icon: '☕' },
  { id: 'whitenoise', name: 'White Noise', icon: '📻' },
  { id: 'lofi', name: 'Lo-fi Beats', icon: '🎵' },
] as const;

/**
 * Task priorities with descriptions
 */
export const PRIORITIES = [
  { 
    value: 'urgent_important', 
    label: 'Urgent & Important', 
    color: '#EF4444',
    description: 'Do first - critical and time-sensitive',
  },
  { 
    value: 'important', 
    label: 'Important', 
    color: '#F59E0B',
    description: 'Schedule - significant but not urgent',
  },
  { 
    value: 'urgent', 
    label: 'Urgent', 
    color: '#F97316',
    description: 'Delegate if possible - time-sensitive but not critical',
  },
  { 
    value: 'low', 
    label: 'Low', 
    color: '#9CA3AF',
    description: 'Do later - nice to complete',
  },
  { 
    value: 'none', 
    label: 'None', 
    color: '#D1D5DB',
    description: 'No priority set',
  },
] as const;

/**
 * Energy levels with recommendations
 */
export const ENERGY_LEVELS = [
  {
    value: 'low',
    label: 'Low Energy',
    color: '#22C55E',
    description: 'Good for routine tasks',
    icon: '🪫',
  },
  {
    value: 'medium',
    label: 'Medium Energy',
    color: '#F59E0B',
    description: 'Good for most tasks',
    icon: '⚡',
  },
  {
    value: 'high',
    label: 'High Energy',
    color: '#EF4444',
    description: 'Save for challenging tasks',
    icon: '🔥',
  },
] as const;

/**
 * Flexible streak window options
 */
export const STREAK_WINDOWS = [
  { days: 7, label: 'Weekly' },
  { days: 14, label: 'Bi-weekly' },
  { days: 30, label: 'Monthly' },
] as const;

/**
 * Progress metaphor options for gamification
 */
export const PROGRESS_METAPHORS = [
  { id: 'minimal', name: 'Minimal', description: 'Simple XP and levels' },
  { id: 'garden', name: 'Garden', description: 'Grow a virtual garden' },
  { id: 'pet', name: 'Virtual Pet', description: 'Care for a cute companion' },
  { id: 'adventure', name: 'Adventure', description: 'Go on a quest' },
] as const;
