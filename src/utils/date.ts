import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  isThisWeek,
  differenceInDays,
  differenceInMinutes,
  addDays,
  startOfDay,
  endOfDay,
  parseISO,
} from 'date-fns';

/**
 * Format a date string to a relative date label
 */
export function formatRelativeDate(dateString: string): string {
  const date = parseISO(dateString);
  const today = new Date();

  if (isToday(date)) {
    return 'Today';
  }

  if (isTomorrow(date)) {
    return 'Tomorrow';
  }

  if (isYesterday(date)) {
    return 'Yesterday';
  }

  const daysDiff = differenceInDays(date, today);

  if (daysDiff < 0) {
    if (daysDiff === -1) {
      return 'Yesterday';
    }
    if (daysDiff > -7) {
      return `${Math.abs(daysDiff)} days ago`;
    }
    return format(date, 'MMM d');
  }

  if (daysDiff <= 7) {
    return format(date, 'EEEE'); // Day name
  }

  if (date.getFullYear() === today.getFullYear()) {
    return format(date, 'MMM d');
  }

  return format(date, 'MMM d, yyyy');
}

/**
 * Format time string (HH:mm) to display format
 */
export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return format(date, 'h:mm a');
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format seconds to MM:SS string
 */
export function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get greeting based on time of day
 */
export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

/**
 * Check if a date is overdue
 */
export function isOverdue(dateString: string): boolean {
  const date = parseISO(dateString);
  const today = startOfDay(new Date());
  return date < today;
}

/**
 * Get date string for today
 */
export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get date string for tomorrow
 */
export function getTomorrowString(): string {
  return format(addDays(new Date(), 1), 'yyyy-MM-dd');
}

/**
 * Format date for display
 */
export function formatDate(dateString: string, formatString: string = 'MMM d, yyyy'): string {
  return format(parseISO(dateString), formatString);
}

/**
 * Get the start of the current week
 */
export function getWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  return startOfDay(start);
}

/**
 * Get day of week number (0 = Sunday)
 */
export function getDayOfWeek(dateString?: string): number {
  const date = dateString ? parseISO(dateString) : new Date();
  return date.getDay();
}

/**
 * Get short day names
 */
export function getShortDayNames(): string[] {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

/**
 * Calculate streak from an array of date strings
 */
export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sortedDates = [...dates].sort().reverse();
  const today = getTodayString();
  const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd');

  // Check if streak is still active
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = parseISO(sortedDates[i - 1]);
    const currDate = parseISO(sortedDates[i]);
    const diff = differenceInDays(prevDate, currDate);

    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
