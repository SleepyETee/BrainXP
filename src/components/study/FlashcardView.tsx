import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Flashcard, ReviewQuality, REVIEW_QUALITY } from '../../types/study';
import { colors, gradients, shadows } from '../../theme/colors';
import { springConfigs } from '../../utils/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FlashcardViewProps {
  card: Flashcard;
  onReview: (quality: ReviewQuality) => void;
  onSkip?: () => void;
  showHint?: boolean;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  card,
  onReview,
  onSkip,
  showHint = true,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showingHint, setShowingHint] = useState(false);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const handleFlip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    rotation.value = withSpring(isFlipped ? 0 : 180, springConfigs.snappy);
    setIsFlipped(!isFlipped);
    setShowingHint(false);
  };

  const handleShowHint = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowingHint(true);
  };

  const handleReview = async (quality: ReviewQuality) => {
    await Haptics.notificationAsync(
      quality >= 3
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );
    
    // Animate card out
    scale.value = withTiming(0.8, { duration: 200 }, () => {
      runOnJS(onReview)(quality);
      scale.value = withSpring(1, springConfigs.gentle);
      rotation.value = 0;
    });
    
    setIsFlipped(false);
    setShowingHint(false);
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      rotation.value,
      [0, 180],
      [0, 180],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { scale: scale.value },
      ],
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      rotation.value,
      [0, 180],
      [180, 360],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { scale: scale.value },
      ],
      backfaceVisibility: 'hidden',
    };
  });

  return (
    <View style={styles.container}>
      {/* Card Container */}
      <View style={styles.cardContainer}>
        {/* Front of Card */}
        <Animated.View style={[styles.card, frontAnimatedStyle]}>
          <TouchableOpacity
            style={styles.cardTouchable}
            onPress={handleFlip}
            activeOpacity={1}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.cardGradient}
            >
              <View style={styles.cardLabel}>
                <Text style={styles.cardLabelText}>QUESTION</Text>
              </View>
              
              <Text style={styles.cardText}>{card.front}</Text>
              
              {card.imageUrlFront && (
                <View style={styles.imageContainer}>
                  {/* Image would go here */}
                </View>
              )}
              
              {showHint && card.hint && !showingHint && (
                <TouchableOpacity
                  style={styles.hintButton}
                  onPress={handleShowHint}
                >
                  <Text style={styles.hintButtonText}>💡 Show Hint</Text>
                </TouchableOpacity>
              )}
              
              {showingHint && card.hint && (
                <View style={styles.hintContainer}>
                  <Text style={styles.hintLabel}>Hint:</Text>
                  <Text style={styles.hintText}>{card.hint}</Text>
                </View>
              )}
              
              <Text style={styles.tapHint}>Tap to flip</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Back of Card */}
        <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
          <TouchableOpacity
            style={styles.cardTouchable}
            onPress={handleFlip}
            activeOpacity={1}
          >
            <LinearGradient
              colors={[gradients.focus[0], gradients.focus[1]]}
              style={styles.cardGradient}
            >
              <View style={styles.cardLabel}>
                <Text style={[styles.cardLabelText, styles.cardLabelTextWhite]}>
                  ANSWER
                </Text>
              </View>
              
              <Text style={[styles.cardText, styles.cardTextWhite]}>
                {card.back}
              </Text>
              
              {card.explanation && (
                <View style={styles.explanationContainer}>
                  <Text style={styles.explanationLabel}>Explanation:</Text>
                  <Text style={styles.explanationText}>{card.explanation}</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Rating Buttons - Only show when flipped */}
      {isFlipped && (
        <Animated.View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>How well did you know this?</Text>
          
          <View style={styles.ratingButtons}>
            <TouchableOpacity
              style={[styles.ratingButton, styles.ratingAgain]}
              onPress={() => handleReview(REVIEW_QUALITY.COMPLETE_BLACKOUT)}
            >
              <Text style={styles.ratingEmoji}>😵</Text>
              <Text style={styles.ratingLabel}>Again</Text>
              <Text style={styles.ratingSubtext}>{"<1m"}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.ratingButton, styles.ratingHard]}
              onPress={() => handleReview(REVIEW_QUALITY.CORRECT_DIFFICULT)}
            >
              <Text style={styles.ratingEmoji}>😓</Text>
              <Text style={styles.ratingLabel}>Hard</Text>
              <Text style={styles.ratingSubtext}>{"<10m"}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.ratingButton, styles.ratingGood]}
              onPress={() => handleReview(REVIEW_QUALITY.CORRECT_HESITATION)}
            >
              <Text style={styles.ratingEmoji}>🙂</Text>
              <Text style={styles.ratingLabel}>Good</Text>
              <Text style={styles.ratingSubtext}>
                {card.interval > 0 ? `${card.interval}d` : '1d'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.ratingButton, styles.ratingEasy]}
              onPress={() => handleReview(REVIEW_QUALITY.PERFECT)}
            >
              <Text style={styles.ratingEmoji}>😄</Text>
              <Text style={styles.ratingLabel}>Easy</Text>
              <Text style={styles.ratingSubtext}>
                {card.interval > 0 ? `${Math.round(card.interval * 1.5)}d` : '4d'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Skip Button */}
      {onSkip && !isFlipped && (
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipText}>Skip →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  cardContainer: {
    width: SCREEN_WIDTH - 40,
    height: 400,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    ...shadows.xl,
  },
  cardBack: {
    position: 'absolute',
  },
  cardTouchable: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray[500],
    letterSpacing: 1,
  },
  cardLabelTextWhite: {
    color: 'rgba(255,255,255,0.8)',
  },
  cardText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.gray[800],
    textAlign: 'center',
    lineHeight: 32,
  },
  cardTextWhite: {
    color: '#FFFFFF',
  },
  imageContainer: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    marginTop: 16,
  },
  hintButton: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.warning[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  hintButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning[700],
  },
  hintContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: colors.warning[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning[200],
    alignSelf: 'stretch',
  },
  hintLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning[600],
    marginBottom: 4,
  },
  hintText: {
    fontSize: 14,
    color: colors.warning[800],
    fontStyle: 'italic',
  },
  tapHint: {
    position: 'absolute',
    bottom: 20,
    fontSize: 13,
    color: colors.gray[400],
  },
  explanationContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  explanationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  ratingContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: 16,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  ratingButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    minWidth: 70,
    ...shadows.sm,
  },
  ratingAgain: {
    backgroundColor: colors.danger[50],
    borderWidth: 1,
    borderColor: colors.danger[200],
  },
  ratingHard: {
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  ratingGood: {
    backgroundColor: colors.success[50],
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  ratingEasy: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  ratingEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[700],
  },
  ratingSubtext: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 2,
  },
  skipButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[500],
  },
});

export default FlashcardView;
