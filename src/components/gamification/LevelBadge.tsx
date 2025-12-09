import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors } from '../../theme/colors';

interface LevelBadgeProps {
  level: number;
  xp: number;
  xpToNext: number;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  xp,
  xpToNext,
  onPress,
  size = 'md',
  showProgress = true,
}) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const progress = xpToNext > 0 ? (xp % xpToNext) / xpToNext : 0;

  const sizeStyles = {
    sm: { badge: 40, text: 14, emoji: 16 },
    md: { badge: 56, text: 18, emoji: 20 },
    lg: { badge: 72, text: 24, emoji: 28 },
  };

  const sizes = sizeStyles[size];

  const content = (
    <Animated.View
      style={[
        styles.badge,
        {
          width: sizes.badge,
          height: sizes.badge,
          borderRadius: sizes.badge / 2,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <Text style={[styles.levelText, { fontSize: sizes.text }]}>
        {level}
      </Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}

      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
          <Text style={styles.xpText}>
            {xp % xpToNext}/{xpToNext} XP
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
  badge: {
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary[700],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: colors.primary[300],
  },
  levelText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  progressBar: {
    width: 80,
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
  xpText: {
    marginTop: 4,
    fontSize: 11,
    color: colors.gray[500],
    fontWeight: '500',
  },
});

export default LevelBadge;

