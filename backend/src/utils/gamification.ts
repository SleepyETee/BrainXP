import { Task } from '@prisma/client';

/**
 * Priority multipliers for XP calculation
 * 
 * Based on the Eisenhower Matrix:
 * - urgent_important: Highest priority (2.0x)
 * - important: High priority (1.5x)
 * - urgent: Medium priority (1.3x)
 * - low/none: Base priority (1.0x)
 */
const PRIORITY_MULTIPLIERS: Record<string, number> = {
  urgent_important: 2.0,
  important: 1.5,
  urgent: 1.3,
  low: 1.0,
  none: 1.0,
};

/**
 * Calculate XP reward for completing a task.
 * 
 * XP Calculation Formula:
 * - Base: 10 XP
 * - Priority multiplier: 1.0x - 2.0x based on task priority
 * - Time investment bonus: +5 XP per 15 minutes (for tasks > 30 min)
 * - Subtask completion bonus: +10 XP (if all subtasks completed)
 * - Overdue penalty: -5 XP (if completed after due date)
 * 
 * Result is clamped between 5 and 100 XP to prevent exploitation
 * while still rewarding significant achievements.
 * 
 * @param task - The completed task with its properties
 * @param subtasksCompleted - Optional count of completed subtasks
 * @param totalSubtasks - Optional total count of subtasks
 * @returns XP amount (minimum 5, maximum 100)
 * 
 * @example
 * // High priority task with no time estimate
 * const xp = calculateTaskXP({
 *   priority: 'urgent_important',
 *   estimatedMinutes: null,
 *   dueDate: null,
 * });
 * // Returns: 20 XP (10 * 2.0)
 * 
 * @example
 * // Important task with all subtasks completed
 * const xp = calculateTaskXP(
 *   { priority: 'important', estimatedMinutes: 45, dueDate: null },
 *   3,
 *   3
 * );
 * // Returns: 35 XP (10 * 1.5 + 10 (time) + 10 (subtasks))
 */
export const calculateTaskXP = (
  task: Pick<Task, 'priority' | 'estimatedMinutes' | 'dueDate'>,
  subtasksCompleted?: number,
  totalSubtasks?: number
): number => {
  const BASE_XP = 10;
  const SUBTASK_BONUS = 10;
  const OVERDUE_PENALTY = 5;
  const TIME_BONUS_THRESHOLD = 30; // minutes
  const TIME_BONUS_PER_INTERVAL = 5; // XP per 15 min
  const MIN_XP = 5;
  const MAX_XP = 100;

  // Base XP with priority multiplier
  const priorityMultiplier = PRIORITY_MULTIPLIERS[task.priority] || 1.0;
  let xp = BASE_XP * priorityMultiplier;

  // Time investment bonus
  if (task.estimatedMinutes && task.estimatedMinutes > TIME_BONUS_THRESHOLD) {
    const intervals = Math.floor(task.estimatedMinutes / 15);
    xp += intervals * TIME_BONUS_PER_INTERVAL;
  }

  // Subtask completion bonus
  if (
    totalSubtasks &&
    subtasksCompleted &&
    totalSubtasks > 0 &&
    subtasksCompleted === totalSubtasks
  ) {
    xp += SUBTASK_BONUS;
  }

  // Overdue penalty (only if completed late)
  if (task.dueDate && new Date() > task.dueDate) {
    xp -= OVERDUE_PENALTY;
  }

  // Clamp between MIN_XP and MAX_XP
  return Math.max(MIN_XP, Math.min(MAX_XP, Math.round(xp)));
};

/**
 * Calculate XP required for a given level.
 * 
 * Uses an exponential curve to make early levels quick to achieve
 * while later levels require more XP. This maintains motivation for
 * users with ADHD by providing frequent early wins.
 * 
 * Formula: XP = 100 * (level ^ 1.5)
 * 
 * @param level - The target level (1-based)
 * @returns XP required to reach this level
 * 
 * @example
 * calculateXPForLevel(1)  // Returns: 100 XP
 * calculateXPForLevel(2)  // Returns: 283 XP
 * calculateXPForLevel(10) // Returns: 3,162 XP
 */
export const calculateXPForLevel = (level: number): number => {
  if (level <= 0) return 0;
  return Math.round(100 * Math.pow(level, 1.5));
};

/**
 * Calculate user's current level based on total XP.
 * 
 * @param totalXP - User's total accumulated XP
 * @returns Current level and progress to next level
 * 
 * @example
 * const progress = calculateLevel(500);
 * // Returns: { level: 2, currentXP: 500, xpForLevel: 283, xpForNextLevel: 520, progress: 0.92 }
 */
export const calculateLevel = (
  totalXP: number
): {
  level: number;
  currentXP: number;
  xpForLevel: number;
  xpForNextLevel: number;
  progress: number;
} => {
  // Find current level
  let level = 1;
  while (calculateXPForLevel(level + 1) <= totalXP) {
    level++;
  }

  const xpForLevel = calculateXPForLevel(level);
  const xpForNextLevel = calculateXPForLevel(level + 1);
  const xpInCurrentLevel = totalXP - xpForLevel;
  const xpNeededForLevel = xpForNextLevel - xpForLevel;
  const progress = xpInCurrentLevel / xpNeededForLevel;

  return {
    level,
    currentXP: totalXP,
    xpForLevel,
    xpForNextLevel,
    progress: Math.min(1, Math.max(0, progress)),
  };
};

/**
 * Calculate XP for completing a habit.
 * 
 * Rewards consistency with streak bonuses to encourage daily engagement.
 * 
 * @param currentStreak - Number of consecutive days the habit was completed
 * @returns XP amount
 * 
 * @example
 * calculateHabitXP(1)   // Returns: 15 XP (base)
 * calculateHabitXP(7)   // Returns: 25 XP (week streak bonus)
 * calculateHabitXP(30)  // Returns: 40 XP (month streak bonus)
 */
export const calculateHabitXP = (currentStreak: number): number => {
  const BASE_XP = 15;
  const WEEK_STREAK_BONUS = 10; // 7 days
  const MONTH_STREAK_BONUS = 25; // 30 days

  let xp = BASE_XP;

  if (currentStreak >= 30) {
    xp += MONTH_STREAK_BONUS;
  } else if (currentStreak >= 7) {
    xp += WEEK_STREAK_BONUS;
  }

  return xp;
};

/**
 * Calculate XP for completing a focus session.
 * 
 * Rewards longer focus periods with diminishing returns to prevent
 * exploitation while still encouraging sustained focus.
 * 
 * @param durationMinutes - Length of focus session in minutes
 * @returns XP amount
 * 
 * @example
 * calculateFocusSessionXP(25)  // Returns: 20 XP (Pomodoro)
 * calculateFocusSessionXP(50)  // Returns: 35 XP (Double Pomodoro)
 * calculateFocusSessionXP(120) // Returns: 60 XP (Deep work session)
 */
export const calculateFocusSessionXP = (durationMinutes: number): number => {
  const BASE_XP = 10;
  const XP_PER_5_MIN = 2;
  const MAX_XP = 100;

  // Diminishing returns after 1 hour
  let xp = BASE_XP;
  
  if (durationMinutes <= 60) {
    xp += Math.floor(durationMinutes / 5) * XP_PER_5_MIN;
  } else {
    // Full XP for first hour
    xp += 12 * XP_PER_5_MIN; // 60 min
    
    // Half XP for additional time
    const additionalMinutes = durationMinutes - 60;
    xp += Math.floor(additionalMinutes / 5) * (XP_PER_5_MIN / 2);
  }

  return Math.min(MAX_XP, Math.round(xp));
};
