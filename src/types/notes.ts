// ═══════════════════════════════════════════════════════════════════════════════
// NOTES & DOCUMENTS TYPES (NotebookLM-inspired)
// Smart Notes, Document Processing, AI Chat
// ═══════════════════════════════════════════════════════════════════════════════

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string; // Markdown
  folderId?: string;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  
  // AI-generated insights
  aiSummary?: string;
  aiKeyPoints: string[];
  aiTags: string[];
  embeddingId?: string;
  
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface NoteFolder {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Document {
  id: string;
  userId: string;
  name: string;
  originalName: string;
  mimeType: string;
  fileUrl: string;
  fileSize: number;
  
  status: DocumentStatus;
  processedAt?: string;
  
  extractedText?: string;
  pageCount?: number;
  
  // AI-generated content
  aiSummary?: string;
  aiKeyPoints: string[];
  aiOutline?: DocumentOutline;
  embeddingId?: string;
  
  // Generated study materials
  generatedFlashcards?: string; // StudySet ID
  generatedQuiz?: string; // Quiz ID
  
  createdAt: string;
  updatedAt: string;
}

export interface DocumentOutline {
  title: string;
  sections: {
    title: string;
    level: number;
    pageStart?: number;
    subsections?: DocumentOutline['sections'];
  }[];
}

export interface DocumentChat {
  id: string;
  documentId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: {
    pageNumber?: number;
    excerpt: string;
    relevance: number;
  }[];
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DAILY LISTS (Twos-inspired)
// ═══════════════════════════════════════════════════════════════════════════════

export type DailyItemType = 'note' | 'task' | 'idea' | 'reminder';

export interface DailyListItem {
  id: string;
  dailyListId: string;
  content: string;
  type: DailyItemType;
  isCompleted: boolean;
  order: number;
  convertedToTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyList {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  items: DailyListItem[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// THINGS DATABASE (Twos-inspired)
// ═══════════════════════════════════════════════════════════════════════════════

export type ThingCategory = 
  | 'movies'
  | 'books'
  | 'restaurants'
  | 'recipes'
  | 'ideas'
  | 'places'
  | 'people'
  | 'quotes'
  | 'links'
  | 'custom';

export type ThingStatus = 'want_to' | 'in_progress' | 'completed' | 'abandoned';

export interface Thing {
  id: string;
  userId: string;
  category: ThingCategory | string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  rating?: number; // 1-5
  status?: ThingStatus;
  metadata?: Record<string, any>;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}
