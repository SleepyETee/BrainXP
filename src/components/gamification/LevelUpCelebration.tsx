// Premium Level Up Celebration Component
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, gradients, shadows } from '../../theme/colors';
import { springConfigs } from '../../utils/animations';
import { ParticleExplosion } from './ParticleExplosion';
import { AnimatedButton } from '../ui/AnimatedButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LevelUpCelebrationProps {
  visible: boolean;
  newLevel: number;
  onClose: () => void;
  rewards?: {
    badges?: string[];
    unlocks?: string[];
  };
}

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({
  visible,
  newLevel,
  onClose,
  rewards,
}) => {
  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.5);
  const cardOpacity = useSharedValue(0);
  const levelScale = useSharedValue(0);
  const levelRotation = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const textOpacity = useSharedValue(0);
  const showParticles = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Haptic feedback sequence
      const hapticSequence = async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 400);
      };
      hapticSequence();

      // Animation sequence
      backdropOpacity.value = withTiming(1, { duration: 300 });

      cardScale.value = withDelay(100, withSpring(1, springConfigs.bouncy));
      cardOpacity.value = withDelay(100, withTiming(1, { duration: 200 }));

      // Level number entrance with spin
      levelScale.value = withDelay(400, withSpring(1, springConfigs.wobbly));
      levelRotation.value = withDelay(
        400,
        withSequence(
          withTiming(360, { duration: 600, easing: Easing.out(Easing.cubic) }),
          withSpring(0, springConfigs.gentle)
        )
      );

      // Expanding ring effect
      ringScale.value = withDelay(
        500,
        withRepeat(
          withSequence(
            withTiming(1.5, { duration: 1000 }),
            withTiming(0, { duration: 0 })
          ),
          3,
          false
        )
      );
      ringOpacity.value = withDelay(
        500,
        withRepeat(
          withSequence(
            withTiming(0.5, { duration: 100 }),
            withTiming(0, { duration: 900 })
          ),
          3,
          false
        )
      );

      // Glow pulse
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );

      // Text fade in
      textOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));

      // Show particles after a delay
      showParticles.value = withDelay(300, withTiming(1, { duration: 100 }));
    } else {
      // Reset all values
      backdropOpacity.value = 0;
      cardScale.value = 0.5;
      cardOpacity.value = 0;
      levelScale.value = 0;
      levelRotation.value = 0;
      ringScale.value = 0;
      ringOpacity.value = 0;
      textOpacity.value = 0;
      showParticles.value = 0;
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const levelStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: levelScale.value },
      { rotate: `${levelRotation.value}deg` },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const particlesVisible = useAnimatedStyle(() => ({
    opacity: showParticles.value,
  }));

  const handleClose = () => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    cardScale.value = withTiming(0.8, { duration: 200 });
    cardOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(onClose, 250);
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <LinearGradient
            colors={['rgba(79, 70, 229, 0.9)', 'rgba(139, 92, 246, 0.95)']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Particles */}
        <Animated.View style={[StyleSheet.absoluteFill, particlesVisible]}>
          <ParticleExplosion
            visible={visible}
            type="stars"
            particleCount={40}
            duration={3000}
          />
        </Animated.View>

        {/* Main Card */}
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Glow effect */}
          <Animated.View style={[styles.glow, glowStyle]}>
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF6B6B']}
              style={styles.glowGradient}
            />
          </Animated.View>

          {/* Ring effect */}
          <Animated.View style={[styles.ring, ringStyle]} />

          {/* Level badge */}
          <Animated.View style={[styles.levelBadge, levelStyle]}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.levelGradient}
            >
              <Text style={styles.levelNumber}>{newLevel}</Text>
            </LinearGradient>
          </Animated.View>

          {/* Content */}
          <Animated.View style={[styles.content, textStyle]}>
            <Text style={styles.title}>LEVEL UP!</Text>
            <Text style={styles.subtitle}>
              Congratulations! You've reached Level {newLevel}
            </Text>

            {rewards?.badges && rewards.badges.length > 0 && (
              <View style={styles.rewardsSection}>
                <Text style={styles.rewardsTitle}>🏆 New Badges Unlocked</Text>
                <View style={styles.badgesRow}>
                  {rewards.badges.map((badge, index) => (
                    <View key={index} style={styles.badge}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {rewards?.unlocks && rewards.unlocks.length > 0 && (
              <View style={styles.rewardsSection}>
                <Text style={styles.rewardsTitle}>🔓 New Features</Text>
                {rewards.unlocks.map((unlock, index) => (
                  <Text key={index} style={styles.unlockText}>
                    • {unlock}
                  </Text>
                ))}
              </View>
            )}

            <AnimatedButton
              title="Continue"
              onPress={handleClose}
              variant="gradient"
              gradientColors={['#FFD700', '#FFA500']}
              size="lg"
              fullWidth
              style={styles.continueButton}
            />
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    ...shadows.xl,
  },
  glow: {
    position: 'absolute',
    top: -40,
    left: -40,
    right: -40,
    height: 200,
    opacity: 0.3,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 100,
  },
  ring: {
    position: 'absolute',
    top: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  levelBadge: {
    marginBottom: 24,
    ...shadows.xl,
  },
  levelGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  levelNumber: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.primary[600],
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  rewardsSection: {
    width: '100%',
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  rewardsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[700],
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[700],
  },
  unlockText: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 4,
    lineHeight: 20,
  },
  continueButton: {
    marginTop: 8,
  },
});

export default LevelUpCelebration;
