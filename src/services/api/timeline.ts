import apiClient from './client';
import {
  BufferInsertInput,
  CreateTimelineBlockInput,
  ReorderBlocksInput,
  TimelineBlock,
  UpdateTimelineBlockInput,
} from '../../types/timeline';

const unwrap = <T>(data: any, key?: string): T => {
  if (key && data?.[key]) return data[key] as T;
  if (key && data?.data?.[key]) return data.data[key] as T;
  if (data?.data) return data.data as T;
  return data as T;
};

export const getTimelineBlocks = async (day?: string): Promise<TimelineBlock[]> => {
  const response = await apiClient.get('/timeline/blocks', {
    params: day ? { day } : undefined,
  });
  return unwrap<TimelineBlock[]>(response.data, 'blocks');
};

export const createTimelineBlock = async (
  input: CreateTimelineBlockInput
): Promise<TimelineBlock> => {
  const response = await apiClient.post('/timeline/blocks', input);
  return unwrap<TimelineBlock>(response.data, 'block');
};

export const updateTimelineBlock = async (
  id: string,
  updates: UpdateTimelineBlockInput
): Promise<TimelineBlock> => {
  const response = await apiClient.put(`/timeline/blocks/${id}`, updates);
  return unwrap<TimelineBlock>(response.data, 'block');
};

export const deleteTimelineBlock = async (id: string): Promise<void> => {
  await apiClient.delete(`/timeline/blocks/${id}`);
};

export const reorderTimelineBlocks = async (
  input: ReorderBlocksInput
): Promise<TimelineBlock[]> => {
  const response = await apiClient.post('/timeline/blocks/reorder', input);
  return unwrap<TimelineBlock[]>(response.data, 'blocks');
};

export const insertBufferBlock = async (
  blockId: string,
  input?: BufferInsertInput
): Promise<TimelineBlock> => {
  const response = await apiClient.post(`/timeline/blocks/${blockId}/buffer`, input);
  return unwrap<TimelineBlock>(response.data, 'block');
};
