import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyList, DailyListItem, DailyItemType } from '../types/notes';
import { useTaskStore } from './taskStore';
import { CreateTaskInput } from '../types/task';

type DailyListRecord = Record<string, DailyList>;

interface DailyListState {
  lists: DailyListRecord;
  getListForDate: (date?: string) => DailyList;
  addItem: (date: string, content: string, type?: DailyItemType) => DailyListItem;
  updateItem: (
    date: string,
    itemId: string,
    updates: Partial<Pick<DailyListItem, 'content' | 'type' | 'order' | 'convertedToTaskId'>>
  ) => void;
  toggleItem: (date: string, itemId: string) => void;
  deleteItem: (date: string, itemId: string) => void;
  convertToTask: (date: string, itemId: string) => Promise<void>;
}

const isoDate = (date: Date | string) => {
  if (typeof date === 'string') return date.split('T')[0];
  return date.toISOString().split('T')[0];
};

const createEmptyList = (date: string): DailyList => ({
  id: `daily-${date}`,
  userId: 'local-user',
  date,
  items: [],
});

export const useDailyListStore = create<DailyListState>()(
  persist(
    (set, get) => ({
      lists: {},

      getListForDate: (dateInput) => {
        const date = isoDate(dateInput || new Date());
        const existing = get().lists[date];
        if (existing) return existing;
        const newList = createEmptyList(date);
        set((state) => ({ lists: { ...state.lists, [date]: newList } }));
        return newList;
      },

      addItem: (dateInput, content, type = 'note') => {
        const date = isoDate(dateInput);
        const base = get().getListForDate(date);
        const now = new Date().toISOString();
        const item: DailyListItem = {
          id: `dli-${Math.random().toString(36).slice(2)}`,
          dailyListId: base.id,
          content,
          type,
          isCompleted: false,
          order: base.items.length,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          lists: {
            ...state.lists,
            [date]: { ...base, items: [...base.items, item] },
          },
        }));
        return item;
      },

      updateItem: (dateInput, itemId, updates) => {
        const date = isoDate(dateInput);
        const list = get().getListForDate(date);
        set((state) => ({
          lists: {
            ...state.lists,
            [date]: {
              ...list,
              items: list.items.map((it) =>
                it.id === itemId
                  ? {
                      ...it,
                      ...updates,
                      updatedAt: new Date().toISOString(),
                    }
                  : it
              ),
            },
          },
        }));
      },

      toggleItem: (dateInput, itemId) => {
        const date = isoDate(dateInput);
        const list = get().getListForDate(date);
        set((state) => ({
          lists: {
            ...state.lists,
            [date]: {
              ...list,
              items: list.items.map((it) =>
                it.id === itemId
                  ? {
                      ...it,
                      isCompleted: !it.isCompleted,
                      updatedAt: new Date().toISOString(),
                    }
                  : it
              ),
            },
          },
        }));
      },

      deleteItem: (dateInput, itemId) => {
        const date = isoDate(dateInput);
        const list = get().getListForDate(date);
        set((state) => ({
          lists: {
            ...state.lists,
            [date]: { ...list, items: list.items.filter((it) => it.id !== itemId) },
          },
        }));
      },

      convertToTask: async (dateInput, itemId) => {
        const date = isoDate(dateInput);
        const list = get().getListForDate(date);
        const item = list.items.find((it) => it.id === itemId);
        if (!item) return;

        const createTask = useTaskStore.getState().createTask;
        const payload: CreateTaskInput = {
          title: item.content,
          tags: ['twos'],
          source: 'manual',
        };
        const newTask = await createTask(payload);

        get().updateItem(date, itemId, { convertedToTaskId: newTask.id, type: 'task' });
      },
    }),
    {
      name: 'daily-list-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ lists: state.lists }),
    }
  )
);
