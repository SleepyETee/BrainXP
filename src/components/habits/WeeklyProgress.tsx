import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HabitLog } from '../../types/habit';
import { colors } from '../../theme/colors';
import { format, subDays, startOfDay } from 'date-fns';

interface WeeklyProgressProps {
  logs: HabitLog[];
  targetCount?: number;
  color?: string;
}

export const WeeklyProgress: React.FC<WeeklyProgressProps> = ({
  logs,
  targetCount = 1,
  color = colors.success[500],
}) => {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    return {
      date,
      dayLabel: format(date, 'EEE')[0], // M, T, W, etc.
      dateStr: format(date, 'yyyy-MM-dd'),
      isToday: i === 6,
    };
  });

  const getCompletionLevel = (dateStr: string): number => {
    const log = logs.find((l) => l.date.startsWith(dateStr));
    if (!log) return 0;
    if (log.completed) return 1;
    if (log.partialCredit) return log.partialCredit;
    return 0;
  };

  return (
    <View style={styles.container}>
      {days.map((day, index) => {
        const completion = getCompletionLevel(day.dateStr);
        const isCompleted = completion >= 1;
        const isPartial = completion > 0 && completion < 1;

        return (
          <View key={index} style={styles.dayColumn}>
            <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
              {day.dayLabel}
            </Text>
            <View
              style={[
                styles.circle,
                isCompleted && [styles.circleCompleted, { backgroundColor: color }],
                isPartial && [
                  styles.circlePartial,
                  { borderColor: color, backgroundColor: `${color}20` },
                ],
                day.isToday && styles.circleToday,
              ]}
            >
              {isCompleted && <Text style={styles.checkmark}>✓</Text>}
              {isPartial && (
                <Text style={[styles.partialText, { color }]}>
                  {Math.round(completion * 100)}%
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[400],
  },
  dayLabelToday: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  circleCompleted: {
    backgroundColor: colors.success[500],
    borderColor: 'transparent',
  },
  circlePartial: {
    borderWidth: 2,
  },
  circleToday: {
    borderColor: colors.primary[500],
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  partialText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default WeeklyProgress;

