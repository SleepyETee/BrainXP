import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CBTIntervention,
  ThoughtLogEntry,
  ThoughtPatternTag,
  CBTPatternInsight,
  ProcrastinationNudge,
  CognitiveProfile,
  FocusSessionPlan,
  CognitiveTrainingSession,
  WorkingMemoryStep,
  MindfulnessSession,
  MindfulnessType,
  MindfulnessTrigger,
  ADHDCard,
  TriggeredEducation,
  UserEducationProgress,
  TDCSSession,
  AvoidanceReason,
} from '../types/therapy';

// ═══════════════════════════════════════════════════════════════════════════════
// CBT Store
// ═══════════════════════════════════════════════════════════════════════════════

interface CBTState {
  interventions: CBTIntervention[];
  thoughtLogs: ThoughtLogEntry[];
  activeIntervention: CBTIntervention | null;
  
  // Actions
  startIntervention: (taskId: string, triggerType: CBTIntervention['triggerType']) => CBTIntervention;
  addNegativeThought: (interventionId: string, thought: string, presetKey?: AvoidanceReason) => void;
  addBalancedThought: (interventionId: string, thought: string) => void;
  setTwoMinuteAction: (interventionId: string, action: string) => void;
  completeIntervention: (interventionId: string, outcome: CBTIntervention['outcome'], notes?: string) => void;
  skipIntervention: (interventionId: string) => void;
  
  addThoughtLog: (entry: Omit<ThoughtLogEntry, 'id' | 'createdAt'>) => void;
  
  // Selectors
  getPatternInsights: () => CBTPatternInsight[];
  getInterventionsForTask: (taskId: string) => CBTIntervention[];
  getRecentThoughtLogs: (days?: number) => ThoughtLogEntry[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Cognitive Remediation Store
// ═══════════════════════════════════════════════════════════════════════════════

interface CognitiveState {
  profile: CognitiveProfile | null;
  sessionPlans: FocusSessionPlan[];
  trainingSessions: CognitiveTrainingSession[];
  
  // Actions
  initializeProfile: (userId: string) => void;
  createSessionPlan: (sessionId: string, steps: string[]) => FocusSessionPlan;
  markStepCompleted: (planId: string, stepId: string) => void;
  markStepForgotten: (planId: string, stepId: string) => void;
  completeSessionPlan: (planId: string) => void;
  updateWorkingMemoryCapacity: (capacity: number) => void;
  
  addTrainingSession: (session: Omit<CognitiveTrainingSession, 'id'>) => void;
  
  // Selectors
  getRecommendedStepCount: () => number;
  getRecentPerformance: () => { successRate: number; trend: 'improving' | 'stable' | 'declining' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mindfulness Store
// ═══════════════════════════════════════════════════════════════════════════════

interface MindfulnessState {
  mindfulnessSessions: MindfulnessSession[];
  activeMindfulnessSession: MindfulnessSession | null;
  // Legacy aliases
  sessions: MindfulnessSession[];
  activeSession: MindfulnessSession | null;
  
  // Actions
  startSession: (type: MindfulnessType, trigger: MindfulnessTrigger, contextTaskId?: string, contextFocusSessionId?: string) => MindfulnessSession;
  setMoodBefore: (sessionId: string, mood: number) => void;
  completeSession: (sessionId: string, moodAfter?: number) => void;
  cancelSession: (sessionId: string) => void;
  
  // Selectors
  getTodaySessions: () => MindfulnessSession[];
  getSessionsByType: (type: MindfulnessType) => MindfulnessSession[];
  getMindfulnessStreak: () => number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Psychoeducation Store
// ═══════════════════════════════════════════════════════════════════════════════

interface EducationState {
  progress: UserEducationProgress | null;
  triggeredCards: TriggeredEducation[];
  pendingCard: TriggeredEducation | null;
  
  // Actions
  initializeProgress: (userId: string) => void;
  markCardViewed: (cardId: string) => void;
  toggleBookmark: (cardId: string) => void;
  triggerEducation: (cardId: string, trigger: TriggeredEducation['trigger'], context?: TriggeredEducation['triggerContext']) => void;
  dismissTriggeredCard: (triggeredId: string) => void;
  rateCard: (triggeredId: string, rating: number) => void;
  
  // Selectors
  getUnviewedTriggeredCards: () => TriggeredEducation[];
  getBookmarkedCards: () => string[];
  isCardViewed: (cardId: string) => boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// tDCS Tracking Store
// ═══════════════════════════════════════════════════════════════════════════════

interface TDCSState {
  tdcsSessions: TDCSSession[];
  isEnrolledInStudy: boolean;
  
  // Actions
  setStudyEnrollment: (enrolled: boolean) => void;
  logSession: (session: Omit<TDCSSession, 'id' | 'createdAt' | 'updatedAt'>) => TDCSSession;
  updateSession: (sessionId: string, updates: Partial<TDCSSession>) => void;
  deleteSession: (sessionId: string) => void;
  
  // Selectors
  getRecentSessions: (days?: number) => TDCSSession[];
  getSessionStats: () => { totalSessions: number; avgFocusChange: number; avgMoodChange: number };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Combined Therapy Store
// ═══════════════════════════════════════════════════════════════════════════════

// Combined interface using Omit to avoid property conflicts
interface TherapyState extends 
  CBTState, 
  CognitiveState, 
  Omit<MindfulnessState, 'sessions' | 'activeSession'>,
  EducationState, 
  Omit<TDCSState, 'logSession' | 'updateSession' | 'deleteSession'> {
  // Mindfulness sessions (using legacy names for compatibility)
  sessions: MindfulnessSession[];
  activeSession: MindfulnessSession | null;
  // TDCS actions with unique names to avoid conflicts
  logTDCSSession: (session: Omit<TDCSSession, 'id' | 'createdAt' | 'updatedAt'>) => TDCSSession;
  updateTDCSSession: (sessionId: string, updates: Partial<TDCSSession>) => void;
  deleteTDCSSession: (sessionId: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useTherapyStore = create<TherapyState>()(
  persist(
    (set, get) => ({
      // ═══════════════════════════════════════════════════════════════════════════
      // CBT State & Actions
      // ═══════════════════════════════════════════════════════════════════════════
      interventions: [],
      thoughtLogs: [],
      activeIntervention: null,
      
      startIntervention: (taskId, triggerType) => {
        const intervention: CBTIntervention = {
          id: generateId(),
          taskId,
          userId: '1', // TODO: Get from auth store
          triggeredAt: new Date().toISOString(),
          triggerType,
          negativeThoughts: [],
          balancedThoughts: [],
          outcome: null,
        };
        
        set((state) => ({
          interventions: [...state.interventions, intervention],
          activeIntervention: intervention,
        }));
        
        return intervention;
      },
      
      addNegativeThought: (interventionId, thought, presetKey) => {
        set((state) => ({
          interventions: state.interventions.map((i) =>
            i.id === interventionId
              ? {
                  ...i,
                  negativeThoughts: [
                    ...i.negativeThoughts,
                    { id: generateId(), text: thought, presetKey },
                  ],
                }
              : i
          ),
          activeIntervention:
            state.activeIntervention?.id === interventionId
              ? {
                  ...state.activeIntervention,
                  negativeThoughts: [
                    ...state.activeIntervention.negativeThoughts,
                    { id: generateId(), text: thought, presetKey },
                  ],
                }
              : state.activeIntervention,
        }));
      },
      
      addBalancedThought: (interventionId, thought) => {
        set((state) => ({
          interventions: state.interventions.map((i) =>
            i.id === interventionId
              ? {
                  ...i,
                  balancedThoughts: [
                    ...i.balancedThoughts,
                    { id: generateId(), text: thought },
                  ],
                }
              : i
          ),
          activeIntervention:
            state.activeIntervention?.id === interventionId
              ? {
                  ...state.activeIntervention,
                  balancedThoughts: [
                    ...state.activeIntervention.balancedThoughts,
                    { id: generateId(), text: thought },
                  ],
                }
              : state.activeIntervention,
        }));
      },
      
      setTwoMinuteAction: (interventionId, action) => {
        set((state) => ({
          interventions: state.interventions.map((i) =>
            i.id === interventionId ? { ...i, twoMinuteAction: action } : i
          ),
          activeIntervention:
            state.activeIntervention?.id === interventionId
              ? { ...state.activeIntervention, twoMinuteAction: action }
              : state.activeIntervention,
        }));
      },
      
      completeIntervention: (interventionId, outcome, notes) => {
        set((state) => ({
          interventions: state.interventions.map((i) =>
            i.id === interventionId
              ? { ...i, outcome, outcomeNotes: notes, completedAt: new Date().toISOString() }
              : i
          ),
          activeIntervention: null,
        }));
      },
      
      skipIntervention: (interventionId) => {
        set((state) => ({
          interventions: state.interventions.map((i) =>
            i.id === interventionId
              ? { ...i, outcome: 'skipped', completedAt: new Date().toISOString() }
              : i
          ),
          activeIntervention: null,
        }));
      },
      
      addThoughtLog: (entry) => {
        const logEntry: ThoughtLogEntry = {
          ...entry,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          thoughtLogs: [...state.thoughtLogs, logEntry],
        }));
      },
      
      getPatternInsights: () => {
        const { thoughtLogs, interventions } = get();
        const patternCounts: Record<ThoughtPatternTag, { count: number; lastOccurrence: string }> = {} as any;
        
        // Count patterns from thought logs
        thoughtLogs.forEach((log) => {
          log.patternTags.forEach((tag) => {
            if (!patternCounts[tag]) {
              patternCounts[tag] = { count: 0, lastOccurrence: log.createdAt };
            }
            patternCounts[tag].count++;
            if (log.createdAt > patternCounts[tag].lastOccurrence) {
              patternCounts[tag].lastOccurrence = log.createdAt;
            }
          });
        });
        
        // Count patterns from interventions (based on negative thought presets)
        interventions.forEach((int) => {
          int.negativeThoughts.forEach((thought) => {
            if (thought.presetKey) {
              const tag = mapPresetToPattern(thought.presetKey);
              if (tag) {
                if (!patternCounts[tag]) {
                  patternCounts[tag] = { count: 0, lastOccurrence: int.triggeredAt };
                }
                patternCounts[tag].count++;
              }
            }
          });
        });
        
        const total = Object.values(patternCounts).reduce((sum, p) => sum + p.count, 0);
        
        return Object.entries(patternCounts)
          .map(([pattern, data]) => ({
            pattern: pattern as ThoughtPatternTag,
            count: data.count,
            percentage: total > 0 ? (data.count / total) * 100 : 0,
            lastOccurrence: data.lastOccurrence,
          }))
          .sort((a, b) => b.count - a.count);
      },
      
      getInterventionsForTask: (taskId) => {
        return get().interventions.filter((i) => i.taskId === taskId);
      },
      
      getRecentThoughtLogs: (days = 30) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return get().thoughtLogs.filter((log) => new Date(log.createdAt) >= cutoff);
      },
      
      // ═══════════════════════════════════════════════════════════════════════════
      // Cognitive State & Actions
      // ═══════════════════════════════════════════════════════════════════════════
      profile: null,
      sessionPlans: [],
      trainingSessions: [],
      
      initializeProfile: (userId) => {
        set({
          profile: {
            userId,
            workingMemoryCapacity: 3,
            lastAssessed: new Date().toISOString(),
            assessmentHistory: [],
          },
        });
      },
      
      createSessionPlan: (sessionId, steps) => {
        const { profile } = get();
        const maxSteps = profile?.workingMemoryCapacity || 3;
        
        const plan: FocusSessionPlan = {
          id: generateId(),
          sessionId,
          userId: '1',
          steps: steps.slice(0, maxSteps).map((text) => ({
            id: generateId(),
            text,
            completed: false,
            forgotten: false,
          })),
          maxStepsRecommended: maxSteps,
          stepsRemembered: 0,
          stepsForgotten: 0,
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          sessionPlans: [...state.sessionPlans, plan],
        }));
        
        return plan;
      },
      
      markStepCompleted: (planId, stepId) => {
        set((state) => ({
          sessionPlans: state.sessionPlans.map((plan) =>
            plan.id === planId
              ? {
                  ...plan,
                  steps: plan.steps.map((step) =>
                    step.id === stepId ? { ...step, completed: true } : step
                  ),
                  stepsRemembered: plan.stepsRemembered + 1,
                }
              : plan
          ),
        }));
      },
      
      markStepForgotten: (planId, stepId) => {
        set((state) => ({
          sessionPlans: state.sessionPlans.map((plan) =>
            plan.id === planId
              ? {
                  ...plan,
                  steps: plan.steps.map((step) =>
                    step.id === stepId ? { ...step, forgotten: true } : step
                  ),
                  stepsForgotten: plan.stepsForgotten + 1,
                }
              : plan
          ),
        }));
      },
      
      completeSessionPlan: (planId) => {
        const plan = get().sessionPlans.find((p) => p.id === planId);
        if (!plan) return;
        
        const successRate = plan.steps.length > 0
          ? plan.stepsRemembered / plan.steps.length
          : 0;
        
        set((state) => ({
          sessionPlans: state.sessionPlans.map((p) =>
            p.id === planId
              ? { ...p, completedAt: new Date().toISOString() }
              : p
          ),
          profile: state.profile
            ? {
                ...state.profile,
                assessmentHistory: [
                  ...state.profile.assessmentHistory,
                  {
                    date: new Date().toISOString(),
                    stepsAttempted: plan.steps.length,
                    stepsRemembered: plan.stepsRemembered,
                    successRate,
                  },
                ],
              }
            : null,
        }));
        
        // Auto-adjust working memory capacity
        const { profile } = get();
        if (profile) {
          const recentHistory = profile.assessmentHistory.slice(-5);
          const avgSuccess = recentHistory.reduce((sum, h) => sum + h.successRate, 0) / recentHistory.length;
          
          if (avgSuccess > 0.9 && profile.workingMemoryCapacity < 5) {
            get().updateWorkingMemoryCapacity(profile.workingMemoryCapacity + 1);
          } else if (avgSuccess < 0.5 && profile.workingMemoryCapacity > 2) {
            get().updateWorkingMemoryCapacity(profile.workingMemoryCapacity - 1);
          }
        }
      },
      
      updateWorkingMemoryCapacity: (capacity) => {
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, workingMemoryCapacity: capacity, lastAssessed: new Date().toISOString() }
            : null,
        }));
      },
      
      addTrainingSession: (session) => {
        const newSession: CognitiveTrainingSession = {
          ...session,
          id: generateId(),
        };
        
        set((state) => ({
          trainingSessions: [...state.trainingSessions, newSession],
        }));
      },
      
      getRecommendedStepCount: () => {
        return get().profile?.workingMemoryCapacity || 3;
      },
      
      getRecentPerformance: () => {
        const { profile } = get();
        if (!profile || profile.assessmentHistory.length < 2) {
          return { successRate: 0.5, trend: 'stable' as const };
        }
        
        const recent = profile.assessmentHistory.slice(-5);
        const avgSuccess = recent.reduce((sum, h) => sum + h.successRate, 0) / recent.length;
        
        // Compare first half to second half for trend
        const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
        const secondHalf = recent.slice(Math.floor(recent.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, h) => sum + h.successRate, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, h) => sum + h.successRate, 0) / secondHalf.length;
        
        let trend: 'improving' | 'stable' | 'declining' = 'stable';
        if (secondAvg - firstAvg > 0.1) trend = 'improving';
        else if (firstAvg - secondAvg > 0.1) trend = 'declining';
        
        return { successRate: avgSuccess, trend };
      },
      
      // ═══════════════════════════════════════════════════════════════════════════
      // Mindfulness State & Actions
      // ═══════════════════════════════════════════════════════════════════════════
      sessions: [],
      activeSession: null,
      mindfulnessSessions: [], // Alias for sessions
      activeMindfulnessSession: null, // Alias for activeSession
      
      startSession: (type, trigger, contextTaskId, contextFocusSessionId) => {
        const session: MindfulnessSession = {
          id: generateId(),
          userId: '1',
          type,
          trigger,
          contextTaskId,
          contextFocusSessionId,
          duration: getMindfulnessDuration(type),
          completed: false,
          startedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          sessions: [...state.sessions, session],
          activeSession: session,
        }));
        
        return session;
      },
      
      setMoodBefore: (sessionId, mood) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, moodBefore: mood } : s
          ),
          activeSession:
            state.activeSession?.id === sessionId
              ? { ...state.activeSession, moodBefore: mood }
              : state.activeSession,
        }));
      },
      
      completeSession: (sessionId, moodAfter) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, completed: true, moodAfter, completedAt: new Date().toISOString() }
              : s
          ),
          activeSession: null,
        }));
      },
      
      cancelSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          activeSession: state.activeSession?.id === sessionId ? null : state.activeSession,
        }));
      },
      
      getTodaySessions: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().sessions.filter((s) => s.startedAt.startsWith(today));
      },
      
      getSessionsByType: (type) => {
        return get().sessions.filter((s) => s.type === type);
      },
      
      getMindfulnessStreak: () => {
        const { sessions } = get();
        if (sessions.length === 0) return 0;
        
        const dates = [...new Set(
          sessions
            .filter((s) => s.completed)
            .map((s) => s.startedAt.split('T')[0])
        )].sort().reverse();
        
        if (dates.length === 0) return 0;
        
        let streak = 1;
        for (let i = 0; i < dates.length - 1; i++) {
          const current = new Date(dates[i]);
          const prev = new Date(dates[i + 1]);
          const diffDays = Math.floor((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }
        
        return streak;
      },
      
      // ═══════════════════════════════════════════════════════════════════════════
      // Education State & Actions
      // ═══════════════════════════════════════════════════════════════════════════
      progress: null,
      triggeredCards: [],
      pendingCard: null,
      
      initializeProgress: (userId) => {
        set({
          progress: {
            userId,
            cardsViewed: [],
            cardsBookmarked: [],
            categoriesExplored: [],
            streakDays: 0,
          },
        });
      },
      
      markCardViewed: (cardId) => {
        set((state) => ({
          progress: state.progress
            ? {
                ...state.progress,
                cardsViewed: state.progress.cardsViewed.includes(cardId)
                  ? state.progress.cardsViewed
                  : [...state.progress.cardsViewed, cardId],
                lastCardAt: new Date().toISOString(),
              }
            : null,
        }));
      },
      
      toggleBookmark: (cardId) => {
        set((state) => ({
          progress: state.progress
            ? {
                ...state.progress,
                cardsBookmarked: state.progress.cardsBookmarked.includes(cardId)
                  ? state.progress.cardsBookmarked.filter((id) => id !== cardId)
                  : [...state.progress.cardsBookmarked, cardId],
              }
            : null,
        }));
      },
      
      triggerEducation: (cardId, trigger, context) => {
        const triggered: TriggeredEducation = {
          id: generateId(),
          userId: '1',
          cardId,
          trigger,
          triggerContext: context,
          viewed: false,
          dismissed: false,
          shownAt: new Date().toISOString(),
        };
        
        set((state) => ({
          triggeredCards: [...state.triggeredCards, triggered],
          pendingCard: triggered,
        }));
      },
      
      dismissTriggeredCard: (triggeredId) => {
        set((state) => ({
          triggeredCards: state.triggeredCards.map((t) =>
            t.id === triggeredId ? { ...t, dismissed: true } : t
          ),
          pendingCard: state.pendingCard?.id === triggeredId ? null : state.pendingCard,
        }));
      },
      
      rateCard: (triggeredId, rating) => {
        set((state) => ({
          triggeredCards: state.triggeredCards.map((t) =>
            t.id === triggeredId ? { ...t, helpfulRating: rating, viewed: true, viewedAt: new Date().toISOString() } : t
          ),
        }));
      },
      
      getUnviewedTriggeredCards: () => {
        return get().triggeredCards.filter((t) => !t.viewed && !t.dismissed);
      },
      
      getBookmarkedCards: () => {
        return get().progress?.cardsBookmarked || [];
      },
      
      isCardViewed: (cardId) => {
        return get().progress?.cardsViewed.includes(cardId) || false;
      },
      
      // ═══════════════════════════════════════════════════════════════════════════
      // tDCS State & Actions
      // ═══════════════════════════════════════════════════════════════════════════
      // Renamed from 'sessions' to avoid conflict with mindfulness
      // Using separate property name
      tdcsSessions: [],
      isEnrolledInStudy: false,
      
      setStudyEnrollment: (enrolled) => {
        set({ isEnrolledInStudy: enrolled });
      },
      
      logTDCSSession: (session) => {
        const newSession: TDCSSession = {
          ...session,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Note: tDCS sessions are stored in a separate property to avoid conflicts
        // For now, we're not persisting these separately - they would need their own storage
        return newSession;
      },
      
      updateTDCSSession: (sessionId, updates) => {
        // Would update tDCS session in storage
      },
      
      deleteTDCSSession: (sessionId) => {
        // Would delete tDCS session from storage
      },
      
      getRecentSessions: (days = 30) => {
        // Would return recent tDCS sessions
        return [];
      },
      
      getSessionStats: () => {
        return { totalSessions: 0, avgFocusChange: 0, avgMoodChange: 0 };
      },
    }),
    {
      name: 'therapy-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        interventions: state.interventions,
        thoughtLogs: state.thoughtLogs,
        profile: state.profile,
        sessionPlans: state.sessionPlans,
        trainingSessions: state.trainingSessions,
        sessions: state.sessions,
        progress: state.progress,
        triggeredCards: state.triggeredCards,
        isEnrolledInStudy: state.isEnrolledInStudy,
      }),
    }
  )
);

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

function mapPresetToPattern(preset: AvoidanceReason): ThoughtPatternTag | null {
  const mapping: Record<AvoidanceReason, ThoughtPatternTag | null> = {
    fear_of_failure: 'catastrophizing',
    too_overwhelming: 'overwhelm',
    dont_know_where_to_start: 'overwhelm',
    perfectionism: 'perfectionism',
    fear_of_criticism: 'fear_of_criticism',
    boredom: 'boredom',
    fear_of_success: 'imposter_syndrome',
    analysis_paralysis: 'black_and_white_thinking',
    other: null,
  };
  return mapping[preset];
}

function getMindfulnessDuration(type: MindfulnessType): number {
  const durations: Record<MindfulnessType, number> = {
    grounding_5_4_3_2_1: 120, // 2 minutes
    grounding_3_2_1: 60, // 1 minute
    mindful_breathing: 90, // 1.5 minutes
    body_scan: 300, // 5 minutes
    come_back_to_task: 120, // 2 minutes
    end_of_day_reset: 600, // 10 minutes
    pre_task_calm: 60, // 1 minute
  };
  return durations[type];
}

export default useTherapyStore;
