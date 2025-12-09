import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { colors } from '../../src/theme/colors';

const GOAL_OPTIONS = [
  { id: 'focus', label: 'Improve focus', emoji: '🎯' },
  { id: 'tasks', label: 'Complete tasks', emoji: '✅' },
  { id: 'habits', label: 'Build habits', emoji: '🔄' },
  { id: 'time', label: 'Manage time better', emoji: '⏰' },
  { id: 'routine', label: 'Create routines', emoji: '📋' },
  { id: 'stress', label: 'Reduce overwhelm', emoji: '😌' },
  { id: 'motivation', label: 'Stay motivated', emoji: '💪' },
  { id: 'organization', label: 'Get organized', emoji: '📁' },
];

export default function GoalsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const setOnboardingData = useAuthStore((state) => state.setOnboardingData);

  const toggleGoal = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    setOnboardingData({ primaryGoals: selected });
    router.push('/(onboarding)/challenges');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Step 2 of 4</Text>
          <Text style={styles.title}>What are your main goals?</Text>
          <Text style={styles.subtitle}>
            Select all that apply • We'll tailor features to help
          </Text>
        </View>

        {/* Options */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.options}
          showsVerticalScrollIndicator={false}
        >
          {GOAL_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                selected.includes(option.id) && styles.optionSelected,
              ]}
              onPress={() => toggleGoal(option.id)}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <Text
                style={[
                  styles.optionLabel,
                  selected.includes(option.id) && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
              {selected.includes(option.id) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* CTA */}
        <View style={styles.cta}>
          <Button
            title="Continue"
            onPress={handleContinue}
            fullWidth
            disabled={selected.length === 0}
          />
          <TouchableOpacity onPress={() => router.push('/(onboarding)/challenges')}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  step: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[500],
  },
  scrollView: {
    flex: 1,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.gray[200],
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  optionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  optionEmoji: {
    fontSize: 20,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[700],
  },
  optionLabelSelected: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: colors.primary[500],
    fontWeight: '700',
  },
  cta: {
    gap: 16,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 15,
    color: colors.gray[400],
  },
});

