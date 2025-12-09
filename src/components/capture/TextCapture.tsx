import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';

interface TextCaptureProps {
  onCapture: (text: string) => void;
  onCancel: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const TextCapture: React.FC<TextCaptureProps> = ({
  onCapture,
  onCancel,
  placeholder = "What's on your mind?",
  autoFocus = true,
}) => {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  const handleCapture = async () => {
    if (!text.trim()) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCapture(text.trim());
    setText('');
  };

  const handleCancel = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleCancel}
      />

      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>💭 Quick Capture</Text>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />

        <View style={styles.footer}>
          <Text style={styles.charCount}>{text.length}/500</Text>
          <TouchableOpacity
            style={[styles.captureButton, !text.trim() && styles.captureButtonDisabled]}
            onPress={handleCapture}
            disabled={!text.trim()}
          >
            <Text style={styles.captureButtonText}>Capture</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            💡 Capture now, organize later. Your thought will go to the inbox.
          </Text>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[800],
  },
  cancelText: {
    fontSize: 16,
    color: colors.gray[500],
  },
  input: {
    minHeight: 120,
    maxHeight: 200,
    fontSize: 16,
    color: colors.gray[800],
    padding: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  charCount: {
    fontSize: 12,
    color: colors.gray[400],
  },
  captureButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  captureButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  captureButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  hintText: {
    fontSize: 13,
    color: colors.primary[700],
    textAlign: 'center',
  },
});

export default TextCapture;

