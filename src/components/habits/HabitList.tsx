import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { HabitWithLogs } from '../../types/habit';
import { HabitCard } from './HabitCard';
import { colors } from '../../theme/colors';

interface HabitListProps {
  habits: HabitWithLogs[];
  onHabitPress: (habit: HabitWithLogs) => void;
  onHabitToggle: (habitId: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  emptyMessage?: string;
  showStreak?: boolean;
}

export const HabitList: React.FC<HabitListProps> = ({
  habits,
  onHabitPress,
  onHabitToggle,
  isLoading = false,
  onRefresh,
  emptyMessage = "No habits yet. Create your first habit!",
  showStreak = true,
}) => {
  const renderItem = ({ item }: { item: HabitWithLogs }) => (
    <HabitCard
      habit={item}
      onPress={() => onHabitPress(item)}
      onToggle={() => onHabitToggle(item.id)}
      showStreak={showStreak}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🌱</Text>
      <Text style={styles.emptyTitle}>Start Building Habits</Text>
      <Text style={styles.emptyMessage}>{emptyMessage}</Text>
    </View>
  );

  const completedCount = habits.filter((h) => h.todayLog?.completed).length;
  const totalCount = habits.length;

  return (
    <View style={styles.container}>
      {habits.length > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {completedCount} of {totalCount} complete today
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(completedCount / totalCount) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      <FlatList
        data={habits}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={habits.length === 0 && styles.emptyList}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  summaryText: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '500',
  },
  progressBar: {
    width: 100,
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success[500],
    borderRadius: 3,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
  },
});

export default HabitList;

