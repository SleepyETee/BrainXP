// Flashcard Generator Tool Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, gradients, shadows } from '../../src/theme/colors';
import { useStudyStore } from '../../src/stores/studyStore';

interface GeneratedCard {
  front: string;
  back: string;
}

export default function FlashcardGeneratorScreen() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [cardCount, setCardCount] = useState<5 | 10 | 15 | 20>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const createStudySet = useStudyStore((state) => state.createStudySet);

  const CARD_COUNT_OPTIONS = [5, 10, 15, 20] as const;

  const handleGenerate = async () => {
    if (!content.trim()) {
      setError('Please enter some content to generate flashcards from');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate AI generation (replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Generate mock cards based on content
      const words = content.split(/\s+/).filter((w) => w.length > 4);
      const cards: GeneratedCard[] = [];
      
      for (let i = 0; i < Math.min(cardCount, words.length); i++) {
        cards.push({
          front: `What is the meaning of "${words[i % words.length]}"?`,
          back: `Definition and explanation of ${words[i % words.length]} in context.`,
        });
      }
      
      // If we don't have enough words, add generic cards
      while (cards.length < cardCount) {
        cards.push({
          front: `Key concept #${cards.length + 1} from the content`,
          back: `Explanation of key concept #${cards.length + 1}`,
        });
      }
      
      setGeneratedCards(cards);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError('Failed to generate flashcards. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToStudySet = async () => {
    try {
      // Create a new study set with the generated cards
      const studySet = await createStudySet({
        title: 'AI Generated Set',
        description: `${generatedCards.length} cards generated from your content`,
        icon: '🤖',
        color: colors.primary[500],
      });
      
      // Add cards to the study set
      // (In a real implementation, you'd add cards to the store)
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/study');
    } catch (err) {
      setError('Failed to save study set');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={[...gradients.focus]}
        style={styles.headerGradient}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerEmoji}>🎴</Text>
        <Text style={styles.headerTitle}>Flashcard Generator</Text>
        <Text style={styles.headerSubtitle}>
          Turn any content into study cards with AI
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {generatedCards.length === 0 ? (
          <>
            {/* Content Input */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.inputSection}>
              <Text style={styles.label}>Paste your content</Text>
              <Text style={styles.labelHint}>
                Notes, articles, textbook sections, or any text you want to learn
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Paste your study material here..."
                placeholderTextColor={colors.gray[400]}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />
            </Animated.View>

            {/* Card Count */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.inputSection}>
              <Text style={styles.label}>Number of cards to generate</Text>
              <View style={styles.countOptions}>
                {CARD_COUNT_OPTIONS.map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.countOption,
                      cardCount === count && styles.countOptionSelected,
                    ]}
                    onPress={() => setCardCount(count)}
                  >
                    <Text
                      style={[
                        styles.countText,
                        cardCount === count && styles.countTextSelected,
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {error && <Text style={styles.error}>{error}</Text>}

            <Animated.View entering={FadeInDown.delay(300)}>
              <TouchableOpacity
                style={[styles.generateButton, isLoading && styles.buttonDisabled]}
                onPress={handleGenerate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.buttonEmoji}>✨</Text>
                    <Text style={styles.buttonText}>Generate Flashcards</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Tips */}
            <Animated.View entering={FadeInDown.delay(400)} style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>💡 Tips for best results</Text>
              <Text style={styles.tipItem}>• Use clear, well-organized content</Text>
              <Text style={styles.tipItem}>• Include definitions and key concepts</Text>
              <Text style={styles.tipItem}>• Longer content = better cards</Text>
            </Animated.View>
          </>
        ) : (
          /* Generated Cards Preview */
          <Animated.View entering={FadeIn}>
            <View style={styles.successBanner}>
              <Text style={styles.successEmoji}>✅</Text>
              <Text style={styles.successText}>
                Generated {generatedCards.length} flashcards!
              </Text>
            </View>

            {/* Cards Preview */}
            <Text style={styles.previewTitle}>Preview Cards</Text>
            {generatedCards.slice(0, 5).map((card, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(index * 80)}
                style={styles.cardPreview}
              >
                <View style={styles.cardSide}>
                  <Text style={styles.cardSideLabel}>Front</Text>
                  <Text style={styles.cardText} numberOfLines={2}>
                    {card.front}
                  </Text>
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.cardSide}>
                  <Text style={styles.cardSideLabel}>Back</Text>
                  <Text style={styles.cardText} numberOfLines={2}>
                    {card.back}
                  </Text>
                </View>
              </Animated.View>
            ))}

            {generatedCards.length > 5 && (
              <Text style={styles.moreCards}>
                + {generatedCards.length - 5} more cards
              </Text>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveToStudySet}
              >
                <Text style={styles.saveButtonText}>Save to Study Sets</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={() => setGeneratedCards([])}
              >
                <Text style={styles.regenerateButtonText}>Generate New Cards</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 4,
  },
  labelHint: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray[800],
    minHeight: 160,
  },
  countOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  countOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[50],
  },
  countOptionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  countText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[600],
  },
  countTextSelected: {
    color: colors.primary[700],
  },
  error: {
    fontSize: 14,
    color: colors.danger[500],
    marginBottom: 16,
    textAlign: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonEmoji: {
    fontSize: 18,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tipsCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary[700],
    marginBottom: 10,
  },
  tipItem: {
    fontSize: 14,
    color: colors.primary[600],
    marginBottom: 4,
    lineHeight: 20,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success[50],
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  successEmoji: {
    fontSize: 24,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success[700],
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 12,
  },
  cardPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  cardSide: {
    paddingVertical: 8,
  },
  cardSideLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[400],
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 21,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 8,
  },
  moreCards: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    marginVertical: 12,
  },
  actions: {
    marginTop: 20,
    gap: 12,
  },
  saveButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...shadows.sm,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  regenerateButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  regenerateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[600],
  },
});
