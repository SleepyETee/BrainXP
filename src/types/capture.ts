export type CaptureContentType = 'text' | 'voice' | 'photo' | 'link';
export type CaptureStatus = 'pending' | 'processed' | 'dismissed';
export type ConvertedType = 'task' | 'habit' | 'note' | 'event';

export interface CaptureItem {
  id: string;
  userId: string;
  contentType: CaptureContentType;
  textContent?: string;
  voiceUrl?: string;
  voiceTranscript?: string;
  voiceDuration?: number; // in seconds
  photoUrl?: string;
  linkUrl?: string;
  linkMetadata?: LinkMetadata;
  status: CaptureStatus;
  processedAt?: string;
  convertedToType?: ConvertedType;
  convertedToId?: string;
  aiSuggestion?: AISuggestion;
  capturedAt: string;
  source: 'app' | 'widget' | 'share' | 'notification';
}

export interface LinkMetadata {
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
}

export interface AISuggestion {
  suggestedType: ConvertedType;
  confidence: number;
  suggestedTitle?: string;
  suggestedDescription?: string;
  suggestedDueDate?: string;
  suggestedPriority?: string;
  suggestedTags?: string[];
  reasoning?: string;
}

export interface CreateTextCaptureInput {
  textContent: string;
  source?: CaptureItem['source'];
}

export interface CreateVoiceCaptureInput {
  voiceUrl: string;
  voiceDuration: number;
  source?: CaptureItem['source'];
}

export interface CreatePhotoCaptureInput {
  photoUrl: string;
  source?: CaptureItem['source'];
}

export interface CreateLinkCaptureInput {
  linkUrl: string;
  source?: CaptureItem['source'];
}

export interface ProcessCaptureInput {
  captureId: string;
  convertToType: ConvertedType;
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  tags?: string[];
}

export interface CaptureProcessResult {
  capture: CaptureItem;
  createdItem: {
    type: ConvertedType;
    id: string;
  };
  xpEarned: number;
}
