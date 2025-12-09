// AI Flashcard Generator Screen
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
import { useStudyStore } from '../../src/stores/studyStore';
import { colors, gradients, shadows } from '../../src/theme/colors';

interface GeneratedCard {
  front: string;
  back: string;
}

export default function AIGenerateScreen() {
  const router = useRouter();
  const createStudySet = useStudyStore((state) => state.createStudySet);
  
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [cardCount, setCardCount] = useState<10 | 15 | 20 | 30>(15);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  const CARD_COUNT_OPTIONS = [10, 15, 20, 30] as const;

  const handleGenerate = async () => {
    if (!content.trim()) {
      setError('Please paste some content to generate flashcards from');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate AI generation (replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 2500));
      
      // Generate mock cards based on content length
      const cards: GeneratedCard[] = [];
      const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10);
      
      for (let i = 0; i < Math.min(cardCount, Math.max(sentences.length, 5)); i++) {
        const sentence = sentences[i % sentences.length]?.trim() || `Key concept ${i + 1}`;
        cards.push({
          front: `What is important about: "${sentence.slice(0, 50)}..."?`,
          back: `This relates to the main concept of ${sentence.slice(0, 100)}...`,
        });
      }
      
      // Fill remaining cards if needed
      while (cards.length < cardCount) {
        cards.push({
          front: `Additional concept #${cards.length + 1}`,
          back: `Explanation of concept #${cards.length + 1}`,
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

  const handleSaveStudySet = async () => {
    const setTitle = title.trim() || 'AI Generated Set';
    
    try {
      const studySet = await createStudySet({
        title: setTitle,
        description: `${generatedCards.length} cards generated from your content`,
        icon: '🤖',
        color: colors.primary[500],
      });
      
      // In a real implementation, you'd add the flashcards to the study set here
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(`/study/${studySet.id}`);
    } catch (err) {
      setError('Failed to create study set');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#667EEA', '#764BA2']}
        style={styles.headerGradient}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerEmoji}>🤖</Text>
        <Text style={styles.headerTitle}>AI Generate</Text>
        <Text style={styles.headerSubtitle}>
          Create flashcards from any content instantly
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {generatedCards.length === 0 ? (
          <>
            {/* Set Title */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.inputSection}>
              <Text style={styles.label}>Study Set Title (optional)</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="e.g., History Chapter 5"
                placeholderTextColor={colors.gray[400]}
                value={title}
                onChangeText={setTitle}
              />
            </Animated.View>

            {/* Content Input */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.inputSection}>
              <Text style={styles.label}>Paste your content</Text>
              <Text style={styles.labelHint}>
                Textbook sections, notes, articles, or any study material
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
            <Animated.View entering={FadeInDown.delay(300)} style={styles.inputSection}>
              <Text style={styles.label}>Number of cards</Text>
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

            <Animated.View entering={FadeInDown.delay(400)}>
              <TouchableOpacity
                style={[styles.generateButton, isLoading && styles.buttonDisabled]}
                onPress={handleGenerate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" />
                    <Text style={styles.buttonText}>Generating...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.buttonEmoji}>✨</Text>
                    <Text style={styles.buttonText}>Generate Flashcards</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Tips */}
            <Animated.View entering={FadeInDown.delay(500)} style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>💡 For best results</Text>
              <Text style={styles.tipItem}>• Use well-structured, clear content</Text>
              <Text style={styles.tipItem}>• Include key terms and definitions</Text>
              <Text style={styles.tipItem}>• More content = better cards</Text>
              <Text style={styles.tipItem}>• Review and edit cards after generation</Text>
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

            {/* Preview Cards */}
            <Text style={styles.previewTitle}>Preview</Text>
            {generatedCards.slice(0, 5).map((card, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(index * 80)}
                style={styles.cardPreview}
              >
                <View style={styles.cardSide}>
                  <Text style={styles.cardSideLabel}>Q</Text>
                  <Text style={styles.cardText} numberOfLines={2}>
                    {card.front}
                  </Text>
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.cardSide}>
                  <Text style={styles.cardSideLabel}>A</Text>
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
                onPress={handleSaveStudySet}
              >
                <Text style={styles.saveButtonText}>Create Study Set</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={() => setGeneratedCards([])}
              >
                <Text style={styles.regenerateButtonText}>Regenerate</Text>
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
  titleInput: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray[800],
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
    minHeight: 180,
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
    borderColor: '#764BA2',
    backgroundColor: '#764BA215',
  },
  countText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[600],
  },
  countTextSelected: {
    color: '#764BA2',
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
    backgroundColor: '#764BA2',
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
    backgroundColor: '#764BA215',
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#764BA230',
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#764BA2',
    marginBottom: 10,
  },
  tipItem: {
    fontSize: 14,
    color: '#5a3d7a',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  cardSideLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#764BA2',
    backgroundColor: '#764BA215',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 10,
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
    backgroundColor: '#764BA2',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...shadows.md,
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
    color: '#764BA2',
  },
});
