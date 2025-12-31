// Global Undo/Redo System
// Provides universal undo/redo functionality for all user actions
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Action types that can be undone/redone
 */
export type UndoableActionType =
  | 'task_create'
  | 'task_update'
  | 'task_delete'
  | 'task_complete'
  | 'task_uncomplete'
  | 'task_reorder'
  | 'habit_create'
  | 'habit_update'
  | 'habit_delete'
  | 'habit_log'
  | 'habit_unlog'
  | 'subtask_add'
  | 'subtask_toggle'
  | 'subtask_delete'
  | 'timeline_block_create'
  | 'timeline_block_update'
  | 'timeline_block_delete'
  | 'note_create'
  | 'note_update'
  | 'note_delete';

/**
 * Base interface for undoable actions
 */
export interface UndoableAction {
  id: string;
  type: UndoableActionType;
  timestamp: number;
  description: string;
  // Store the state before the action
  previousState: unknown;
  // Store the state after the action
  newState: unknown;
  // Function to undo the action
  undo: () => Promise<void> | void;
  // Function to redo the action
  redo: () => Promise<void> | void;
}

interface UndoState {
  // History stack (oldest to newest)
  history: UndoableAction[];
  // Current position in history
  currentIndex: number;
  // Maximum history size (default: 50)
  maxHistorySize: number;

  // Actions
  pushAction: (action: Omit<UndoableAction, 'id' | 'timestamp'>) => void;
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;
}

const MAX_HISTORY_SIZE = 50;

export const useUndoStore = create<UndoState>()(
  persist(
    (set, get) => ({
      history: [],
      currentIndex: -1,
      maxHistorySize: MAX_HISTORY_SIZE,

      pushAction: (action) => {
        const { history, currentIndex, maxHistorySize } = get();
        
        // Remove any actions after current index (when undoing and then doing new action)
        const newHistory = history.slice(0, currentIndex + 1);
        
        // Create the full action
        const fullAction: UndoableAction = {
          ...action,
          id: `undo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: Date.now(),
        };

        // Add new action
        newHistory.push(fullAction);

        // Limit history size
        const limitedHistory = newHistory.slice(-maxHistorySize);

        set({
          history: limitedHistory,
          currentIndex: limitedHistory.length - 1,
        });
      },

      undo: async () => {
        const { history, currentIndex } = get();
        
        if (!get().canUndo()) {
          return false;
        }

        const action = history[currentIndex];
        
        try {
          await action.undo();
          set({ currentIndex: currentIndex - 1 });
          return true;
        } catch (error) {
          console.error('Undo failed:', error);
          return false;
        }
      },

      redo: async () => {
        const { history, currentIndex } = get();
        
        if (!get().canRedo()) {
          return false;
        }

        const action = history[currentIndex + 1];
        
        try {
          await action.redo();
          set({ currentIndex: currentIndex + 1 });
          return true;
        } catch (error) {
          console.error('Redo failed:', error);
          return false;
        }
      },

      canUndo: () => {
        const { history, currentIndex } = get();
        return currentIndex >= 0 && history.length > 0;
      },

      canRedo: () => {
        const { history, currentIndex } = get();
        return currentIndex < history.length - 1;
      },

      clearHistory: () => {
        set({ history: [], currentIndex: -1 });
      },

      getUndoDescription: () => {
        const { history, currentIndex } = get();
        if (currentIndex >= 0 && history[currentIndex]) {
          return history[currentIndex].description;
        }
        return null;
      },

      getRedoDescription: () => {
        const { history, currentIndex } = get();
        if (currentIndex < history.length - 1 && history[currentIndex + 1]) {
          return history[currentIndex + 1].description;
        }
        return null;
      },
    }),
    {
      name: 'undo-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist history, not functions
      partialize: (state) => ({
        history: state.history.map((action) => ({
          id: action.id,
          type: action.type,
          timestamp: action.timestamp,
          description: action.description,
          previousState: action.previousState,
          newState: action.newState,
        })),
        currentIndex: state.currentIndex,
        maxHistorySize: state.maxHistorySize,
      }),
    }
  )
);

/**
 * Helper to create undoable action wrappers for store actions
 */
export function createUndoableAction<T extends (...args: any[]) => any>(
  actionFn: T,
  actionType: UndoableActionType,
  getDescription: (...args: Parameters<T>) => string,
  getPreviousState: (...args: Parameters<T>) => unknown,
  getNewState: (result: Awaited<ReturnType<T>>) => unknown,
  createUndo: (
    previousState: unknown,
    ...args: Parameters<T>
  ) => () => Promise<void> | void,
  createRedo: (
    newState: unknown,
    ...args: Parameters<T>
  ) => () => Promise<void> | void
): T {
  return ((...args: Parameters<T>) => {
    const previousState = getPreviousState(...args);
    
    // Execute the action
    const result = actionFn(...args);
    
    // Handle both sync and async actions
    if (result instanceof Promise) {
      return result.then((resolvedResult) => {
        const newState = getNewState(resolvedResult);
        
        useUndoStore.getState().pushAction({
          type: actionType,
          description: getDescription(...args),
          previousState,
          newState,
          undo: createUndo(previousState, ...args),
          redo: createRedo(newState, ...args),
        });
        
        return resolvedResult;
      });
    } else {
      const newState = getNewState(result);
      
      useUndoStore.getState().pushAction({
        type: actionType,
        description: getDescription(...args),
        previousState,
        newState,
        undo: createUndo(previousState, ...args),
        redo: createRedo(newState, ...args),
      });
      
      return result;
    }
  }) as T;
}
