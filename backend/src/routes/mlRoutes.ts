// filepath: /Users/sleepyet/BrainXP/backend/src/routes/mlRoutes.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  analyzeUserPatterns,
  predictSpoons,
  predictTime,
  generateTaskRecommendations,
  recordFeedback,
  getLearningStats,
} from '../services/mlService.js';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// USER PATTERNS ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /ml/patterns
 * Analyze user's productivity patterns from historical data
 */
router.get('/patterns', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const patterns = await analyzeUserPatterns(userId);
    
    res.json({
      success: true,
      data: {
        ...patterns,
        insights: generatePatternInsights(patterns),
      },
    });
  } catch (error) {
    console.error('Error analyzing patterns:', error);
    res.status(500).json({ success: false, message: 'Failed to analyze patterns' });
  }
});

function generatePatternInsights(patterns: Awaited<ReturnType<typeof analyzeUserPatterns>>): string[] {
  const insights: string[] = [];
  
  // Best time insight
  if (patterns.bestHours.length > 0 && patterns.bestHours[0].productivity > 0) {
    const hour = patterns.bestHours[0].hour;
    const timeStr = hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;
    insights.push(`Your most productive hour is around ${timeStr}`);
  }
  
  // Best day insight
  if (patterns.bestDaysOfWeek.length > 0 && patterns.bestDaysOfWeek[0].productivity > 0) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    insights.push(`${days[patterns.bestDaysOfWeek[0].day]} is your most productive day`);
  }
  
  // Estimation accuracy insight
  if (patterns.estimationAccuracy > 1.3) {
    insights.push(`You tend to underestimate task time by ${Math.round((patterns.estimationAccuracy - 1) * 100)}%`);
  } else if (patterns.estimationAccuracy < 0.7) {
    insights.push(`You tend to overestimate task time by ${Math.round((1 - patterns.estimationAccuracy) * 100)}%`);
  } else {
    insights.push('Your time estimates are fairly accurate!');
  }
  
  // Task size preference
  const sizeDescriptions = {
    micro: 'very quick tasks (under 10 min)',
    small: 'short tasks (10-25 min)',
    medium: 'medium tasks (25-60 min)',
    large: 'longer tasks (60+ min)',
  };
  insights.push(`You work best with ${sizeDescriptions[patterns.preferredTaskSize]}`);
  
  // Peak energy time
  insights.push(`Your peak energy time is in the ${patterns.peakEnergyTime}`);
  
  return insights;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ML-ENHANCED PREDICTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const predictSpoonsSchema = z.object({
  body: z.object({
    taskTitle: z.string().min(1).max(500),
    taskDescription: z.string().max(2000).optional(),
    currentEnergy: z.number().min(1).max(5).optional(),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
  }),
});

/**
 * POST /ml/predict-spoons
 * ML-enhanced spoon prediction based on user's history
 */
router.post('/predict-spoons', authMiddleware, validate(predictSpoonsSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { taskTitle, taskDescription, currentEnergy, timeOfDay } = req.body;
    
    const prediction = await predictSpoons(
      userId,
      taskTitle,
      taskDescription,
      currentEnergy,
      timeOfDay
    );
    
    res.json({
      success: true,
      data: {
        ...prediction,
        isPersonalized: prediction.basedOnSimilarTasks > 0,
        source: prediction.basedOnSimilarTasks > 0 ? 'ml_prediction' : 'default_estimate',
      },
    });
  } catch (error) {
    console.error('Error predicting spoons:', error);
    res.status(500).json({ success: false, message: 'Failed to predict spoons' });
  }
});

const predictTimeSchema = z.object({
  body: z.object({
    taskTitle: z.string().min(1).max(500),
    taskDescription: z.string().max(2000).optional(),
    estimatedMinutes: z.number().min(1).max(480).optional(),
  }),
});

/**
 * POST /ml/predict-time
 * ML-enhanced time prediction based on user's history
 */
router.post('/predict-time', authMiddleware, validate(predictTimeSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { taskTitle, taskDescription, estimatedMinutes } = req.body;
    
    const prediction = await predictTime(
      userId,
      taskTitle,
      taskDescription,
      estimatedMinutes
    );
    
    // Add context about the prediction
    const context: string[] = [];
    if (prediction.userAccuracyFactor > 1.2) {
      context.push(`Based on your history, you typically take ${Math.round((prediction.userAccuracyFactor - 1) * 100)}% longer than estimated`);
    } else if (prediction.userAccuracyFactor < 0.8) {
      context.push(`You often finish ${Math.round((1 - prediction.userAccuracyFactor) * 100)}% faster than estimated`);
    }
    
    if (prediction.similarTasksAnalyzed > 0) {
      context.push(`Analyzed ${prediction.similarTasksAnalyzed} similar tasks from your history`);
    }
    
    res.json({
      success: true,
      data: {
        ...prediction,
        context,
        isPersonalized: prediction.similarTasksAnalyzed > 0,
        source: prediction.similarTasksAnalyzed > 0 ? 'ml_prediction' : 'default_estimate',
      },
    });
  } catch (error) {
    console.error('Error predicting time:', error);
    res.status(500).json({ success: false, message: 'Failed to predict time' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SMART RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const recommendationsSchema = z.object({
  body: z.object({
    taskTitle: z.string().min(1).max(500),
    estimatedMinutes: z.number().optional(),
    dueDate: z.string().datetime().optional(),
  }),
});

/**
 * POST /ml/recommendations
 * Get smart recommendations for a task
 */
router.post('/recommendations', authMiddleware, validate(recommendationsSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { taskTitle, estimatedMinutes, dueDate } = req.body;
    
    const recommendations = await generateTaskRecommendations(
      userId,
      taskTitle,
      estimatedMinutes,
      dueDate ? new Date(dueDate) : undefined
    );
    
    res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
      },
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ success: false, message: 'Failed to generate recommendations' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// FEEDBACK & LEARNING
// ═══════════════════════════════════════════════════════════════════════════════

const feedbackSchema = z.object({
  body: z.object({
    toolUsageId: z.string().uuid(),
    wasHelpful: z.boolean(),
    feedback: z.string().max(500).optional(),
    actualValues: z.record(z.unknown()).optional(),
  }),
});

/**
 * POST /ml/feedback
 * Submit feedback to improve ML predictions
 */
router.post('/feedback', authMiddleware, validate(feedbackSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { toolUsageId, wasHelpful, feedback, actualValues } = req.body;
    
    await recordFeedback(userId, toolUsageId, wasHelpful, feedback, actualValues);
    
    res.json({
      success: true,
      message: 'Feedback recorded. This helps improve your personalized predictions!',
    });
  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({ success: false, message: 'Failed to record feedback' });
  }
});

/**
 * GET /ml/stats
 * Get user's ML learning stats
 */
router.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const stats = await getLearningStats(userId);
    
    // Generate personalization level
    let personalizationLevel: 'low' | 'medium' | 'high' | 'expert';
    if (stats.totalInteractions < 10) personalizationLevel = 'low';
    else if (stats.totalInteractions < 50) personalizationLevel = 'medium';
    else if (stats.totalInteractions < 200) personalizationLevel = 'high';
    else personalizationLevel = 'expert';
    
    const personalizationDescriptions = {
      low: 'Just getting started! Use more AI tools to improve personalization.',
      medium: 'Building your profile. Predictions are becoming more accurate.',
      high: 'Strong personalization. AI predictions are tailored to your patterns.',
      expert: 'Maximum personalization. AI deeply understands your work style.',
    };
    
    res.json({
      success: true,
      data: {
        ...stats,
        personalizationLevel,
        personalizationDescription: personalizationDescriptions[personalizationLevel],
        nextMilestone: personalizationLevel === 'expert' 
          ? null 
          : { interactions: personalizationLevel === 'low' ? 10 : personalizationLevel === 'medium' ? 50 : 200 },
      },
    });
  } catch (error) {
    console.error('Error getting learning stats:', error);
    res.status(500).json({ success: false, message: 'Failed to get learning stats' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// OPTIMAL SCHEDULING
// ═══════════════════════════════════════════════════════════════════════════════

const optimalTimeSchema = z.object({
  body: z.object({
    taskTitle: z.string().min(1).max(500),
    estimatedMinutes: z.number().min(1).max(480),
    energyRequired: z.enum(['low', 'medium', 'high']).optional(),
    deadline: z.string().datetime().optional(),
  }),
});

/**
 * POST /ml/optimal-time
 * Suggest optimal time to schedule a task based on user patterns
 */
router.post('/optimal-time', authMiddleware, validate(optimalTimeSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { taskTitle, estimatedMinutes, energyRequired, deadline } = req.body;
    
    const patterns = await analyzeUserPatterns(userId);
    
    // Find best hours that can fit the task
    const suitableHours = patterns.bestHours
      .filter(h => h.productivity > 0)
      .slice(0, 5);
    
    // Adjust for energy requirements
    let recommendedHours = suitableHours;
    if (energyRequired === 'high') {
      // High energy tasks should be during peak times
      recommendedHours = suitableHours.slice(0, 2);
    } else if (energyRequired === 'low') {
      // Low energy tasks can be done anytime
      recommendedHours = suitableHours;
    }
    
    // Format suggestions
    const suggestions = recommendedHours.map(h => {
      const hour = h.hour;
      const timeStr = hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;
      const endHour = hour + Math.ceil(estimatedMinutes / 60);
      const endTimeStr = endHour < 12 ? `${endHour}:00 AM` : endHour === 12 ? '12:00 PM' : `${endHour - 12}:00 PM`;
      
      return {
        startHour: hour,
        timeRange: `${timeStr} - ${endTimeStr}`,
        productivityScore: Math.round(h.productivity * 100),
        reason: h.hour === patterns.bestHours[0].hour 
          ? 'Your most productive hour'
          : `High productivity time (${Math.round(h.productivity * 100)}% completion rate)`,
      };
    });
    
    res.json({
      success: true,
      data: {
        suggestions,
        peakEnergyTime: patterns.peakEnergyTime,
        taskFitsPreferredSize: estimatedMinutes <= patterns.averageTaskDuration * 1.5,
        recommendation: suggestions.length > 0 
          ? `Schedule "${taskTitle}" around ${suggestions[0].timeRange} for best results`
          : 'Build more history to get personalized scheduling suggestions',
      },
    });
  } catch (error) {
    console.error('Error finding optimal time:', error);
    res.status(500).json({ success: false, message: 'Failed to find optimal time' });
  }
});

export default router;
