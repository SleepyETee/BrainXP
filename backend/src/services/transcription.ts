// filepath: /Users/sleepyet/BrainXP/backend/src/services/transcription.ts
/**
 * Voice Transcription Service
 * Uses OpenAI's Whisper API for audio transcription
 */

interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number;
}

class TranscriptionService {
  private apiKey: string | undefined;
  private baseUrl = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = process.env['OPENAI_API_KEY'];
    if (!this.apiKey) {
      console.warn('OPENAI_API_KEY not set - transcription service will use fallback');
    }
  }

  /**
   * Check if the service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Transcribe audio from a URL
   */
  async transcribeFromUrl(audioUrl: string, options: TranscriptionOptions = {}): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      return this.fallbackTranscription(audioUrl);
    }

    try {
      // Fetch the audio file
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
      }

      const audioBlob = await audioResponse.blob();
      return this.transcribeBlob(audioBlob, options);
    } catch (error) {
      console.error('Transcription from URL failed:', error);
      return this.fallbackTranscription(audioUrl);
    }
  }

  /**
   * Transcribe audio from a Blob/File
   */
  async transcribeBlob(audioBlob: Blob, options: TranscriptionOptions = {}): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      return this.fallbackTranscription();
    }

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      
      if (options.language) {
        formData.append('language', options.language);
      }
      if (options.prompt) {
        formData.append('prompt', options.prompt);
      }
      if (options.temperature !== undefined) {
        formData.append('temperature', options.temperature.toString());
      }
      
      // Use verbose_json to get segments and duration
      formData.append('response_format', options.responseFormat || 'verbose_json');

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Whisper API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as {
        text: string;
        language?: string;
        duration?: number;
        segments?: Array<{ start: number; end: number; text: string }>;
      };

      // Handle different response formats
      if (typeof data === 'string') {
        return { text: data };
      }

      return {
        text: data.text,
        language: data.language,
        duration: data.duration,
        segments: data.segments?.map((s) => ({
          start: s.start,
          end: s.end,
          text: s.text,
        })),
      };
    } catch (error) {
      console.error('Transcription failed:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio from base64 data
   */
  async transcribeFromBase64(base64Data: string, mimeType: string = 'audio/webm', options: TranscriptionOptions = {}): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      return this.fallbackTranscription();
    }

    try {
      // Convert base64 to Blob
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });

      return this.transcribeBlob(blob, options);
    } catch (error) {
      console.error('Base64 transcription failed:', error);
      throw error;
    }
  }

  /**
   * Fallback when API is not configured
   */
  private fallbackTranscription(audioUrl?: string): TranscriptionResult {
    console.warn('Using fallback transcription - configure OPENAI_API_KEY for real transcription');
    return {
      text: audioUrl 
        ? `[Voice note from: ${audioUrl}] - Configure OPENAI_API_KEY to enable transcription`
        : '[Voice note] - Configure OPENAI_API_KEY to enable transcription',
      language: 'en',
    };
  }
}

// Singleton instance
export const transcriptionService = new TranscriptionService();

// Export types
export type { TranscriptionResult, TranscriptionOptions };
