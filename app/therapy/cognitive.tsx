import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useTherapyStore } from '../../src/stores/therapyStore';

interface CognitiveExercise {
  id: string;
  name: string;
  description: string;
  duration: string;
  skill: string;
  emoji: string;
  realLifeConnection: string;
}

const EXERCISES: CognitiveExercise[] = [
  {
    id: 'working_memory_steps',
    name: 'Step Tracker',
    description: 'Practice holding 2-5 steps in mind during focus sessions',
    duration: 'During focus',
    skill: 'Working Memory',
    emoji: '🧠',
    realLifeConnection: 'Following multi-step instructions at work or school',
  },
  {
    id: 'attention_switching',
    name: 'Quick Switch',
    description: 'Practice switching attention between tasks on cue',
    duration: '3 min',
    skill: 'Attention Switching',
    emoji: '🔄',
    realLifeConnection: 'Handling interruptions and returning to work',
  },
  {
    id: 'planning_sequence',
    name: 'Plan Builder',
    description: 'Arrange steps in the best order for a goal',
    duration: '5 min',
    skill: 'Planning',
    emoji: '📋',
    realLifeConnection: 'Breaking down projects into actionable steps',
  },
];

export default function CognitiveScreen() {
  const router = useRouter();
  const profile = useTherapyStore((state) => state.profile);
  const getRecentPerformance = useTherapyStore((state) => state.getRecentPerformance);
  const trainingSessions = useTherapyStore((state) => state.trainingSessions);
  
  const { successRate, trend } = React.useMemo(() => getRecentPerformance(), [profile]);
  const currentCapacity = profile?.workingMemoryCapacity || 3;
  const totalSessions = trainingSessions.length;
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Brain Training</Text>
          <Text style={styles.subtitle}>
            Build cognitive skills in context, not random games
          </Text>
        </View>
        
        {/* Your Profile */}
        <View style={styles.profileCard}>
          <Text style={styles.profileTitle}>Your Cognitive Profile</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentCapacity}</Text>
              <Text style={styles.statLabel}>Steps capacity</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(successRate * 100)}%</Text>
              <Text style={styles.statLabel}>Success rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️'}
              </Text>
              <Text style={styles.statLabel}>
                {trend === 'improving' ? 'Improving' : trend === 'declining' ? 'Practice' : 'Stable'}
              </Text>
            </View>
          </View>
          
          <View style={styles.capacityInfo}>
            <Text style={styles.capacityText}>
              Your working memory can comfortably hold <Text style={styles.capacityHighlight}>{currentCapacity} steps</Text> at a time.
              {currentCapacity < 3 && " We'll help you build this up gradually."}
              {currentCapacity >= 4 && " That's great! Keep challenging yourself."}
            </Text>
          </View>
        </View>
        
        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How Brain Training Works</Text>
          <View style={styles.howItWorksCard}>
            <View style={styles.howItWorksStep}>
              <Text style={styles.howItWorksNumber}>1</Text>
              <View style={styles.howItWorksContent}>
                <Text style={styles.howItWorksTitle}>Train during real tasks</Text>
                <Text style={styles.howItWorksText}>
                  Not abstract games—practice holding steps in mind during your actual focus sessions.
                </Text>
              </View>
            </View>
            
            <View style={styles.howItWorksStep}>
              <Text style={styles.howItWorksNumber}>2</Text>
              <View style={styles.howItWorksContent}>
                <Text style={styles.howItWorksTitle}>Track what you remember</Text>
                <Text style={styles.howItWorksText}>
                  After each session, we'll ask which steps you remembered vs. forgot.
                </Text>
              </View>
            </View>
            
            <View style={styles.howItWorksStep}>
              <Text style={styles.howItWorksNumber}>3</Text>
              <View style={styles.howItWorksContent}>
                <Text style={styles.howItWorksTitle}>Adaptive difficulty</Text>
                <Text style={styles.howItWorksText}>
                  We adjust how many steps to suggest based on your actual performance.
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Exercises */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          {EXERCISES.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={styles.exerciseCard}
              onPress={() => {
                if (exercise.id === 'working_memory_steps') {
                  // This is integrated into focus sessions
                  router.push('/focus/setup');
                } else {
                  // Show coming soon for other exercises
                }
              }}
            >
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <View style={styles.exerciseMeta}>
                    <Text style={styles.exerciseSkill}>{exercise.skill}</Text>
                    <Text style={styles.exerciseDot}>•</Text>
                    <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.exerciseDescription}>{exercise.description}</Text>
              <View style={styles.realLifeBox}>
                <Text style={styles.realLifeLabel}>Real life skill:</Text>
                <Text style={styles.realLifeText}>{exercise.realLifeConnection}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Why This Matters */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Why train in context?</Text>
          <Text style={styles.infoText}>
            Research shows cognitive training is most effective when it's tied to real tasks, not abstract games.
            {'\n\n'}
            By practicing working memory during actual focus sessions, you're building skills that directly transfer to your daily life.
          </Text>
        </View>
        
        <View style={styles.spacer} />
      </ScrollView>
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
  profileCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  profileTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary[600],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: 'center',
  },
  capacityInfo: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 14,
  },
  capacityText: {
    fontSize: 14,
    color: colors.primary[700],
    lineHeight: 21,
  },
  capacityHighlight: {
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 16,
  },
  howItWorksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  howItWorksStep: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  howItWorksNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[100],
    color: colors.primary[700],
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 14,
  },
  howItWorksContent: {
    flex: 1,
  },
  howItWorksTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 4,
  },
  howItWorksText: {
    fontSize: 14,
    color: colors.gray[500],
    lineHeight: 20,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 4,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseSkill: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '500',
  },
  exerciseDot: {
    fontSize: 13,
    color: colors.gray[300],
    marginHorizontal: 6,
  },
  exerciseDuration: {
    fontSize: 13,
    color: colors.gray[500],
  },
  exerciseDescription: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: 12,
  },
  realLifeBox: {
    backgroundColor: colors.secondary[50],
    borderRadius: 10,
    padding: 12,
  },
  realLifeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary[700],
    marginBottom: 4,
  },
  realLifeText: {
    fontSize: 13,
    color: colors.secondary[600],
    lineHeight: 18,
  },
  infoCard: {
    marginHorizontal: 20,
    backgroundColor: colors.warning[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning[700],
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: colors.warning[600],
    lineHeight: 21,
  },
  spacer: {
    height: 40,
  },
});
