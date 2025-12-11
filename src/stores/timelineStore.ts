import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TimelineBlock,
  TimelineBlockWithTask,
  CreateTimelineBlockInput,
  UpdateTimelineBlockInput,
  BufferInsertInput,
} from '../types/timeline';
import {
  createTimelineBlock,
  deleteTimelineBlock,
  getTimelineBlocks,
  insertBufferBlock,
  reorderTimelineBlocks,
  updateTimelineBlock,
} from '../services/api/timeline';
import { useTaskStore } from './taskStore';

interface TimelineState {
  blocks: TimelineBlock[];
  selectedDay: string;
  isLoading: boolean;
  error: string | null;

  fetchBlocks: (day?: string) => Promise<void>;
  createBlock: (input: CreateTimelineBlockInput) => Promise<TimelineBlock>;
  updateBlock: (id: string, updates: UpdateTimelineBlockInput) => Promise<TimelineBlock>;
  deleteBlock: (id: string) => Promise<void>;
  reorderBlocks: (orderedIds: string[], day?: string) => Promise<TimelineBlock[]>;
  insertBuffer: (blockId: string, input?: BufferInsertInput) => Promise<TimelineBlock>;
  setSelectedDay: (day: string) => void;

  getBlocksForDay: (day?: string) => TimelineBlock[];
  getBlocksWithTasks: (day?: string) => TimelineBlockWithTask[];
  getBlockById: (id: string) => TimelineBlock | undefined;
  getCurrentBlock: (now?: Date) => TimelineBlockWithTask | undefined;
}

const todayIso = () => new Date().toISOString().split('T')[0];

const sortBlocks = (blocks: TimelineBlock[]) =>
  [...blocks].sort((a, b) => a.order - b.order || a.startTime.localeCompare(b.startTime));

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
      blocks: [],
      selectedDay: todayIso(),
      isLoading: false,
      error: null,

      fetchBlocks: async (day) => {
        set({ isLoading: true, error: null, selectedDay: day || get().selectedDay });
        try {
          const targetDay = day || get().selectedDay;
          const blocks = await getTimelineBlocks(targetDay);
          set({ blocks: sortBlocks(blocks), isLoading: false, selectedDay: targetDay });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      createBlock: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const block = await createTimelineBlock(input);
          set((state) => ({
            blocks: sortBlocks([...state.blocks, block]),
            isLoading: false,
            selectedDay: block.day,
          }));
          return block;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      updateBlock: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await updateTimelineBlock(id, updates);
          set((state) => ({
            blocks: sortBlocks(state.blocks.map((b) => (b.id === id ? updated : b))),
            isLoading: false,
          }));
          return updated;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      deleteBlock: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await deleteTimelineBlock(id);
          set((state) => ({
            blocks: state.blocks.filter((b) => b.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      reorderBlocks: async (orderedIds, day) => {
        set({ isLoading: true, error: null });
        const previous = get().blocks;
        const optimistic = sortBlocks(
          previous.map((b) =>
            orderedIds.includes(b.id) ? { ...b, order: orderedIds.indexOf(b.id) } : b
          )
        );
        set({ blocks: optimistic });
        try {
          const reordered = await reorderTimelineBlocks({ orderedIds, day });
          set((state) => ({
            blocks: sortBlocks(
              state.blocks.map((b) => reordered.find((r) => r.id === b.id) || b)
            ),
            isLoading: false,
          }));
          return reordered;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false, blocks: previous });
          throw error;
        }
      },

      insertBuffer: async (blockId, input) => {
        set({ isLoading: true, error: null });
        try {
          const buffer = await insertBufferBlock(blockId, input);
          set((state) => ({
            blocks: sortBlocks([...state.blocks, buffer]),
            isLoading: false,
          }));
          return buffer;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      setSelectedDay: (day) => set({ selectedDay: day }),

      getBlocksForDay: (day) => {
        const targetDay = day || get().selectedDay;
        return sortBlocks(get().blocks.filter((b) => b.day === targetDay));
      },

      getBlocksWithTasks: (day) => {
        const taskMap = new Map(useTaskStore.getState().tasks.map((t) => [t.id, t]));
        return get()
          .getBlocksForDay(day)
          .map((block) => ({
            ...block,
            task: block.taskId ? taskMap.get(block.taskId) : undefined,
          }));
      },

      getBlockById: (id) => get().blocks.find((b) => b.id === id),

      getCurrentBlock: (now = new Date()) => {
        const nowMs = now.getTime();
        return get()
          .getBlocksWithTasks()
          .find((block) => {
            const start = new Date(block.startTime).getTime();
            const end = new Date(block.endTime).getTime();
            return start <= nowMs && nowMs <= end;
          });
      },
    }),
    {
      name: 'timeline-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        blocks: state.blocks,
        selectedDay: state.selectedDay,
      }),
    }
  )
);
