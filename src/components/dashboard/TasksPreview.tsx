import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import { Task, TaskPriority } from '../../types/task';
import { DashboardCard } from './DashboardCard';
import { SectionHeader } from './SectionHeader';

type TasksPreviewProps = {
  tasks: Task[];
  totalCount: number;
  onPressTask: (task: Task) => void;
  onCompleteTask: (taskId: string) => void;
  onSeeAll: () => void;
  onAddTask: () => void;
};

const priorityLabel: Record<TaskPriority, string> = {
  urgent_important: 'High',
  important: 'High',
  urgent: 'High',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'None',
};

const getDueLabel = (dateIso?: string) => {
  if (!dateIso) return undefined;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const d = dateIso.split('T')[0];

  if (d === todayStr) return 'Today';
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  if (d === tomorrowStr) return 'Tomorrow';

  if (d < todayStr) return 'Needs attention';

  // Day name for upcoming
  const dt = new Date(d);
  return dt.toLocaleDateString([], { weekday: 'short' });
};

const formatEstimate = (minutes?: number) => {
  if (!minutes || minutes <= 0) return undefined;
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60}h`;
  return `${minutes}m`;
};

export function TasksPreview({
  tasks,
  totalCount,
  onPressTask,
  onCompleteTask,
  onSeeAll,
  onAddTask,
}: TasksPreviewProps) {
  const theme = useTheme();

  const rightLabel = totalCount > 0 ? `See all (${totalCount})` : 'See all';

  return (
    <View style={styles.container}>
      <SectionHeader title="Tasks Today" rightLabel={rightLabel} onPressRight={onSeeAll} />

      {tasks.length === 0 ? (
        <DashboardCard tone="muted" onPress={onAddTask}>
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>All caught up</Text>
          <Text style={[styles.emptyText, { color: theme.text.secondary }]}>Want to add something small?</Text>
          <Text style={[styles.emptyCta, { color: theme.palette.primary[500] }]}>+ Add task</Text>
        </DashboardCard>
      ) : (
        <DashboardCard padding={0}>
          <View style={styles.list}>
            {tasks.map((task, idx) => {
              const dueLabel = getDueLabel(task.dueDate || task.scheduledDate);
              const estimate = formatEstimate(task.estimatedMinutes);

              const subtaskCount = (task.subtasks || []).length;
              const completedSubtasks = (task.subtasks || []).filter((s) => s.completed).length;

              const metaParts: string[] = [];
              if (task.priority) metaParts.push(priorityLabel[task.priority]);
              if (estimate) metaParts.push(estimate);
              if (dueLabel) metaParts.push(dueLabel);
              if (subtaskCount > 0) metaParts.push(`${completedSubtasks}/${subtaskCount} subtasks`);

              const meta = metaParts.join(' • ');

              const accentColor =
                dueLabel === 'Needs attention'
                  ? theme.palette.danger[500]
                  : task.priority === 'medium'
                    ? theme.palette.warning[500]
                    : task.priority === 'low' || task.priority === 'none'
                      ? theme.palette.gray[400]
                      : theme.palette.danger[500];

              return (
                <View
                  key={task.id}
                  style={[
                    styles.row,
                    idx !== tasks.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => onCompleteTask(task.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Complete task: ${task.title}`}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View style={[styles.checkbox, { borderColor: accentColor }]} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.textCol}
                    onPress={() => onPressTask(task)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Open task: ${task.title}`}
                  >
                    <Text style={[styles.title, { color: theme.text.primary }]} numberOfLines={1}>
                      {task.title}
                    </Text>
                    {meta ? (
                      <Text
                        style={[
                          styles.meta,
                          {
                            color:
                              dueLabel === 'Needs attention'
                                ? theme.palette.danger[600]
                                : theme.text.secondary,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {meta}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </DashboardCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  list: {
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyCta: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '800',
  },
});
