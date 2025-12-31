// Calendar View for Tasks
// Provides monthly calendar view with tasks displayed on their due dates
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Task } from '../../types/task';
import { TaskCard } from './TaskCard';
import { colors, shadows } from '../../theme/colors';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns';

interface TaskCalendarProps {
  tasks: Task[];
  onTaskPress: (task: Task) => void;
  onTaskComplete: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onTaskSnooze?: (task: Task) => void;
  onDatePress?: (date: Date) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TaskCalendar: React.FC<TaskCalendarProps> = ({
  tasks,
  onTaskPress,
  onTaskComplete,
  onTaskDelete,
  onTaskSnooze,
  onDatePress,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);

  // Get all days in current month
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Add days from previous month to fill first week
    const firstDay = days[0];
    const firstDayOfWeek = firstDay.getDay();
    const prevMonthDays: Date[] = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(firstDay);
      date.setDate(date.getDate() - i - 1);
      prevMonthDays.push(date);
    }
    
    // Add days from next month to fill last week
    const lastDay = days[days.length - 1];
    const lastDayOfWeek = lastDay.getDay();
    const nextMonthDays: Date[] = [];
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
      const date = new Date(lastDay);
      date.setDate(date.getDate() + i);
      nextMonthDays.push(date);
    }
    
    return [...prevMonthDays, ...days, ...nextMonthDays];
  }, [currentMonth]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    
    tasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });
    
    return grouped;
  }, [tasks]);

  // Get tasks for selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return tasksByDate[dateKey] || [];
  }, [selectedDate, tasksByDate]);

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
    onDatePress?.(date);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDate(null);
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const getTasksForDate = (date: Date): Task[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return tasksByDate[dateKey] || [];
  };

  const isToday = (date: Date): boolean => {
    return isSameDay(date, new Date());
  };

  const isSelected = (date: Date): boolean => {
    return selectedDate ? isSameDay(date, selectedDate) : false;
  };

  const isCurrentMonth = (date: Date): boolean => {
    return isSameMonth(date, currentMonth);
  };

  return (
    <View style={styles.container}>
      {/* Month Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
          <Text style={styles.navIcon}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.monthContainer}>
          <Text style={styles.monthText}>{format(currentMonth, 'MMMM yyyy')}</Text>
          <TouchableOpacity onPress={handleToday} style={styles.todayButton}>
            <Text style={styles.todayText}>Today</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
          <Text style={styles.navIcon}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendar}>
        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {DAYS_OF_WEEK.map((day) => (
            <View key={day} style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Days */}
        <View style={styles.daysGrid}>
          {monthDays.map((date, index) => {
            const dateTasks = getTasksForDate(date);
            const taskCount = dateTasks.length;
            const isCurrentMonthDay = isCurrentMonth(date);
            const isTodayDate = isToday(date);
            const isSelectedDate = isSelected(date);

            return (
              <TouchableOpacity
                key={`${date.toISOString()}-${index}`}
                onPress={() => handleDatePress(date)}
                style={[
                  styles.dayCell,
                  !isCurrentMonthDay && styles.dayCellOtherMonth,
                  isTodayDate && styles.dayCellToday,
                  isSelectedDate && styles.dayCellSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    !isCurrentMonthDay && styles.dayNumberOtherMonth,
                    isTodayDate && styles.dayNumberToday,
                    isSelectedDate && styles.dayNumberSelected,
                  ]}
                >
                  {format(date, 'd')}
                </Text>
                {taskCount > 0 && (
                  <View style={[styles.taskIndicator, isSelectedDate && styles.taskIndicatorSelected]}>
                    <Text style={styles.taskCount}>{taskCount > 9 ? '9+' : taskCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Selected Date Tasks */}
      {selectedDate && selectedDateTasks.length > 0 && (
        <Animated.View
          entering={!reduceMotion ? FadeIn.duration(200) : undefined}
          style={styles.selectedTasksContainer}
        >
          <View style={styles.selectedTasksHeader}>
            <Text style={styles.selectedTasksTitle}>
              {format(selectedDate, 'EEEE, MMMM d')}
            </Text>
            <Text style={styles.selectedTasksCount}>
              {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <ScrollView style={styles.selectedTasksList}>
            {selectedDateTasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => onTaskPress(task)}
                onComplete={() => onTaskComplete(task)}
                onDelete={() => onTaskDelete(task)}
                onSnooze={onTaskSnooze ? () => onTaskSnooze(task) : undefined}
                compact={true}
                index={index}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.gray[100],
  },
  navIcon: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[700],
  },
  monthContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.primary[100],
  },
  todayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[700],
  },
  calendar: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    ...shadows.sm,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[600],
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderRadius: 8,
    margin: 2,
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayCellToday: {
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  dayCellSelected: {
    backgroundColor: colors.primary[100],
    borderWidth: 2,
    borderColor: colors.primary[600],
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[800],
  },
  dayNumberOtherMonth: {
    color: colors.gray[400],
  },
  dayNumberToday: {
    fontWeight: '700',
    color: colors.primary[700],
  },
  dayNumberSelected: {
    fontWeight: '700',
    color: colors.primary[800],
  },
  taskIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIndicatorSelected: {
    backgroundColor: colors.primary[600],
  },
  taskCount: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectedTasksContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    borderRadius: 16,
    ...shadows.md,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  selectedTasksHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedTasksTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
  },
  selectedTasksCount: {
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: '500',
  },
  selectedTasksList: {
    padding: 16,
  },
});
