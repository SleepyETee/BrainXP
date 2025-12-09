import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useFocusStore } from '../../src/stores/focusStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { Timer } from '../../src/components/focus/Timer';
import { Button } from '../../src/components/ui/Button';
import { colors } from '../../src/theme/colors';

export default function ActiveFocusScreen() {
  const router = useRouter();
  const currentSession = useFocusStore((state) => state.currentSession);
  const pauseSession = useFocusStore((state) => state.pauseSession);
  const resumeSession = useFocusStore((state) => state.resumeSession);
  const endSession = useFocusStore((state) => state.endSession);
  const extendSession = useFocusStore((state) => state.extendSession);
  const addXP = useProgressStore((state) => state.addXP);

  const [showEndConfirm, setShowEndConfirm] = useState(false);

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
    
    // Calculate XP based on duration
    const duration = currentSession.plannedDuration;
    const xpEarned = Math.min(Math.floor(duration * 1.5), 50);
    
    await addXP(xpEarned, 'focus_session', 'Completed a focus session');
    await endSession({ qualityRating: 5 }); // Default rating
    router.replace('/focus/complete');
  };

  const handleEndEarly = () => {
    Alert.alert(
      'End Session Early?',
      "That's okay! Every bit of focus counts.",
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'End Session',
          onPress: async () => {
            const xpEarned = 5; // Minimal XP for ending early
            await addXP(xpEarned, 'focus_session', 'Attempted focus session');
            endSession();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const handleExtend = (minutes: number) => {
    extendSession(minutes);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleEndEarly}>
          <Text style={styles.endEarly}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Task */}
        <View style={styles.taskSection}>
          <Text style={styles.taskLabel}>Focusing on</Text>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {currentSession.taskDescription}
          </Text>
        </View>

        {/* Timer */}
        <Timer
          durationMinutes={currentSession.plannedDuration}
          isActive={currentSession.isActive}
          onComplete={handleComplete}
        />

        {/* Controls */}
        <View style={styles.controls}>
          {currentSession.isActive ? (
            <Button
              title="Pause"
              variant="outline"
              onPress={pauseSession}
              size="lg"
            />
          ) : (
            <Button
              title="Resume"
              onPress={resumeSession}
              size="lg"
            />
          )}
        </View>

        {/* Extend buttons */}
        <View style={styles.extendSection}>
          <Text style={styles.extendLabel}>Need more time?</Text>
          <View style={styles.extendButtons}>
            <TouchableOpacity
              style={styles.extendButton}
              onPress={() => handleExtend(5)}
            >
              <Text style={styles.extendButtonText}>+5 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.extendButton}
              onPress={() => handleExtend(10)}
            >
              <Text style={styles.extendButtonText}>+10 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.extendButton}
              onPress={() => handleExtend(15)}
            >
              <Text style={styles.extendButtonText}>+15 min</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Encouragement */}
      <View style={styles.encouragement}>
        <Text style={styles.encouragementText}>
          You've got this! Stay focused. 💪
        </Text>
      </View>
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
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  endEarly: {
    fontSize: 16,
    color: colors.gray[500],
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  taskSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  taskLabel: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[800],
    textAlign: 'center',
  },
  extendSection: {
    alignItems: 'center',
    marginTop: 32,
  },
  extendLabel: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 12,
  },
  extendButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  extendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  extendButtonText: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '500',
  },
  encouragement: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  encouragementText: {
    fontSize: 16,
    color: colors.gray[500],
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 24,
  },
});

