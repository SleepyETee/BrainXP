import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../src/theme/colors';

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = '@brainxp_onboarding_complete';

interface OnboardingSlide {
  id: string;
  emoji: string;
  title: string;
  description: string;
  gradient: string[];
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    emoji: '🧠',
    title: 'Welcome to BrainXP',
    description: 'Your ADHD-friendly companion for better focus, productivity, and self-care.',
    gradient: ['#6366F1', '#8B5CF6'],
  },
  {
    id: '2',
    emoji: '✅',
    title: 'Smart Task Management',
    description: 'Break tasks into tiny steps, estimate energy costs with spoon theory, and never feel overwhelmed.',
    gradient: ['#10B981', '#059669'],
  },
  {
    id: '3',
    emoji: '⏱️',
    title: 'Focus Timer',
    description: 'Pomodoro-style sessions with ambient sounds to help you concentrate and take healthy breaks.',
    gradient: ['#F59E0B', '#D97706'],
  },
  {
    id: '4',
    emoji: '🎮',
    title: 'Gamified Progress',
    description: 'Earn XP, unlock badges, and level up as you complete tasks and build habits. Make productivity fun!',
    gradient: ['#EC4899', '#DB2777'],
  },
  {
    id: '5',
    emoji: '🤖',
    title: 'AI-Powered Tools',
    description: 'Magic task breakdown, tone rewriter, note compiler, and more AI tools to support your journey.',
    gradient: ['#6366F1', '#4F46E5'],
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(auth)/login');
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(auth)/login');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <LinearGradient
        colors={item.gradient as [string, string]}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
      </LinearGradient>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {SLIDES.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={index}
            style={[styles.dot, { width: dotWidth, opacity }]}
          />
        );
      })}
    </View>
  );

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {!isLastSlide && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      {renderDots()}

      <View style={styles.footer}>
        {isLastSlide ? (
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
          >
            <LinearGradient
              colors={[colors.primary[500], colors.primary[600]]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 50,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: colors.gray[500],
    fontWeight: '500',
  },
  slide: {
    width,
    alignItems: 'center',
  },
  gradientBg: {
    width: width * 0.85,
    height: height * 0.4,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
  },
  contentContainer: {
    paddingHorizontal: 40,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
    marginHorizontal: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 30,
  },
  nextButton: {
    backgroundColor: colors.gray[100],
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[700],
  },
  getStartedButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
