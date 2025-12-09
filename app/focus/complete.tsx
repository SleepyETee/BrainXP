import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusStore } from '../../src/stores/focusStore';
import { SessionComplete } from '../../src/components/focus/SessionComplete';
import { colors } from '../../src/theme/colors';

export default function FocusCompleteScreen() {
  const router = useRouter();
  const sessions = useFocusStore((state) => state.sessions);
  
  // Get the most recent completed session
  const lastSession = sessions[sessions.length - 1];
  
  const handleComplete = () => {
    router.replace('/(tabs)');
  };

  const handleTaskComplete = () => {
    // TODO: Mark the linked task as complete
    router.replace('/(tabs)');
  };

  if (!lastSession) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <SessionComplete
        duration={lastSession.actualDuration || lastSession.plannedDuration}
        taskDescription={lastSession.taskDescription}
        xpEarned={Math.min(Math.floor((lastSession.actualDuration || lastSession.plannedDuration) * 1.5), 50)}
        onComplete={handleComplete}
        onTaskComplete={lastSession.taskId ? handleTaskComplete : undefined}
        showTaskComplete={!!lastSession.taskId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
});

