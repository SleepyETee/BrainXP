// Premium Particle Explosion Effect for Celebrations
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ParticleExplosionProps {
  visible: boolean;
  onComplete?: () => void;
  type?: 'confetti' | 'stars' | 'hearts' | 'sparkles' | 'xp';
  particleCount?: number;
  duration?: number;
  originX?: number;
  originY?: number;
  colors?: string[];
}

const PARTICLE_EMOJIS = {
  confetti: ['🎊', '🎉', '✨', '💫', '⭐'],
  stars: ['⭐', '🌟', '✨', '💫', '✴️'],
  hearts: ['❤️', '💜', '💙', '💚', '💛', '🧡'],
  sparkles: ['✨', '💎', '💠', '✴️', '🔮'],
  xp: ['⭐', '✨', '+XP', '🏆', '💫'],
};

const DEFAULT_COLORS = [
  colors.primary[400],
  colors.primary[500],
  colors.secondary[400],
  colors.accent[400],
  colors.success[400],
  '#FFD700',
  '#FF69B4',
  '#00CED1',
];

interface Particle {
  id: number;
  emoji: string;
  startX: number;
  startY: number;
  angle: number;
  speed: number;
  size: number;
  rotationSpeed: number;
  delay: number;
  color: string;
}

const ParticleComponent: React.FC<{
  particle: Particle;
  duration: number;
}> = ({ particle, duration }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    const radians = (particle.angle * Math.PI) / 180;
    const targetX = Math.cos(radians) * particle.speed;
    const targetY = Math.sin(radians) * particle.speed - 100; // Add upward bias

    // Scale in
    scale.value = withDelay(
      particle.delay,
      withSpring(particle.size, { damping: 10, stiffness: 200 })
    );

    // Fade in then out
    opacity.value = withDelay(
      particle.delay,
      withTiming(1, { duration: 200 }, () => {
        opacity.value = withDelay(
          duration * 0.6,
          withTiming(0, { duration: duration * 0.4 })
        );
      })
    );

    // Move outward with gravity
    translateX.value = withDelay(
      particle.delay,
      withTiming(targetX, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );

    translateY.value = withDelay(
      particle.delay,
      withTiming(targetY + 200, {
        duration,
        easing: Easing.bezier(0.2, 0.8, 0.4, 1),
      })
    );

    // Rotation
    rotation.value = withDelay(
      particle.delay,
      withTiming(particle.rotationSpeed * 720, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const isText = particle.emoji.includes('+');

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: particle.startX,
          top: particle.startY,
        },
        animatedStyle,
      ]}
    >
      {isText ? (
        <Animated.Text style={[styles.textParticle, { color: particle.color }]}>
          {particle.emoji}
        </Animated.Text>
      ) : (
        <Animated.Text style={styles.emojiParticle}>
          {particle.emoji}
        </Animated.Text>
      )}
    </Animated.View>
  );
};

export const ParticleExplosion: React.FC<ParticleExplosionProps> = ({
  visible,
  onComplete,
  type = 'confetti',
  particleCount = 30,
  duration = 2000,
  originX,
  originY,
  colors: customColors,
}) => {
  const particles = useMemo(() => {
    if (!visible) return [];

    const emojis = PARTICLE_EMOJIS[type];
    const particleColors = customColors || DEFAULT_COLORS;
    const centerX = originX ?? SCREEN_WIDTH / 2;
    const centerY = originY ?? SCREEN_HEIGHT / 2;

    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      startX: centerX,
      startY: centerY,
      angle: (360 / particleCount) * i + Math.random() * 30 - 15,
      speed: 100 + Math.random() * 150,
      size: 0.6 + Math.random() * 0.6,
      rotationSpeed: Math.random() > 0.5 ? 1 : -1,
      delay: Math.random() * 200,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
    }));
  }, [visible, type, particleCount, originX, originY, customColors]);

  useEffect(() => {
    if (visible && onComplete) {
      const timeout = setTimeout(onComplete, duration + 500);
      return () => clearTimeout(timeout);
    }
  }, [visible, onComplete, duration]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <ParticleComponent
          key={particle.id}
          particle={particle}
          duration={duration}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiParticle: {
    fontSize: 28,
  },
  textParticle: {
    fontSize: 16,
    fontWeight: '800',
  },
});

export default ParticleExplosion;

