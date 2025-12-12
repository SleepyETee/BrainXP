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
import { CompileFormat, CompileResult, CompileInput } from '../../types/aiTools';
import { colors, shadows } from '../../theme/colors';
import { compileNotes } from '../../services/api/aiTools';
import { useMLStore } from '../../stores/mlStore';

interface NoteCompilerProps {
  onCompileComplete?: (result: CompileResult) => void;
  onClose?: () => void;
}

const FORMAT_OPTIONS: { format: CompileFormat; label: string; emoji: string; description: string }[] = [
  { format: 'outline', label: 'Outline', emoji: '📋', description: 'Hierarchical structure' },
  { format: 'summary', label: 'Summary', emoji: '📝', description: 'Concise overview' },
  { format: 'bullets', label: 'Bullets', emoji: '•', description: 'Organized bullet points' },
  { format: 'study_guide', label: 'Study Guide', emoji: '📚', description: 'Learning-focused' },
  { format: 'action_items', label: 'Action Items', emoji: '✅', description: 'Tasks & to-dos' },
  { format: 'essay', label: 'Essay', emoji: '📄', description: 'Flowing prose' },
  { format: 'meeting_notes', label: 'Meeting Notes', emoji: '📊', description: 'Structured meeting' },
  { format: 'blog_post', label: 'Blog Post', emoji: '✍️', description: 'Engaging article' },
];

export const NoteCompiler: React.FC<NoteCompilerProps> = ({
  onCompileComplete,
  onClose,
}) => {
  const [notes, setNotes] = useState<string[]>(['', '']);
  const [selectedFormat, setSelectedFormat] = useState<CompileFormat>('outline');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CompileResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ML Integration State
  const [toolUsageId, setToolUsageId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [mlRecommendation, setMlRecommendation] = useState<{
    suggestedFormat: CompileFormat;
    reason: string;
    confidence: number;
  } | null>(null);
  const [formatUsageHistory, setFormatUsageHistory] = useState<Map<CompileFormat, number>>(new Map());

  const { patterns, fetchPatterns, submitFeedback, getRecommendations } = useMLStore();

  // Fetch patterns and determine recommended format
  useEffect(() => {
    const initML = async () => {
      try {
        const userPatterns = await fetchPatterns();
        
        // Determine recommended format based on user patterns
        if (userPatterns) {
          let suggested: CompileFormat = 'outline';
          let reason = '';
          let confidence = 0.5;

          // Check productivity patterns
          if (userPatterns.productivity) {
            const { preferredTaskTypes, averageSessionDuration } = userPatterns.productivity;
            
            // Task-focused users prefer action items
            if (preferredTaskTypes?.includes('quick') || preferredTaskTypes?.includes('todo')) {
              suggested = 'action_items';
              reason = 'You tend to focus on actionable tasks';
              confidence = 0.75;
            }
            
            // Users with longer sessions might prefer detailed formats
            if (averageSessionDuration && averageSessionDuration > 30) {
              suggested = 'study_guide';
              reason = 'Your longer work sessions benefit from structured guides';
              confidence = 0.7;
            }
          }

          // Check learning patterns
          if (userPatterns.learning) {
            const { preferredStudyMethod, retentionStrength } = userPatterns.learning;
            
            if (preferredStudyMethod === 'reading' || preferredStudyMethod === 'notes') {
              suggested = 'summary';
              reason = 'Summaries align with your reading-focused learning style';
              confidence = 0.8;
            }
            
            if (retentionStrength === 'visual') {
              suggested = 'outline';
              reason = 'Visual hierarchies help your retention';
              confidence = 0.75;
            }
          }

          // Check ADHD patterns for quick processing
          if (userPatterns.adhd) {
            const { taskCompletionRate, averageTaskDuration } = userPatterns.adhd;
            
            if (taskCompletionRate && taskCompletionRate < 0.6) {
              suggested = 'bullets';
              reason = 'Bullet points are easier to scan and process';
              confidence = 0.8;
            }
            
            if (averageTaskDuration && averageTaskDuration < 15) {
              suggested = 'action_items';
              reason = 'Quick action items match your task style';
              confidence = 0.75;
            }
          }

          // Get ML recommendations if available
          try {
            const recommendations = await getRecommendations('note_compiler');
            if (recommendations?.preferredFormat) {
              suggested = recommendations.preferredFormat as CompileFormat;
              reason = recommendations.reason || 'Based on your usage patterns';
              confidence = recommendations.confidence || 0.7;
            }
            
            // Track format usage history
            if (recommendations?.formatHistory) {
              setFormatUsageHistory(new Map(Object.entries(recommendations.formatHistory) as [CompileFormat, number][]));
            }
          } catch {
            // Use pattern-based recommendation
          }

          if (confidence > 0.6) {
            setMlRecommendation({ suggestedFormat: suggested, reason, confidence });
          }
        }
      } catch (error) {
        console.log('ML init failed, using defaults');
      }
    };

    initML();
  }, [fetchPatterns, getRecommendations]);

  const handleCompile = async () => {
    const filledNotes = notes.filter((n) => n.trim());
    if (filledNotes.length < 2) {
      setError('Please add at least 2 notes to compile');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Generate usage ID for ML tracking
    const usageId = `compile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setToolUsageId(usageId);

    try {
      const input: CompileInput = {
        texts: filledNotes,
        format: selectedFormat,
        title: title.trim() || undefined,
        instructions: instructions.trim() || undefined,
      };

      const compileResult = await compileNotes(input);
      setResult(compileResult);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Track usage for ML (fire and forget)
      try {
        await submitFeedback({
          toolUsageId: usageId,
          toolType: 'note_compiler',
          action: 'compile',
          metadata: {
            format: selectedFormat,
            noteCount: filledNotes.length,
            totalCharacters: filledNotes.reduce((sum, n) => sum + n.length, 0),
            hasTitle: !!title.trim(),
            hasInstructions: !!instructions.trim(),
            resultWordCount: compileResult.wordCount,
            keyTopicsCount: compileResult.keyTopics.length,
            actionItemsCount: compileResult.actionItems?.length || 0,
            usedRecommendation: mlRecommendation?.suggestedFormat === selectedFormat,
          },
        });
      } catch {
        // Don't fail on ML tracking errors
      }
      
      onCompileComplete?.(compileResult);
    } catch (err) {
      setError('Failed to compile. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  // ML Feedback handlers
  const handlePositiveFeedback = async () => {
    if (!toolUsageId || feedbackGiven) return;
    
    setFeedbackGiven(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await submitFeedback({
        toolUsageId,
        toolType: 'note_compiler',
        rating: 5,
        wasHelpful: true,
        metadata: {
          format: selectedFormat,
          feedbackType: 'positive',
        },
      });
    } catch {
      // Silent fail
    }
  };

  const handleNegativeFeedback = async () => {
    if (!toolUsageId || feedbackGiven) return;
    
    setFeedbackGiven(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await submitFeedback({
        toolUsageId,
        toolType: 'note_compiler',
        rating: 2,
        wasHelpful: false,
        metadata: {
          format: selectedFormat,
          feedbackType: 'negative',
        },
      });
    } catch {
      // Silent fail
    }
  };

  const applyRecommendation = async () => {
    if (mlRecommendation) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedFormat(mlRecommendation.suggestedFormat);
    }
  };

  const addNote = () => {
    if (notes.length < 10) {
      setNotes([...notes, '']);
    }
  };

  const removeNote = (index: number) => {
    if (notes.length > 2) {
      setNotes(notes.filter((_, i) => i !== index));
    }
  };

  const updateNote = (index: number, value: string) => {
    const newNotes = [...notes];
    newNotes[index] = value;
    setNotes(newNotes);
  };

  const handleCopy = async () => {
    if (result?.compiled) {
      await Clipboard.setStringAsync(result.compiled);
      setCopied(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setResult(null);
    setNotes(['', '']);
    setTitle('');
    setInstructions('');
    setToolUsageId(null);
    setFeedbackGiven(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Animated.View entering={FadeIn} style={styles.header}>
        <Text style={styles.title}>📝 Note Compiler</Text>
        <Text style={styles.subtitle}>
          Combine scattered notes into organized content
        </Text>
      </Animated.View>

      {!result ? (
        <>
          {/* ML Recommendation Banner */}
          {mlRecommendation && selectedFormat !== mlRecommendation.suggestedFormat && (
            <Animated.View entering={FadeInDown.delay(50)} style={styles.mlBanner}>
              <View style={styles.mlBannerContent}>
                <Text style={styles.mlBannerEmoji}>🧠</Text>
                <View style={styles.mlBannerText}>
                  <Text style={styles.mlBannerTitle}>
                    Try {FORMAT_OPTIONS.find(f => f.format === mlRecommendation.suggestedFormat)?.label}
                  </Text>
                  <Text style={styles.mlBannerReason}>{mlRecommendation.reason}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.mlBannerButton} onPress={applyRecommendation}>
                <Text style={styles.mlBannerButtonText}>Apply</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Notes Input */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Your Notes</Text>
              <Text style={styles.noteCount}>{notes.filter((n) => n.trim()).length} notes</Text>
            </View>
            
            {notes.map((note, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(100 + index * 50)}
                style={styles.noteContainer}
              >
                <View style={styles.noteHeader}>
                  <Text style={styles.noteLabel}>Note {index + 1}</Text>
                  {notes.length > 2 && (
                    <TouchableOpacity
                      onPress={() => removeNote(index)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={styles.noteInput}
                  placeholder={`Paste or type note ${index + 1}...`}
                  placeholderTextColor={colors.gray[400]}
                  value={note}
                  onChangeText={(value) => updateNote(index, value)}
                  multiline
                  textAlignVertical="top"
                />
              </Animated.View>
            ))}

            {notes.length < 10 && (
              <TouchableOpacity style={styles.addNoteButton} onPress={addNote}>
                <Text style={styles.addNoteButtonText}>+ Add Another Note</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Format Selection */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
            <Text style={styles.label}>Output Format</Text>
            <View style={styles.formatGrid}>
              {FORMAT_OPTIONS.map((option) => {
                const isRecommended = mlRecommendation?.suggestedFormat === option.format;
                const usageCount = formatUsageHistory.get(option.format) || 0;
                
                return (
                  <TouchableOpacity
                    key={option.format}
                    style={[
                      styles.formatOption,
                      selectedFormat === option.format && styles.formatOptionSelected,
                      isRecommended && styles.formatOptionRecommended,
                    ]}
                    onPress={async () => {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedFormat(option.format);
                    }}
                  >
                    {isRecommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedBadgeText}>🧠</Text>
                      </View>
                    )}
                    {usageCount > 2 && !isRecommended && (
                      <View style={styles.frequentBadge}>
                        <Text style={styles.frequentBadgeText}>★</Text>
                      </View>
                    )}
                    <Text style={styles.formatEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.formatLabel,
                        selectedFormat === option.format && styles.formatLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.formatDescription}>
              {FORMAT_OPTIONS.find((f) => f.format === selectedFormat)?.description}
            </Text>
          </Animated.View>

          {/* Optional Settings */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
            <Text style={styles.label}>Title (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Give your compiled document a title..."
              placeholderTextColor={colors.gray[400]}
              value={title}
              onChangeText={setTitle}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(450)} style={styles.section}>
            <Text style={styles.label}>Special Instructions (Optional)</Text>
            <TextInput
              style={[styles.input, styles.inputSmall]}
              placeholder="e.g., Focus on action items, Keep it brief..."
              placeholderTextColor={colors.gray[400]}
              value={instructions}
              onChangeText={setInstructions}
              multiline
            />
          </Animated.View>

          {/* Error */}
          {error && <Text style={styles.error}>{error}</Text>}

          {/* Compile Button */}
          <Animated.View entering={FadeInDown.delay(500)}>
            <TouchableOpacity
              style={[styles.compileButton, isLoading && styles.compileButtonDisabled]}
              onPress={handleCompile}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.compileButtonEmoji}>✨</Text>
                  <Text style={styles.compileButtonText}>Compile Notes</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </>
      ) : (
        /* Results */
        <Animated.View entering={FadeIn}>
          {/* Title & Copy */}
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>{result.title}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
              <Text style={styles.copyButtonText}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{result.wordCount}</Text>
              <Text style={styles.statLabel}>Words</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{result.keyTopics.length}</Text>
              <Text style={styles.statLabel}>Topics</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{result.actionItems?.length || 0}</Text>
              <Text style={styles.statLabel}>Actions</Text>
            </View>
          </View>

          {/* Compiled Content */}
          <View style={styles.compiledBox}>
            <Text style={styles.compiledText}>{result.compiled}</Text>
          </View>

          {/* Key Topics */}
          {result.keyTopics.length > 0 && (
            <View style={styles.topicsSection}>
              <Text style={styles.topicsTitle}>🏷️ Key Topics</Text>
              <View style={styles.topicsContainer}>
                {result.keyTopics.map((topic, index) => (
                  <View key={index} style={styles.topicTag}>
                    <Text style={styles.topicText}>{topic}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action Items */}
          {result.actionItems && result.actionItems.length > 0 && (
            <View style={styles.actionsSection}>
              <Text style={styles.actionsTitle}>✅ Action Items</Text>
              {result.actionItems.map((item, index) => (
                <View key={index} style={styles.actionItem}>
                  <Text style={styles.actionBullet}>□</Text>
                  <Text style={styles.actionText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Questions */}
          {result.questions && result.questions.length > 0 && (
            <View style={styles.questionsSection}>
              <Text style={styles.questionsTitle}>❓ Open Questions</Text>
              {result.questions.map((question, index) => (
                <View key={index} style={styles.questionItem}>
                  <Text style={styles.questionBullet}>?</Text>
                  <Text style={styles.questionText}>{question}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ML Feedback Section */}
          {!feedbackGiven && (
            <Animated.View entering={FadeInDown.delay(200)} style={styles.feedbackSection}>
              <Text style={styles.feedbackTitle}>Was this helpful?</Text>
              <View style={styles.feedbackButtons}>
                <TouchableOpacity
                  style={styles.feedbackButton}
                  onPress={handlePositiveFeedback}
                >
                  <Text style={styles.feedbackButtonEmoji}>👍</Text>
                  <Text style={styles.feedbackButtonText}>Yes!</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.feedbackButton}
                  onPress={handleNegativeFeedback}
                >
                  <Text style={styles.feedbackButtonEmoji}>👎</Text>
                  <Text style={styles.feedbackButtonText}>Not really</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {feedbackGiven && (
            <Animated.View entering={FadeIn} style={styles.feedbackThanks}>
              <Text style={styles.feedbackThanksText}>
                Thanks! This helps improve your recommendations 🧠
              </Text>
            </Animated.View>
          )}

          {/* Actions */}
          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.saveButton} onPress={handleCopy}>
              <Text style={styles.saveButtonText}>Save to Notes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retryButton} onPress={handleReset}>
              <Text style={styles.retryButtonText}>Compile Again</Text>
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
  
  // ML Recommendation Banner Styles
  mlBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  mlBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mlBannerEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  mlBannerText: {
    flex: 1,
  },
  mlBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
  },
  mlBannerReason: {
    fontSize: 12,
    color: colors.primary[600],
    marginTop: 2,
  },
  mlBannerButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mlBannerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Format option enhancements
  formatOptionRecommended: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[25],
  },
  recommendedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendedBadgeText: {
    fontSize: 10,
  },
  frequentBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.warning[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequentBadgeText: {
    fontSize: 10,
    color: colors.warning[600],
  },

  // Feedback section styles
  feedbackSection: {
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
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 6,
  },
  feedbackButtonEmoji: {
    fontSize: 18,
  },
  feedbackButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
  },
  feedbackThanks: {
    backgroundColor: colors.success[50],
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  feedbackThanksText: {
    fontSize: 14,
    color: colors.success[700],
    fontWeight: '500',
  },

  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  noteCount: {
    fontSize: 12,
    color: colors.gray[500],
  },
  noteContainer: {
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[500],
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    fontSize: 14,
    color: colors.gray[400],
  },
  noteInput: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.gray[800],
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addNoteButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
    backgroundColor: colors.primary[50],
  },
  addNoteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  formatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formatOption: {
    width: '23%',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray[200],
    backgroundColor: colors.gray[50],
    position: 'relative',
  },
  formatOptionSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  formatEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  formatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.gray[600],
    textAlign: 'center',
  },
  formatLabelSelected: {
    color: colors.primary[700],
  },
  formatDescription: {
    fontSize: 13,
    color: colors.primary[600],
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.gray[800],
  },
  inputSmall: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 14,
    color: colors.danger[500],
    marginBottom: 16,
    textAlign: 'center',
  },
  compileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    ...shadows.md,
  },
  compileButtonDisabled: {
    opacity: 0.7,
  },
  compileButtonEmoji: {
    fontSize: 18,
  },
  compileButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[800],
    flex: 1,
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
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary[600],
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray[500],
  },
  compiledBox: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  compiledText: {
    fontSize: 15,
    color: colors.gray[800],
    lineHeight: 24,
  },
  topicsSection: {
    marginBottom: 16,
  },
  topicsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[700],
    marginBottom: 8,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicTag: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  topicText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary[700],
  },
  actionsSection: {
    backgroundColor: colors.success[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success[700],
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  actionBullet: {
    fontSize: 14,
    color: colors.success[600],
    marginRight: 8,
    width: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: colors.success[800],
  },
  questionsSection: {
    backgroundColor: colors.warning[50],
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  questionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warning[700],
    marginBottom: 12,
  },
  questionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  questionBullet: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warning[600],
    marginRight: 8,
    width: 16,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    color: colors.warning[800],
  },
  resultActions: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: colors.success[500],
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

export default NoteCompiler;
