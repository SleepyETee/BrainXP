import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../src/stores/taskStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { TaskList } from '../../src/components/tasks/TaskList';
import { Task, TaskStatus } from '../../src/types/task';
import { colors } from '../../src/theme/colors';

type FilterTab = 'all' | 'today' | 'inbox' | 'upcoming';

const FILTER_TABS: { key: FilterTab; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '📋' },
  { key: 'today', label: 'Today', emoji: '📅' },
  { key: 'inbox', label: 'Inbox', emoji: '📥' },
  { key: 'upcoming', label: 'Upcoming', emoji: '🔜' },
];

export default function TasksScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('today');

  const tasks = useTaskStore((state) => state.tasks);
  const todayTasks = useTaskStore((state) => state.getTodayTasks());
  const inboxTasks = useTaskStore((state) => state.getInboxTasks());
  const upcomingTasks = useTaskStore((state) => state.getUpcomingTasks(7));
  const overdueTasks = useTaskStore((state) => state.getOverdueTasks());
  const completeTask = useTaskStore((state) => state.completeTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const isLoading = useTaskStore((state) => state.isLoading);

  const addXP = useProgressStore((state) => state.addXP);

  const getFilteredTasks = (): Task[] => {
    switch (activeFilter) {
      case 'today':
        return [...overdueTasks, ...todayTasks];
      case 'inbox':
        return inboxTasks;
      case 'upcoming':
        return upcomingTasks;
      case 'all':
      default:
        return tasks.filter(
          (t) => t.status !== 'done' && t.status !== 'abandoned' && !t.parentTaskId
        );
    }
  };

  const handleTaskPress = (task: Task) => {
    router.push(`/task/${task.id}`);
  };

  const handleTaskComplete = async (task: Task) => {
    const result = await completeTask(task.id);
    await addXP(result.xpEarned, 'task_complete', 'Completed a task', task.id);
  };

  const handleTaskDelete = async (task: Task) => {
    await deleteTask(task.id);
  };

  const filteredTasks = getFilteredTasks();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/task/create')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                activeFilter === tab.key && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text style={styles.filterEmoji}>{tab.emoji}</Text>
              <Text
                style={[
                  styles.filterLabel,
                  activeFilter === tab.key && styles.filterLabelActive,
                ]}
              >
                {tab.label}
              </Text>
              {tab.key === 'inbox' && inboxTasks.length > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{inboxTasks.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Task List */}
      <TaskList
        tasks={filteredTasks}
        onTaskPress={handleTaskPress}
        onTaskComplete={handleTaskComplete}
        onTaskDelete={handleTaskDelete}
        onRefresh={fetchTasks}
        isRefreshing={isLoading}
        emptyMessage={
          activeFilter === 'inbox'
            ? 'Inbox is empty'
            : activeFilter === 'today'
            ? 'No tasks for today'
            : 'No tasks yet'
        }
        emptyDescription={
          activeFilter === 'inbox'
            ? 'Quick capture items will appear here'
            : 'Tap + to add your first task'
        }
        showSections={activeFilter === 'all' || activeFilter === 'today'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[800],
  },
  addButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  filterContainer: {
    paddingBottom: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    gap: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  filterTabActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  filterEmoji: {
    fontSize: 14,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
  },
  filterLabelActive: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 2,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
