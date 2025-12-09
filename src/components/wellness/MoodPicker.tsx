import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';

interface MoodPickerProps {
  value?: number;
  onChange: (mood: number, descriptor?: string) => void;
  showDescriptors?: boolean;
}

const MOODS = [
  { level: 1, emoji: '😔', label: 'Low', color: '#6B7280' },
  { level: 2, emoji: '😕', label: 'Meh', color: '#9CA3AF' },
  { level: 3, emoji: '😐', label: 'Okay', color: '#F59E0B' },
  { level: 4, emoji: '🙂', label: 'Good', color: '#22C55E' },
  { level: 5, emoji: '😊', label: 'Great', color: '#3B82F6' },
];

const DESCRIPTORS = [
  'Anxious', 'Overwhelmed', 'Tired', 'Restless', 'Calm',
  'Focused', 'Motivated', 'Scattered', 'Peaceful', 'Energized',
];

export const MoodPicker: React.FC<MoodPickerProps> = ({
  value,
  onChange,
  showDescriptors = true,
}) => {
  const [selectedMood, setSelectedMood] = useState<number | undefined>(value);
  const [selectedDescriptor, setSelectedDescriptor] = useState<string>();

  const handleMoodSelect = async (level: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMood(level);
    onChange(level, selectedDescriptor);
  };

  const handleDescriptorSelect = async (descriptor: string) => {
    await Haptics.selectionAsync();
    const newDescriptor = selectedDescriptor === descriptor ? undefined : descriptor;
    setSelectedDescriptor(newDescriptor);
    if (selectedMood) {
      onChange(selectedMood, newDescriptor);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling?</Text>
      
      <View style={styles.moodRow}>
        {MOODS.map((mood) => {
          const isSelected = selectedMood === mood.level;
          return (
            <TouchableOpacity
              key={mood.level}
              style={[
                styles.moodButton,
                isSelected && [styles.moodButtonSelected, { borderColor: mood.color }],
              ]}
              onPress={() => handleMoodSelect(mood.level)}
              activeOpacity={0.7}
            >
              <Text style={[styles.moodEmoji, isSelected && styles.moodEmojiSelected]}>
                {mood.emoji}
              </Text>
              <Text style={[styles.moodLabel, isSelected && { color: mood.color }]}>
                {mood.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {showDescriptors && selectedMood && (
        <View style={styles.descriptorsContainer}>
          <Text style={styles.descriptorsTitle}>What best describes it?</Text>
          <View style={styles.descriptorsGrid}>
            {DESCRIPTORS.map((descriptor) => {
              const isSelected = selectedDescriptor === descriptor;
              return (
                <TouchableOpacity
                  key={descriptor}
                  style={[
                    styles.descriptorChip,
                    isSelected && styles.descriptorChipSelected,
                  ]}
                  onPress={() => handleDescriptorSelect(descriptor)}
                >
                  <Text
                    style={[
                      styles.descriptorText,
                      isSelected && styles.descriptorTextSelected,
                    ]}
                  >
                    {descriptor}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 20,
    textAlign: 'center',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.gray[50],
    minWidth: 64,
  },
  moodButtonSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 4,
    opacity: 0.7,
  },
  moodEmojiSelected: {
    opacity: 1,
    transform: [{ scale: 1.2 }],
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[500],
  },
  descriptorsContainer: {
    marginTop: 8,
  },
  descriptorsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
    marginBottom: 12,
    textAlign: 'center',
  },
  descriptorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  descriptorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  descriptorChipSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  descriptorText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[600],
  },
  descriptorTextSelected: {
    color: colors.primary[600],
  },
});

export default MoodPicker;

