// Create Study Set Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useStudyStore } from '../../src/stores/studyStore';
import { colors, shadows } from '../../src/theme/colors';

const ICON_OPTIONS = ['📚', '🧠', '📖', '🎯', '💡', '🔬', '📐', '🌍', '💻', '🎨'];
const COLOR_OPTIONS: string[] = [
  colors.primary[500],
  colors.secondary[500],
  colors.success[500],
  colors.warning[500],
  colors.danger[500],
  '#764BA2',
  '#667EEA',
  '#F97316',
];

export default function CreateStudySetScreen() {
  const router = useRouter();
  const createStudySet = useStudyStore((state) => state.createStudySet);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📚');
  const [selectedColor, setSelectedColor] = useState<string>(colors.primary[500]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    try {
      await createStudySet({
        title: title.trim(),
        description: description.trim() || undefined,
        icon: selectedIcon,
        color: selectedColor,
      });
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Failed to create study set:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Study Set</Text>
        <TouchableOpacity onPress={handleCreate} disabled={isLoading || !title.trim()}>
          <Text style={[styles.createButton, (!title.trim() || isLoading) && styles.createButtonDisabled]}>
            Create
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.previewSection}>
          <View style={[styles.previewCard, { backgroundColor: selectedColor }]}>
            <Text style={styles.previewIcon}>{selectedIcon}</Text>
            <Text style={styles.previewTitle}>{title || 'Study Set Name'}</Text>
            {description ? (
              <Text style={styles.previewDescription} numberOfLines={1}>
                {description}
              </Text>
            ) : null}
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.inputSection}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Biology Chapter 5"
            placeholderTextColor={colors.gray[400]}
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.inputSection}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What's this set about?"
            placeholderTextColor={colors.gray[400]}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={200}
          />
        </Animated.View>

        {/* Icon */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.inputSection}>
          <Text style={styles.label}>Icon</Text>
          <View style={styles.optionGrid}>
            {ICON_OPTIONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconOption,
                  selectedIcon === icon && styles.iconOptionSelected,
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <Text style={styles.iconEmoji}>{icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Color */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.inputSection}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.optionGrid}>
            {COLOR_OPTIONS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Text style={styles.colorCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Tips */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips for effective study sets</Text>
          <Text style={styles.tipItem}>• Keep topics focused and specific</Text>
          <Text style={styles.tipItem}>• Use clear, concise card content</Text>
          <Text style={styles.tipItem}>• Add images to improve memory</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  cancelButton: {
    fontSize: 16,
    color: colors.gray[500],
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[900],
  },
  createButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[500],
  },
  createButtonDisabled: {
    color: colors.gray[300],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  previewSection: {
    marginBottom: 24,
  },
  previewCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...shadows.lg,
  },
  previewIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  previewDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray[800],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  iconOptionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  iconEmoji: {
    fontSize: 24,
  },
  colorOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.gray[800],
  },
  colorCheck: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tipsCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 14,
    padding: 16,
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
});
