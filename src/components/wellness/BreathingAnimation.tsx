import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';

interface BreathingAnimationProps {
  pattern?: 'box' | 'relaxing' | 'energizing';
  onComplete?: (cycles: number) => void;
  autoStart?: boolean;
}

const PATTERNS = {
  box: { inhale: 4, hold1: 4, exhale: 4, hold2: 4, name: 'Box Breathing' },
  relaxing: { inhale: 4, hold1: 7, exhale: 8, hold2: 0, name: '4-7-8 Relaxing' },
  energizing: { inhale: 6, hold1: 0, exhale: 2, hold2: 0, name: 'Energizing' },
};

const PHASES = ['Breathe In', 'Hold', 'Breathe Out', 'Hold'];

export const BreathingAnimation: React.FC<BreathingAnimationProps> = ({
  pattern = 'box',
  onComplete,
  autoStart = false,
}) => {
  const [isActive, setIsActive] = useState(autoStart);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  const patternConfig = PATTERNS[pattern];
  const phaseDurations = [
    patternConfig.inhale,
    patternConfig.hold1,
    patternConfig.exhale,
    patternConfig.hold2,
  ];

  useEffect(() => {
    if (!isActive) return;

    let phaseIndex = 0;
    let timeoutId: NodeJS.Timeout;
    let countdownIntervalId: NodeJS.Timeout;

    const runPhase = () => {
      const duration = phaseDurations[phaseIndex];
      
      if (duration === 0) {
        phaseIndex = (phaseIndex + 1) % 4;
        if (phaseIndex === 0) {
          setCycleCount((c) => c + 1);
        }
        runPhase();
        return;
      }

      setCurrentPhase(phaseIndex);
      setCountdown(duration);
      
      // Haptic at phase start
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Animate based on phase
      if (phaseIndex === 0) {
        // Inhale - expand
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.5,
            duration: duration * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: duration * 1000,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (phaseIndex === 2) {
        // Exhale - contract
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: duration * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: duration * 1000,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // Countdown
      let count = duration;
      // Clear any existing countdown interval before creating new one
      if (countdownIntervalId) {
        clearInterval(countdownIntervalId);
      }
      countdownIntervalId = setInterval(() => {
        count--;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(countdownIntervalId);
        }
      }, 1000);

      // Move to next phase
      timeoutId = setTimeout(() => {
        clearInterval(countdownIntervalId);
        phaseIndex = (phaseIndex + 1) % 4;
        if (phaseIndex === 0) {
          setCycleCount((c) => c + 1);
        }
        runPhase();
      }, duration * 1000);
    };

    runPhase();

    return () => {
      clearTimeout(timeoutId);
      clearInterval(countdownIntervalId);
    };
  }, [isActive, pattern]);

  const handleToggle = () => {
    if (isActive && onComplete) {
      onComplete(cycleCount);
    }
    setIsActive(!isActive);
    if (!isActive) {
      setCycleCount(0);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.patternName}>{patternConfig.name}</Text>

      <View style={styles.circleContainer}>
        <Animated.View
          style={[
            styles.breathCircle,
            {
              transform: [{ scale }],
              opacity,
            },
          ]}
        />
        <View style={styles.innerCircle}>
          {isActive ? (
            <>
              <Text style={styles.phaseText}>{PHASES[currentPhase]}</Text>
              <Text style={styles.countdownText}>{countdown}</Text>
            </>
          ) : (
            <Text style={styles.startText}>Tap to start</Text>
          )}
        </View>
      </View>

      <View style={styles.stats}>
        <Text style={styles.cycleText}>
          {cycleCount} {cycleCount === 1 ? 'cycle' : 'cycles'} completed
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isActive && styles.buttonStop]}
        onPress={handleToggle}
      >
        <Text style={styles.buttonText}>
          {isActive ? 'Stop' : 'Start Breathing'}
        </Text>
      </TouchableOpacity>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Inhale {patternConfig.inhale}s
          {patternConfig.hold1 > 0 && ` → Hold ${patternConfig.hold1}s`}
          {' → '}Exhale {patternConfig.exhale}s
          {patternConfig.hold2 > 0 && ` → Hold ${patternConfig.hold2}s`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
  },
  patternName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 32,
  },
  circleContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  breathCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary[400],
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  phaseText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 4,
  },
  countdownText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary[500],
  },
  startText: {
    fontSize: 14,
    color: colors.gray[500],
    fontWeight: '500',
  },
  stats: {
    marginBottom: 24,
  },
  cycleText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  button: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 24,
  },
  buttonStop: {
    backgroundColor: colors.danger[500],
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    padding: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
  },
  instructionText: {
    fontSize: 13,
    color: colors.gray[600],
    textAlign: 'center',
  },
});

export default BreathingAnimation;

