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
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useTherapyStore } from '../../src/stores/therapyStore';
import { GroundingExercise, MicroMindfulness } from '../../src/components/therapy';
import { MindfulnessType, THERAPY_DISCLAIMER } from '../../src/types/therapy';

interface MindfulnessPractice {
  id: MindfulnessType;
  name: string;
  description: string;
  duration: string;
  emoji: string;
  category: 'quick' | 'standard' | 'deep';
}

const PRACTICES: MindfulnessPractice[] = [
  {
    id: 'grounding_3_2_1',
    name: 'Quick 3-2-1 Grounding',
    description: 'A fast way to come back to the present moment',
    duration: '1 min',
    emoji: '🌿',
    category: 'quick',
  },
  {
    id: 'mindful_breathing',
    name: '3 Mindful Breaths',
    description: 'Simple breathing to reset your nervous system',
    duration: '30 sec',
    emoji: '🫁',
    category: 'quick',
  },
  {
    id: 'grounding_5_4_3_2_1',
    name: '5-4-3-2-1 Grounding',
    description: 'Full sensory grounding for anxiety or overwhelm',
    duration: '2-3 min',
    emoji: '🧘',
    category: 'standard',
  },
  {
    id: 'come_back_to_task',
    name: 'Come Back to Task',
    description: 'Refocus after getting distracted',
    duration: '2 min',
    emoji: '🎯',
    category: 'standard',
  },
  {
    id: 'pre_task_calm',
    name: 'Pre-Task Calm',
    description: 'Center yourself before a challenging task',
    duration: '1 min',
    emoji: '☀️',
    category: 'standard',
  },
  {
    id: 'end_of_day_reset',
    name: 'End of Day Reset',
    description: 'Wind down and transition out of work mode',
    duration: '10 min',
    emoji: '🌙',
    category: 'deep',
  },
];

export default function MindfulnessScreen() {
  const router = useRouter();
  const sessions = useTherapyStore((state) => state.sessions);
  const getMindfulnessStreak = useTherapyStore((state) => state.getMindfulnessStreak);
  const getTodaySessions = useTherapyStore((state) => state.getTodaySessions);
  
  const [activePractice, setActivePractice] = useState<MindfulnessPractice | null>(null);
  
  // Memoize derived data
  const streak = useMemo(() => getMindfulnessStreak(), [sessions]);
  const todaySessions = useMemo(() => getTodaySessions(), [sessions]);
  const completedToday = todaySessions.filter((s) => s.completed).length;
  const totalMinutesToday = todaySessions
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.duration, 0) / 60;
  
  const quickPractices = PRACTICES.filter((p) => p.category === 'quick');
  const standardPractices = PRACTICES.filter((p) => p.category === 'standard');
  const deepPractices = PRACTICES.filter((p) => p.category === 'deep');
  
  const handlePracticeComplete = () => {
    setActivePractice(null);
  };
  
  const renderPracticeModal = () => {
    if (!activePractice) return null;
    
    if (activePractice.id === 'grounding_5_4_3_2_1' || activePractice.id === 'grounding_3_2_1') {
      return (
        <GroundingExercise
          variant={activePractice.id === 'grounding_5_4_3_2_1' ? '5_4_3_2_1' : '3_2_1'}
          trigger="manual"
          onComplete={handlePracticeComplete}
          onSkip={handlePracticeComplete}
        />
      );
    }
    
    return (
      <MicroMindfulness
        breaths={activePractice.id === 'mindful_breathing' ? 3 : 5}
        trigger="manual"
        onComplete={handlePracticeComplete}
        onSkip={handlePracticeComplete}
      />
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Mindfulness</Text>
          <Text style={styles.subtitle}>
            Take a moment to ground yourself
          </Text>
        </View>
        
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedToday}</Text>
            <Text style={styles.statLabel}>Sessions today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(totalMinutesToday)}</Text>
            <Text style={styles.statLabel}>Minutes today</Text>
          </View>
        </View>
        
        {/* Quick Practices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick (under 1 min)</Text>
          <View style={styles.practicesGrid}>
            {quickPractices.map((practice) => (
              <TouchableOpacity
                key={practice.id}
                style={styles.practiceCard}
                onPress={() => setActivePractice(practice)}
              >
                <Text style={styles.practiceEmoji}>{practice.emoji}</Text>
                <Text style={styles.practiceName}>{practice.name}</Text>
                <Text style={styles.practiceDuration}>{practice.duration}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Standard Practices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧘 Standard</Text>
          {standardPractices.map((practice) => (
            <TouchableOpacity
              key={practice.id}
              style={styles.practiceRow}
              onPress={() => setActivePractice(practice)}
            >
              <Text style={styles.rowEmoji}>{practice.emoji}</Text>
              <View style={styles.rowContent}>
                <Text style={styles.rowName}>{practice.name}</Text>
                <Text style={styles.rowDescription}>{practice.description}</Text>
              </View>
              <Text style={styles.rowDuration}>{practice.duration}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Deep Practices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌙 Longer Sessions</Text>
          {deepPractices.map((practice) => (
            <TouchableOpacity
              key={practice.id}
              style={styles.practiceRow}
              onPress={() => setActivePractice(practice)}
            >
              <Text style={styles.rowEmoji}>{practice.emoji}</Text>
              <View style={styles.rowContent}>
                <Text style={styles.rowName}>{practice.name}</Text>
                <Text style={styles.rowDescription}>{practice.description}</Text>
              </View>
              <Text style={styles.rowDuration}>{practice.duration}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 When to use mindfulness</Text>
          <Text style={styles.tipsText}>
            • Before starting a focus session{'\n'}
            • When you feel overwhelmed{'\n'}
            • After getting distracted{'\n'}
            • Before a scary or difficult task{'\n'}
            • At the end of your workday
          </Text>
        </View>
        
        <Text style={styles.disclaimer}>{THERAPY_DISCLAIMER.mindfulness}</Text>
      </ScrollView>
      
      {/* Practice Modal */}
      <Modal
        visible={activePractice !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActivePractice(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setActivePractice(null)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {renderPracticeModal()}
        </View>
      </Modal>
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary[600],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 12,
  },
  practicesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  practiceCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  practiceEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  practiceName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
    textAlign: 'center',
    marginBottom: 4,
  },
  practiceDuration: {
    fontSize: 12,
    color: colors.gray[400],
  },
  practiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  rowEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  rowContent: {
    flex: 1,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 4,
  },
  rowDescription: {
    fontSize: 13,
    color: colors.gray[500],
  },
  rowDuration: {
    fontSize: 13,
    color: colors.gray[400],
    fontWeight: '500',
  },
  tipsCard: {
    marginHorizontal: 20,
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[700],
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: colors.primary[600],
    lineHeight: 24,
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
