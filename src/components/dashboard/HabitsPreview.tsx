import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import { HabitWithLogs } from '../../types/habit';
import { DashboardCard } from './DashboardCard';
import { SectionHeader } from './SectionHeader';

type HabitsPreviewProps = {
  habits: HabitWithLogs[];
  windowDays: number;
  onToggleHabit: (habitId: string) => void;
  onSeeAll: () => void;
  onAddHabit: () => void;
};

const isoDay = (d: Date) => d.toISOString().split('T')[0];

export function HabitsPreview({
  habits,
  windowDays,
  onToggleHabit,
  onSeeAll,
  onAddHabit,
}: HabitsPreviewProps) {
  const theme = useTheme();

  const days = useMemo(() => {
    const today = new Date();
    const result: string[] = [];
    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      result.push(isoDay(d));
    }
    return result;
  }, [windowDays]);

  return (
    <View style={styles.container}>
      <SectionHeader title="Today's Habits" rightLabel="Log all" onPressRight={onSeeAll} />

      {habits.length === 0 ? (
        <DashboardCard tone="muted" onPress={onAddHabit}>
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>Start a habit</Text>
          <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
            Build routines that stick — even on low-energy days.
          </Text>
          <Text style={[styles.emptyCta, { color: theme.palette.primary[500] }]}>+ Create habit</Text>
        </DashboardCard>
      ) : (
        <DashboardCard padding={0}>
          <View style={styles.list}>
            {habits.map((habit, idx) => {
              const completedToday = Boolean(habit.todayLog?.completed);

              const completedCount = habit.logs.filter((l) =>
                l.completed && days.includes(l.date)
              ).length;

              const accent = habit.color || theme.palette.success[500];

              return (
                <TouchableOpacity
                  key={habit.id}
                  onPress={() => onToggleHabit(habit.id)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`${completedToday ? 'Completed' : 'Not completed'} habit: ${habit.name}`}
                  style={[
                    styles.row,
                    idx !== habits.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 },
                  ]}
                >
                  <View style={styles.left}>
                    <View
                      style={[
                        styles.checkCircle,
                        {
                          borderColor: completedToday ? accent : theme.border,
                          backgroundColor: completedToday ? accent : 'transparent',
                        },
                      ]}
                    >
                      {completedToday ? <Text style={styles.checkmark}>✓</Text> : null}
                    </View>
                    <View style={styles.nameCol}>
                      <Text style={[styles.name, { color: theme.text.primary }]} numberOfLines={1}>
                        {habit.icon ? `${habit.icon} ` : ''}{habit.name}
                      </Text>
                      <Text style={[styles.sub, { color: theme.text.secondary }]}>
                        {completedCount}/{windowDays} in last {windowDays} days
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bars}>
                    {days.map((day) => {
                      const log = habit.logs.find((l) => l.date === day);
                      const completed = Boolean(log?.completed);
                      const partial = !completed && Boolean(log?.partialCredit);

                      const barColor = completed
                        ? accent
                        : partial
                          ? `${accent}88`
                          : theme.isDark
                            ? theme.palette.gray[700]
                            : theme.palette.gray[200];

                      return (
                        <View
                          key={day}
                          style={[styles.bar, { backgroundColor: barColor }]}
                        />
                      );
                    })}
                  </View>
                </TouchableOpacity>
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
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    marginTop: -1,
  },
  nameCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  sub: {
    fontSize: 11,
    fontWeight: '600',
  },
  bars: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  bar: {
    width: 4,
    height: 14,
    borderRadius: 2,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  emptyCta: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '800',
  },
});
