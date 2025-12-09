import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StudySet } from '../../types/study';
import { colors, shadows } from '../../theme/colors';
import { springConfigs } from '../../utils/animations';

interface StudySetCardProps {
  studySet: StudySet;
  onPress: () => void;
  onLongPress?: () => void;
  index?: number;
}

export const StudySetCard: React.FC<StudySetCardProps> = ({
  studySet,
  onPress,
  onLongPress,
  index = 0,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springConfigs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfigs.bouncy);
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleLongPress = async () => {
    if (onLongPress) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLongPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Calculate stats from actual cards array
  const cards = studySet.cards || [];
  const cardCount = cards.length;
  const now = new Date();
  const masteredCount = cards.filter((c) => c.interval >= 21).length;
  const dueCount = cards.filter((c) => {
    if (c.learningState === 'new') return true;
    if (!c.nextReview) return true;
    return new Date(c.nextReview) <= now;
  }).length;
  const progress = cardCount > 0 ? (masteredCount / cardCount) * 100 : 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={[styles.container, animatedStyle]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        activeOpacity={1}
        delayLongPress={500}
      >
        <View style={[styles.card, shadows.md]}>
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: studySet.color || colors.primary[500] },
              ]}
            >
              <Text style={styles.icon}>{studySet.icon || '📚'}</Text>
            </View>
            
            <View style={styles.headerInfo}>
              <Text style={styles.title} numberOfLines={1}>
                {studySet.title}
              </Text>
              {studySet.description && (
                <Text style={styles.description} numberOfLines={1}>
                  {studySet.description}
                </Text>
              )}
            </View>
            
            {studySet.isFavorite && (
              <View style={styles.favoriteIcon}>
                <Text>⭐</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{cardCount}</Text>
              <Text style={styles.statLabel}>Cards</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.success[600] }]}>
                {masteredCount}
              </Text>
              <Text style={styles.statLabel}>Mastered</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.stat}>
              <Text
                style={[
                  styles.statValue,
                  { color: dueCount > 0 ? colors.warning[600] : colors.gray[400] },
                ]}
              >
                {dueCount}
              </Text>
              <Text style={styles.statLabel}>Due</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: studySet.color || colors.primary[500],
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progress)}% mastered
            </Text>
          </View>

          {/* AI Badge */}
          {studySet.aiGenerated && (
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>🤖 AI Generated</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: colors.gray[500],
  },
  favoriteIcon: {
    padding: 4,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[800],
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray[500],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[500],
    minWidth: 80,
    textAlign: 'right',
  },
  aiBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[600],
  },
});

export default StudySetCard;
