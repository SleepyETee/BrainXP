import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MoodPicker } from '../../src/components/wellness/MoodPicker';
import { EnergySlider } from '../../src/components/wellness/EnergySlider';
import { Button } from '../../src/components/ui/Button';
import { Header } from '../../src/components/common/Header';
import { useProgressStore } from '../../src/stores/progressStore';
import { recordMood } from '../../src/services/api/analytics';
import { colors } from '../../src/theme/colors';

export default function MoodScreen() {
  const router = useRouter();
  const addXP = useProgressStore((state) => state.addXP);
  
  const [mood, setMood] = useState<{ level: number; descriptor?: string }>();
  const [energy, setEnergy] = useState<number>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMoodChange = (level: number, descriptor?: string) => {
    setMood({ level, descriptor });
  };

  const handleEnergyChange = (level: number) => {
    setEnergy(level);
  };

  const handleSubmit = async () => {
    if (!mood || !energy) return;

    setIsSubmitting(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const result = await recordMood(mood.level, energy, mood.descriptor);
      const xp = result?.xpEarned ?? 5;
      await addXP(xp, 'mood_checkin', 'Mood check-in completed');

      router.back();
    } catch (error) {
      console.error('Failed to save mood entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = mood && energy;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="How are you feeling?" showBack />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.introText}>
            Taking a moment to check in with yourself is a form of self-care. 
            There are no wrong answers here. 💙
          </Text>
        </View>

        <View style={styles.section}>
          <MoodPicker
            value={mood?.level}
            onChange={handleMoodChange}
            showDescriptors
          />
        </View>

        <View style={styles.section}>
          <EnergySlider
            value={energy}
            onChange={handleEnergyChange}
          />
        </View>

        <View style={styles.actions}>
          <Button
            title="Save Check-in"
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={isSubmitting}
            fullWidth
          />
          
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.back()}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.benefits}>
          <Text style={styles.benefitsTitle}>Why track your mood?</Text>
          <Text style={styles.benefitsText}>
            • Helps identify patterns in how you feel{'\n'}
            • Suggests tasks based on your energy level{'\n'}
            • Provides insights over time{'\n'}
            • Earns you XP! ✨
          </Text>
        </View>
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  intro: {
    backgroundColor: colors.primary[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  introText: {
    fontSize: 15,
    color: colors.primary[700],
    lineHeight: 22,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actions: {
    marginTop: 8,
    gap: 12,
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  skipText: {
    fontSize: 15,
    color: colors.gray[500],
  },
  benefits: {
    marginTop: 32,
    padding: 16,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  benefitsText: {
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 22,
  },
});

