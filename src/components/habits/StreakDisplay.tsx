import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { FlexibleStreak } from '../../types/habit';
import { colors } from '../../theme/colors';

interface StreakDisplayProps {
  currentStreak: number;
  flexibleStreak?: FlexibleStreak;
  showFlexible?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentStreak,
  flexibleStreak,
  showFlexible = true,
  size = 'md',
}) => {
  const fireScale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (currentStreak > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(fireScale, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(fireScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [currentStreak]);

  const sizeStyles = {
    sm: { fire: 24, number: 16, label: 10 },
    md: { fire: 36, number: 24, label: 12 },
    lg: { fire: 48, number: 32, label: 14 },
  };

  const sizes = sizeStyles[size];

  return (
    <View style={styles.container}>
      <View style={styles.streakRow}>
        <Animated.Text
          style={[
            styles.fireEmoji,
            { fontSize: sizes.fire, transform: [{ scale: fireScale }] },
          ]}
        >
          {currentStreak > 0 ? '🔥' : '❄️'}
        </Animated.Text>
        <View style={styles.streakInfo}>
          <Text style={[styles.streakNumber, { fontSize: sizes.number }]}>
            {currentStreak}
          </Text>
          <Text style={[styles.streakLabel, { fontSize: sizes.label }]}>
            {currentStreak === 1 ? 'day' : 'days'}
          </Text>
        </View>
      </View>

      {showFlexible && flexibleStreak && (
        <View style={styles.flexibleContainer}>
          <View style={styles.flexibleProgress}>
            <View
              style={[
                styles.flexibleProgressFill,
                {
                  width: `${flexibleStreak.percentage}%`,
                  backgroundColor:
                    flexibleStreak.percentage >= 70
                      ? colors.success[500]
                      : flexibleStreak.percentage >= 40
                      ? colors.warning[500]
                      : colors.gray[400],
                },
              ]}
            />
          </View>
          <Text style={styles.flexibleText}>
            {flexibleStreak.completed} of last {flexibleStreak.windowDays} days (
            {flexibleStreak.percentage}%)
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fireEmoji: {
    marginRight: 4,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  streakNumber: {
    fontWeight: '700',
    color: colors.gray[800],
  },
  streakLabel: {
    color: colors.gray[500],
    fontWeight: '500',
  },
  flexibleContainer: {
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  flexibleProgress: {
    width: '100%',
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  flexibleProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  flexibleText: {
    fontSize: 11,
    color: colors.gray[500],
  },
});

export default StreakDisplay;

