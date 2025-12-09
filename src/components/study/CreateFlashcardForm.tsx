import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CreateFlashcardInput } from '../../types/study';
import { colors, shadows } from '../../theme/colors';
import { Button } from '../ui/Button';

interface CreateFlashcardFormProps {
  studySetId: string;
  onSubmit: (card: CreateFlashcardInput) => Promise<void>;
  onCancel: () => void;
  initialValues?: Partial<CreateFlashcardInput>;
}

export const CreateFlashcardForm: React.FC<CreateFlashcardFormProps> = ({
  studySetId,
  onSubmit,
  onCancel,
  initialValues,
}) => {
  const [front, setFront] = useState(initialValues?.front || '');
  const [back, setBack] = useState(initialValues?.back || '');
  const [hint, setHint] = useState(initialValues?.hint || '');
  const [explanation, setExplanation] = useState(initialValues?.explanation || '');
  const [tags, setTags] = useState<string[]>(initialValues?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});

  const validateForm = () => {
    const newErrors: { front?: string; back?: string } = {};
    
    if (!front.trim()) {
      newErrors.front = 'Front side is required';
    }
    if (!back.trim()) {
      newErrors.back = 'Back side is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        studySetId,
        front: front.trim(),
        back: back.trim(),
        hint: hint.trim() || undefined,
        explanation: explanation.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const swapSides = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tempFront = front;
    setFront(back);
    setBack(tempFront);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn}>
          <Text style={styles.title}>Create Flashcard</Text>
          <Text style={styles.subtitle}>
            Add a new card to your study set
          </Text>
        </Animated.View>

        {/* Front Side */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.inputGroup}>
          <Text style={styles.label}>Front Side (Question/Term) *</Text>
          <TextInput
            style={[styles.input, styles.inputLarge, errors.front && styles.inputError]}
            placeholder="What do you want to remember?"
            placeholderTextColor={colors.gray[400]}
            value={front}
            onChangeText={setFront}
            multiline
            textAlignVertical="top"
          />
          {errors.front && <Text style={styles.errorText}>{errors.front}</Text>}
        </Animated.View>

        {/* Swap Button */}
        <Animated.View entering={FadeInDown.delay(150)}>
          <TouchableOpacity style={styles.swapButton} onPress={swapSides}>
            <Text style={styles.swapButtonText}>↕️ Swap Sides</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Back Side */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.inputGroup}>
          <Text style={styles.label}>Back Side (Answer/Definition) *</Text>
          <TextInput
            style={[styles.input, styles.inputLarge, errors.back && styles.inputError]}
            placeholder="The answer or definition"
            placeholderTextColor={colors.gray[400]}
            value={back}
            onChangeText={setBack}
            multiline
            textAlignVertical="top"
          />
          {errors.back && <Text style={styles.errorText}>{errors.back}</Text>}
        </Animated.View>

        {/* Hint */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.inputGroup}>
          <Text style={styles.label}>Hint (Optional)</Text>
          <Text style={styles.labelHint}>A clue to help remember without giving the answer</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 'Think about...'"
            placeholderTextColor={colors.gray[400]}
            value={hint}
            onChangeText={setHint}
          />
        </Animated.View>

        {/* Explanation */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.inputGroup}>
          <Text style={styles.label}>Explanation (Optional)</Text>
          <Text style={styles.labelHint}>Additional context shown after revealing the answer</Text>
          <TextInput
            style={[styles.input, styles.inputMedium]}
            placeholder="Why is this the answer?"
            placeholderTextColor={colors.gray[400]}
            value={explanation}
            onChangeText={setExplanation}
            multiline
            textAlignVertical="top"
          />
        </Animated.View>

        {/* Tags */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.inputGroup}>
          <Text style={styles.label}>Tags (Optional)</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={[styles.input, styles.tagInput]}
              placeholder="Add a tag..."
              placeholderTextColor={colors.gray[400]}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
              <Text style={styles.addTagButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.tag}
                  onPress={() => removeTag(tag)}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                  <Text style={styles.tagRemove}>×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Preview */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewSide}>
              <Text style={styles.previewLabel}>Front</Text>
              <Text style={styles.previewText}>
                {front || 'Your question will appear here...'}
              </Text>
            </View>
            <View style={styles.previewDivider} />
            <View style={styles.previewSide}>
              <Text style={styles.previewLabel}>Back</Text>
              <Text style={styles.previewText}>
                {back || 'Your answer will appear here...'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(700)} style={styles.actions}>
          <Button
            title="Cancel"
            variant="ghost"
            onPress={onCancel}
            style={styles.cancelButton}
          />
          <Button
            title="Create Card"
            onPress={handleSubmit}
            loading={isSubmitting}
            style={styles.submitButton}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray[500],
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 6,
  },
  labelHint: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.gray[800],
  },
  inputLarge: {
    minHeight: 100,
  },
  inputMedium: {
    minHeight: 80,
  },
  inputError: {
    borderColor: colors.danger[400],
    backgroundColor: colors.danger[50],
  },
  errorText: {
    fontSize: 12,
    color: colors.danger[500],
    marginTop: 4,
  },
  swapButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginVertical: 8,
  },
  swapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary[700],
  },
  tagRemove: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.primary[400],
  },
  previewContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  previewSide: {
    paddingVertical: 8,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 22,
  },
  previewDivider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});

export default CreateFlashcardForm;
