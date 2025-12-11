import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../src/stores/taskStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { TaskList } from '../../src/components/tasks/TaskList';
import { DailyListCard } from '../../src/components/notes/DailyListCard';
import { Task, TaskStatus } from '../../src/types/task';
import { colors } from '../../src/theme/colors';
import { useTheme } from '../../src/theme';

type FilterTab = 'all' | 'today' | 'inbox' | 'upcoming' | 'overdue';

const FILTER_TABS: { key: FilterTab; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '📋' },
  { key: 'today', label: 'Today', emoji: '📅' },
  { key: 'inbox', label: 'Inbox', emoji: '📥' },
  { key: 'upcoming', label: 'Upcoming', emoji: '🔜' },
  { key: 'overdue', label: 'Overdue', emoji: '⏰' },
];

export default function TasksScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('today');
  const [quickText, setQuickText] = useState('');
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [activeSmartSlug, setActiveSmartSlug] = useState<string | null>(null);
  const [smartListTasks, setSmartListTasks] = useState<Task[]>([]);
  const [smartListLoading, setSmartListLoading] = useState(false);
  const theme = useTheme();

  // Only select raw data to avoid selector issues
  const tasks = useTaskStore((state) => state.tasks);
  const completeTask = useTaskStore((state) => state.completeTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const isLoading = useTaskStore((state) => state.isLoading);
  const quickAdd = useTaskStore((state) => state.quickAdd);
  const fetchSmartLists = useTaskStore((state) => state.fetchSmartLists);
  const smartLists = useTaskStore((state) => state.smartLists);
  const fetchSmartListTasks = useTaskStore((state) => state.fetchSmartListTasks);
  const fetchTaskWidgets = useTaskStore((state) => state.fetchTaskWidgets);
  const widgetSummary = useTaskStore((state) => state.widgetSummary);

  // Compute derived task lists locally to prevent infinite re-renders
  const todayTasks = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return tasks.filter((t) => {
      if (t.status === 'done' || t.status === 'abandoned') return false;
      if (!t.dueDate) return false;
      const dueDate = t.dueDate.split('T')[0];
      return dueDate === todayStr;
    });
  }, [tasks]);

  const inboxTasks = useMemo(() => {
    return tasks.filter((t) => {
      return !t.dueDate && t.status !== 'done' && t.status !== 'abandoned';
    });
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 7);
    const futureStr = futureDate.toISOString().split('T')[0];

    return tasks.filter((t) => {
      if (t.status === 'done' || t.status === 'abandoned') return false;
      if (!t.dueDate) return false;
      const dueDate = t.dueDate.split('T')[0];
      return dueDate > todayStr && dueDate <= futureStr;
    });
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return tasks.filter((t) => {
      if (t.status === 'done' || t.status === 'abandoned') return false;
      if (!t.dueDate) return false;
      const dueDate = t.dueDate.split('T')[0];
      return dueDate < todayStr;
    });
  }, [tasks]);

  const addXP = useProgressStore((state) => state.addXP);

  const getFilteredTasks = (): Task[] => {
    switch (activeFilter) {
      case 'today':
        return [...overdueTasks, ...todayTasks];
      case 'inbox':
        return inboxTasks;
      case 'upcoming':
        return upcomingTasks;
      case 'overdue':
        return overdueTasks;
      case 'all':
      default:
        return tasks.filter((t) => t.status !== 'abandoned' && !t.parentTaskId);
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

  const filteredTasks = activeSmartSlug ? smartListTasks : getFilteredTasks();
  const handleQuickAdd = async () => {
    if (!quickText.trim()) return;
    try {
      setQuickAddLoading(true);
      await quickAdd(quickText.trim(), { listId: activeFilter === 'inbox' ? 'inbox' : undefined });
      setQuickText('');
    } finally {
      setQuickAddLoading(false);
    }
  };

  const handleSmartListSelect = async (slug: string) => {
    setActiveSmartSlug(slug);
    setSmartListLoading(true);
    try {
      const tasks = await fetchSmartListTasks(slug);
      setSmartListTasks(tasks);
    } finally {
      setSmartListLoading(false);
    }
  };

  useEffect(() => {
    fetchSmartLists();
    fetchTaskWidgets();
  }, [fetchSmartLists, fetchTaskWidgets]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Tasks</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/task/create')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Add */}
      <View style={[styles.quickAddCard, { backgroundColor: theme.background.card, borderColor: theme.border }]}>
        <TextInput
          style={[styles.quickAddInput, { color: theme.text.primary }]}
          placeholder="Quick add with #tags, !!priority, today/tomorrow"
          placeholderTextColor={theme.text.muted}
          value={quickText}
          onChangeText={setQuickText}
          onSubmitEditing={handleQuickAdd}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[
            styles.quickAddButton,
            { backgroundColor: theme.palette.primary[500] },
            quickAddLoading && styles.quickAddButtonDisabled,
          ]}
          onPress={handleQuickAdd}
          disabled={quickAddLoading}
        >
          <Text style={[styles.quickAddButtonText, { color: '#FFF' }]}>
            {quickAddLoading ? 'Adding…' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Smart list summary */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.smartListRow}
      >
        {[
          { key: 'today' as FilterTab, label: 'Today', count: todayTasks.length, color: theme.palette.primary[500] },
          { key: 'overdue' as FilterTab, label: 'Overdue', count: overdueTasks.length, color: theme.palette.danger ? theme.palette.danger[500] : colors.danger[500] },
          { key: 'upcoming' as FilterTab, label: 'Next 7d', count: upcomingTasks.length, color: theme.palette.success ? theme.palette.success[500] : colors.success[500] },
          { key: 'inbox' as FilterTab, label: 'Inbox', count: inboxTasks.length, color: theme.text.secondary },
        ].map((chip) => (
          <TouchableOpacity
            key={chip.key}
            style={[
              styles.smartChip,
              activeFilter === chip.key && { backgroundColor: `${chip.color}20`, borderColor: chip.color },
            ]}
            onPress={() => setActiveFilter(chip.key)}
          >
            <Text style={[styles.smartChipLabel, { color: activeFilter === chip.key ? chip.color : theme.text.secondary }]}>
              {chip.label}
            </Text>
            <View style={[styles.smartChipBadge, { backgroundColor: chip.color }]}>
              <Text style={styles.smartChipBadgeText}>{chip.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Widget-style summary */}
      {widgetSummary && (
        <View style={[styles.widgetCard, { backgroundColor: theme.background.card, borderColor: theme.border }]}>
          <View style={styles.widgetRow}>
            <View style={styles.widgetStat}>
              <Text style={[styles.widgetLabel, { color: theme.text.secondary }]}>Today</Text>
              <Text style={[styles.widgetValue, { color: theme.text.primary }]}>{widgetSummary.today.count}</Text>
            </View>
            <View style={styles.widgetStat}>
              <Text style={[styles.widgetLabel, { color: theme.text.secondary }]}>Next 7 days</Text>
              <Text style={[styles.widgetValue, { color: theme.text.primary }]}>{widgetSummary.next7Days.count}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Daily list (Twos-style) */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <DailyListCard />
      </View>

      {/* Smart Lists */}
      {smartLists.length > 0 && (
        <View style={styles.smartListContainer}>
          <Text style={[styles.smartListTitle, { color: theme.text.primary }]}>Smart lists</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.smartListScroll}>
            {smartLists.map((list) => (
              <TouchableOpacity
                key={list.id}
                style={[
                  styles.smartListChip,
                  {
                    borderColor: activeSmartSlug === list.slug ? (list.color || theme.palette.primary[500]) : theme.border,
                    backgroundColor:
                      activeSmartSlug === list.slug ? `${(list.color || theme.palette.primary[500])}20` : theme.background.card,
                  },
                ]}
                onPress={() => handleSmartListSelect(list.slug)}
              >
                <Text style={[styles.smartListChipText, { color: list.color || theme.text.primary }]}>
                  {list.icon || '⭐'} {list.name}
                </Text>
                {typeof list.taskCount === 'number' && (
                  <View style={[styles.smartListBadge, { backgroundColor: list.color || theme.palette.primary[500] }]}>
                    <Text style={styles.smartListBadgeText}>{list.taskCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          {activeSmartSlug && smartListLoading && (
            <Text style={[styles.smartListLoading, { color: theme.text.secondary }]}>Loading list…</Text>
          )}
        </View>
      )}

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
                activeFilter === tab.key && { borderColor: theme.palette.primary[400] },
              ]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text style={styles.filterEmoji}>{tab.emoji}</Text>
              <Text
                style={[
                  styles.filterLabel,
                  activeFilter === tab.key && styles.filterLabelActive,
                  activeFilter === tab.key && { color: theme.palette.primary[600] },
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
  widgetCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  widgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  widgetStat: {
    flex: 1,
    paddingHorizontal: 8,
  },
  widgetLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  widgetValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  smartListContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 6,
  },
  smartListTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  smartListScroll: {
    gap: 8,
  },
  smartListChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  smartListChipText: {
    fontWeight: '700',
  },
  smartListBadge: {
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  smartListBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  smartListLoading: {
    fontSize: 12,
  },
  quickAddCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickAddInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  quickAddButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAddButtonDisabled: {
    opacity: 0.5,
  },
  quickAddButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  smartListRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  smartChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  smartChipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  smartChipBadge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartChipBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
