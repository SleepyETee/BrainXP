import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BreathingAnimation } from '../../src/components/wellness/BreathingAnimation';
import { Header } from '../../src/components/common/Header';
import { useProgressStore } from '../../src/stores/progressStore';
import { colors } from '../../src/theme/colors';

type BreathingPattern = 'box' | 'relaxing' | 'energizing';

const PATTERNS: { id: BreathingPattern; name: string; description: string; icon: string }[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Calming 4-4-4-4 pattern for anxiety relief',
    icon: '📦',
  },
  {
    id: 'relaxing',
    name: '4-7-8 Relaxing',
    description: 'Deep relaxation for sleep or stress',
    icon: '😴',
  },
  {
    id: 'energizing',
    name: 'Energizing',
    description: 'Quick breaths to increase alertness',
    icon: '⚡',
  },
];

export default function BreathingScreen() {
  const router = useRouter();
  const addXP = useProgressStore((state) => state.addXP);
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>('box');
  const [showPatternPicker, setShowPatternPicker] = useState(true);

  const handleComplete = async (cycles: number) => {
    if (cycles >= 3) {
      await addXP(10, 'breathing_exercise', `Completed ${cycles} breathing cycles`);
    }
    setShowPatternPicker(true);
  };

  const handleStartPattern = (pattern: BreathingPattern) => {
    setSelectedPattern(pattern);
    setShowPatternPicker(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Breathing Exercise"
        subtitle="Take a moment to center yourself"
        showBack
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {showPatternPicker ? (
          <>
            <View style={styles.intro}>
              <Text style={styles.introEmoji}>🌬️</Text>
              <Text style={styles.introTitle}>Choose a Breathing Pattern</Text>
              <Text style={styles.introText}>
                Breathing exercises can help calm your mind, reduce anxiety, 
                and improve focus. Pick what feels right for you right now.
              </Text>
            </View>

            <View style={styles.patterns}>
              {PATTERNS.map((pattern) => (
                <TouchableOpacity
                  key={pattern.id}
                  style={[
                    styles.patternCard,
                    selectedPattern === pattern.id && styles.patternCardSelected,
                  ]}
                  onPress={() => handleStartPattern(pattern.id)}
                >
                  <Text style={styles.patternIcon}>{pattern.icon}</Text>
                  <View style={styles.patternInfo}>
                    <Text style={styles.patternName}>{pattern.name}</Text>
                    <Text style={styles.patternDescription}>
                      {pattern.description}
                    </Text>
                  </View>
                  <Text style={styles.patternArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.tips}>
              <Text style={styles.tipsTitle}>💡 Tips</Text>
              <Text style={styles.tipsText}>
                • Find a comfortable position{'\n'}
                • Close your eyes if it helps{'\n'}
                • Focus on your breath, not perfection{'\n'}
                • It's okay if your mind wanders - gently bring it back
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.exerciseContainer}>
            <BreathingAnimation
              pattern={selectedPattern}
              onComplete={handleComplete}
            />

            <TouchableOpacity
              style={styles.changePatternButton}
              onPress={() => setShowPatternPicker(true)}
            >
              <Text style={styles.changePatternText}>Change Pattern</Text>
            </TouchableOpacity>
          </View>
        )}
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
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 24,
  },
  introEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 12,
  },
  introText: {
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  patterns: {
    gap: 12,
    marginBottom: 24,
  },
  patternCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  patternCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  patternIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  patternInfo: {
    flex: 1,
  },
  patternName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 4,
  },
  patternDescription: {
    fontSize: 13,
    color: colors.gray[500],
  },
  patternArrow: {
    fontSize: 20,
    color: colors.gray[400],
  },
  tips: {
    backgroundColor: colors.primary[50],
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: colors.primary[600],
    lineHeight: 22,
  },
  exerciseContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  changePatternButton: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  changePatternText: {
    fontSize: 15,
    color: colors.gray[500],
    fontWeight: '500',
  },
});

