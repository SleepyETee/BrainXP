import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { Task } from '../../types/task';
import { TaskCard } from './TaskCard';
import { colors } from '../../theme/colors';

interface TaskListProps {
  tasks: Task[];
  onTaskPress: (task: Task) => void;
  onTaskComplete: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onTaskSnooze?: (task: Task) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  showSections?: boolean;
  compact?: boolean;
  ListHeaderComponent?: React.ReactElement;
  ListFooterComponent?: React.ReactElement;
}

interface SectionData {
  title: string;
  data: Task[];
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onTaskPress,
  onTaskComplete,
  onTaskDelete,
  onTaskSnooze,
  onRefresh,
  isRefreshing = false,
  emptyMessage = 'No tasks yet',
  emptyDescription = 'Tap the + button to add your first task',
  showSections = false,
  compact = false,
  ListHeaderComponent,
  ListFooterComponent,
}) => {
  const renderItem: ListRenderItem<Task> = useCallback(
    ({ item }) => (
      <TaskCard
        task={item}
        onPress={() => onTaskPress(item)}
        onComplete={() => onTaskComplete(item)}
        onDelete={() => onTaskDelete(item)}
        onSnooze={onTaskSnooze ? () => onTaskSnooze(item) : undefined}
        compact={compact}
      />
    ),
    [onTaskPress, onTaskComplete, onTaskDelete, onTaskSnooze, compact]
  );

  const keyExtractor = useCallback((item: Task) => item.id, []);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📋</Text>
      <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      <Text style={styles.emptyDescription}>{emptyDescription}</Text>
    </View>
  );

  const ItemSeparator = () => <View style={styles.separator} />;

  if (showSections) {
    const sections = groupTasksIntoSections(tasks);

    return (
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            {ListHeaderComponent}
            {sections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.data.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onPress={() => onTaskPress(task)}
                    onComplete={() => onTaskComplete(task)}
                    onDelete={() => onTaskDelete(task)}
                    onSnooze={onTaskSnooze ? () => onTaskSnooze(task) : undefined}
                    compact={compact}
                  />
                ))}
              </View>
            ))}
          </>
        }
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={tasks.length === 0 ? renderEmpty : null}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary[500]}
            />
          ) : undefined
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <FlatList
      data={tasks}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={ItemSeparator}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        ) : undefined
      }
      contentContainerStyle={[
        styles.listContent,
        tasks.length === 0 && styles.emptyListContent,
      ]}
      showsVerticalScrollIndicator={false}
    />
  );
};

function groupTasksIntoSections(tasks: Task[]): SectionData[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const sections: SectionData[] = [];

  const overdue = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'done') return false;
    return new Date(t.dueDate) < today;
  });

  const todayTasks = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'done') return false;
    const dueDate = new Date(t.dueDate);
    return dueDate >= today && dueDate < tomorrow;
  });

  const thisWeekTasks = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'done') return false;
    const dueDate = new Date(t.dueDate);
    return dueDate >= tomorrow && dueDate < nextWeek;
  });

  const laterTasks = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'done') return false;
    return new Date(t.dueDate) >= nextWeek;
  });

  const noDueDateTasks = tasks.filter((t) => !t.dueDate && t.status !== 'done');

  if (overdue.length > 0) {
    sections.push({ title: 'Needs Attention', data: overdue });
  }
  if (todayTasks.length > 0) {
    sections.push({ title: 'Today', data: todayTasks });
  }
  if (thisWeekTasks.length > 0) {
    sections.push({ title: 'This Week', data: thisWeekTasks });
  }
  if (laterTasks.length > 0) {
    sections.push({ title: 'Later', data: laterTasks });
  }
  if (noDueDateTasks.length > 0) {
    sections.push({ title: 'No Due Date', data: noDueDateTasks });
  }

  return sections;
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 8,
  },
  emptyListContent: {
    flex: 1,
  },
  separator: {
    height: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[700],
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

export default TaskList;
