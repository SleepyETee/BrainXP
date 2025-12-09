import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { colors } from '../../src/theme/colors';
import { ADHDExperience } from '../../src/types/user';

const EXPERIENCE_OPTIONS = [
  {
    id: 'newly_diagnosed',
    label: 'Newly Diagnosed',
    description: 'Recently learned I have ADHD',
    emoji: '🌱',
  },
  {
    id: 'diagnosed_years',
    label: 'Years of Experience',
    description: 'Been managing ADHD for a while',
    emoji: '🎯',
  },
  {
    id: 'self_identified',
    label: 'Self-Identified',
    description: 'Think I might have ADHD',
    emoji: '🤔',
  },
  {
    id: 'exploring',
    label: 'Exploring',
    description: 'Learning more about ADHD',
    emoji: '💜',
  },
] as const;

export default function ExperienceScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<ADHDExperience | null>(null);
  const setOnboardingData = useAuthStore((state) => state.setOnboardingData);

  const handleContinue = () => {
    if (selected) {
      setOnboardingData({ adhdExperience: selected });
      router.push('/(onboarding)/goals');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Step 1 of 4</Text>
          <Text style={styles.title}>Tell us about your experience</Text>
          <Text style={styles.subtitle}>
            This helps us personalize your experience
          </Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {EXPERIENCE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                selected === option.id && styles.optionSelected,
              ]}
              onPress={() => setSelected(option.id as ADHDExperience)}
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
            disabled={!selected}
          />
          <TouchableOpacity onPress={() => router.push('/(onboarding)/goals')}>
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
    fontSize: 32,
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

