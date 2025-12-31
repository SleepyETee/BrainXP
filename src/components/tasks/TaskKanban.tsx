// Kanban Board View for Tasks
// Provides visual board layout with columns for different task statuses
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Task, TaskStatus } from '../../types/task';
import { TaskCard } from './TaskCard';
import { colors, shadows } from '../../theme/colors';
import { useSettingsStore } from '../../stores/settingsStore';

interface TaskKanbanProps {
  tasks: Task[];
  onTaskPress: (task: Task) => void;
  onTaskComplete: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onTaskSnooze?: (task: Task) => void;
  onTaskMove?: (taskId: string, newStatus: TaskStatus) => void;
}

const STATUS_COLUMNS: { status: TaskStatus; label: string; emoji: string; color: string }[] = [
  { status: 'inbox', label: 'Inbox', emoji: '📥', color: colors.gray[400] },
  { status: 'todo', label: 'To Do', emoji: '📋', color: colors.primary[500] },
  { status: 'in_progress', label: 'In Progress', emoji: '⚡', color: colors.warning[500] },
  { status: 'waiting', label: 'Waiting', emoji: '⏸️', color: colors.gray[500] },
  { status: 'done', label: 'Done', emoji: '✅', color: colors.success[500] },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = Math.min((SCREEN_WIDTH - 80) / STATUS_COLUMNS.length, 160);

export const TaskKanban: React.FC<TaskKanbanProps> = ({
  tasks,
  onTaskPress,
  onTaskComplete,
  onTaskDelete,
  onTaskSnooze,
  onTaskMove,
}) => {
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      inbox: [],
      todo: [],
      in_progress: [],
      waiting: [],
      done: [],
      abandoned: [],
    };

    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  const handleTaskPress = (task: Task) => {
    onTaskPress(task);
  };

  const handleTaskComplete = (task: Task) => {
    onTaskComplete(task);
  };

  const handleTaskDelete = (task: Task) => {
    onTaskDelete(task);
  };

  const handleTaskSnooze = (task: Task) => {
    onTaskSnooze?.(task);
  };

  const handleTaskMove = (task: Task, newStatus: TaskStatus) => {
    if (onTaskMove) {
      onTaskMove(task.id, newStatus);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {STATUS_COLUMNS.map((column, columnIndex) => {
        const columnTasks = tasksByStatus[column.status] || [];
        const taskCount = columnTasks.length;

        return (
          <Animated.View
            key={column.status}
            entering={!reduceMotion ? FadeInDown.delay(columnIndex * 100).springify() : undefined}
            style={[styles.column, { width: COLUMN_WIDTH }]}
          >
            {/* Column Header */}
            <View style={[styles.columnHeader, { borderLeftColor: column.color }]}>
              <View style={styles.columnHeaderContent}>
                <Text style={styles.columnEmoji}>{column.emoji}</Text>
                <Text style={styles.columnLabel}>{column.label}</Text>
                <View style={[styles.countBadge, { backgroundColor: `${column.color}20` }]}>
                  <Text style={[styles.countText, { color: column.color }]}>{taskCount}</Text>
                </View>
              </View>
            </View>

            {/* Tasks */}
            <ScrollView
              style={styles.tasksContainer}
              contentContainerStyle={styles.tasksContent}
              showsVerticalScrollIndicator={false}
            >
              {columnTasks.length === 0 ? (
                <View style={styles.emptyColumn}>
                  <Text style={styles.emptyText}>No tasks</Text>
                </View>
              ) : (
                columnTasks.map((task, index) => (
                  <Animated.View
                    key={task.id}
                    entering={!reduceMotion ? FadeInDown.delay(index * 50) : undefined}
                    style={styles.taskWrapper}
                  >
                    <TaskCard
                      task={task}
                      onPress={() => handleTaskPress(task)}
                      onComplete={() => handleTaskComplete(task)}
                      onDelete={() => handleTaskDelete(task)}
                      onSnooze={onTaskSnooze ? () => handleTaskSnooze(task) : undefined}
                      compact={true}
                      index={index}
                    />
                  </Animated.View>
                ))
              )}
            </ScrollView>

            {/* Quick Move Actions */}
            {columnTasks.length > 0 && onTaskMove && (
              <View style={styles.quickActions}>
                {STATUS_COLUMNS.filter((c) => c.status !== column.status).map((targetColumn) => (
                  <TouchableOpacity
                    key={targetColumn.status}
                    style={[styles.quickActionButton, { backgroundColor: `${targetColumn.color}15` }]}
                    onPress={() => {
                      // Move first task as example (in real app, would have drag-to-move)
                      if (columnTasks[0]) {
                        handleTaskMove(columnTasks[0], targetColumn.status);
                      }
                    }}
                  >
                    <Text style={styles.quickActionEmoji}>{targetColumn.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Animated.View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  column: {
    marginRight: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    ...shadows.sm,
    overflow: 'hidden',
  },
  columnHeader: {
    padding: 12,
    backgroundColor: colors.gray[100],
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  columnHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  columnEmoji: {
    fontSize: 18,
  },
  columnLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[800],
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tasksContainer: {
    flex: 1,
  },
  tasksContent: {
    padding: 8,
    gap: 8,
    minHeight: 200,
  },
  taskWrapper: {
    marginBottom: 8,
  },
  emptyColumn: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.gray[400],
    fontStyle: 'italic',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 8,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    justifyContent: 'center',
  },
  quickActionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionEmoji: {
    fontSize: 14,
  },
});
