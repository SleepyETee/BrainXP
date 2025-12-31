// Voice Recorder Component
// Records audio for voice capture feature
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
  maxDuration?: number; // Maximum recording duration in seconds
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
  maxDuration = 300, // 5 minutes default
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [duration, setDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Request permissions on mount
    requestPermissions();

    // Cleanup on unmount
    return () => {
      if (recording) {
        stopRecording().catch(console.error);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      // Pulse animation while recording
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Update duration every second
      intervalRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          // Auto-stop at max duration
          if (newDuration >= maxDuration) {
            handleStop();
          }
          return newDuration;
        });
      }, 1000);
    } else {
      // Stop animation
      pulseAnim.setValue(1);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isRecording]);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Microphone permission is needed to record voice notes.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      setHasPermission(false);
    }
  };

  const startRecording = async () => {
    try {
      if (hasPermission === false) {
        await requestPermissions();
        if (hasPermission === false) {
          return;
        }
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      if (uri) {
        onRecordingComplete(uri, duration);
      }

      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const handleStop = async () => {
    await stopRecording();
  };

  const handleCancel = async () => {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      } catch (error) {
        console.error('Error canceling recording:', error);
      }
      setRecording(null);
    }
    setIsRecording(false);
    setDuration(0);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Microphone permission is required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermissions}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎤 Voice Recording</Text>

      {!isRecording ? (
        <>
          <Text style={styles.instruction}>Tap the button to start recording</Text>
          <TouchableOpacity
            style={styles.recordButton}
            onPress={startRecording}
            accessibilityLabel="Start recording"
            accessibilityRole="button"
          >
            <Text style={styles.recordButtonText}>Start Recording</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Animated.View
            style={[
              styles.recordingIndicator,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.recordingDot} />
          </Animated.View>
          <Text style={styles.duration}>{formatDuration(duration)}</Text>
          <Text style={styles.recordingText}>Recording...</Text>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, styles.stopButton]}
              onPress={handleStop}
              accessibilityLabel="Stop recording"
              accessibilityRole="button"
            >
              <Text style={styles.stopButtonText}>✓ Stop</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.cancelButton]}
              onPress={handleCancel}
              accessibilityLabel="Cancel recording"
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>✕ Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 16,
  },
  instruction: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 24,
    textAlign: 'center',
  },
  recordButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    minWidth: 200,
    alignItems: 'center',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  recordingIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.danger[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  recordingDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  duration: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  recordingText: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 32,
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: colors.success[500],
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: colors.gray[200],
  },
  cancelButtonText: {
    color: colors.gray[700],
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: colors.danger[600],
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary[500],
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
