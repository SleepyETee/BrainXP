import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useTherapyStore } from '../../src/stores/therapyStore';
import { useTaskStore } from '../../src/stores/taskStore';
import { CBTMiniFlow, ThoughtPatternInsights, ProcrastinationNudge } from '../../src/components/therapy';
import { THERAPY_DISCLAIMER } from '../../src/types/therapy';

export default function CBTScreen() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  
  const interventions = useTherapyStore((state) => state.interventions);
  const thoughtLogs = useTherapyStore((state) => state.thoughtLogs);
  const getPatternInsights = useTherapyStore((state) => state.getPatternInsights);
  const tasks = useTaskStore((state) => state.tasks);
  const getOverdueTasks = useTaskStore((state) => state.getOverdueTasks);
  
  const [showCBTFlow, setShowCBTFlow] = useState(!!taskId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(taskId || null);
  const [showProcrastinationNudge, setShowProcrastinationNudge] = useState(false);
  const [nudgeTaskId, setNudgeTaskId] = useState<string | null>(null);
  
  // Memoize derived data
  const insights = useMemo(() => getPatternInsights(), [interventions, thoughtLogs]);
  const overdueTasks = useMemo(() => getOverdueTasks(), [tasks]);
  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;
  const nudgeTask = nudgeTaskId ? tasks.find((t) => t.id === nudgeTaskId) : null;
  
  // Tasks that might benefit from CBT intervention
  const stuckTasks = tasks.filter((t) => 
    t.status !== 'done' && 
    t.status !== 'abandoned' &&
    (overdueTasks.some((ot) => ot.id === t.id) || 
     interventions.filter((i) => i.taskId === t.id).length > 0)
  );
  
  const recentInterventions = interventions
    .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
    .slice(0, 5);
  
  const handleStartCBT = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowCBTFlow(true);
  };
  
  const handleShowNudge = (taskId: string) => {
    setNudgeTaskId(taskId);
    setShowProcrastinationNudge(true);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>CBT Tools</Text>
          <Text style={styles.subtitle}>
            Challenge unhelpful thoughts & beat procrastination
          </Text>
        </View>
        
        {/* Pattern Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Patterns</Text>
          <ThoughtPatternInsights />
        </View>
        
        {/* Stuck Tasks */}
        {stuckTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tasks That Feel Heavy</Text>
            <Text style={styles.sectionSubtitle}>
              These tasks might benefit from some CBT coaching
            </Text>
            {stuckTasks.slice(0, 5).map((task) => {
              const taskInterventions = interventions.filter((i) => i.taskId === task.id);
              const isOverdue = overdueTasks.some((ot) => ot.id === task.id);
              
              return (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle} numberOfLines={2}>
                      {task.title}
                    </Text>
                    {isOverdue && (
                      <View style={styles.overdueBadge}>
                        <Text style={styles.overdueBadgeText}>Overdue</Text>
                      </View>
                    )}
                  </View>
                  
                  {taskInterventions.length > 0 && (
                    <Text style={styles.interventionCount}>
                      {taskInterventions.length} CBT session{taskInterventions.length > 1 ? 's' : ''}
                    </Text>
                  )}
                  
                  <View style={styles.taskActions}>
                    <TouchableOpacity
                      style={styles.cbtButton}
                      onPress={() => handleStartCBT(task.id)}
                    >
                      <Text style={styles.cbtButtonText}>
                        🧠 Work through thoughts
                      </Text>
                    </TouchableOpacity>
                    
                    {isOverdue && (
                      <TouchableOpacity
                        style={styles.nudgeButton}
                        onPress={() => handleShowNudge(task.id)}
                      >
                        <Text style={styles.nudgeButtonText}>
                          🫂 Get unstuck
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
        
        {/* Quick Start */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Tools</Text>
          <View style={styles.toolsGrid}>
            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => {
                setSelectedTaskId(null);
                setShowCBTFlow(true);
              }}
            >
              <Text style={styles.toolEmoji}>💭</Text>
              <Text style={styles.toolName}>Thought Check</Text>
              <Text style={styles.toolDescription}>
                Challenge a thought without a specific task
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => router.push('/therapy/thought-log' as any)}
            >
              <Text style={styles.toolEmoji}>📝</Text>
              <Text style={styles.toolName}>Thought Log</Text>
              <Text style={styles.toolDescription}>
                Track patterns over time
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Recent Sessions */}
        {recentInterventions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {recentInterventions.map((intervention) => {
              const task = tasks.find((t) => t.id === intervention.taskId);
              return (
                <View key={intervention.id} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <Text style={styles.sessionTask} numberOfLines={1}>
                      {task?.title || 'General thought check'}
                    </Text>
                    <Text style={styles.sessionDate}>
                      {new Date(intervention.triggeredAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.sessionOutcome}>
                    <Text style={styles.sessionOutcomeText}>
                      {intervention.outcome === 'completed_action' && '✅ Took action'}
                      {intervention.outcome === 'broke_down_task' && '🧩 Broke it down'}
                      {intervention.outcome === 'lowered_bar' && '📉 Lowered the bar'}
                      {intervention.outcome === 'dropped_task' && '🗑️ Let it go'}
                      {intervention.outcome === 'skipped' && '⏭️ Skipped'}
                      {!intervention.outcome && '🔄 In progress'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        
        <Text style={styles.disclaimer}>{THERAPY_DISCLAIMER.cbt}</Text>
      </ScrollView>
      
      {/* CBT Flow Modal */}
      <Modal
        visible={showCBTFlow}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCBTFlow(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCBTFlow(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <CBTMiniFlow
            taskId={selectedTaskId || 'general'}
            taskTitle={selectedTask?.title || 'This situation'}
            triggerType="user_flagged"
            onComplete={() => setShowCBTFlow(false)}
            onSkip={() => setShowCBTFlow(false)}
          />
        </View>
      </Modal>
      
      {/* Procrastination Nudge Modal */}
      {nudgeTask && (
        <ProcrastinationNudge
          visible={showProcrastinationNudge}
          taskId={nudgeTask.id}
          taskTitle={nudgeTask.title}
          overdueCount={3}
          onClose={() => {
            setShowProcrastinationNudge(false);
            setNudgeTaskId(null);
          }}
          onBreakDown={() => {
            router.push(`/task/${nudgeTask.id}?decompose=true` as any);
          }}
          onLowerBar={(goodEnough) => {
            // Update task with lowered expectations
            console.log('Lower bar:', goodEnough);
          }}
          onDropTask={() => {
            // Archive the task
            console.log('Drop task');
          }}
          onRenegotiate={(newDeadline) => {
            // Update deadline
            console.log('New deadline:', newDeadline);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 12,
  },
  backButton: {
    fontSize: 16,
    color: colors.primary[600],
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[500],
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginRight: 12,
  },
  overdueBadge: {
    backgroundColor: colors.danger[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  overdueBadgeText: {
    fontSize: 11,
    color: colors.danger[600],
    fontWeight: '600',
  },
  interventionCount: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 12,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cbtButton: {
    flex: 1,
    backgroundColor: colors.primary[50],
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cbtButtonText: {
    fontSize: 13,
    color: colors.primary[700],
    fontWeight: '600',
  },
  nudgeButton: {
    flex: 1,
    backgroundColor: colors.accent[50],
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  nudgeButtonText: {
    fontSize: 13,
    color: colors.accent[700],
    fontWeight: '600',
  },
  toolsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  toolCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  toolEmoji: {
    fontSize: 28,
    marginBottom: 12,
  },
  toolName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 13,
    color: colors.gray[500],
    lineHeight: 18,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTask: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginRight: 12,
  },
  sessionDate: {
    fontSize: 12,
    color: colors.gray[400],
  },
  sessionOutcome: {},
  sessionOutcomeText: {
    fontSize: 13,
    color: colors.gray[600],
  },
  disclaimer: {
    fontSize: 11,
    color: colors.gray[400],
    textAlign: 'center',
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalClose: {
    fontSize: 24,
    color: colors.gray[400],
    padding: 8,
  },
});
