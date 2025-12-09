// Premium Focus Timer Component with Stunning Animations
// ADHD-Friendly: Respects reduceMotion setting for sensory sensitivity
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  interpolateColor,
  useDerivedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, gradients } from '../../theme/colors';
import { formatTimer } from '../../utils/date';
import { springConfigs } from '../../utils/animations';
import { useSettingsStore } from '../../stores/settingsStore';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface TimerProps {
  durationMinutes: number;
  isActive: boolean;
  isPaused?: boolean;
  onComplete: () => void;
  onTick?: (remainingSeconds: number) => void;
  size?: number;
  variant?: 'default' | 'minimal' | 'cosmic';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const Timer: React.FC<TimerProps> = ({
  durationMinutes,
  isActive,
  isPaused = false,
  onComplete,
  onTick,
  size = 300,
  variant = 'default',
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(durationMinutes * 60);
  
  // Get accessibility settings
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);
  const hapticFeedback = useSettingsStore((state) => state.settings.hapticFeedback);
  
  const totalSeconds = durationMinutes * 60;
  const progress = remainingSeconds / totalSeconds;

  // Animation values
  const progressAnim = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(reduceMotion ? 0.5 : 0.3);
  const ringRotation = useSharedValue(0);
  const particleOpacity = useSharedValue(0);
  const breatheScale = useSharedValue(1);

  // Colors based on progress
  const getProgressColor = () => {
    if (progress > 0.5) return colors.success[500];
    if (progress > 0.25) return colors.warning[500];
    return colors.danger[500];
  };

  const getGradientColors = () => {
    if (progress > 0.5) return ['#10B981', '#34D399'];
    if (progress > 0.25) return ['#F59E0B', '#FBBF24'];
    return ['#F43F5E', '#FB7185'];
  };

  // Initialize timer
  useEffect(() => {
    setRemainingSeconds(durationMinutes * 60);
    progressAnim.value = 1;
  }, [durationMinutes]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && !isPaused && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          const newValue = prev - 1;
          onTick?.(newValue);

          // Haptic feedback at milestones (respects settings)
          if (hapticFeedback) {
            if (newValue === 60) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            if (newValue === 10) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }

          if (newValue <= 0) {
            clearInterval(interval);
            if (hapticFeedback) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            onComplete();
          }

          return newValue;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, remainingSeconds, onComplete, onTick, hapticFeedback]);

  // Update progress animation
  useEffect(() => {
    progressAnim.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  // Breathing animation when active (respects reduceMotion)
  useEffect(() => {
    if (isActive && !isPaused) {
      // Only animate if motion is not reduced
      if (!reduceMotion) {
        breatheScale.value = withRepeat(
          withSequence(
            withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );

        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(0.6, { duration: 2000 }),
            withTiming(0.2, { duration: 2000 })
          ),
          -1,
          true
        );

        ringRotation.value = withRepeat(
          withTiming(360, { duration: 60000, easing: Easing.linear }),
          -1,
          false
        );

        particleOpacity.value = withTiming(1, { duration: 500 });
      } else {
        // Static values for reduced motion
        breatheScale.value = 1;
        glowOpacity.value = 0.5;
        ringRotation.value = 0;
        particleOpacity.value = 0;
      }
    } else {
      if (!reduceMotion) {
        breatheScale.value = withSpring(1, springConfigs.gentle);
        glowOpacity.value = withTiming(0.2, { duration: 500 });
        particleOpacity.value = withTiming(0, { duration: 300 });
      } else {
        breatheScale.value = 1;
        glowOpacity.value = 0.2;
        particleOpacity.value = 0;
      }
    }
  }, [isActive, isPaused, reduceMotion]);

  // Pulse animation every minute
  useEffect(() => {
    if (isActive && remainingSeconds % 60 === 0 && remainingSeconds !== totalSeconds && remainingSeconds > 0) {
      pulseScale.value = withSequence(
        withSpring(1.08, springConfigs.bouncy),
        withSpring(1, springConfigs.gentle)
      );
    }
  }, [remainingSeconds, isActive, totalSeconds]);

  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const animatedProgressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
    opacity: particleOpacity.value * 0.5,
  }));

  const strokeDashoffset = useDerivedValue(() => {
    return circumference * (1 - progressAnim.value);
  });

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
  }));

  const timerTextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Outer glow effect */}
      <Animated.View style={[styles.glowContainer, { width: size + 80, height: size + 80 }, animatedGlowStyle]}>
        <LinearGradient
          colors={[`${getGradientColors()[0]}40`, 'transparent']}
          style={styles.glowGradient}
        />
      </Animated.View>

      {/* Decorative rotating ring */}
      <Animated.View style={[styles.rotatingRing, { width: size + 40, height: size + 40 }, animatedRingStyle]}>
        <View style={[styles.ringDot, styles.ringDot1]} />
        <View style={[styles.ringDot, styles.ringDot2]} />
        <View style={[styles.ringDot, styles.ringDot3]} />
        <View style={[styles.ringDot, styles.ringDot4]} />
      </Animated.View>

      {/* Main timer circle */}
      <Animated.View style={[styles.timerCircle, { width: size, height: size }, animatedProgressStyle]}>
        <Svg width={size} height={size} style={styles.progressRing}>
          <Defs>
            <SvgGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={getGradientColors()[0]} />
              <Stop offset="100%" stopColor={getGradientColors()[1]} />
            </SvgGradient>
          </Defs>
          
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.gray[200]}
            strokeWidth={12}
            fill="transparent"
          />
          
          {/* Progress circle with gradient */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth={12}
            fill="transparent"
            strokeDasharray={circumference}
            animatedProps={animatedCircleProps}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>

        {/* Inner content */}
        <View style={styles.innerContent}>
          {/* Glass effect background */}
          <View style={styles.glassBackground}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
              style={styles.glassGradient}
            />
          </View>

          <Animated.View style={timerTextStyle}>
            <Text style={[styles.timeText, { color: getProgressColor() }]}>
              {formatTimer(remainingSeconds)}
            </Text>
          </Animated.View>
          
          <Text style={styles.statusText}>
            {isPaused ? '⏸ Paused' : isActive ? '🎯 Focus' : 'Ready'}
          </Text>
          
          {isActive && !isPaused && (
            <View style={styles.progressInfo}>
              <View style={[styles.progressDot, { backgroundColor: getProgressColor() }]} />
              <Text style={styles.progressText}>
                {Math.round((1 - progress) * 100)}% complete
              </Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Floating particles when active (hidden if reduceMotion) */}
      {isActive && !isPaused && !reduceMotion && (
        <Animated.View style={[styles.particles, { opacity: particleOpacity }]}>
          <FloatingParticle delay={0} size={size} />
          <FloatingParticle delay={500} size={size} />
          <FloatingParticle delay={1000} size={size} />
          <FloatingParticle delay={1500} size={size} />
        </Animated.View>
      )}
    </View>
  );
};

// Floating particle component
const FloatingParticle: React.FC<{ delay: number; size: number }> = ({ delay, size }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    const startX = (Math.random() - 0.5) * size;
    const startY = size / 2;
    
    translateX.value = startX;
    translateY.value = startY;

    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-size / 2, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000 }),
          withTiming(0.8, { duration: 2000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.5, { duration: 3000 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      <Text style={styles.particleText}>✨</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    borderRadius: 1000,
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
    borderRadius: 1000,
  },
  rotatingRing: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
    borderStyle: 'dashed',
  },
  ringDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[400],
    opacity: 0.6,
  },
  ringDot1: {
    top: '50%',
    left: -3,
    marginTop: -3,
  },
  ringDot2: {
    top: -3,
    left: '50%',
    marginLeft: -3,
  },
  ringDot3: {
    top: '50%',
    right: -3,
    marginTop: -3,
  },
  ringDot4: {
    bottom: -3,
    left: '50%',
    marginLeft: -3,
  },
  timerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    position: 'absolute',
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '75%',
    height: '75%',
    borderRadius: 1000,
    overflow: 'hidden',
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 1000,
    overflow: 'hidden',
  },
  glassGradient: {
    flex: 1,
  },
  timeText: {
    fontSize: 56,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[500],
    marginTop: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: colors.gray[400],
    fontWeight: '500',
  },
  particles: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
  },
  particleText: {
    fontSize: 16,
  },
});

export default Timer;
