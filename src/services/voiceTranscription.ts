// Voice Transcription Service
// Handles audio transcription with fallback support

import { Audio } from 'expo-av';

export interface TranscriptionResult {
  text: string;
  confidence: number;
  duration: number;
  language?: string;
}

export interface TranscriptionOptions {
  language?: string;
  maxDuration?: number;
}

// Mock transcription for offline/development mode
const mockTranscribe = async (
  audioUri: string,
  duration: number
): Promise<TranscriptionResult> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, Math.min(duration * 100, 2000)));
  
  return {
    text: 'Voice note captured. Transcription will be available when connected to the server.',
    confidence: 0.5,
    duration,
    language: 'en',
  };
};

// Main transcription function
export const transcribeAudio = async (
  audioUri: string,
  duration: number,
  options?: TranscriptionOptions
): Promise<TranscriptionResult> => {
  try {
    // In production, this would call a real transcription API
    // For now, we use the mock implementation
    // You can integrate with:
    // - OpenAI Whisper API
    // - Google Cloud Speech-to-Text
    // - AWS Transcribe
    // - Azure Speech Services
    
    const result = await mockTranscribe(audioUri, duration);
    return result;
  } catch (error) {
    console.error('Transcription error:', error);
    return {
      text: 'Unable to transcribe audio. Please try again.',
      confidence: 0,
      duration,
    };
  }
};

// Recording utilities
export interface RecordingState {
  isRecording: boolean;
  duration: number;
  uri: string | null;
}

let recording: Audio.Recording | null = null;

export const startRecording = async (): Promise<void> => {
  try {
    // Request permissions
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Microphone permission not granted');
    }

    // Configure audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Start recording
    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    
    recording = newRecording;
  } catch (error) {
    console.error('Failed to start recording:', error);
    throw error;
  }
};

export const stopRecording = async (): Promise<{ uri: string; duration: number } | null> => {
  if (!recording) {
    return null;
  }

  try {
    await recording.stopAndUnloadAsync();
    
    // Reset audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    const uri = recording.getURI();
    const status = await recording.getStatusAsync();
    const duration = status.durationMillis ? status.durationMillis / 1000 : 0;
    
    recording = null;
    
    if (!uri) {
      return null;
    }

    return { uri, duration };
  } catch (error) {
    console.error('Failed to stop recording:', error);
    recording = null;
    throw error;
  }
};

export const cancelRecording = async (): Promise<void> => {
  if (recording) {
    try {
      await recording.stopAndUnloadAsync();
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
    recording = null;
  }
};

export const getRecordingStatus = async (): Promise<RecordingState> => {
  if (!recording) {
    return { isRecording: false, duration: 0, uri: null };
  }

  try {
    const status = await recording.getStatusAsync();
    return {
      isRecording: status.isRecording,
      duration: status.durationMillis ? status.durationMillis / 1000 : 0,
      uri: recording.getURI(),
    };
  } catch {
    return { isRecording: false, duration: 0, uri: null };
  }
};
