import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusStore } from '../../src/stores/focusStore';
import { useTaskStore } from '../../src/stores/taskStore';
import { useTherapyStore } from '../../src/stores/therapyStore';
import { Button } from '../../src/components/ui/Button';
import { GroundingExercise, FocusSessionPlanner } from '../../src/components/therapy';
import { colors } from '../../src/theme/colors';

// Timer mode presets - includes ADHD-friendly alternatives
// Research: Different timer lengths work better for different people
const TIMER_MODES = {
  pomodoro: {
    label: 'Pomodoro',
    description: '25 min work, 5 min break',
    emoji: '🍅',
    workDuration: 25,
    breakDuration: 5,
  },
  short: {
    label: '10-3 Rule',
    description: '10 min focus, 3 min break',
    emoji: '⚡',
    workDuration: 10,
    breakDuration: 3,
  },
  starter: {
    label: '20-min Rule',
    description: 'Build momentum with 20 min',
    emoji: '🚀',
    workDuration: 20,
    breakDuration: 5,
  },
  deep: {
    label: 'Deep Work',
    description: '45-90 min for flow states',
    emoji: '🧠',
    workDuration: 45,
    breakDuration: 15,
  },
} as const;

type TimerMode = keyof typeof TIMER_MODES;

const DURATION_PRESETS = [
  { label: '5 min', value: 5, forMode: 'custom' },
  { label: '10 min', value: 10, forMode: 'short' },
  { label: '15 min', value: 15, forMode: 'custom' },
  { label: '20 min', value: 20, forMode: 'starter' },
  { label: '25 min', value: 25, forMode: 'pomodoro' },
  { label: '45 min', value: 45, forMode: 'deep' },
  { label: '60 min', value: 60, forMode: 'deep' },
  { label: '90 min', value: 90, forMode: 'deep' },
];

const SOUND_OPTIONS = [
  { id: 'none', label: 'None', emoji: '🔇' },
  { id: 'rain', label: 'Rain', emoji: '🌧️' },
  { id: 'cafe', label: 'Café', emoji: '☕' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'white_noise', label: 'White Noise', emoji: '📻' },
  { id: 'lo_fi', label: 'Lo-Fi', emoji: '🎵' },
];

export default function FocusSetupScreen() {
  const router = useRouter();
  const { taskId, taskTitle } = useLocalSearchParams<{
    taskId?: string;
    taskTitle?: string;
  }>();

  const startSession = useFocusStore((state) => state.startSession);
  const getTaskById = useTaskStore((state) => state.getTaskById);

  const [selectedMode, setSelectedMode] = useState<TimerMode>('pomodoro');
  const [duration, setDuration] = useState<number>(TIMER_MODES.pomodoro.workDuration);
  const [customTask, setCustomTask] = useState('');
  const [selectedSound, setSelectedSound] = useState('none');
  const [showModeInfo, setShowModeInfo] = useState(false);

  // Update duration when mode changes
  const handleModeChange = (mode: TimerMode) => {
    setSelectedMode(mode);
    setDuration(TIMER_MODES[mode].workDuration);
  };
  const [mindfulStart, setMindfulStart] = useState(true);
  const [showGrounding, setShowGrounding] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
  const [sessionPlanId, setSessionPlanId] = useState<string | null>(null);

  const getRecommendedStepCount = useTherapyStore((state) => state.getRecommendedStepCount);
  const recommendedSteps = getRecommendedStepCount();

  const task = taskId ? getTaskById(taskId) : null;
  const taskDescription = task?.title || taskTitle || customTask;

  const handleStart = () => {
    if (!taskDescription.trim()) {
      return;
    }

    // Show grounding if enabled
    if (mindfulStart) {
      setShowGrounding(true);
      return;
    }

    proceedToSession();
  };

  const handleGroundingComplete = () => {
    setShowGrounding(false);
    setShowPlanner(true);
  };

  const handlePlanCreated = (planId: string) => {
    setSessionPlanId(planId);
    setShowPlanner(false);
    proceedToSession();
  };

  const proceedToSession = () => {
    startSession({
      taskDescription: taskDescription,
      plannedDuration: duration,
      taskId: taskId,
      backgroundSound: selectedSound as any,
    });
    router.replace('/focus/active');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Start Focus Session</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Task */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What are you focusing on?</Text>
          {task ? (
            <View style={styles.taskCard}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              {task.estimatedMinutes && (
                <Text style={styles.taskMeta}>
                  Estimated: {task.estimatedMinutes} min
                </Text>
              )}
            </View>
          ) : (
            <TextInput
              style={styles.taskInput}
              placeholder="Enter what you'll work on..."
              value={customTask}
              onChangeText={setCustomTask}
              placeholderTextColor={colors.gray[400]}
            />
          )}
        </View>

        {/* Timer Mode Selection - ADHD-friendly options */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Timer Mode</Text>
            <TouchableOpacity
              onPress={() => setShowModeInfo(!showModeInfo)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Show timer mode information"
            >
              <Text style={styles.infoButton}>ℹ️</Text>
            </TouchableOpacity>
          </View>
          
          {showModeInfo && (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                💡 Different timer lengths work for different people and tasks. The 10-3 rule is great when you're struggling to start. Pomodoro works well for moderate tasks. Deep work is for when you're in flow.
              </Text>
            </View>
          )}

          <View style={styles.modeGrid}>
            {(Object.keys(TIMER_MODES) as TimerMode[]).map((mode) => {
              const config = TIMER_MODES[mode];
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeButton,
                    selectedMode === mode && styles.modeButtonActive,
                  ]}
                  onPress={() => handleModeChange(mode)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedMode === mode }}
                  accessibilityLabel={`${config.label}: ${config.description}`}
                >
                  <Text style={styles.modeEmoji}>{config.emoji}</Text>
                  <Text
                    style={[
                      styles.modeLabel,
                      selectedMode === mode && styles.modeLabelActive,
                    ]}
                  >
                    {config.label}
                  </Text>
                  <Text style={styles.modeDescription}>
                    {config.workDuration}m work
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Duration Fine-tuning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.durationGrid}>
            {DURATION_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.value}
                style={[
                  styles.durationButton,
                  duration === preset.value && styles.durationButtonActive,
                ]}
                onPress={() => setDuration(preset.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: duration === preset.value }}
              >
                <Text
                  style={[
                    styles.durationText,
                    duration === preset.value && styles.durationTextActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.durationHint}>
            💪 Start small! Even 10 minutes counts. You can always extend.
          </Text>
        </View>

        {/* Sound */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background sound</Text>
          <View style={styles.soundGrid}>
            {SOUND_OPTIONS.map((sound) => (
              <TouchableOpacity
                key={sound.id}
                style={[
                  styles.soundButton,
                  selectedSound === sound.id && styles.soundButtonActive,
                ]}
                onPress={() => setSelectedSound(sound.id)}
              >
                <Text style={styles.soundEmoji}>{sound.emoji}</Text>
                <Text
                  style={[
                    styles.soundLabel,
                    selectedSound === sound.id && styles.soundLabelActive,
                  ]}
                >
                  {sound.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mindful Start Toggle */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.mindfulToggle}
            onPress={() => setMindfulStart(!mindfulStart)}
          >
            <View style={styles.mindfulContent}>
              <Text style={styles.mindfulEmoji}>🧘</Text>
              <View style={styles.mindfulText}>
                <Text style={styles.mindfulTitle}>Mindful start</Text>
                <Text style={styles.mindfulSubtitle}>
                  Quick grounding before you begin
                </Text>
              </View>
            </View>
            <View style={[styles.toggle, mindfulStart && styles.toggleActive]}>
              <View style={[styles.toggleDot, mindfulStart && styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Start Button */}
        <View style={styles.cta}>
          <Button
            title={mindfulStart ? `Ground & Start ${duration} min` : `Start ${duration} min Session`}
            onPress={handleStart}
            fullWidth
            size="lg"
            disabled={!taskDescription.trim()}
          />
        </View>
      </View>

      {/* Grounding Modal */}
      <Modal
        visible={showGrounding}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGrounding(false)}
      >
        <GroundingExercise
          variant="3_2_1"
          trigger="focus_session_start"
          contextTaskId={taskId}
          onComplete={handleGroundingComplete}
          onSkip={() => {
            setShowGrounding(false);
            setShowPlanner(true);
          }}
        />
      </Modal>

      {/* Session Planner Modal */}
      <Modal
        visible={showPlanner}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPlanner(false)}
      >
        <FocusSessionPlanner
          sessionId="temp-session-id"
          taskTitle={taskDescription}
          onPlanCreated={handlePlanCreated}
          onSkip={proceedToSession}
        />
      </Modal>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  closeButton: {
    fontSize: 24,
    color: colors.gray[500],
    width: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[800],
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
  },
  infoButton: {
    fontSize: 18,
  },
  infoCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[400],
  },
  infoText: {
    fontSize: 13,
    color: colors.primary[700],
    lineHeight: 19,
  },
  // Timer mode selection
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  modeButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.gray[50],
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  modeButtonActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  modeEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[700],
    marginBottom: 2,
  },
  modeLabelActive: {
    color: colors.primary[700],
  },
  modeDescription: {
    fontSize: 12,
    color: colors.gray[500],
  },
  taskCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray[800],
  },
  taskMeta: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  taskInput: {
    fontSize: 16,
    color: colors.gray[800],
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  durationButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    minWidth: '30%',
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: colors.primary[500],
  },
  durationText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[700],
  },
  durationTextActive: {
    color: '#FFFFFF',
  },
  durationHint: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 12,
    textAlign: 'center',
  },
  soundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  soundButton: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  soundButtonActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  soundEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  soundLabel: {
    fontSize: 12,
    color: colors.gray[600],
  },
  soundLabelActive: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  cta: {
    marginTop: 'auto',
  },
  // Mindful start toggle styles
  mindfulToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.primary[50],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  mindfulContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mindfulEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  mindfulText: {
    flex: 1,
  },
  mindfulTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
  },
  mindfulSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  toggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: colors.primary[500],
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleDotActive: {
    alignSelf: 'flex-end',
  },
});

