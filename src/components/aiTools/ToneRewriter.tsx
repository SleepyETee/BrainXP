import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { ToneStyle, RewriteResult, RewriteToneInput } from '../../types/aiTools';
import { colors, shadows } from '../../theme/colors';
import { rewriteTone } from '../../services/api/aiTools';
import { useMLStore } from '../../stores/mlStore';

interface ToneRewriterProps {
  initialText?: string;
  onRewriteComplete?: (result: RewriteResult) => void;
  onClose?: () => void;
}

const TONE_OPTIONS: { tone: ToneStyle; label: string; emoji: string; description: string }[] = [
  { tone: 'formal', label: 'Formal', emoji: '👔', description: 'Professional and polished' },
  { tone: 'casual', label: 'Casual', emoji: '👋', description: 'Relaxed and conversational' },
  { tone: 'friendly', label: 'Friendly', emoji: '😊', description: 'Warm and approachable' },
  { tone: 'professional', label: 'Professional', emoji: '💼', description: 'Clear and business-like' },
  { tone: 'gentle', label: 'Gentle', emoji: '🌸', description: 'Soft and considerate' },
  { tone: 'direct', label: 'Direct', emoji: '🎯', description: 'Straightforward and clear' },
  { tone: 'enthusiastic', label: 'Enthusiastic', emoji: '🎉', description: 'Energetic and excited' },
  { tone: 'empathetic', label: 'Empathetic', emoji: '💙', description: 'Understanding and supportive' },
  { tone: 'assertive', label: 'Assertive', emoji: '💪', description: 'Confident and firm' },
  { tone: 'simplified', label: 'Simplified', emoji: '📖', description: 'Easy to understand' },
];

export const ToneRewriter: React.FC<ToneRewriterProps> = ({
  initialText = '',
  onRewriteComplete,
  onClose,
}) => {
  const [text, setText] = useState(initialText);
  const [selectedTone, setSelectedTone] = useState<ToneStyle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [toolUsageId, setToolUsageId] = useState<string | null>(null);
  const [suggestedTones, setSuggestedTones] = useState<ToneStyle[]>([]);

  const { submitFeedback, patterns, fetchPatterns, learningStats, fetchLearningStats } = useMLStore();

  useEffect(() => {
    fetchPatterns().catch(() => {});
    fetchLearningStats().catch(() => {});
  }, []);

  useEffect(() => {
    if (text.length > 20) {
      const suggestions: ToneStyle[] = [];
      const lowerText = text.toLowerCase();

      if (lowerText.includes('dear') || lowerText.includes('sincerely') || lowerText.includes('regarding')) {
        suggestions.push('casual', 'friendly');
      }
      if (lowerText.includes('hey') || lowerText.includes('gonna') || lowerText.includes('wanna')) {
        suggestions.push('formal', 'professional');
      }
      if (text.split(' ').some(word => word.length > 12)) {
        suggestions.push('simplified');
      }
      if (lowerText.includes('sorry') || lowerText.includes('apologize') || lowerText.includes('unfortunately')) {
        suggestions.push('assertive', 'direct');
      }

      setSuggestedTones(suggestions.slice(0, 3));
    } else {
      setSuggestedTones([]);
    }
  }, [text]);

  const handleRewrite = async () => {
    if (!text.trim()) {
      setError('Please enter some text to rewrite');
      return;
    }
    if (!selectedTone) {
      setError('Please select a tone');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const input: RewriteToneInput = {
        text: text.trim(),
        targetTone: selectedTone,
      };

      const usageId = `tone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToolUsageId(usageId);

      const rewriteResult = await rewriteTone(input);
      setResult(rewriteResult);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onRewriteComplete?.(rewriteResult);
    } catch (err) {
      setError('Failed to rewrite. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (wasHelpful: boolean) => {
    if (!toolUsageId || feedbackGiven) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeedbackGiven(true);

    await submitFeedback(
      toolUsageId,
      wasHelpful,
      undefined,
      { 
        originalLength: result?.original?.length,
        rewrittenLength: result?.rewritten?.length,
        tone: result?.tone,
        wasCopied: copied,
      }
    );
  };

  const handleCopy = async () => {
    if (result?.rewritten) {
      await Clipboard.setStringAsync(result.rewritten);
      setCopied(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setResult(null);
    setText('');
    setSelectedTone(null);
    setFeedbackGiven(false);
    setToolUsageId(null);
  };

  const renderMLBadge = () => {
    if (!learningStats || learningStats.personalizationLevel === 'low') return null;

    return (
      <Animated.View entering={FadeIn} style={styles.mlBadge}>
        <Text style={styles.mlBadgeIcon}>🧠</Text>
        <Text style={styles.mlBadgeText}>
          {learningStats.personalizationLevel === 'expert' 
            ? 'Expert personalization active'
            : learningStats.personalizationLevel === 'high'
            ? 'Highly personalized'
            : 'Learning your preferences'}
        </Text>
      </Animated.View>
    );
  };

  const renderSuggestedTones = () => {
    if (suggestedTones.length === 0) return null;

    return (
      <Animated.View entering={FadeInDown.delay(50)} style={styles.suggestedBanner}>
        <Text style={styles.suggestedIcon}>💡</Text>
        <Text style={styles.suggestedText}>
          Suggested: {suggestedTones.map(t => 
            TONE_OPTIONS.find(o => o.tone === t)?.label
          ).join(', ')}
        </Text>
      </Animated.View>
    );
  };

  const renderFeedbackSection = () => {
    if (!result) return null;

    if (feedbackGiven) {
      return (
        <Animated.View entering={FadeIn} style={styles.feedbackThanks}>
          <Text style={styles.feedbackThanksEmoji}>🙏</Text>
          <Text style={styles.feedbackThanksText}>
            Thanks! Your feedback helps improve tone suggestions.
          </Text>
        </Animated.View>
      );
    }

    return (
      <Animated.View entering={FadeInDown.delay(400)} style={styles.feedbackCard}>
        <Text style={styles.feedbackTitle}>Was this rewrite helpful?</Text>
        <View style={styles.feedbackButtons}>
          <TouchableOpacity
            style={[styles.feedbackButton, styles.feedbackButtonPositive]}
            onPress={() => handleFeedback(true)}
          >
            <Text style={styles.feedbackButtonEmoji}>👍</Text>
            <Text style={styles.feedbackButtonText}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.feedbackButton, styles.feedbackButtonNegative]}
            onPress={() => handleFeedback(false)}
          >
            <Text style={styles.feedbackButtonEmoji}>👎</Text>
            <Text style={styles.feedbackButtonText}>No</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.feedbackHint}>
          Your feedback improves future suggestions
        </Text>
      </Animated.View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeIn} style={styles.header}>
        <Text style={styles.title}>✍️ Tone Rewriter</Text>
        <Text style={styles.subtitle}>
          Transform your text to match any tone
        </Text>
        {renderMLBadge()}
      </Animated.View>

      {!result ? (
        <>
          {renderSuggestedTones()}

          <Animated.View entering={FadeInDown.delay(100)} style={styles.inputGroup}>
            <Text style={styles.label}>Your Text</Text>
            <TextInput
              style={[styles.input, styles.inputLarge]}
              placeholder="Paste or type the text you want to rewrite..."
              placeholderTextColor={colors.gray[400]}
              value={text}
              onChangeText={setText}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{text.length} characters</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.inputGroup}>
            <Text style={styles.label}>Select Target Tone</Text>
            <View style={styles.toneGrid}>
              {TONE_OPTIONS.map((option, index) => (
                <TouchableOpacity
                  key={option.tone}
                  style={[
                    styles.toneOption,
                    selectedTone === option.tone && styles.toneOptionSelected,
                    suggestedTones.includes(option.tone) && styles.toneOptionSuggested,
                  ]}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTone(option.tone);
                  }}
                >
                  <Text style={styles.toneEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.toneLabel,
                      selectedTone === option.tone && styles.toneLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {suggestedTones.includes(option.tone) && (
                    <View style={styles.suggestedDot} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {selectedTone && (
              <Text style={styles.toneDescription}>
                {TONE_OPTIONS.find((t) => t.tone === selectedTone)?.description}
              </Text>
            )}
          </Animated.View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Animated.View entering={FadeInDown.delay(300)}>
            <TouchableOpacity
              style={[styles.rewriteButton, isLoading && styles.rewriteButtonDisabled]}
              onPress={handleRewrite}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.rewriteButtonEmoji}>✨</Text>
                  <Text style={styles.rewriteButtonText}>Rewrite Text</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </>
      ) : (
        <Animated.View entering={FadeIn}>
          <View style={styles.resultSection}>
            <Text style={styles.resultLabel}>📝 Original</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>{result.original}</Text>
            </View>
          </View>

          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultLabel}>
                ✨ {TONE_OPTIONS.find((t) => t.tone === result.tone)?.emoji}{' '}
                {TONE_OPTIONS.find((t) => t.tone === result.tone)?.label}
              </Text>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                <Text style={styles.copyButtonText}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.resultBox, styles.resultBoxHighlighted]}>
              <Text style={styles.resultTextHighlighted}>{result.rewritten}</Text>
            </View>
          </View>

          {result.changes && result.changes.length > 0 && (
            <View style={styles.changesSection}>
              <Text style={styles.changesTitle}>🔄 Key Changes Made</Text>
              {result.changes.map((change, index) => {
                if (typeof change === 'string') {
                  return (
                    <View key={index} style={styles.change}>
                      <Text style={styles.changeReason}>💡 {change}</Text>
                    </View>
                  );
                }
                return (
                  <View key={index} style={styles.change}>
                    {change.original && (
                      <View style={styles.changeRow}>
                        <Text style={styles.changeLabel}>Before:</Text>
                        <Text style={styles.changeOriginal}>{change.original}</Text>
                      </View>
                    )}
                    {change.changed && (
                      <View style={styles.changeRow}>
                        <Text style={styles.changeLabel}>After:</Text>
                        <Text style={styles.changeNew}>{change.changed}</Text>
                      </View>
                    )}
                    {change.reason && (
                      <Text style={styles.changeReason}>💡 {change.reason}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {result.readabilityScore && (
            <View style={styles.readabilityCard}>
              <Text style={styles.readabilityLabel}>📊 Readability Score</Text>
              <Text style={styles.readabilityScore}>{result.readabilityScore}/100</Text>
              <Text style={styles.readabilityHint}>
                {result.readabilityScore >= 70
                  ? 'Easy to read'
                  : result.readabilityScore >= 50
                  ? 'Moderately readable'
                  : 'May be complex'}
              </Text>
            </View>
          )}

          {renderFeedbackSection()}

          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.useButton} onPress={handleCopy}>
              <Text style={styles.useButtonText}>Use This Version</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retryButton} onPress={handleReset}>
              <Text style={styles.retryButtonText}>Try Different Tone</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray[500],
  },
  mlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  mlBadgeIcon: {
    fontSize: 12,
  },
  mlBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[700],
  },
  suggestedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  suggestedIcon: {
    fontSize: 16,
  },
  suggestedText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary[700],
  },
  toneOptionSuggested: {
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
  },
  suggestedDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },
  feedbackCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 12,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  feedbackButtonPositive: {
    backgroundColor: colors.success[100],
  },
  feedbackButtonNegative: {
    backgroundColor: colors.danger[100],
  },
  feedbackButtonEmoji: {
    fontSize: 16,
  },
  feedbackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  feedbackHint: {
    fontSize: 11,
    color: colors.gray[400],
  },
  feedbackThanks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  feedbackThanksEmoji: {
    fontSize: 18,
  },
  feedbackThanksText: {
    fontSize: 14,
    color: colors.success[700],
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
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
  },
  inputLarge: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: colors.gray[400],
    textAlign: 'right',
    marginTop: 4,
  },
  toneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toneOption: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[50],
  },
  toneOptionSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  toneEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  toneLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[600],
    textAlign: 'center',
  },
  toneLabelSelected: {
    color: colors.primary[700],
  },
  toneDescription: {
    fontSize: 13,
    color: colors.primary[600],
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    color: colors.danger[500],
    marginBottom: 16,
    textAlign: 'center',
  },
  rewriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    ...shadows.md,
  },
  rewriteButtonDisabled: {
    opacity: 0.7,
  },
  rewriteButtonEmoji: {
    fontSize: 18,
  },
  rewriteButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultSection: {
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[600],
    marginBottom: 8,
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[600],
  },
  resultBox: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  resultBoxHighlighted: {
    backgroundColor: colors.success[50],
    borderColor: colors.success[200],
  },
  resultText: {
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 22,
  },
  resultTextHighlighted: {
    fontSize: 15,
    color: colors.success[800],
    lineHeight: 22,
  },
  changesSection: {
    backgroundColor: colors.primary[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  changesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary[700],
    marginBottom: 12,
  },
  change: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[100],
  },
  changeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  changeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
    width: 50,
  },
  changeOriginal: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[600],
    textDecorationLine: 'line-through',
  },
  changeNew: {
    flex: 1,
    fontSize: 13,
    color: colors.success[700],
    fontWeight: '500',
  },
  changeReason: {
    fontSize: 12,
    color: colors.primary[600],
    fontStyle: 'italic',
    marginTop: 4,
  },
  readabilityCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  readabilityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: 4,
  },
  readabilityScore: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary[600],
  },
  readabilityHint: {
    fontSize: 13,
    color: colors.gray[500],
  },
  resultActions: {
    gap: 12,
  },
  useButton: {
    backgroundColor: colors.success[500],
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...shadows.sm,
  },
  useButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  retryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[600],
  },
});

export default ToneRewriter;

