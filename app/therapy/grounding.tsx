import React from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { GroundingExercise } from '../../src/components/therapy';
import { MindfulnessTrigger } from '../../src/types/therapy';

export default function GroundingScreen() {
  const router = useRouter();
  const { variant = '3_2_1', trigger = 'manual', taskId, focusSessionId } = useLocalSearchParams<{
    variant?: '5_4_3_2_1' | '3_2_1';
    trigger?: MindfulnessTrigger;
    taskId?: string;
    focusSessionId?: string;
  }>();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>
      <GroundingExercise
        variant={variant as '5_4_3_2_1' | '3_2_1'}
        trigger={trigger as MindfulnessTrigger}
        contextTaskId={taskId}
        contextFocusSessionId={focusSessionId}
        onComplete={() => router.back()}
        onSkip={() => router.back()}
      />
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
    padding: 16,
  },
  closeButton: {
    fontSize: 24,
    color: colors.gray[400],
    padding: 8,
  },
});
