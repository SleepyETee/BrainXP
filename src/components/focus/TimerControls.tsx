import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';

interface TimerControlsProps {
  isActive: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onExtend: (minutes: number) => void;
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  isActive,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
  onExtend,
}) => {
  const handlePrimaryAction = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isActive) {
      onStart();
    } else if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  };

  const handleStop = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onStop();
  };

  const handleExtend = async (minutes: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onExtend(minutes);
  };

  const getPrimaryButtonLabel = () => {
    if (!isActive) return 'Start Focus';
    if (isPaused) return 'Resume';
    return 'Pause';
  };

  const getPrimaryButtonStyle = () => {
    if (!isActive) return styles.startButton;
    if (isPaused) return styles.resumeButton;
    return styles.pauseButton;
  };

  return (
    <View style={styles.container}>
      {/* Primary control button */}
      <View style={styles.mainControls}>
        {isActive && (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStop}
            activeOpacity={0.8}
          >
            <View style={styles.stopIcon} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, getPrimaryButtonStyle()]}
          onPress={handlePrimaryAction}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>{getPrimaryButtonLabel()}</Text>
        </TouchableOpacity>
      </View>

      {/* Extend options - only show when active */}
      {isActive && (
        <View style={styles.extendControls}>
          <Text style={styles.extendLabel}>Need more time?</Text>
          <View style={styles.extendButtons}>
            <TouchableOpacity
              style={styles.extendButton}
              onPress={() => handleExtend(5)}
              activeOpacity={0.7}
            >
              <Text style={styles.extendButtonText}>+5 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.extendButton}
              onPress={() => handleExtend(10)}
              activeOpacity={0.7}
            >
              <Text style={styles.extendButtonText}>+10 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.extendButton}
              onPress={() => handleExtend(15)}
              activeOpacity={0.7}
            >
              <Text style={styles.extendButtonText}>+15 min</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 24,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    minWidth: 180,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: colors.primary[500],
  },
  pauseButton: {
    backgroundColor: colors.warning[500],
  },
  resumeButton: {
    backgroundColor: colors.success[500],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  stopButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.danger[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  extendControls: {
    alignItems: 'center',
    gap: 12,
  },
  extendLabel: {
    fontSize: 14,
    color: colors.gray[500],
  },
  extendButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  extendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  extendButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
  },
});

export default TimerControls;
