import { Task } from './task';

export type TimelineBlockType = 'task' | 'focus' | 'break' | 'buffer' | 'routine' | 'event';

export interface TimelineBlock {
  id: string;
  userId: string;
  title: string;
  type: TimelineBlockType;
  startTime: string;
  endTime: string;
  day: string; // YYYY-MM-DD
  color?: string;
  isBuffer: boolean;
  order: number;
  notes?: string;
  taskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineBlockWithTask extends TimelineBlock {
  task?: Task;
}

export interface CreateTimelineBlockInput {
  title: string;
  startTime: string;
  endTime: string;
  type?: TimelineBlockType;
  color?: string;
  isBuffer?: boolean;
  notes?: string;
  taskId?: string;
}

export type UpdateTimelineBlockInput = Partial<CreateTimelineBlockInput>;

export interface ReorderBlocksInput {
  orderedIds: string[];
  day?: string;
}

export interface BufferInsertInput {
  minutes?: number;
  color?: string;
  title?: string;
}
