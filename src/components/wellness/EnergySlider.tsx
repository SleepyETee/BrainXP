import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';

interface EnergySliderProps {
  value?: number;
  onChange: (energy: number) => void;
}

const ENERGY_LEVELS = [
  { level: 1, emoji: '🔋', label: 'Very Low', description: 'Running on empty', color: '#EF4444' },
  { level: 2, emoji: '🪫', label: 'Low', description: 'Need to take it easy', color: '#F97316' },
  { level: 3, emoji: '⚡', label: 'Medium', description: 'Doing okay', color: '#F59E0B' },
  { level: 4, emoji: '💪', label: 'High', description: 'Feeling good', color: '#22C55E' },
  { level: 5, emoji: '🚀', label: 'Very High', description: 'Ready for anything', color: '#3B82F6' },
];

export const EnergySlider: React.FC<EnergySliderProps> = ({
  value,
  onChange,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(value);

  const handleSelect = async (level: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLevel(level);
    onChange(level);
  };

  const selectedEnergy = ENERGY_LEVELS.find((e) => e.level === selectedLevel);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Energy Level</Text>
      
      <View style={styles.sliderContainer}>
        <View style={styles.track}>
          {ENERGY_LEVELS.map((energy, index) => {
            const isSelected = selectedLevel === energy.level;
            const isBeforeSelected = selectedLevel !== undefined && energy.level < selectedLevel;
            
            return (
              <TouchableOpacity
                key={energy.level}
                style={[
                  styles.levelButton,
                  isSelected && { ...styles.levelButtonSelected, backgroundColor: energy.color },
                  isBeforeSelected && { ...styles.levelButtonFilled, backgroundColor: `${selectedEnergy?.color}40` },
                ]}
                onPress={() => handleSelect(energy.level)}
              >
                <Text style={[styles.levelEmoji, isSelected && styles.levelEmojiSelected]}>
                  {energy.emoji}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        <View style={styles.labels}>
          <Text style={styles.labelText}>Low</Text>
          <Text style={styles.labelText}>High</Text>
        </View>
      </View>

      {selectedEnergy && (
        <View style={[styles.selectedInfo, { backgroundColor: `${selectedEnergy.color}15` }]}>
          <Text style={[styles.selectedLabel, { color: selectedEnergy.color }]}>
            {selectedEnergy.label}
          </Text>
          <Text style={styles.selectedDescription}>
            {selectedEnergy.description}
          </Text>
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 20,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  track: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 4,
  },
  levelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  levelButtonSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelButtonFilled: {
    borderRadius: 8,
  },
  levelEmoji: {
    fontSize: 24,
    opacity: 0.6,
  },
  levelEmojiSelected: {
    opacity: 1,
    transform: [{ scale: 1.2 }],
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  labelText: {
    fontSize: 12,
    color: colors.gray[400],
    fontWeight: '500',
  },
  selectedInfo: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedDescription: {
    fontSize: 14,
    color: colors.gray[600],
  },
});

export default EnergySlider;

