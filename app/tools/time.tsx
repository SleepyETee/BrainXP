// Time Estimator Tool Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, shadows } from '../../src/theme/colors';

interface TimeEstimate {
  optimistic: number;
  realistic: number;
  pessimistic: number;
  suggestedBuffer: number;
  breakdown?: string[];
  tips?: string[];
}

export default function TimeEstimatorScreen() {
  const router = useRouter();
  const [task, setTask] = useState('');
  const [complexity, setComplexity] = useState<'simple' | 'medium' | 'complex'>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TimeEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const COMPLEXITY_OPTIONS = [
    { value: 'simple' as const, label: 'Simple', emoji: '🟢', multiplier: 0.7 },
    { value: 'medium' as const, label: 'Medium', emoji: '🟡', multiplier: 1 },
    { value: 'complex' as const, label: 'Complex', emoji: '🔴', multiplier: 1.5 },
  ];

  const handleEstimate = async () => {
    if (!task.trim()) {
      setError('Please enter a task to estimate');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate AI estimation (replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const baseTime = task.length * 0.5 + 10; // Simple heuristic
      const multiplier = COMPLEXITY_OPTIONS.find((c) => c.value === complexity)?.multiplier || 1;
      
      const estimate: TimeEstimate = {
        optimistic: Math.round(baseTime * multiplier * 0.7),
        realistic: Math.round(baseTime * multiplier),
        pessimistic: Math.round(baseTime * multiplier * 1.5),
        suggestedBuffer: Math.round(baseTime * multiplier * 0.25),
        breakdown: [
          'Preparation: ~5 min',
          'Main work: ~' + Math.round(baseTime * multiplier * 0.6) + ' min',
          'Review/finish: ~' + Math.round(baseTime * multiplier * 0.2) + ' min',
        ],
        tips: [
          'Add 20% buffer for ADHD time blindness',
          'Set a timer to stay aware of time passing',
          'Break into smaller chunks if over 45 min',
        ],
      };
      
      setResult(estimate);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError('Failed to estimate time. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#F97316', '#EA580C']}
        style={styles.headerGradient}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerEmoji}>⏱️</Text>
        <Text style={styles.headerTitle}>Time Estimator</Text>
        <Text style={styles.headerSubtitle}>
          Get realistic time estimates with ADHD in mind
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!result ? (
          <>
            {/* Task Input */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.inputSection}>
              <Text style={styles.label}>What task do you want to estimate?</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Write a report, Clean the kitchen..."
                placeholderTextColor={colors.gray[400]}
                value={task}
                onChangeText={setTask}
                multiline
                textAlignVertical="top"
              />
            </Animated.View>

            {/* Complexity */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.inputSection}>
              <Text style={styles.label}>Task complexity</Text>
              <View style={styles.complexityOptions}>
                {COMPLEXITY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.complexityOption,
                      complexity === option.value && styles.complexityOptionSelected,
                    ]}
                    onPress={() => setComplexity(option.value)}
                  >
                    <Text style={styles.complexityEmoji}>{option.emoji}</Text>
                    <Text style={styles.complexityLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {error && <Text style={styles.error}>{error}</Text>}

            <Animated.View entering={FadeInDown.delay(300)}>
              <TouchableOpacity
                style={[styles.estimateButton, isLoading && styles.buttonDisabled]}
                onPress={handleEstimate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.buttonEmoji}>⏱️</Text>
                    <Text style={styles.buttonText}>Estimate Time</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          /* Results */
          <Animated.View entering={FadeIn}>
            {/* Main Estimate */}
            <View style={styles.mainEstimate}>
              <Text style={styles.mainEstimateLabel}>Realistic Estimate</Text>
              <Text style={styles.mainEstimateValue}>
                {formatTime(result.realistic)}
              </Text>
              <Text style={styles.mainEstimateHint}>
                With {formatTime(result.suggestedBuffer)} buffer
              </Text>
            </View>

            {/* Range */}
            <View style={styles.rangeCard}>
              <Text style={styles.rangeTitle}>Estimate Range</Text>
              <View style={styles.rangeRow}>
                <View style={styles.rangeItem}>
                  <Text style={[styles.rangeEmoji, { color: colors.success[500] }]}>🏃</Text>
                  <Text style={styles.rangeValue}>{formatTime(result.optimistic)}</Text>
                  <Text style={styles.rangeLabel}>Best case</Text>
                </View>
                <View style={styles.rangeItem}>
                  <Text style={[styles.rangeEmoji, { color: colors.warning[500] }]}>🚶</Text>
                  <Text style={styles.rangeValue}>{formatTime(result.realistic)}</Text>
                  <Text style={styles.rangeLabel}>Likely</Text>
                </View>
                <View style={styles.rangeItem}>
                  <Text style={[styles.rangeEmoji, { color: colors.danger[500] }]}>🐢</Text>
                  <Text style={styles.rangeValue}>{formatTime(result.pessimistic)}</Text>
                  <Text style={styles.rangeLabel}>Worst case</Text>
                </View>
              </View>
            </View>

            {/* Breakdown */}
            {result.breakdown && (
              <View style={styles.breakdownCard}>
                <Text style={styles.sectionTitle}>📋 Time Breakdown</Text>
                {result.breakdown.map((item, index) => (
                  <Text key={index} style={styles.breakdownItem}>• {item}</Text>
                ))}
              </View>
            )}

            {/* ADHD Tips */}
            {result.tips && (
              <View style={styles.tipsCard}>
                <Text style={styles.sectionTitle}>💡 ADHD Time Tips</Text>
                {result.tips.map((tip, index) => (
                  <Text key={index} style={styles.tipItem}>• {tip}</Text>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.tryAgainButton}
                onPress={() => setResult(null)}
              >
                <Text style={styles.tryAgainButtonText}>Estimate Another Task</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray[800],
    minHeight: 100,
  },
  complexityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  complexityOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[50],
  },
  complexityOptionSelected: {
    borderColor: '#F97316',
    backgroundColor: '#F9731615',
  },
  complexityEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  complexityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  error: {
    fontSize: 14,
    color: colors.danger[500],
    marginBottom: 16,
    textAlign: 'center',
  },
  estimateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonEmoji: {
    fontSize: 18,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mainEstimate: {
    alignItems: 'center',
    backgroundColor: '#F9731610',
    borderRadius: 20,
    padding: 28,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#F9731630',
  },
  mainEstimateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EA580C',
    marginBottom: 8,
  },
  mainEstimateValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#EA580C',
  },
  mainEstimateHint: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 8,
  },
  rangeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  rangeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 16,
    textAlign: 'center',
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rangeItem: {
    alignItems: 'center',
  },
  rangeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  rangeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[800],
  },
  rangeLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  breakdownCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 12,
  },
  breakdownItem: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 6,
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: colors.warning[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  tipItem: {
    fontSize: 14,
    color: colors.warning[700],
    marginBottom: 6,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  tryAgainButton: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 14,
  },
  tryAgainButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[700],
  },
});
