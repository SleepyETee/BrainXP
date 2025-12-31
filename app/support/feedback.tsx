import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other';

const FEEDBACK_TYPES: { key: FeedbackType; label: string; emoji: string }[] = [
  { key: 'bug', label: 'Bug Report', emoji: '🐛' },
  { key: 'feature', label: 'Feature Request', emoji: '✨' },
  { key: 'improvement', label: 'Improvement', emoji: '💡' },
  { key: 'other', label: 'Other', emoji: '💬' },
];

export default function FeedbackScreen() {
  const router = useRouter();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('improvement');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please enter your feedback message');
      } else {
        Alert.alert('Error', 'Please enter your feedback message');
      }
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>Thank You!</Text>
          <Text style={styles.successText}>
            Your feedback has been received. We appreciate you taking the time to help us improve BrainXP.
          </Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.back()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Send Feedback</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Intro */}
          <View style={styles.introCard}>
            <Text style={styles.introEmoji}>💬</Text>
            <Text style={styles.introText}>
              We'd love to hear from you! Your feedback helps us make BrainXP better for everyone with ADHD.
            </Text>
          </View>

          {/* Feedback Type */}
          <Text style={styles.label}>What type of feedback?</Text>
          <View style={styles.typeGrid}>
            {FEEDBACK_TYPES.map(type => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeButton,
                  feedbackType === type.key && styles.typeButtonActive,
                ]}
                onPress={() => setFeedbackType(type.key)}
              >
                <Text style={styles.typeEmoji}>{type.emoji}</Text>
                <Text style={[
                  styles.typeLabel,
                  feedbackType === type.key && styles.typeLabelActive,
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Message */}
          <Text style={styles.label}>Your feedback</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell us what's on your mind..."
            placeholderTextColor={colors.gray[400]}
            multiline
            numberOfLines={6}
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />

          {/* Email (optional) */}
          <Text style={styles.label}>Email (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor={colors.gray[400]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.hint}>
            Include your email if you'd like us to follow up
          </Text>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: colors.primary[600],
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  introCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  introEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  introText: {
    fontSize: 15,
    color: colors.primary[700],
    textAlign: 'center',
    lineHeight: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  typeButtonActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[600],
  },
  typeLabelActive: {
    color: colors.primary[700],
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.gray[800],
    borderWidth: 1,
    borderColor: colors.gray[200],
    minHeight: 150,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.gray[800],
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  doneButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
