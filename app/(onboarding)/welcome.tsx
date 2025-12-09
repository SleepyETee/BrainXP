// BrainXP Welcome Screen - ADHD-Friendly Onboarding
// Calming colors, clear visual hierarchy, reduced cognitive load
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AnimatedButton } from '../../src/components/ui/AnimatedButton';
import { colors, gradients, shadows, adhdPalette } from '../../src/theme/colors';
import { springConfigs } from '../../src/utils/animations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Features with ADHD-friendly color coding
const FEATURES = [
  {
    icon: '🎯',
    title: 'Focus Sessions',
    description: 'ADHD-friendly timers with ambient sounds',
    gradient: [adhdPalette.shadowGreen, colors.primary[500]] as const, // Calming teal
  },
  {
    icon: '✨',
    title: 'AI Task Breakdown',
    description: 'Turn overwhelming tasks into tiny steps',
    gradient: [colors.primary[300], colors.primary[500]] as const, // Focus colors
  },
  {
    icon: '🔄',
    title: 'Flexible Habits',
    description: 'Streaks that celebrate progress, not perfection',
    gradient: [adhdPalette.berylGreen, colors.secondary[500]] as const, // Growth green
  },
  {
    icon: '⭐',
    title: 'Gentle Rewards',
    description: 'XP and badges without overwhelming stimulation',
    gradient: [colors.warning[300], colors.warning[500]] as const, // Soft amber
  },
];

// Floating particle - gentle animation
const FloatingParticle: React.FC<{
  emoji: string;
  startX: number;
  startY: number;
  delay: number;
}> = ({ emoji, startX, startY, delay }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    // Gentle floating - not distracting
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-60, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming((Math.random() - 0.5) * 30, { duration: 4000 }),
          withTiming((Math.random() - 0.5) * 30, { duration: 4000 })
        ),
        -1,
        true
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1500 }),
          withTiming(0.5, { duration: 5000 }),
          withTiming(0, { duration: 1500 })
        ),
        -1,
        false
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500 }),
          withTiming(0.6, { duration: 6500 })
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
    <Animated.View style={[styles.particle, { left: startX, top: startY }, animatedStyle]}>
      <Text style={styles.particleEmoji}>{emoji}</Text>
    </Animated.View>
  );
};

// Feature card with calm design
const FeatureCard: React.FC<{
  feature: typeof FEATURES[0];
  index: number;
}> = ({ feature, index }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(500 + index * 100).springify()}
      style={[styles.featureCard, shadows.sm, animatedStyle]}
    >
      <LinearGradient
        colors={[...feature.gradient] as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featureIconContainer}
      >
        <Text style={styles.featureIcon}>{feature.icon}</Text>
      </LinearGradient>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </View>
    </Animated.View>
  );
};

export default function WelcomeScreen() {
  const router = useRouter();
  
  // Animation values - gentle, not overwhelming
  const logoScale = useSharedValue(0);
  const logoRotation = useSharedValue(-20);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0.15);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Logo entrance - gentle
    logoScale.value = withDelay(200, withSpring(1, springConfigs.gentle));
    logoRotation.value = withDelay(200, withSpring(0, springConfigs.gentle));

    // Title entrance
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    titleTranslateY.value = withDelay(400, withSpring(0, springConfigs.gentle));

    // Subtitle entrance
    subtitleOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));

    // Subtle continuous animations - calming
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 3000 }),
        withTiming(0.1, { duration: 3000 })
      ),
      -1,
      true
    );

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 3000 }),
        withTiming(1, { duration: 3000 })
      ),
      -1,
      true
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const handleGetStarted = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/experience');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Background - calming gradient */}
      <LinearGradient
        colors={[adhdPalette.grayNurse, '#F0F7F6', colors.gray[100]]}
        locations={[0, 0.5, 1]}
        style={styles.backgroundGradient}
      />

      {/* Subtle floating particles - not distracting */}
      <View style={styles.particlesContainer}>
        <FloatingParticle emoji="✨" startX={40} startY={SCREEN_HEIGHT * 0.65} delay={0} />
        <FloatingParticle emoji="🧠" startX={SCREEN_WIDTH - 70} startY={SCREEN_HEIGHT * 0.55} delay={1000} />
        <FloatingParticle emoji="⭐" startX={80} startY={SCREEN_HEIGHT * 0.75} delay={2000} />
        <FloatingParticle emoji="🎯" startX={SCREEN_WIDTH - 90} startY={SCREEN_HEIGHT * 0.7} delay={3000} />
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        {/* Subtle glow effect */}
        <Animated.View style={[styles.logoGlow, glowStyle]}>
          <LinearGradient
            colors={[`${adhdPalette.shadowGreen}60`, 'transparent']}
            style={styles.glowGradient}
          />
        </Animated.View>

        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <LinearGradient
            colors={[...gradients.focus] as [string, string, ...string[]]}
            style={styles.logoGradient}
          >
            <Text style={styles.logoEmoji}>🧠</Text>
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[styles.title, titleStyle]}>
          BrainXP
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          Your calm companion for{'\n'}focus, tasks, and habits
        </Animated.Text>
      </View>

      {/* Features - clear, organized */}
      <View style={styles.featuresSection}>
        {FEATURES.map((feature, index) => (
          <FeatureCard key={index} feature={feature} index={index} />
        ))}
      </View>

      {/* CTA Section */}
      <Animated.View 
        entering={FadeInDown.delay(1000).springify()}
        style={styles.ctaSection}
      >
        <AnimatedButton
          title="Let's Get Started"
          onPress={handleGetStarted}
          variant="gradient"
          gradientColors={gradients.focus as unknown as [string, string, ...string[]]}
          size="lg"
          fullWidth
        />
        <Text style={styles.ctaNote}>
          ⏱️ Quick setup • Takes about 2 minutes
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adhdPalette.grayNurse,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
  },
  particleEmoji: {
    fontSize: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: SCREEN_HEIGHT * 0.07,
    paddingHorizontal: 24,
  },
  logoGlow: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.03,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 80,
  },
  logoContainer: {
    marginBottom: 16,
    ...shadows.lg,
  },
  logoGradient: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 44,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.gray[900],
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    gap: 14,
  },
  featureIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: colors.gray[500],
    lineHeight: 18,
  },
  ctaSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 36,
    backgroundColor: `${adhdPalette.grayNurse}F0`,
  },
  ctaNote: {
    fontSize: 13,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 12,
  },
});
