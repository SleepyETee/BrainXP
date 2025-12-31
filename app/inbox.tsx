import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { safeGoBack } from '../src/utils/navigation';
import * as Haptics from 'expo-haptics';
import { useCaptureStore } from '../src/stores/captureStore';
import { useTaskStore } from '../src/stores/taskStore';
import { useProgressStore } from '../src/stores/progressStore';
import { Button } from '../src/components/ui/Button';
import { VoiceRecorder } from '../src/components/capture/VoiceRecorder';
import { colors } from '../src/theme/colors';
import { uploadVoice, captureVoice } from '../src/services/api/capture';

export default function InboxScreen() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  
  const captureItems = useCaptureStore((state) => state.items);
  const captureText = useCaptureStore((state) => state.captureText);
  const captureVoiceStore = useCaptureStore((state) => state.captureVoice);
  const processCapture = useCaptureStore((state) => state.processCapture);
  const dismissCapture = useCaptureStore((state) => state.dismissCapture);
  
  const createTask = useTaskStore((state) => state.createTask);
  const addXP = useProgressStore((state) => state.addXP);

  const handleQuickCapture = async () => {
    if (!input.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    await captureText({
      textContent: input.trim(),
      source: 'app',
    });
    
    setInput('');
    await addXP(3, 'inbox_processed', 'Captured an item');
  };

  const handleConvertToTask = async (itemId: string, content: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const task = await createTask({ title: content });
    await processCapture({ captureId: itemId, convertToType: 'task' });
    await addXP(5, 'inbox_processed', 'Converted inbox item to task');
  };

  const handleDismiss = async (itemId: string) => {
    await dismissCapture(itemId);
  };

  const handleVoiceRecordingComplete = async (uri: string, duration: number) => {
    try {
      setIsProcessingVoice(true);
      setShowVoiceRecorder(false);
      
      // Upload the voice file
      const { url: voiceUrl } = await uploadVoice(uri, duration);
      
      // Create capture item
      await captureVoiceStore({
        voiceUrl,
        voiceDuration: duration,
        source: 'app',
      });
      
      await addXP(3, 'inbox_processed', 'Captured a voice note');
      
      // Show success feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error processing voice recording:', error);
      Alert.alert('Error', 'Failed to save voice recording. Please try again.');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleMicPress = () => {
    setShowVoiceRecorder(true);
  };

  const handlePhotoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Photo Capture',
      'Take a photo of notes, whiteboards, or documents to capture them as tasks.\n\nThis feature requires the expo-image-picker package. For now, you can type or dictate your notes.',
      [
        { text: 'Use Voice Instead', onPress: () => setShowVoiceRecorder(true) },
        { text: 'OK', style: 'cancel' },
      ]
    );
  };

  const pendingItems = captureItems.filter((item) => item.status === 'pending');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeGoBack(router, '/(tabs)')}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Quick Capture</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>What's on your mind?</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Capture any thought, idea, or task..."
              value={input}
              onChangeText={setInput}
              placeholderTextColor={colors.gray[400]}
              multiline
              autoFocus
            />
          </View>
          <View style={styles.inputActions}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handleMicPress}
              accessibilityLabel="Record voice note"
              accessibilityRole="button"
            >
              <Text>🎤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handlePhotoPress}
              accessibilityLabel="Capture photo"
              accessibilityRole="button"
            >
              <Text>📷</Text>
            </TouchableOpacity>
            <Button
              title="Capture"
              size="sm"
              onPress={handleQuickCapture}
              disabled={!input.trim()}
            />
          </View>
        </View>

        {/* Inbox Items */}
        {pendingItems.length > 0 && (
          <View style={styles.listSection}>
            <Text style={styles.listTitle}>
              Inbox ({pendingItems.length} items)
            </Text>
            <FlatList
              data={pendingItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.inboxItem}>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemText} numberOfLines={2}>
                      {item.textContent || item.voiceTranscript || 'Voice note'}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {new Date(item.capturedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        handleConvertToTask(
                          item.id,
                          item.textContent || item.voiceTranscript || 'New task'
                        )
                      }
                    >
                      <Text style={styles.actionButtonText}>→ Task</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dismissButton}
                      onPress={() => handleDismiss(item.id)}
                    >
                      <Text style={styles.dismissButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Empty state */}
        {pendingItems.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📥</Text>
            <Text style={styles.emptyTitle}>Inbox Zero!</Text>
            <Text style={styles.emptyText}>
              Capture thoughts quickly here, then process them later into tasks,
              habits, or notes.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Voice Recorder Modal */}
      <Modal
        visible={showVoiceRecorder}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVoiceRecorder(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <VoiceRecorder
              onRecordingComplete={handleVoiceRecordingComplete}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  closeButton: {
    fontSize: 24,
    color: colors.gray[500],
    width: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[800],
  },
  placeholder: {
    width: 32,
  },
  keyboardView: {
    flex: 1,
  },
  inputSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 12,
  },
  inputRow: {
    marginBottom: 12,
  },
  input: {
    fontSize: 16,
    color: colors.gray[800],
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mediaButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  listSection: {
    flex: 1,
    padding: 20,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 15,
    color: colors.gray[800],
  },
  itemMeta: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[100],
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary[700],
  },
  dismissButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.gray[200],
  },
  dismissButtonText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
});

