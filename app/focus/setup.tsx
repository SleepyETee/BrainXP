import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useFocusStore } from '../../src/stores/focusStore';
import { useTaskStore } from '../../src/stores/taskStore';
import { useTherapyStore } from '../../src/stores/therapyStore';
import { Button } from '../../src/components/ui/Button';
import { GroundingExercise, FocusSessionPlanner } from '../../src/components/therapy';
import { colors, gradients } from '../../src/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Default Timer mode presets - used as fallback
const DEFAULT_TIMER_MODES = {
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

type TimerMode = keyof typeof DEFAULT_TIMER_MODES | string;

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

// Animated selection chip
const SelectionChip: React.FC<{
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
}> = ({ selected, onPress, children, style }) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function FocusSetupScreen() {
  const router = useRouter();
  const { taskId, taskTitle } = useLocalSearchParams<{
    taskId?: string;
    taskTitle?: string;
  }>();

  const startSession = useFocusStore((state) => state.startSession);
  const getTaskById = useTaskStore((state) => state.getTaskById);
  const presets = useFocusStore((state) => state.presets);
  const fetchPresets = useFocusStore((state) => state.fetchPresets);

  const derivedModes = useMemo(() => {
    if (presets && presets.length) {
      const entries = presets.map((preset) => [
        preset.id,
        {
          label: preset.label,
          description: `${preset.work} min focus • ${preset.shortBreak} min break`,
          emoji: '⏱️',
          workDuration: preset.work,
          breakDuration: preset.shortBreak,
        },
      ]);
      return Object.fromEntries(entries) as Record<
        string,
        { label: string; description: string; emoji: string; workDuration: number; breakDuration: number }
      >;
    }
    return DEFAULT_TIMER_MODES;
  }, [presets]);

  const modeKeys = useMemo(() => Object.keys(derivedModes), [derivedModes]);
  const defaultModeKey = modeKeys[0] as TimerMode;

  const [selectedMode, setSelectedMode] = useState<TimerMode>(defaultModeKey);
  const [duration, setDuration] = useState<number>(derivedModes[defaultModeKey as keyof typeof derivedModes]?.workDuration ?? 25);
  const [customTask, setCustomTask] = useState('');
  const [selectedSound, setSelectedSound] = useState('none');
  const [showModeInfo, setShowModeInfo] = useState(false);

  // Update duration when mode changes
  const handleModeChange = async (mode: TimerMode) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMode(mode);
    const modeConfig = derivedModes[mode as keyof typeof derivedModes];
    if (modeConfig) {
      setDuration(modeConfig.workDuration);
    }
  };

  const handleDurationChange = async (value: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDuration(value);
  };

  const handleSoundChange = async (soundId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSound(soundId);
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

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  useEffect(() => {
    const newDefault = (Object.keys(derivedModes)[0] || defaultModeKey) as TimerMode;
    setSelectedMode(newDefault);
    const modeConfig = derivedModes[newDefault as keyof typeof derivedModes];
    if (modeConfig) {
      setDuration(modeConfig.workDuration);
    }
  }, [derivedModes]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={[colors.primary[50], '#FFFFFF', '#FFFFFF']}
        locations={[0, 0.3, 1]}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.closeButtonContainer}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Focus Session</Text>
          <Text style={styles.headerSubtitle}>Set up your session</Text>
        </View>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Task Section */}
        <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
          <Text style={styles.sectionLabel}>WHAT ARE YOU FOCUSING ON?</Text>
          {task ? (
            <View style={styles.taskCard}>
              <LinearGradient
                colors={[colors.primary[50], '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.taskCardGradient}
              >
                <View style={styles.taskIconContainer}>
                  <Text style={styles.taskEmoji}>🎯</Text>
                </View>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
                  {task.estimatedMinutes && (
                    <Text style={styles.taskMeta}>
                      ⏱️ {task.estimatedMinutes} min estimated
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.taskInputContainer}>
              <Text style={styles.taskInputIcon}>✏️</Text>
              <TextInput
                style={styles.taskInput}
                placeholder="What will you work on?"
                value={customTask}
                onChangeText={setCustomTask}
                placeholderTextColor={colors.gray[400]}
                multiline={false}
              />
            </View>
          )}
        </Animated.View>

        {/* Timer Mode Selection */}
        <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>TIMER MODE</Text>
            <TouchableOpacity
              onPress={() => setShowModeInfo(!showModeInfo)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.infoButtonContainer}
            >
              <Text style={styles.infoButton}>{showModeInfo ? '✕' : 'ℹ️'}</Text>
            </TouchableOpacity>
          </View>
          
          {showModeInfo && (
            <Animated.View entering={FadeIn} style={styles.infoCard}>
              <Text style={styles.infoText}>
                💡 Different timer lengths work for different people and tasks. The 10-3 rule is great when you're struggling to start. Pomodoro works well for moderate tasks. Deep work is for when you're in flow.
              </Text>
            </Animated.View>
          )}

          <View style={styles.modeGrid}>
            {modeKeys.map((mode) => {
              const config = derivedModes[mode as keyof typeof derivedModes];
              const isSelected = selectedMode === mode;
              return (
                <SelectionChip
                  key={mode}
                  selected={isSelected}
                  onPress={() => handleModeChange(mode)}
                  style={[
                    styles.modeButton,
                    isSelected && styles.modeButtonActive,
                  ]}
                >
                  <View style={[styles.modeIconContainer, isSelected && styles.modeIconContainerActive]}>
                    <Text style={styles.modeEmoji}>{config.emoji}</Text>
                  </View>
                  <Text style={[styles.modeLabel, isSelected && styles.modeLabelActive]}>
                    {config.label}
                  </Text>
                  <Text style={[styles.modeDescription, isSelected && styles.modeDescriptionActive]}>
                    {config.workDuration}m
                  </Text>
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedCheck}>✓</Text>
                    </View>
                  )}
                </SelectionChip>
              );
            })}
          </View>
        </Animated.View>

        {/* Duration Fine-tuning */}
        <Animated.View entering={FadeInDown.delay(350)} style={styles.section}>
          <Text style={styles.sectionLabel}>ADJUST DURATION</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.durationScrollContent}
          >
            {DURATION_PRESETS.map((preset) => {
              const isSelected = duration === preset.value;
              return (
                <SelectionChip
                  key={preset.value}
                  selected={isSelected}
                  onPress={() => handleDurationChange(preset.value)}
                  style={[
                    styles.durationButton,
                    isSelected && styles.durationButtonActive,
                  ]}
                >
                  <Text style={[styles.durationText, isSelected && styles.durationTextActive]}>
                    {preset.label}
                  </Text>
                </SelectionChip>
              );
            })}
          </ScrollView>
          <View style={styles.durationHintContainer}>
            <Text style={styles.durationHint}>
              💪 Start small! Even 10 minutes counts. You can always extend.
            </Text>
          </View>
        </Animated.View>

        {/* Sound Selection */}
        <Animated.View entering={FadeInDown.delay(450)} style={styles.section}>
          <Text style={styles.sectionLabel}>BACKGROUND SOUND</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.soundScrollContent}
          >
            {SOUND_OPTIONS.map((sound) => {
              const isSelected = selectedSound === sound.id;
              return (
                <SelectionChip
                  key={sound.id}
                  selected={isSelected}
                  onPress={() => handleSoundChange(sound.id)}
                  style={[
                    styles.soundButton,
                    isSelected && styles.soundButtonActive,
                  ]}
                >
                  <Text style={styles.soundEmoji}>{sound.emoji}</Text>
                  <Text style={[styles.soundLabel, isSelected && styles.soundLabelActive]}>
                    {sound.label}
                  </Text>
                </SelectionChip>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Mindful Start Toggle */}
        <Animated.View entering={FadeInDown.delay(550)} style={styles.section}>
          <TouchableOpacity
            style={[styles.mindfulToggle, mindfulStart && styles.mindfulToggleActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMindfulStart(!mindfulStart);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.mindfulContent}>
              <View style={[styles.mindfulIconContainer, mindfulStart && styles.mindfulIconContainerActive]}>
                <Text style={styles.mindfulEmoji}>🧘</Text>
              </View>
              <View style={styles.mindfulText}>
                <Text style={[styles.mindfulTitle, mindfulStart && styles.mindfulTitleActive]}>
                  Mindful Start
                </Text>
                <Text style={styles.mindfulSubtitle}>
                  Quick grounding exercise before you begin
                </Text>
              </View>
            </View>
            <View style={[styles.toggle, mindfulStart && styles.toggleActive]}>
              <Animated.View style={[styles.toggleDot, mindfulStart && styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed CTA Button */}
      <Animated.View entering={FadeInUp.delay(600)} style={styles.ctaContainer}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', '#FFFFFF']}
          locations={[0, 0.3, 0.5]}
          style={styles.ctaGradient}
        >
          <View style={styles.cta}>
            <Button
              title={mindfulStart ? `🧘 Ground & Start (${duration}m)` : `🚀 Start Focus (${duration}m)`}
              onPress={handleStart}
              fullWidth
              size="lg"
              gradient
              disabled={!taskDescription.trim()}
            />
            {!taskDescription.trim() && (
              <Text style={styles.ctaHint}>Enter a task to continue</Text>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

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
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  headerCenter: {
    alignItems: 'center',
  },
  closeButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    fontSize: 18,
    color: colors.gray[600],
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 140,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[500],
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoButtonContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButton: {
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  infoText: {
    fontSize: 14,
    color: colors.primary[700],
    lineHeight: 20,
  },

  // Task styles
  taskCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.primary[200],
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  taskCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  taskIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  taskEmoji: {
    fontSize: 24,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    lineHeight: 22,
  },
  taskMeta: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  taskInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    paddingHorizontal: 14,
  },
  taskInputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  taskInput: {
    flex: 1,
    fontSize: 16,
    color: colors.gray[800],
    paddingVertical: 14,
  },

  // Mode grid - 2x2 layout
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  modeButton: {
    width: (SCREEN_WIDTH - 52) / 2,
    marginHorizontal: 6,
    marginBottom: 12,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.gray[50],
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    position: 'relative',
  },
  modeButtonActive: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  modeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modeIconContainerActive: {
    backgroundColor: colors.primary[100],
  },
  modeEmoji: {
    fontSize: 22,
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[700],
    marginBottom: 2,
    textAlign: 'center',
  },
  modeLabelActive: {
    color: colors.primary[700],
  },
  modeDescription: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: '500',
  },
  modeDescriptionActive: {
    color: colors.primary[600],
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheck: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Duration styles - horizontal scroll
  durationScrollContent: {
    paddingRight: 20,
  },
  durationButton: {
    marginRight: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  durationButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  durationTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  durationHintContainer: {
    marginTop: 12,
    backgroundColor: colors.success[50],
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.success[100],
  },
  durationHint: {
    fontSize: 13,
    color: colors.success[700],
    lineHeight: 18,
    textAlign: 'center',
  },

  // Sound styles - horizontal scroll
  soundScrollContent: {
    paddingRight: 20,
  },
  soundButton: {
    marginRight: 10,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    minWidth: 80,
  },
  soundButtonActive: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  soundEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  soundLabel: {
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: '500',
  },
  soundLabelActive: {
    color: colors.primary[700],
    fontWeight: '600',
  },

  // Mindful toggle
  mindfulToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  mindfulToggleActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  mindfulContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mindfulIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mindfulIconContainerActive: {
    backgroundColor: colors.primary[100],
  },
  mindfulEmoji: {
    fontSize: 22,
  },
  mindfulText: {
    flex: 1,
  },
  mindfulTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray[700],
  },
  mindfulTitleActive: {
    color: colors.primary[700],
  },
  mindfulSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[300],
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleDotActive: {
    alignSelf: 'flex-end',
  },

  // CTA
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  ctaGradient: {
    paddingTop: 24,
  },
  cta: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 4,
  },
  ctaHint: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});

