import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BackgroundSound } from '../../types/focus';
import { colors } from '../../theme/colors';
import { BACKGROUND_SOUNDS } from '../../utils/constants';

interface SoundPickerProps {
  selectedSound: BackgroundSound;
  onSelectSound: (sound: BackgroundSound) => void;
  compact?: boolean;
}

export const SoundPicker: React.FC<SoundPickerProps> = ({
  selectedSound,
  onSelectSound,
  compact = false,
}) => {
  const handleSelect = async (soundId: BackgroundSound) => {
    await Haptics.selectionAsync();
    onSelectSound(soundId);
  };

  if (compact) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.compactContainer}
      >
        {BACKGROUND_SOUNDS.map((sound) => (
          <TouchableOpacity
            key={sound.id}
            style={[
              styles.compactItem,
              selectedSound === sound.id && styles.compactItemSelected,
            ]}
            onPress={() => handleSelect(sound.id as BackgroundSound)}
            activeOpacity={0.7}
          >
            <Text style={styles.soundEmoji}>{sound.icon}</Text>
            <Text
              style={[
                styles.compactLabel,
                selectedSound === sound.id && styles.compactLabelSelected,
              ]}
            >
              {sound.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Background Sound</Text>
      <View style={styles.grid}>
        {BACKGROUND_SOUNDS.map((sound) => (
          <TouchableOpacity
            key={sound.id}
            style={[
              styles.soundItem,
              selectedSound === sound.id && styles.soundItemSelected,
            ]}
            onPress={() => handleSelect(sound.id as BackgroundSound)}
            activeOpacity={0.7}
          >
            <Text style={styles.soundEmojiLarge}>{sound.icon}</Text>
            <Text
              style={[
                styles.soundLabel,
                selectedSound === sound.id && styles.soundLabelSelected,
              ]}
            >
              {sound.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  soundItem: {
    width: '30%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  soundItemSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  soundEmojiLarge: {
    fontSize: 32,
  },
  soundLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[600],
    textAlign: 'center',
  },
  soundLabelSelected: {
    color: colors.primary[700],
  },
  compactContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  compactItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 20,
    flexDirection: 'row',
    gap: 6,
    marginRight: 8,
  },
  compactItemSelected: {
    backgroundColor: colors.primary[500],
  },
  soundEmoji: {
    fontSize: 16,
  },
  compactLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[600],
  },
  compactLabelSelected: {
    color: '#FFFFFF',
  },
});

export default SoundPicker;
