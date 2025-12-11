// Routine Index Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, shadows } from '../../src/theme/colors';
import { useRoutineStore } from '../../src/stores/routineStore';
import { Routine, RoutineExecution } from '../../src/types/routine';

export default function RoutineScreen() {
  const router = useRouter();
  
  // Use the routine store
  const routines = useRoutineStore((state) => state.routines);
  const activeExecution = useRoutineStore((state) => state.activeExecution);
  const startRoutine = useRoutineStore((state) => state.startRoutine);
  const completeStep = useRoutineStore((state) => state.completeStep);
  const skipStep = useRoutineStore((state) => state.skipStep);
  const createRoutine = useRoutineStore((state) => state.createRoutine);
  
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);

  // Create default routines if none exist
  useEffect(() => {
    if (routines.length === 0) {
      // Create default morning routine
      createRoutine({
        name: 'Morning Routine',
        icon: '🌅',
        type: 'morning',
        daysActive: [1, 2, 3, 4, 5], // Weekdays
        steps: [
          { name: 'Wake up & stretch', icon: '🧘', estimatedMinutes: 5 },
          { name: 'Drink water', icon: '💧', estimatedMinutes: 2 },
          { name: 'Morning meditation', icon: '🧘‍♀️', estimatedMinutes: 10 },
          { name: 'Review today\'s tasks', icon: '📋', estimatedMinutes: 5 },
          { name: 'Healthy breakfast', icon: '🥣', estimatedMinutes: 15 },
          { name: 'Take medications/vitamins', icon: '💊', estimatedMinutes: 2 },
        ],
      });
      
      // Create default evening routine
      createRoutine({
        name: 'Evening Wind-Down',
        icon: '🌙',
        type: 'evening',
        daysActive: [0, 1, 2, 3, 4, 5, 6], // Every day
        steps: [
          { name: 'Review completed tasks', icon: '✅', estimatedMinutes: 5 },
          { name: 'Plan tomorrow', icon: '📝', estimatedMinutes: 5 },
          { name: 'Screen-free time', icon: '📵', estimatedMinutes: 15 },
          { name: 'Gratitude journaling', icon: '🙏', estimatedMinutes: 5 },
        ],
      });
    }
  }, [routines.length, createRoutine]);

  const handleStartRoutine = async (routineId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (expandedRoutineId === routineId) {
      // If already expanded, start the routine execution
      await startRoutine(routineId);
    }
    setExpandedRoutineId(routineId);
  };

  const handleToggleStep = async (stepId: string) => {
    if (!activeExecution) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const stepResult = activeExecution.stepResults.find(sr => sr.stepId === stepId);
    
    if (stepResult?.status === 'pending') {
      await completeStep(activeExecution.id, stepId);
    }
  };

  const handleSkipStep = async (stepId: string) => {
    if (!activeExecution) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await skipStep(activeExecution.id, stepId);
  };

  const getProgress = (routine: Routine) => {
    if (!activeExecution || activeExecution.routineId !== routine.id) {
      return 0;
    }
    const completed = activeExecution.stepResults.filter(sr => sr.status === 'completed').length;
    return Math.round((completed / routine.steps.length) * 100);
  };

  const getStepStatus = (stepId: string) => {
    if (!activeExecution) return 'pending';
    const result = activeExecution.stepResults.find(sr => sr.stepId === stepId);
    return result?.status || 'pending';
  };

  const activeRoutines = routines.filter(r => !r.archivedAt);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Routines</Text>
        <TouchableOpacity onPress={() => router.push('/routine/create')}>
          <Text style={styles.addButton}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.infoCard}>
          <Text style={styles.infoEmoji}>🔄</Text>
          <Text style={styles.infoTitle}>Build Consistent Habits</Text>
          <Text style={styles.infoText}>
            Routines help automate your day by chaining small actions together. 
            Start with morning or evening routines to build momentum.
          </Text>
        </Animated.View>

        {/* Routines List */}
        {activeRoutines.map((routine, index) => {
          const progress = getProgress(routine);
          const isExpanded = expandedRoutineId === routine.id;
          const isActiveExecution = activeExecution?.routineId === routine.id;
          
          return (
            <Animated.View 
              key={routine.id}
              entering={FadeInDown.delay(200 + index * 100)}
            >
              <TouchableOpacity
                style={[styles.routineCard, isExpanded && styles.routineCardActive]}
                onPress={() => handleStartRoutine(routine.id)}
                activeOpacity={0.8}
              >
                <View style={styles.routineHeader}>
                  <Text style={styles.routineIcon}>{routine.icon}</Text>
                  <View style={styles.routineInfo}>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    <Text style={styles.routineMeta}>
                      {routine.steps.length} steps • ~{routine.totalEstimatedMinutes || 0} min
                    </Text>
                  </View>
                  {progress > 0 && (
                    <View style={styles.progressBadge}>
                      <Text style={styles.progressText}>{progress}%</Text>
                    </View>
                  )}
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>

                {/* Steps (expanded when active) */}
                {isExpanded && (
                  <View style={styles.stepsContainer}>
                    {!isActiveExecution && (
                      <TouchableOpacity
                        style={styles.startButton}
                        onPress={() => startRoutine(routine.id)}
                      >
                        <Text style={styles.startButtonText}>▶️ Start Routine</Text>
                      </TouchableOpacity>
                    )}
                    
                    {routine.steps.map((step) => {
                      const status = getStepStatus(step.id);
                      const isCompleted = status === 'completed';
                      const isSkipped = status === 'skipped';
                      
                      return (
                        <View key={step.id} style={styles.stepItem}>
                          <TouchableOpacity
                            style={[
                              styles.stepCheckbox,
                              isCompleted && styles.stepCheckboxCompleted,
                              isSkipped && styles.stepCheckboxSkipped,
                            ]}
                            onPress={() => handleToggleStep(step.id)}
                            disabled={!isActiveExecution || status !== 'pending'}
                          >
                            {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                            {isSkipped && <Text style={styles.skipMark}>–</Text>}
                          </TouchableOpacity>
                          <Text style={styles.stepIcon}>{step.icon}</Text>
                          <View style={styles.stepInfo}>
                            <Text style={[
                              styles.stepName,
                              (isCompleted || isSkipped) && styles.stepNameCompleted
                            ]}>
                              {step.name}
                            </Text>
                            <Text style={styles.stepDuration}>{step.estimatedMinutes} min</Text>
                          </View>
                          {isActiveExecution && status === 'pending' && routine.allowSkips && (
                            <TouchableOpacity
                              style={styles.skipButton}
                              onPress={() => handleSkipStep(step.id)}
                            >
                              <Text style={styles.skipButtonText}>Skip</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Create New Routine */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <TouchableOpacity 
            style={styles.createCard}
            onPress={() => router.push('/routine/create')}
          >
            <Text style={styles.createIcon}>➕</Text>
            <Text style={styles.createText}>Create Custom Routine</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    fontSize: 16,
    color: colors.primary[600],
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[900],
  },
  addButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[500],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  infoEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary[700],
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.primary[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  routineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  routineCardActive: {
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routineIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  routineMeta: {
    fontSize: 13,
    color: colors.gray[500],
  },
  progressBadge: {
    backgroundColor: colors.success[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success[700],
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success[500],
    borderRadius: 3,
  },
  stepsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: 12,
  },
  startButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  stepCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepCheckboxCompleted: {
    backgroundColor: colors.success[500],
    borderColor: colors.success[500],
  },
  stepCheckboxSkipped: {
    backgroundColor: colors.gray[300],
    borderColor: colors.gray[300],
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  skipMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: 15,
    color: colors.gray[800],
  },
  stepNameCompleted: {
    color: colors.gray[400],
    textDecorationLine: 'line-through',
  },
  stepDuration: {
    fontSize: 12,
    color: colors.gray[400],
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  skipButtonText: {
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: '600',
  },
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
  },
  createIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  createText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[600],
  },
});
