import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ListRenderItem,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  Layout,
  SlideInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
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
  onAddTask?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: string;
  showSections?: boolean;
  compact?: boolean;
  ListHeaderComponent?: React.ReactElement;
  ListFooterComponent?: React.ReactElement;
}

interface SectionData {
  title: string;
  icon: string;
  color: string;
  data: Task[];
}

// Skeleton loader for tasks
const TaskSkeleton: React.FC<{ index: number }> = ({ index }) => (
  <Animated.View
    entering={FadeIn.delay(index * 100)}
    style={styles.skeletonCard}
  >
    <View style={styles.skeletonCheckbox} />
    <View style={styles.skeletonContent}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonMeta} />
    </View>
  </Animated.View>
);

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onTaskPress,
  onTaskComplete,
  onTaskDelete,
  onTaskSnooze,
  onRefresh,
  onAddTask,
  isRefreshing = false,
  isLoading = false,
  emptyMessage = 'No tasks yet',
  emptyDescription = 'Tap the + button to add your first task',
  emptyIcon = '📋',
  showSections = false,
  compact = false,
  ListHeaderComponent,
  ListFooterComponent,
}) => {
  const renderItem: ListRenderItem<Task> = useCallback(
    ({ item, index }) => (
      <TaskCard
        task={item}
        onPress={() => onTaskPress(item)}
        onComplete={() => onTaskComplete(item)}
        onDelete={() => onTaskDelete(item)}
        onSnooze={onTaskSnooze ? () => onTaskSnooze(item) : undefined}
        compact={compact}
        index={index}
      />
    ),
    [onTaskPress, onTaskComplete, onTaskDelete, onTaskSnooze, compact]
  );

  const keyExtractor = useCallback((item: Task) => item.id, []);

  // Loading state with skeletons
  if (isLoading && tasks.length === 0) {
    return (
      <View style={styles.listContent}>
        {ListHeaderComponent}
        {[0, 1, 2, 3].map((i) => (
          <TaskSkeleton key={i} index={i} />
        ))}
      </View>
    );
  }

  const renderEmpty = () => (
    <Animated.View 
      entering={FadeInUp.delay(200).springify()}
      style={styles.emptyContainer}
    >
      <View style={styles.emptyIconContainer}>
        <LinearGradient
          colors={[colors.primary[50], colors.primary[100]]}
          style={styles.emptyIconGradient}
        >
          <Text style={styles.emptyEmoji}>{emptyIcon}</Text>
        </LinearGradient>
      </View>
      <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      <Text style={styles.emptyDescription}>{emptyDescription}</Text>
      {onAddTask && (
        <TouchableOpacity
          style={styles.emptyAddButton}
          onPress={onAddTask}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary[500], colors.primary[600]]}
            style={styles.emptyAddButtonGradient}
          >
            <Text style={styles.emptyAddButtonText}>+ Add Task</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  const ItemSeparator = () => <View style={styles.separator} />;

  // Section header component
  const renderSectionHeader = (section: SectionData) => (
    <Animated.View 
      entering={SlideInRight.delay(100)}
      style={styles.sectionHeader}
    >
      <View style={[styles.sectionIconContainer, { backgroundColor: `${section.color}15` }]}>
        <Text style={styles.sectionIcon}>{section.icon}</Text>
      </View>
      <Text style={[styles.sectionTitle, { color: section.color }]}>{section.title}</Text>
      <View style={[styles.sectionBadge, { backgroundColor: section.color }]}>
        <Text style={styles.sectionBadgeText}>{section.data.length}</Text>
      </View>
    </Animated.View>
  );

  if (showSections) {
    const sections = groupTasksIntoSections(tasks);

    return (
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            {ListHeaderComponent}
            {sections.length === 0 && renderEmpty()}
            {sections.map((section, sectionIndex) => (
              <Animated.View 
                key={section.title} 
                style={styles.section}
                entering={FadeInDown.delay(sectionIndex * 100)}
                layout={Layout.springify()}
              >
                {renderSectionHeader(section)}
                {section.data.map((task, taskIndex) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onPress={() => onTaskPress(task)}
                    onComplete={() => onTaskComplete(task)}
                    onDelete={() => onTaskDelete(task)}
                    onSnooze={onTaskSnooze ? () => onTaskSnooze(task) : undefined}
                    compact={compact}
                    index={taskIndex}
                  />
                ))}
              </Animated.View>
            ))}
          </>
        }
        ListFooterComponent={ListFooterComponent}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary[500]}
              colors={[colors.primary[500]]}
            />
          ) : undefined
        }
        contentContainerStyle={[
          styles.listContent,
          sections.length === 0 && styles.emptyListContent,
        ]}
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
            colors={[colors.primary[500]]}
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
    sections.push({ 
      title: 'Needs Attention', 
      icon: '🚨', 
      color: colors.danger[500],
      data: overdue 
    });
  }
  if (todayTasks.length > 0) {
    sections.push({ 
      title: 'Today', 
      icon: '📅', 
      color: colors.primary[500],
      data: todayTasks 
    });
  }
  if (thisWeekTasks.length > 0) {
    sections.push({ 
      title: 'This Week', 
      icon: '📆', 
      color: colors.success[500],
      data: thisWeekTasks 
    });
  }
  if (laterTasks.length > 0) {
    sections.push({ 
      title: 'Later', 
      icon: '🔮', 
      color: colors.gray[500],
      data: laterTasks 
    });
  }
  if (noDueDateTasks.length > 0) {
    sections.push({ 
      title: 'No Due Date', 
      icon: '📥', 
      color: colors.gray[400],
      data: noDueDateTasks 
    });
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
  // Empty state styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyMessage: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[700],
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyAddButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyAddButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyAddButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Section styles
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  sectionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIcon: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sectionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Skeleton styles
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    alignItems: 'center',
  },
  skeletonCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray[200],
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonTitle: {
    height: 16,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    width: '70%',
  },
  skeletonMeta: {
    height: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    width: '40%',
  },
});

export default TaskList;
