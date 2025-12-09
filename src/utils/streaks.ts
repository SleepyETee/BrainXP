import { differenceInDays, subDays, startOfDay, format } from 'date-fns';
import { FlexibleStreak } from '../types/habit';

/**
 * Calculate flexible streak based on completions within a window
 * This is more forgiving than traditional streaks - perfect for ADHD users
 */
export function calculateFlexibleStreak(
  completionDates: Date[] | string[],
  windowDays: number = 14
): FlexibleStreak {
  const today = startOfDay(new Date());
  const windowStart = subDays(today, windowDays - 1);

  // Convert string dates to Date objects and filter to window
  const completions = completionDates
    .map((d) => (typeof d === 'string' ? startOfDay(new Date(d)) : startOfDay(d)))
    .filter((date) => date >= windowStart && date <= today);

  // Count unique days
  const uniqueDays = new Set(completions.map((d) => format(d, 'yyyy-MM-dd')));

  const completed = uniqueDays.size;
  const percentage = Math.round((completed / windowDays) * 100);

  return {
    completed,
    total: windowDays,
    percentage,
    windowDays,
  };
}

/**
 * Format flexible streak for display
 */
export function formatFlexibleStreak(streak: FlexibleStreak): string {
  return `${streak.completed} of last ${streak.total} days (${streak.percentage}%)`;
}

/**
 * Calculate traditional streak (consecutive days)
 * More strict, but still useful for some metrics
 */
export function calculateConsecutiveStreak(completionDates: Date[] | string[]): number {
  if (completionDates.length === 0) return 0;

  // Sort dates in descending order (most recent first)
  const sortedDates = completionDates
    .map((d) => (typeof d === 'string' ? startOfDay(new Date(d)) : startOfDay(d)))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);

  // Check if most recent completion is today or yesterday
  const mostRecent = sortedDates[0];
  if (!mostRecent) return 0;

  const daysSinceLast = differenceInDays(today, mostRecent);
  if (daysSinceLast > 1) return 0;

  // Count consecutive days
  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const current = sortedDates[i];
    const previous = sortedDates[i - 1];
    const diff = differenceInDays(previous!, current!);

    if (diff === 1) {
      streak++;
    } else if (diff > 1) {
      break;
    }
    // diff === 0 means same day, continue counting
  }

  return streak;
}

/**
 * Get streak status message (supportive language)
 */
export function getStreakStatusMessage(
  consecutiveStreak: number,
  flexibleStreak: FlexibleStreak
): string {
  // Prioritize flexible streak for messaging
  if (flexibleStreak.percentage >= 80) {
    return "You're doing amazing! 🌟";
  } else if (flexibleStreak.percentage >= 60) {
    return "Great consistency! Keep it up! 💪";
  } else if (flexibleStreak.percentage >= 40) {
    return "You're making progress! Every day counts. 🌱";
  } else if (flexibleStreak.percentage > 0) {
    return "Every completion matters. You've got this! 💙";
  } else {
    return "Today is a great day to start! ✨";
  }
}

/**
 * Calculate streak bonus XP
 */
export function calculateStreakBonus(consecutiveStreak: number): number {
  if (consecutiveStreak >= 30) return 200;
  if (consecutiveStreak >= 14) return 100;
  if (consecutiveStreak >= 7) return 50;
  if (consecutiveStreak >= 3) return 15;
  return 0;
}

/**
 * Get days until streak milestone
 */
export function daysUntilMilestone(currentStreak: number): {
  milestone: number;
  daysRemaining: number;
} | null {
  const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
  const nextMilestone = milestones.find((m) => m > currentStreak);

  if (!nextMilestone) return null;

  return {
    milestone: nextMilestone,
    daysRemaining: nextMilestone - currentStreak,
  };
}

/**
 * Get streak fire emoji based on streak length
 */
export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return '🔥🔥🔥';
  if (streak >= 14) return '🔥🔥';
  if (streak >= 7) return '🔥';
  if (streak >= 3) return '🌟';
  if (streak > 0) return '⭐';
  return '✨';
}

