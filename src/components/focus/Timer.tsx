import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { formatTimer } from '../../utils/date';

interface TimerProps {
  durationMinutes: number;
  isActive: boolean;
  onComplete: () => void;
  onTick?: (remainingSeconds: number) => void;
  size?: number;
}

export const Timer: React.FC<TimerProps> = ({
  durationMinutes,
  isActive,
  onComplete,
  onTick,
  size = 280,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(durationMinutes * 60);
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const totalSeconds = durationMinutes * 60;
  const progress = remainingSeconds / totalSeconds;

  // Determine color based on progress
  const getProgressColor = () => {
    if (progress > 0.5) return colors.success[500];
    if (progress > 0.25) return colors.warning[500];
    return colors.danger[500];
  };

  useEffect(() => {
    setRemainingSeconds(durationMinutes * 60);
  }, [durationMinutes]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          const newValue = prev - 1;
          onTick?.(newValue);

          if (newValue <= 0) {
            clearInterval(interval);
            onComplete();
          }

          return newValue;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, remainingSeconds, onComplete, onTick]);

  // Pulse animation every minute
  useEffect(() => {
    if (isActive && remainingSeconds % 60 === 0 && remainingSeconds !== totalSeconds && remainingSeconds > 0) {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [remainingSeconds, isActive, totalSeconds, pulseAnimation]);

  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const center = size / 2;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: pulseAnimation }] },
      ]}
    >
      <View style={[styles.timerCircle, { width: size, height: size }]}>
        <Svg width={size} height={size} style={styles.progressRing}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.gray[200]}
            strokeWidth={8}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={getProgressColor()}
            strokeWidth={8}
            fill="transparent"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>

        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: getProgressColor() }]}>
            {formatTimer(remainingSeconds)}
          </Text>
          <Text style={styles.remainingLabel}>remaining</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    position: 'absolute',
  },
  timeContainer: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 64,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  remainingLabel: {
    fontSize: 16,
    color: colors.gray[400],
    marginTop: 4,
  },
});

export default Timer;
