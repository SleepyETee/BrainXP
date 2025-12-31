import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CaptureItem,
  CreateTextCaptureInput,
  CreateVoiceCaptureInput,
  ProcessCaptureInput,
  CaptureProcessResult,
  CaptureStatus,
} from '../types/capture';
import { useAuthStore } from './authStore';
import { transcribeAudio } from '../services/voiceTranscription';
import { useTaskStore } from './taskStore';
import { useHabitStore } from './habitStore';

interface CaptureState {
  items: CaptureItem[];
  isLoading: boolean;
  isRecording: boolean;
  error: string | null;

  // Actions
  captureText: (input: CreateTextCaptureInput) => Promise<CaptureItem>;
  captureVoice: (input: CreateVoiceCaptureInput) => Promise<CaptureItem>;
  processCapture: (input: ProcessCaptureInput) => Promise<CaptureProcessResult>;
  dismissCapture: (id: string) => Promise<void>;
  deleteCapture: (id: string) => Promise<void>;
  setRecording: (isRecording: boolean) => void;

  // Selectors
  getPendingItems: () => CaptureItem[];
  getItemById: (id: string) => CaptureItem | undefined;
  getItemCount: () => number;
}

const generateId = () => Math.random().toString(36).substring(2, 15);
const getUserId = () => useAuthStore.getState().user?.id || 'local-user';

export const useCaptureStore = create<CaptureState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isRecording: false,
      error: null,

      captureText: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const item: CaptureItem = {
            id: generateId(),
            userId: getUserId(),
            contentType: 'text',
            textContent: input.textContent,
            status: 'pending',
            capturedAt: new Date().toISOString(),
            source: input.source || 'app',
          };

          set((state) => ({
            items: [item, ...state.items],
            isLoading: false,
          }));

          return item;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      captureVoice: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const item: CaptureItem = {
            id: generateId(),
            userId: getUserId(),
            contentType: 'voice',
            voiceUrl: input.voiceUrl,
            voiceDuration: input.voiceDuration,
            status: 'pending',
            capturedAt: new Date().toISOString(),
            source: input.source || 'app',
          };

          // Add item immediately so user sees feedback
          set((state) => ({
            items: [item, ...state.items],
            isLoading: false,
          }));

          // Trigger voice transcription in background
          if (input.voiceUrl && input.voiceDuration) {
            transcribeAudio(input.voiceUrl, input.voiceDuration)
              .then((result) => {
                // Update item with transcription
                set((state) => ({
                  items: state.items.map((i) =>
                    i.id === item.id
                      ? { ...i, textContent: result.text, transcriptionConfidence: result.confidence }
                      : i
                  ),
                }));
              })
              .catch((err) => {
                console.warn('Voice transcription failed:', err);
              });
          }

          return item;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      processCapture: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const item = get().items.find((i) => i.id === input.captureId);
          if (!item) throw new Error('Capture item not found');

          let createdItemId = '';
          const content = item.textContent || item.voiceTranscript || '';
          const title = input.title || content.substring(0, 50) || 'Captured item';

          // Create the appropriate item based on convertToType
          switch (input.convertToType) {
            case 'task': {
              const task = await useTaskStore.getState().createTask({
                title,
                description: input.description || content,
                priority: (input.priority as 'low' | 'medium' | 'high') || 'medium',
                dueDate: input.dueDate,
                tags: input.tags,
              });
              createdItemId = task.id;
              break;
            }
            case 'habit': {
              const habit = await useHabitStore.getState().createHabit({
                name: title,
                icon: '✨',
                color: '#6366F1',
              });
              createdItemId = habit.id;
              break;
            }
            case 'note':
            case 'event':
            default: {
              // For notes and events, just generate an ID
              // These would be handled by their respective stores when implemented
              createdItemId = generateId();
              break;
            }
          }

          const processedItem: CaptureItem = {
            ...item,
            status: 'processed',
            processedAt: new Date().toISOString(),
            convertedToType: input.convertToType,
            convertedToId: createdItemId,
          };

          set((state) => ({
            items: state.items.map((i) =>
              i.id === input.captureId ? processedItem : i
            ),
            isLoading: false,
          }));

          return {
            capture: processedItem,
            createdItem: {
              type: input.convertToType,
              id: createdItemId,
            },
            xpEarned: 3,
          };
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      dismissCapture: async (id) => {
        try {
          set((state) => ({
            items: state.items.map((i) =>
              i.id === id ? { ...i, status: 'dismissed' as CaptureStatus } : i
            ),
          }));
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      deleteCapture: async (id) => {
        try {
          set((state) => ({
            items: state.items.filter((i) => i.id !== id),
          }));
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      setRecording: (isRecording) => set({ isRecording }),

      // Selectors
      getPendingItems: () =>
        get().items.filter((i) => i.status === 'pending'),

      getItemById: (id) => get().items.find((i) => i.id === id),

      getItemCount: () => get().items.filter((i) => i.status === 'pending').length,
    }),
    {
      name: 'capture-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);
