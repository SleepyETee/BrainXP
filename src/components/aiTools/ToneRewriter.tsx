import React, { useState } from 'react';
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
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Animated.View entering={FadeIn} style={styles.header}>
        <Text style={styles.title}>✍️ Tone Rewriter</Text>
        <Text style={styles.subtitle}>
          Transform your text to match any tone
        </Text>
      </Animated.View>

      {!result ? (
        <>
          {/* Text Input */}
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

          {/* Tone Selection */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.inputGroup}>
            <Text style={styles.label}>Select Target Tone</Text>
            <View style={styles.toneGrid}>
              {TONE_OPTIONS.map((option, index) => (
                <TouchableOpacity
                  key={option.tone}
                  style={[
                    styles.toneOption,
                    selectedTone === option.tone && styles.toneOptionSelected,
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
                </TouchableOpacity>
              ))}
            </View>
            {selectedTone && (
              <Text style={styles.toneDescription}>
                {TONE_OPTIONS.find((t) => t.tone === selectedTone)?.description}
              </Text>
            )}
          </Animated.View>

          {/* Error */}
          {error && <Text style={styles.error}>{error}</Text>}

          {/* Rewrite Button */}
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
        /* Results */
        <Animated.View entering={FadeIn}>
          {/* Original */}
          <View style={styles.resultSection}>
            <Text style={styles.resultLabel}>📝 Original</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>{result.original}</Text>
            </View>
          </View>

          {/* Rewritten */}
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

          {/* Changes */}
          {result.changes.length > 0 && (
            <View style={styles.changesSection}>
              <Text style={styles.changesTitle}>🔄 Key Changes Made</Text>
              {result.changes.map((change, index) => {
                // Handle both string and object types for changes
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

          {/* Readability Score */}
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

          {/* Actions */}
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
