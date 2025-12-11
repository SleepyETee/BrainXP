import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useFocusStore } from '../../src/stores/focusStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { Timer } from '../../src/components/focus/Timer';
import { Button } from '../../src/components/ui/Button';
import { Toast } from '../../src/components/ui/Toast';
import { colors, gradients } from '../../src/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// Breathing animation component for focus
const BreathingCircle: React.FC<{ isPaused: boolean }> = ({ isPaused }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (!isPaused) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 4000 }),
          withTiming(1, { duration: 4000 })
        ),
        -1,
        true
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 4000 }),
          withTiming(0.3, { duration: 4000 })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1);
      opacity.value = withTiming(0.3);
    }
  }, [isPaused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.breathingCircle, animatedStyle]}>
      <LinearGradient
        colors={[`${colors.primary[400]}40`, `${colors.primary[500]}20`]}
        style={styles.breathingGradient}
      />
    </Animated.View>
  );
};

// Encouraging messages that rotate
const ENCOURAGEMENTS = [
  { emoji: '💪', text: "You've got this! Stay focused." },
  { emoji: '🧠', text: 'Your brain is in the zone.' },
  { emoji: '⭐', text: 'Every minute counts!' },
  { emoji: '🎯', text: 'Crushing it! Keep going.' },
  { emoji: '🌟', text: 'Focus is your superpower.' },
  { emoji: '🚀', text: "You're making progress!" },
  { emoji: '💎', text: 'Quality focus time!' },
  { emoji: '🔥', text: "On fire! Don't stop now." },
];

export default function ActiveFocusScreen() {
  const router = useRouter();
  const currentSession = useFocusStore((state) => state.currentSession);
  const pauseSession = useFocusStore((state) => state.pauseSession);
  const resumeSession = useFocusStore((state) => state.resumeSession);
  const endSession = useFocusStore((state) => state.endSession);
  const extendSession = useFocusStore((state) => state.extendSession);
  const addXP = useProgressStore((state) => state.addXP);

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [encouragementIndex, setEncouragementIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', message: '' });

  const isPaused = !(currentSession?.isActive ?? true);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Rotate encouragement messages
  useEffect(() => {
    const interval = setInterval(() => {
      setEncouragementIndex((prev) => (prev + 1) % ENCOURAGEMENTS.length);
    }, 30000); // Change every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentSession) {
      router.replace('/focus/setup');
    }
  }, [currentSession]);

  if (!currentSession) {
    return null;
  }

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const duration = currentSession.plannedDuration;
    const xpEarned = Math.min(Math.floor(duration * 1.5), 50);
    
    await addXP(xpEarned, 'focus_session', 'Completed a focus session');
    await endSession({ qualityRating: 5 });
    router.replace('/focus/complete');
  };

  const handleEndEarly = () => {
    setShowEndConfirm(true);
  };

  const confirmEndEarly = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const xpEarned = 5;
    await addXP(xpEarned, 'focus_session', 'Attempted focus session');
    endSession();
    router.replace('/(tabs)');
  };

  const handleExtend = async (minutes: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    extendSession(minutes);
    setToastMessage({
      title: `+${minutes} minutes added!`,
      message: 'Keep up the great focus!',
    });
    setShowToast(true);
  };

  const handlePauseResume = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPaused) {
      resumeSession();
    } else {
      pauseSession();
    }
  };

  const currentEncouragement = ENCOURAGEMENTS[encouragementIndex];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={isPaused ? [colors.gray[100], colors.gray[50]] : [colors.primary[50], '#FFFFFF']}
        style={styles.backgroundGradient}
      />

      {/* Breathing animation */}
      <BreathingCircle isPaused={isPaused} />

      {/* Toast notifications */}
      <Toast
        visible={showToast}
        type="success"
        title={toastMessage.title}
        message={toastMessage.message}
        onDismiss={() => setShowToast(false)}
        duration={3000}
      />

      {/* Header - Fixed at top */}
      <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
        <TouchableOpacity 
          onPress={handleEndEarly}
          style={styles.endButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.endEarly}>End Session</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Scrollable Content */}
      <AnimatedScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Task */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.taskSection}>
          <Text style={styles.taskLabel}>Focusing on</Text>
          <Text style={styles.taskTitle} numberOfLines={3}>
            {currentSession.taskDescription}
          </Text>
        </Animated.View>

        {/* Timer */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.timerContainer}>
          <Timer
            durationMinutes={currentSession.plannedDuration}
            isActive={!isPaused}
            onComplete={handleComplete}
          />
        </Animated.View>

        {/* Pause indicator */}
        {isPaused && (
          <Animated.View entering={FadeIn} style={styles.pausedBadge}>
            <Text style={styles.pausedText}>⏸️ Paused</Text>
          </Animated.View>
        )}

        {/* Controls */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.controls}>
          <Button
            title={isPaused ? '▶️ Resume' : '⏸️ Pause'}
            variant={isPaused ? 'primary' : 'outline'}
            onPress={handlePauseResume}
            size="lg"
            gradient={isPaused}
            style={styles.mainButton}
          />
        </Animated.View>

        {/* Extend buttons */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.extendSection}>
          <Text style={styles.extendLabel}>Need more time?</Text>
          <View style={styles.extendButtons}>
            {[5, 10, 15].map((minutes) => (
              <TouchableOpacity
                key={minutes}
                style={styles.extendButton}
                onPress={() => handleExtend(minutes)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.gray[100], colors.gray[50]]}
                  style={styles.extendButtonGradient}
                >
                  <Text style={styles.extendButtonText}>+{minutes}m</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Encouragement */}
        <Animated.View 
          entering={FadeInUp.delay(600)} 
          style={styles.encouragement}
          key={encouragementIndex}
        >
          <Text style={styles.encouragementEmoji}>{currentEncouragement.emoji}</Text>
          <Text style={styles.encouragementText}>{currentEncouragement.text}</Text>
        </Animated.View>

        {/* Tips Section */}
        <Animated.View entering={FadeInUp.delay(700)} style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Focus Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              If you feel distracted, take 3 deep breaths and refocus on your task.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              Keep water nearby - hydration helps maintain concentration.
            </Text>
          </View>
        </Animated.View>

        {/* Bottom spacing for safe scrolling */}
        <View style={styles.bottomSpacer} />
      </AnimatedScrollView>

      {/* End confirmation modal */}
      {showEndConfirm && (
        <Animated.View entering={FadeIn} style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp} style={styles.modalContent}>
            <Text style={styles.modalEmoji}>🤔</Text>
            <Text style={styles.modalTitle}>End Session Early?</Text>
            <Text style={styles.modalMessage}>
              That's okay! Every bit of focus counts. You'll still earn some XP.
            </Text>
            <View style={styles.modalButtons}>
              <Button
                title="Keep Going"
                variant="primary"
                onPress={() => setShowEndConfirm(false)}
                style={styles.modalButton}
              />
              <Button
                title="End Session"
                variant="outline"
                onPress={confirmEndEarly}
                style={styles.modalButton}
              />
            </View>
          </Animated.View>
        </Animated.View>
      )}
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
  breathingCircle: {
    position: 'absolute',
    top: '25%',
    left: SCREEN_WIDTH / 2 - 150,
    width: 300,
    height: 300,
    borderRadius: 150,
    overflow: 'hidden',
    zIndex: 0,
  },
  breathingGradient: {
    flex: 1,
    borderRadius: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    zIndex: 10,
  },
  endButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  endEarly: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    zIndex: 5,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    flexGrow: 1,
  },
  taskSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  taskLabel: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 8,
    fontWeight: '500',
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[800],
    textAlign: 'center',
    lineHeight: 32,
    maxWidth: '90%',
  },
  timerContainer: {
    marginVertical: 16,
  },
  pausedBadge: {
    backgroundColor: colors.warning[100],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  pausedText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning[700],
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  mainButton: {
    minWidth: 180,
  },
  extendSection: {
    alignItems: 'center',
    marginTop: 32,
  },
  extendLabel: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 16,
    fontWeight: '500',
  },
  extendButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  extendButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  extendButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  extendButtonText: {
    fontSize: 15,
    color: colors.gray[700],
    fontWeight: '600',
  },
  encouragement: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 8,
  },
  encouragementEmoji: {
    fontSize: 32,
  },
  encouragementText: {
    fontSize: 17,
    color: colors.gray[600],
    textAlign: 'center',
    fontWeight: '500',
  },
  tipsSection: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[700],
    marginBottom: 12,
  },
  tipCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  tipText: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },

  // Modal styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    width: '100%',
    gap: 12,
  },
  modalButton: {
    width: '100%',
  },
});

