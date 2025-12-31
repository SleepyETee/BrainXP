import React from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { MicroMindfulness } from '../../src/components/therapy';
import { MindfulnessTrigger } from '../../src/types/therapy';

export default function BreathingScreen() {
  const router = useRouter();
  const { breaths = '3', trigger = 'manual', taskId } = useLocalSearchParams<{
    breaths?: string;
    trigger?: MindfulnessTrigger;
    taskId?: string;
  }>();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>
      <MicroMindfulness
        breaths={parseInt(breaths)}
        trigger={trigger as MindfulnessTrigger}
        contextTaskId={taskId}
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

