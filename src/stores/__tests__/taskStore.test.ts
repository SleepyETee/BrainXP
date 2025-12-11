// filepath: /Users/sleepyet/BrainXP/src/stores/__tests__/taskStore.test.ts
import { act, renderHook } from '@testing-library/react-native';
import { useTaskStore } from '../taskStore';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../services/upshift', () => ({
  syncTask: jest.fn(),
}));

jest.mock('../authStore', () => ({
  useAuthStore: {
    getState: () => ({ user: { id: 'test-user-123' } }),
  },
}));

describe('taskStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useTaskStore.setState({
        tasks: [],
        isLoading: false,
        error: null,
      });
    });
  });

  describe('createTask', () => {
    it('should create a new task with default values', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Buy groceries',
        });
      });

      expect(task).toBeDefined();
      expect(task.title).toBe('Buy groceries');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.completed).toBe(false);
      expect(result.current.tasks).toHaveLength(1);
    });

    it('should create a task with all custom properties', async () => {
      const { result } = renderHook(() => useTaskStore());

      const dueDate = new Date('2024-12-25');
      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Important Meeting',
          description: 'Quarterly review with the team',
          priority: 'high',
          dueDate: dueDate.toISOString(),
          estimatedMinutes: 60,
          energyLevel: 'high',
          tags: ['work', 'meeting'],
        });
      });

      expect(task.title).toBe('Important Meeting');
      expect(task.description).toBe('Quarterly review with the team');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toBe(dueDate.toISOString());
      expect(task.estimatedMinutes).toBe(60);
      expect(task.energyLevel).toBe('high');
      expect(task.tags).toEqual(['work', 'meeting']);
    });

    it('should create a task with subtasks', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Project Setup',
          subtasks: [
            { title: 'Create repository', completed: false },
            { title: 'Setup CI/CD', completed: false },
            { title: 'Write documentation', completed: false },
          ],
        });
      });

      expect(task.subtasks).toHaveLength(3);
      expect(task.subtasks[0].title).toBe('Create repository');
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Original Title',
          priority: 'low',
        });
      });

      await act(async () => {
        await result.current.updateTask(task.id, {
          title: 'Updated Title',
          priority: 'high',
        });
      });

      const updatedTask = result.current.getTaskById(task.id);
      expect(updatedTask?.title).toBe('Updated Title');
      expect(updatedTask?.priority).toBe('high');
    });

    it('should update task status', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Status Test',
        });
      });

      await act(async () => {
        await result.current.updateTask(task.id, {
          status: 'in_progress',
        });
      });

      const updatedTask = result.current.getTaskById(task.id);
      expect(updatedTask?.status).toBe('in_progress');
    });
  });

  describe('completeTask', () => {
    it('should mark a task as completed and return XP', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Complete Me',
          priority: 'medium',
        });
      });

      let completionResult: any;
      await act(async () => {
        completionResult = await result.current.completeTask(task.id);
      });

      const completedTask = result.current.getTaskById(task.id);
      expect(completedTask?.completed).toBe(true);
      expect(completedTask?.completedAt).toBeDefined();
      expect(completedTask?.status).toBe('done');
      expect(completionResult.xpEarned).toBeGreaterThan(0);
    });

    it('should award more XP for high priority tasks', async () => {
      const { result } = renderHook(() => useTaskStore());

      let lowTask: any;
      let highTask: any;

      await act(async () => {
        lowTask = await result.current.createTask({
          title: 'Low Priority',
          priority: 'low',
        });
        highTask = await result.current.createTask({
          title: 'High Priority',
          priority: 'high',
        });
      });

      let lowResult: any;
      let highResult: any;

      await act(async () => {
        lowResult = await result.current.completeTask(lowTask.id);
        highResult = await result.current.completeTask(highTask.id);
      });

      expect(highResult.xpEarned).toBeGreaterThan(lowResult.xpEarned);
    });

    it('should award bonus XP for completing before due date', async () => {
      const { result } = renderHook(() => useTaskStore());

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Early Task',
          dueDate: futureDate.toISOString(),
          priority: 'medium',
        });
      });

      let completionResult: any;
      await act(async () => {
        completionResult = await result.current.completeTask(task.id);
      });

      // Should include early completion bonus
      expect(completionResult.xpEarned).toBeGreaterThanOrEqual(20);
    });
  });

  describe('uncompleteTask', () => {
    it('should mark a completed task as incomplete', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Toggle Task',
        });
      });

      await act(async () => {
        await result.current.completeTask(task.id);
      });

      expect(result.current.getTaskById(task.id)?.completed).toBe(true);

      await act(async () => {
        await result.current.uncompleteTask(task.id);
      });

      const uncompleted = result.current.getTaskById(task.id);
      expect(uncompleted?.completed).toBe(false);
      expect(uncompleted?.completedAt).toBeNull();
      expect(uncompleted?.status).toBe('todo');
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'To Delete',
        });
      });

      expect(result.current.tasks).toHaveLength(1);

      await act(async () => {
        await result.current.deleteTask(task.id);
      });

      expect(result.current.tasks).toHaveLength(0);
    });
  });

  describe('subtask operations', () => {
    it('should add a subtask to a task', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Parent Task',
        });
      });

      await act(async () => {
        await result.current.addSubtask(task.id, { title: 'New Subtask' });
      });

      const updated = result.current.getTaskById(task.id);
      expect(updated?.subtasks).toHaveLength(1);
      expect(updated?.subtasks?.[0].title).toBe('New Subtask');
    });

    it('should add multiple subtasks in sequence and preserve order', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Parent Task',
        });
      });

      await act(async () => {
        await result.current.addSubtask(task.id, { title: 'First Subtask' });
        await result.current.addSubtask(task.id, { title: 'Second Subtask' });
        await result.current.addSubtask(task.id, { title: 'Third Subtask' });
      });

      const updated = result.current.getTaskById(task.id);
      expect(updated?.subtasks).toHaveLength(3);
      expect(updated?.subtasks?.[0].title).toBe('First Subtask');
      expect(updated?.subtasks?.[1].title).toBe('Second Subtask');
      expect(updated?.subtasks?.[2].title).toBe('Third Subtask');
    });

    it('should add a subtask with pre-completed state', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Parent Task',
        });
      });

      let newSubtask: any;
      await act(async () => {
        newSubtask = await result.current.addSubtask(task.id, { 
          title: 'Already Done Subtask', 
          completed: true 
        });
      });

      const updated = result.current.getTaskById(task.id);
      expect(updated?.subtasks?.[0].completed).toBe(true);
      expect(newSubtask.id).toBeDefined();
      expect(newSubtask.completed).toBe(true);
    });

    it('should generate unique IDs for each subtask', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Parent Task',
        });
      });

      let subtask1: any, subtask2: any;
      await act(async () => {
        subtask1 = await result.current.addSubtask(task.id, { title: 'Subtask 1' });
        subtask2 = await result.current.addSubtask(task.id, { title: 'Subtask 2' });
      });

      expect(subtask1.id).toBeDefined();
      expect(subtask2.id).toBeDefined();
      expect(subtask1.id).not.toBe(subtask2.id);
    });

    it('should throw error when adding subtask to non-existent task', async () => {
      const { result } = renderHook(() => useTaskStore());

      await expect(
        act(async () => {
          await result.current.addSubtask('non-existent-id', { title: 'Orphan Subtask' });
        })
      ).rejects.toThrow('Task not found');
    });

    it('should toggle a subtask completion', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Parent Task',
          subtasks: [{ title: 'Subtask 1', completed: false }],
        });
      });

      const subtaskId = result.current.getTaskById(task.id)?.subtasks?.[0].id;

      await act(async () => {
        await result.current.toggleSubtask(task.id, subtaskId!);
      });

      const updated = result.current.getTaskById(task.id);
      expect(updated?.subtasks?.[0].completed).toBe(true);
    });

    it('should toggle subtask back to incomplete', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Parent Task',
          subtasks: [{ title: 'Subtask 1', completed: true }],
        });
      });

      const subtaskId = result.current.getTaskById(task.id)?.subtasks?.[0].id;

      await act(async () => {
        await result.current.toggleSubtask(task.id, subtaskId!);
      });

      const updated = result.current.getTaskById(task.id);
      expect(updated?.subtasks?.[0].completed).toBe(false);
    });

    it('should toggle only the targeted subtask without affecting others', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Parent Task',
          subtasks: [
            { title: 'Subtask 1', completed: false },
            { title: 'Subtask 2', completed: false },
            { title: 'Subtask 3', completed: true },
          ],
        });
      });

      const subtasks = result.current.getTaskById(task.id)?.subtasks;
      const secondSubtaskId = subtasks?.[1].id;

      await act(async () => {
        await result.current.toggleSubtask(task.id, secondSubtaskId!);
      });

      const updated = result.current.getTaskById(task.id);
      expect(updated?.subtasks?.[0].completed).toBe(false); // unchanged
      expect(updated?.subtasks?.[1].completed).toBe(true);  // toggled
      expect(updated?.subtasks?.[2].completed).toBe(true);  // unchanged
    });

    it('should throw error when toggling subtask on non-existent task', async () => {
      const { result } = renderHook(() => useTaskStore());

      await expect(
        act(async () => {
          await result.current.toggleSubtask('non-existent-task', 'some-subtask-id');
        })
      ).rejects.toThrow('Task not found');
    });

    it('should delete a subtask', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Parent Task',
          subtasks: [
            { title: 'Subtask 1', completed: false },
            { title: 'Subtask 2', completed: false },
          ],
        });
      });

      const subtaskId = result.current.getTaskById(task.id)?.subtasks?.[0].id;

      await act(async () => {
        await result.current.deleteSubtask(task.id, subtaskId!);
      });

      const updated = result.current.getTaskById(task.id);
      expect(updated?.subtasks).toHaveLength(1);
      expect(updated?.subtasks?.[0].title).toBe('Subtask 2');
    });

    it('should delete a subtask from the middle of the list', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Parent Task',
          subtasks: [
            { title: 'First', completed: false },
            { title: 'Middle', completed: true },
            { title: 'Last', completed: false },
          ],
        });
      });

      const subtasks = result.current.getTaskById(task.id)?.subtasks;
      const middleSubtaskId = subtasks?.[1].id;

      await act(async () => {
        await result.current.deleteSubtask(task.id, middleSubtaskId!);
      });

      const updated = result.current.getTaskById(task.id);
      expect(updated?.subtasks).toHaveLength(2);
      expect(updated?.subtasks?.[0].title).toBe('First');
      expect(updated?.subtasks?.[1].title).toBe('Last');
    });

    it('should delete the last remaining subtask leaving an empty array', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Parent Task',
          subtasks: [{ title: 'Only Subtask', completed: false }],
        });
      });

      const subtaskId = result.current.getTaskById(task.id)?.subtasks?.[0].id;

      await act(async () => {
        await result.current.deleteSubtask(task.id, subtaskId!);
      });

      const updated = result.current.getTaskById(task.id);
      expect(updated?.subtasks).toHaveLength(0);
      expect(updated?.subtasks).toEqual([]);
    });

    it('should throw error when deleting subtask from non-existent task', async () => {
      const { result } = renderHook(() => useTaskStore());

      await expect(
        act(async () => {
          await result.current.deleteSubtask('non-existent-task', 'some-subtask-id');
        })
      ).rejects.toThrow('Task not found');
    });

    it('should handle deleting non-existent subtask gracefully', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Parent Task',
          subtasks: [{ title: 'Subtask 1', completed: false }],
        });
      });

      // Attempt to delete a subtask that doesn't exist
      await act(async () => {
        await result.current.deleteSubtask(task.id, 'non-existent-subtask-id');
      });

      // Original subtask should remain
      const updated = result.current.getTaskById(task.id);
      expect(updated?.subtasks).toHaveLength(1);
      expect(updated?.subtasks?.[0].title).toBe('Subtask 1');
    });

    it('should update task updatedAt timestamp when modifying subtasks', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Parent Task',
        });
      });

      const originalUpdatedAt = result.current.getTaskById(task.id)?.updatedAt;

      // Small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await act(async () => {
        await result.current.addSubtask(task.id, { title: 'New Subtask' });
      });

      const updated = result.current.getTaskById(task.id);
      expect(updated?.updatedAt).not.toBe(originalUpdatedAt);
      expect(new Date(updated?.updatedAt!).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt!).getTime()
      );
    });

    it('should handle complex subtask workflow: add, toggle, delete', async () => {
      const { result } = renderHook(() => useTaskStore());

      // Create task with initial subtasks
      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          title: 'Complex Workflow Task',
          subtasks: [
            { title: 'Initial Subtask', completed: false },
          ],
        });
      });

      // Add more subtasks
      await act(async () => {
        await result.current.addSubtask(task.id, { title: 'Added Subtask 1' });
        await result.current.addSubtask(task.id, { title: 'Added Subtask 2' });
      });

      expect(result.current.getTaskById(task.id)?.subtasks).toHaveLength(3);

      // Toggle some subtasks
      const subtasks = result.current.getTaskById(task.id)?.subtasks;
      await act(async () => {
        await result.current.toggleSubtask(task.id, subtasks![0].id);
        await result.current.toggleSubtask(task.id, subtasks![2].id);
      });

      let currentSubtasks = result.current.getTaskById(task.id)?.subtasks;
      expect(currentSubtasks?.[0].completed).toBe(true);
      expect(currentSubtasks?.[1].completed).toBe(false);
      expect(currentSubtasks?.[2].completed).toBe(true);

      // Delete the middle subtask
      await act(async () => {
        await result.current.deleteSubtask(task.id, currentSubtasks![1].id);
      });

      const finalSubtasks = result.current.getTaskById(task.id)?.subtasks;
      expect(finalSubtasks).toHaveLength(2);
      expect(finalSubtasks?.[0].title).toBe('Initial Subtask');
      expect(finalSubtasks?.[0].completed).toBe(true);
      expect(finalSubtasks?.[1].title).toBe('Added Subtask 2');
      expect(finalSubtasks?.[1].completed).toBe(true);
    });
  });

  describe('selectors', () => {
    describe('getTaskById', () => {
      it('should return task by id', async () => {
        const { result } = renderHook(() => useTaskStore());

        let task: any;
        await act(async () => {
          task = await result.current.createTask({
            title: 'Find Me',
          });
        });

        const found = result.current.getTaskById(task.id);
        expect(found?.title).toBe('Find Me');
      });

      it('should return undefined for non-existent id', () => {
        const { result } = renderHook(() => useTaskStore());
        const found = result.current.getTaskById('non-existent');
        expect(found).toBeUndefined();
      });
    });

    describe('getTasksByStatus', () => {
      it('should filter tasks by status', async () => {
        const { result } = renderHook(() => useTaskStore());

        await act(async () => {
          await result.current.createTask({ title: 'Todo 1' });
          await result.current.createTask({ title: 'Todo 2' });
        });

        let task3: any;
        await act(async () => {
          task3 = await result.current.createTask({ title: 'In Progress' });
        });

        await act(async () => {
          await result.current.updateTask(task3.id, { status: 'in_progress' });
        });

        const todoTasks = result.current.getTasksByStatus('todo');
        const inProgressTasks = result.current.getTasksByStatus('in_progress');

        expect(todoTasks).toHaveLength(2);
        expect(inProgressTasks).toHaveLength(1);
      });
    });

    describe('getTasksByPriority', () => {
      it('should filter tasks by priority', async () => {
        const { result } = renderHook(() => useTaskStore());

        await act(async () => {
          await result.current.createTask({ title: 'High 1', priority: 'high' });
          await result.current.createTask({ title: 'Low 1', priority: 'low' });
          await result.current.createTask({ title: 'High 2', priority: 'high' });
        });

        const highPriority = result.current.getTasksByPriority('high');
        const lowPriority = result.current.getTasksByPriority('low');

        expect(highPriority).toHaveLength(2);
        expect(lowPriority).toHaveLength(1);
      });
    });

    describe('getTodayTasks', () => {
      it('should return tasks due today', async () => {
        const { result } = renderHook(() => useTaskStore());

        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        await act(async () => {
          await result.current.createTask({
            title: 'Today Task',
            dueDate: new Date(today).toISOString(),
          });
          await result.current.createTask({
            title: 'Tomorrow Task',
            dueDate: tomorrow.toISOString(),
          });
          await result.current.createTask({
            title: 'No Due Date',
          });
        });

        const todayTasks = result.current.getTodayTasks();
        expect(todayTasks.some(t => t.title === 'Today Task')).toBe(true);
      });
    });

    describe('getOverdueTasks', () => {
      it('should return overdue tasks', async () => {
        const { result } = renderHook(() => useTaskStore());

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        await act(async () => {
          await result.current.createTask({
            title: 'Overdue Task',
            dueDate: yesterday.toISOString(),
          });
          await result.current.createTask({
            title: 'Future Task',
            dueDate: tomorrow.toISOString(),
          });
        });

        const overdue = result.current.getOverdueTasks();
        expect(overdue).toHaveLength(1);
        expect(overdue[0].title).toBe('Overdue Task');
      });
    });

    describe('getCompletedTasks', () => {
      it('should return completed tasks', async () => {
        const { result } = renderHook(() => useTaskStore());

        let task1: any;
        await act(async () => {
          task1 = await result.current.createTask({ title: 'To Complete' });
          await result.current.createTask({ title: 'Incomplete' });
        });

        await act(async () => {
          await result.current.completeTask(task1.id);
        });

        const completed = result.current.getCompletedTasks();
        expect(completed).toHaveLength(1);
        expect(completed[0].title).toBe('To Complete');
      });
    });

    describe('getIncompleteTasks', () => {
      it('should return incomplete tasks', async () => {
        const { result } = renderHook(() => useTaskStore());

        let task1: any;
        await act(async () => {
          task1 = await result.current.createTask({ title: 'To Complete' });
          await result.current.createTask({ title: 'Incomplete 1' });
          await result.current.createTask({ title: 'Incomplete 2' });
        });

        await act(async () => {
          await result.current.completeTask(task1.id);
        });

        const incomplete = result.current.getIncompleteTasks();
        expect(incomplete).toHaveLength(2);
      });
    });
  });

  describe('search and filtering', () => {
    it('should search tasks by title', async () => {
      const { result } = renderHook(() => useTaskStore());

      await act(async () => {
        await result.current.createTask({ title: 'Buy groceries' });
        await result.current.createTask({ title: 'Buy new shoes' });
        await result.current.createTask({ title: 'Call mom' });
      });

      const buyTasks = result.current.searchTasks('buy');
      expect(buyTasks).toHaveLength(2);
    });

    it('should filter tasks by tags', async () => {
      const { result } = renderHook(() => useTaskStore());

      await act(async () => {
        await result.current.createTask({ title: 'Work Task', tags: ['work'] });
        await result.current.createTask({ title: 'Personal Task', tags: ['personal'] });
        await result.current.createTask({ title: 'Both', tags: ['work', 'personal'] });
      });

      const workTasks = result.current.getTasksByTag('work');
      expect(workTasks).toHaveLength(2);
    });
  });

  describe('bulk operations', () => {
    it('should complete multiple tasks', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task1: any, task2: any, task3: any;
      await act(async () => {
        task1 = await result.current.createTask({ title: 'Task 1' });
        task2 = await result.current.createTask({ title: 'Task 2' });
        task3 = await result.current.createTask({ title: 'Task 3' });
      });

      await act(async () => {
        await result.current.bulkComplete([task1.id, task2.id]);
      });

      expect(result.current.getTaskById(task1.id)?.completed).toBe(true);
      expect(result.current.getTaskById(task2.id)?.completed).toBe(true);
      expect(result.current.getTaskById(task3.id)?.completed).toBe(false);
    });

    it('should delete multiple tasks', async () => {
      const { result } = renderHook(() => useTaskStore());

      let task1: any, task2: any;
      await act(async () => {
        task1 = await result.current.createTask({ title: 'Task 1' });
        task2 = await result.current.createTask({ title: 'Task 2' });
        await result.current.createTask({ title: 'Task 3' });
      });

      await act(async () => {
        await result.current.bulkDelete([task1.id, task2.id]);
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].title).toBe('Task 3');
    });
  });
});
