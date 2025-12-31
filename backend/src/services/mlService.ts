// filepath: /Users/sleepyet/BrainXP/backend/src/services/mlService.ts
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════════════════
// MACHINE LEARNING SERVICE
// Personalized predictions, pattern recognition, and adaptive learning
// ═══════════════════════════════════════════════════════════════════════════════

export interface UserProductivityPattern {
  bestHours: { hour: number; productivity: number }[];
  bestDaysOfWeek: { day: number; productivity: number }[];
  averageTaskDuration: number;
  estimationAccuracy: number; // How accurate their estimates typically are
  preferredTaskSize: 'micro' | 'small' | 'medium' | 'large';
  peakEnergyTime: 'morning' | 'afternoon' | 'evening' | 'night';
  averageSpoonCapacity: number;
  commonDistractionPatterns: string[];
}

export interface TaskSimilarityFeatures {
  titleKeywords: string[];
  estimatedMinutes: number;
  priority: string;
  energyRequired: string;
  hasSubtasks: boolean;
  tags: string[];
}

export interface SpoonPrediction {
  predictedSpoons: number;
  confidence: number;
  basedOnSimilarTasks: number;
  adjustmentFactors: {
    factor: string;
    adjustment: number;
    reason: string;
  }[];
  personalizedTips: string[];
}

export interface TimePrediction {
  predictedMinutes: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
  userAccuracyFactor: number;
  similarTasksAnalyzed: number;
  personalizedBreakdown: {
    phase: string;
    minutes: number;
    basedOn: string;
  }[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract keywords from task title for similarity matching
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Calculate Jaccard similarity between two keyword sets
 */
function calculateSimilarity(keywords1: string[], keywords2: string[]): number {
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Categorize task based on keywords
 */
function categorizeTask(title: string): string[] {
  const categories: Record<string, string[]> = {
    'household': ['clean', 'wash', 'laundry', 'dishes', 'vacuum', 'organize', 'tidy', 'cook', 'grocery'],
    'work': ['email', 'meeting', 'report', 'presentation', 'call', 'deadline', 'project', 'review'],
    'creative': ['write', 'design', 'create', 'draw', 'paint', 'compose', 'edit', 'brainstorm'],
    'administrative': ['schedule', 'plan', 'budget', 'file', 'paperwork', 'appointment', 'invoice'],
    'physical': ['exercise', 'workout', 'run', 'walk', 'gym', 'yoga', 'stretch', 'sport'],
    'social': ['call', 'visit', 'party', 'event', 'friend', 'family', 'dinner', 'lunch'],
    'learning': ['study', 'read', 'learn', 'course', 'practice', 'research', 'homework'],
    'self-care': ['meditate', 'relax', 'sleep', 'doctor', 'therapy', 'health', 'rest'],
  };

  const lowerTitle = title.toLowerCase();
  const matched: string[] = [];

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => lowerTitle.includes(kw))) {
      matched.push(category);
    }
  }

  return matched.length > 0 ? matched : ['general'];
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER PATTERN ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze user's productivity patterns from historical data
 */
export async function analyzeUserPatterns(userId: string): Promise<UserProductivityPattern> {
  // Get completed tasks with timing data
  const completedTasks = await prisma.task.findMany({
    where: {
      userId,
      status: 'done',
      completedAt: { not: null },
      actualMinutes: { not: null },
    },
    orderBy: { completedAt: 'desc' },
    take: 200, // Analyze last 200 completed tasks
  });

  // Get focus sessions
  const focusSessions = await prisma.focusSession.findMany({
    where: {
      userId,
      status: 'completed',
    },
    orderBy: { startTime: 'desc' },
    take: 100,
  });

  // Get mood entries for energy patterns
  const moodEntries = await prisma.moodEntry.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  // Analyze hourly productivity
  const hourlyProductivity: Record<number, { completed: number; total: number }> = {};
  for (let h = 0; h < 24; h++) {
    hourlyProductivity[h] = { completed: 0, total: 0 };
  }

  completedTasks.forEach(task => {
    if (task.completedAt) {
      const hour = new Date(task.completedAt).getHours();
      hourlyProductivity[hour].completed++;
      hourlyProductivity[hour].total++;
    }
  });

  const bestHours = Object.entries(hourlyProductivity)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      productivity: data.total > 0 ? data.completed / data.total : 0,
    }))
    .sort((a, b) => b.productivity - a.productivity);

  // Analyze day of week productivity
  const dailyProductivity: Record<number, { completed: number; total: number }> = {};
  for (let d = 0; d < 7; d++) {
    dailyProductivity[d] = { completed: 0, total: 0 };
  }

  completedTasks.forEach(task => {
    if (task.completedAt) {
      const day = new Date(task.completedAt).getDay();
      dailyProductivity[day].completed++;
      dailyProductivity[day].total++;
    }
  });

  const bestDaysOfWeek = Object.entries(dailyProductivity)
    .map(([day, data]) => ({
      day: parseInt(day),
      productivity: data.total > 0 ? data.completed / data.total : 0,
    }))
    .sort((a, b) => b.productivity - a.productivity);

  // Calculate estimation accuracy
  const tasksWithEstimates = completedTasks.filter(
    t => t.estimatedMinutes && t.actualMinutes
  );
  
  let totalRatio = 0;
  tasksWithEstimates.forEach(task => {
    const ratio = (task.actualMinutes || 0) / (task.estimatedMinutes || 1);
    totalRatio += ratio;
  });
  
  const estimationAccuracy = tasksWithEstimates.length > 0
    ? totalRatio / tasksWithEstimates.length
    : 1.0;

  // Calculate average task duration
  const durations = completedTasks
    .filter(t => t.actualMinutes)
    .map(t => t.actualMinutes as number);
  
  const averageTaskDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 30;

  // Determine preferred task size based on average duration
  let preferredTaskSize: 'micro' | 'small' | 'medium' | 'large';
  if (averageTaskDuration < 10) preferredTaskSize = 'micro';
  else if (averageTaskDuration < 25) preferredTaskSize = 'small';
  else if (averageTaskDuration < 60) preferredTaskSize = 'medium';
  else preferredTaskSize = 'large';

  // Determine peak energy time from mood entries and focus sessions
  const timeOfDayEnergy: Record<string, number[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    night: [],
  };

  moodEntries.forEach(entry => {
    const hour = new Date(entry.timestamp).getHours();
    let timeOfDay: string;
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';
    
    timeOfDayEnergy[timeOfDay].push(entry.energyLevel);
  });

  const avgEnergy = Object.entries(timeOfDayEnergy).map(([time, levels]) => ({
    time,
    avg: levels.length > 0 ? levels.reduce((a, b) => a + b, 0) / levels.length : 0,
  }));

  const peakEnergyTime = avgEnergy.sort((a, b) => b.avg - a.avg)[0]?.time as
    | 'morning' | 'afternoon' | 'evening' | 'night'
    || 'morning';

  // Calculate average spoon capacity from mood entries
  const avgSpoonCapacity = moodEntries.length > 0
    ? moodEntries.reduce((sum, e) => sum + e.energyLevel, 0) / moodEntries.length
    : 3;

  return {
    bestHours,
    bestDaysOfWeek,
    averageTaskDuration,
    estimationAccuracy,
    preferredTaskSize,
    peakEnergyTime,
    averageSpoonCapacity: avgSpoonCapacity,
    commonDistractionPatterns: [], // Could be populated from interruption data
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPOON PREDICTION (ML-ENHANCED)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Predict spoons required for a task based on user's history
 */
export async function predictSpoons(
  userId: string,
  taskTitle: string,
  taskDescription?: string,
  currentEnergy?: number,
  timeOfDay?: string
): Promise<SpoonPrediction> {
  // Get user's AI tool usage history for spoon estimations
  const spoonHistory = await prisma.aIToolUsage.findMany({
    where: {
      userId,
      tool: 'spoon_estimator',
      wasHelpful: true, // Only learn from feedback-confirmed useful estimates
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Get completed tasks with energy data
  const completedTasks = await prisma.task.findMany({
    where: {
      userId,
      status: 'done',
      energyRequired: { not: 'medium' }, // Only tasks with explicit energy ratings
    },
    orderBy: { completedAt: 'desc' },
    take: 100,
  });

  const taskKeywords = extractKeywords(taskTitle + ' ' + (taskDescription || ''));
  const taskCategories = categorizeTask(taskTitle);

  // Find similar past tasks
  interface SimilarTask {
    similarity: number;
    spoons: number;
    energyRequired: string;
    source: 'history' | 'completed';
  }
  const similarTasks: SimilarTask[] = [];

  // Check AI tool history
  spoonHistory.forEach(usage => {
    const input = usage.input as { taskTitle?: string; taskDescription?: string };
    const output = usage.output as { spoons?: number };
    
    if (input.taskTitle && output.spoons) {
      const historyKeywords = extractKeywords(
        input.taskTitle + ' ' + (input.taskDescription || '')
      );
      const similarity = calculateSimilarity(taskKeywords, historyKeywords);
      
      if (similarity > 0.2) {
        similarTasks.push({
          similarity,
          spoons: output.spoons,
          energyRequired: 'medium',
          source: 'history',
        });
      }
    }
  });

  // Check completed tasks
  completedTasks.forEach(task => {
    const historyKeywords = extractKeywords(task.title + ' ' + (task.description || ''));
    const similarity = calculateSimilarity(taskKeywords, historyKeywords);
    
    if (similarity > 0.15) {
      const spoons = task.energyRequired === 'low' ? 2 
        : task.energyRequired === 'high' ? 4 
        : 3;
      
      similarTasks.push({
        similarity,
        spoons,
        energyRequired: task.energyRequired,
        source: 'completed',
      });
    }
  });

  // Calculate weighted average from similar tasks
  let predictedSpoons = 3; // Default
  let confidence = 0.5;

  if (similarTasks.length > 0) {
    const weightedSum = similarTasks.reduce(
      (sum, task) => sum + task.spoons * task.similarity,
      0
    );
    const weightSum = similarTasks.reduce((sum, task) => sum + task.similarity, 0);
    predictedSpoons = Math.round(weightedSum / weightSum);
    
    // Confidence based on number of similar tasks and similarity scores
    const avgSimilarity = weightSum / similarTasks.length;
    confidence = Math.min(0.95, 0.4 + avgSimilarity * 0.3 + Math.min(similarTasks.length, 10) * 0.03);
  }

  // Apply adjustments
  const adjustmentFactors: SpoonPrediction['adjustmentFactors'] = [];

  // Time of day adjustment
  if (timeOfDay) {
    const patterns = await analyzeUserPatterns(userId);
    if (timeOfDay !== patterns.peakEnergyTime) {
      const adjustment = 0.5;
      predictedSpoons = Math.min(5, predictedSpoons + adjustment);
      adjustmentFactors.push({
        factor: 'Time of Day',
        adjustment,
        reason: `Not your peak energy time (${patterns.peakEnergyTime})`,
      });
    }
  }

  // Current energy adjustment
  if (currentEnergy !== undefined) {
    if (currentEnergy <= 2) {
      const adjustment = 1;
      predictedSpoons = Math.min(5, predictedSpoons + adjustment);
      adjustmentFactors.push({
        factor: 'Current Energy',
        adjustment,
        reason: 'Low current energy will make tasks feel harder',
      });
    } else if (currentEnergy >= 4) {
      const adjustment = -0.5;
      predictedSpoons = Math.max(1, predictedSpoons + adjustment);
      adjustmentFactors.push({
        factor: 'Current Energy',
        adjustment,
        reason: 'High current energy makes tasks more manageable',
      });
    }
  }

  // Category-based tips
  const personalizedTips: string[] = [];
  
  if (taskCategories.includes('household')) {
    personalizedTips.push('Put on music or a podcast to make cleaning more engaging');
  }
  if (taskCategories.includes('creative')) {
    personalizedTips.push('Start with a 5-minute warm-up to get into creative flow');
  }
  if (taskCategories.includes('administrative')) {
    personalizedTips.push('Batch similar admin tasks together to reduce context switching');
  }
  if (predictedSpoons >= 4) {
    personalizedTips.push('Consider breaking this into smaller chunks with breaks');
  }

  return {
    predictedSpoons: Math.round(Math.max(1, Math.min(5, predictedSpoons))),
    confidence,
    basedOnSimilarTasks: similarTasks.length,
    adjustmentFactors,
    personalizedTips,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIME PREDICTION (ML-ENHANCED)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Predict time needed for a task based on user's history
 */
export async function predictTime(
  userId: string,
  taskTitle: string,
  taskDescription?: string,
  estimatedMinutes?: number
): Promise<TimePrediction> {
  // Get user's completed tasks with actual time data
  const completedTasks = await prisma.task.findMany({
    where: {
      userId,
      status: 'done',
      actualMinutes: { not: null },
    },
    orderBy: { completedAt: 'desc' },
    take: 200,
  });

  // Get user's AI tool usage for time estimations
  const timeHistory = await prisma.aIToolUsage.findMany({
    where: {
      userId,
      tool: 'time_estimator',
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  const taskKeywords = extractKeywords(taskTitle + ' ' + (taskDescription || ''));
  const taskCategories = categorizeTask(taskTitle);

  // Find similar completed tasks
  interface SimilarTaskTime {
    similarity: number;
    estimatedMinutes: number | null;
    actualMinutes: number;
    ratio: number;
  }
  const similarTasks: SimilarTaskTime[] = [];

  completedTasks.forEach(task => {
    const historyKeywords = extractKeywords(task.title + ' ' + (task.description || ''));
    const similarity = calculateSimilarity(taskKeywords, historyKeywords);
    
    if (similarity > 0.15 && task.actualMinutes) {
      const ratio = task.estimatedMinutes 
        ? task.actualMinutes / task.estimatedMinutes 
        : 1;
      
      similarTasks.push({
        similarity,
        estimatedMinutes: task.estimatedMinutes,
        actualMinutes: task.actualMinutes,
        ratio,
      });
    }
  });

  // Calculate user's average estimation accuracy
  const tasksWithBothTimes = completedTasks.filter(t => t.estimatedMinutes && t.actualMinutes);
  let userAccuracyFactor = 1.0;
  
  if (tasksWithBothTimes.length >= 5) {
    const ratios = tasksWithBothTimes.map(t => 
      (t.actualMinutes as number) / (t.estimatedMinutes as number)
    );
    userAccuracyFactor = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  }

  // Calculate prediction
  let predictedMinutes = estimatedMinutes || 30;
  let confidence = 0.5;

  if (similarTasks.length > 0) {
    // Weight by similarity
    const weightedSum = similarTasks.reduce(
      (sum, task) => sum + task.actualMinutes * task.similarity,
      0
    );
    const weightSum = similarTasks.reduce((sum, task) => sum + task.similarity, 0);
    const basePrediction = weightedSum / weightSum;

    // Blend with user's accuracy factor if they provided an estimate
    if (estimatedMinutes) {
      predictedMinutes = estimatedMinutes * userAccuracyFactor * 0.4 + basePrediction * 0.6;
    } else {
      predictedMinutes = basePrediction;
    }

    // Calculate confidence
    const avgSimilarity = weightSum / similarTasks.length;
    confidence = Math.min(0.9, 0.3 + avgSimilarity * 0.25 + Math.min(similarTasks.length, 15) * 0.025);
  } else if (estimatedMinutes) {
    // No similar tasks, but user gave estimate - apply their accuracy factor
    predictedMinutes = estimatedMinutes * userAccuracyFactor;
    confidence = 0.4;
  }

  // Calculate bounds based on variance in similar tasks
  let variance = 0.3; // Default 30% variance
  
  if (similarTasks.length >= 3) {
    const times = similarTasks.map(t => t.actualMinutes);
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    const squaredDiffs = times.map(t => Math.pow(t - mean, 2));
    const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / times.length);
    variance = stdDev / mean;
  }

  const lowerBound = Math.max(5, Math.round(predictedMinutes * (1 - variance)));
  const upperBound = Math.round(predictedMinutes * (1 + variance * 1.5)); // More variance on upper bound for ADHD

  // Create personalized breakdown
  const personalizedBreakdown: TimePrediction['personalizedBreakdown'] = [
    {
      phase: 'Task Initiation',
      minutes: Math.round(predictedMinutes * 0.15),
      basedOn: 'Average startup time for similar tasks',
    },
    {
      phase: 'Main Work',
      minutes: Math.round(predictedMinutes * 0.65),
      basedOn: similarTasks.length > 0 
        ? `${similarTasks.length} similar completed tasks`
        : 'Default estimation',
    },
    {
      phase: 'Wrap-up & Review',
      minutes: Math.round(predictedMinutes * 0.2),
      basedOn: 'Standard completion time',
    },
  ];

  return {
    predictedMinutes: Math.round(predictedMinutes),
    confidence,
    lowerBound,
    upperBound,
    userAccuracyFactor,
    similarTasksAnalyzed: similarTasks.length,
    personalizedBreakdown,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMART RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface TaskRecommendation {
  type: 'optimal_time' | 'break_down' | 'energy_match' | 'batch_similar';
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  data?: Record<string, unknown>;
}

/**
 * Generate smart recommendations for a task based on user patterns
 */
export async function generateTaskRecommendations(
  userId: string,
  taskTitle: string,
  estimatedMinutes?: number,
  dueDate?: Date
): Promise<TaskRecommendation[]> {
  const patterns = await analyzeUserPatterns(userId);
  const categories = categorizeTask(taskTitle);
  const recommendations: TaskRecommendation[] = [];

  // Optimal time recommendation
  if (patterns.bestHours.length > 0 && patterns.bestHours[0].productivity > 0.5) {
    const bestHour = patterns.bestHours[0].hour;
    const timeStr = bestHour < 12 
      ? `${bestHour}:00 AM` 
      : bestHour === 12 
        ? '12:00 PM'
        : `${bestHour - 12}:00 PM`;
    
    recommendations.push({
      type: 'optimal_time',
      message: `You're most productive around ${timeStr}. Schedule this task for that time!`,
      priority: 'medium',
      actionable: true,
      data: { suggestedHour: bestHour },
    });
  }

  // Break down recommendation for long tasks
  if (estimatedMinutes && estimatedMinutes > patterns.averageTaskDuration * 2) {
    recommendations.push({
      type: 'break_down',
      message: `This task is longer than your average (${Math.round(patterns.averageTaskDuration)} min). Consider breaking it into smaller steps.`,
      priority: 'high',
      actionable: true,
      data: { suggestedChunkSize: Math.round(patterns.averageTaskDuration) },
    });
  }

  // Energy matching
  const currentHour = new Date().getHours();
  const isLowEnergyTime = !patterns.bestHours.slice(0, 5).some(h => h.hour === currentHour);
  
  if (isLowEnergyTime && categories.includes('creative')) {
    recommendations.push({
      type: 'energy_match',
      message: "This is typically a lower-energy time for you. Consider saving creative work for your peak hours.",
      priority: 'medium',
      actionable: false,
    });
  }

  // Batch similar tasks
  const pendingTasks = await prisma.task.findMany({
    where: {
      userId,
      status: { in: ['inbox', 'todo'] },
    },
    take: 50,
  });

  const similarPending = pendingTasks.filter(task => {
    const taskCats = categorizeTask(task.title);
    return taskCats.some(c => categories.includes(c));
  });

  if (similarPending.length >= 3) {
    recommendations.push({
      type: 'batch_similar',
      message: `You have ${similarPending.length} similar ${categories[0]} tasks. Batch them together to reduce context switching!`,
      priority: 'low',
      actionable: true,
      data: { similarTaskIds: similarPending.map(t => t.id) },
    });
  }

  return recommendations;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEEDBACK LEARNING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Record user feedback to improve future predictions
 */
export async function recordFeedback(
  userId: string,
  toolUsageId: string,
  wasHelpful: boolean,
  feedback?: string,
  actualValues?: Record<string, unknown>
): Promise<void> {
  const existingUsage = await prisma.aIToolUsage.findUnique({ where: { id: toolUsageId } });
  const existingOutput = existingUsage?.output as Record<string, unknown> | null | undefined;
  
  await prisma.aIToolUsage.update({
    where: { id: toolUsageId },
    data: {
      wasHelpful,
      feedback,
      output: actualValues 
        ? ({ ...(existingOutput || {}), actualValues } as Prisma.InputJsonValue)
        : undefined,
    },
  });
}

/**
 * Get user's learning stats
 */
export async function getLearningStats(userId: string): Promise<{
  totalInteractions: number;
  feedbackRate: number;
  improvementOverTime: number;
  mostUsedTools: { tool: string; count: number }[];
}> {
  const allUsage = await prisma.aIToolUsage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const withFeedback = allUsage.filter(u => u.wasHelpful !== null);
  const feedbackRate = allUsage.length > 0 ? withFeedback.length / allUsage.length : 0;

  // Calculate improvement (compare old vs recent helpful ratings)
  const recentFeedback = withFeedback.slice(0, Math.min(20, withFeedback.length));
  const olderFeedback = withFeedback.slice(-Math.min(20, withFeedback.length));
  
  const recentHelpful = recentFeedback.filter(u => u.wasHelpful).length / Math.max(recentFeedback.length, 1);
  const olderHelpful = olderFeedback.filter(u => u.wasHelpful).length / Math.max(olderFeedback.length, 1);
  const improvementOverTime = recentHelpful - olderHelpful;

  // Count by tool
  const toolCounts: Record<string, number> = {};
  allUsage.forEach(u => {
    toolCounts[u.tool] = (toolCounts[u.tool] || 0) + 1;
  });

  const mostUsedTools = Object.entries(toolCounts)
    .map(([tool, count]) => ({ tool, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalInteractions: allUsage.length,
    feedbackRate,
    improvementOverTime,
    mostUsedTools,
  };
}
