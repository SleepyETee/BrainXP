import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { colors } from '../../src/theme/colors';

const CHALLENGE_OPTIONS = [
  {
    id: 'starting',
    label: 'Getting started',
    description: 'Hard to begin tasks',
    emoji: '🚀',
  },
  {
    id: 'time_blindness',
    label: 'Time blindness',
    description: 'Losing track of time',
    emoji: '⏳',
  },
  {
    id: 'overwhelm',
    label: 'Feeling overwhelmed',
    description: 'Too many things to do',
    emoji: '🌊',
  },
  {
    id: 'distraction',
    label: 'Getting distracted',
    description: 'Staying on task',
    emoji: '🦋',
  },
  {
    id: 'memory',
    label: 'Forgetting things',
    description: 'Working memory challenges',
    emoji: '💭',
  },
  {
    id: 'consistency',
    label: 'Being consistent',
    description: 'Maintaining habits',
    emoji: '📅',
  },
];

export default function ChallengesScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const setOnboardingData = useAuthStore((state) => state.setOnboardingData);

  const handleContinue = () => {
    if (selected) {
      setOnboardingData({ biggestChallenge: selected });
    }
    router.push('/(onboarding)/ready');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Step 3 of 4</Text>
          <Text style={styles.title}>What's your biggest challenge?</Text>
          <Text style={styles.subtitle}>
            We'll prioritize features that help with this
          </Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {CHALLENGE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                selected === option.id && styles.optionSelected,
              ]}
              onPress={() => setSelected(option.id)}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDesc}>{option.description}</Text>
              </View>
              {selected === option.id && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <Button
            title="Continue"
            onPress={handleContinue}
            fullWidth
          />
          <TouchableOpacity onPress={() => router.push('/(onboarding)/ready')}>
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
    marginBottom: 32,
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
  options: {
    flex: 1,
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.gray[200],
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  optionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 14,
    color: colors.gray[500],
  },
  checkmark: {
    fontSize: 20,
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

