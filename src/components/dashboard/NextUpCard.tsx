import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import { TaskPriority } from '../../types/task';
import { DashboardCard } from './DashboardCard';

export type NextUpItem =
  | {
      kind: 'task';
      title: string;
      priority?: TaskPriority;
      subtaskCount?: number;
      estimateMinutes?: number;
      dueLabel?: string;
      isCompleted?: boolean;
    }
  | {
      kind: 'block';
      title: string;
      subtitle?: string;
      timeLabel?: string;
      isCurrent?: boolean;
      color?: string;
    }
  | {
      kind: 'empty';
      title: string;
      message: string;
    };

type NextUpCardProps = {
  item: NextUpItem;
  onPressItem?: () => void;
  onToggleComplete?: () => void;
  onStartFocus?: () => void;
  onLater?: () => void;
  onMore?: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
  rightBadgeLabel?: string;
};

const priorityToLabel: Record<TaskPriority, string> = {
  urgent_important: 'High priority',
  important: 'High priority',
  urgent: 'High priority',
  high: 'High priority',
  medium: 'Medium',
  low: 'Low',
  none: 'No priority',
};

export function NextUpCard({
  item,
  onPressItem,
  onToggleComplete,
  onStartFocus,
  onLater,
  onMore,
  primaryLabel,
  secondaryLabel = 'Later',
  rightBadgeLabel = 'Most important',
}: NextUpCardProps) {
  const theme = useTheme();

  const metaText = useMemo(() => {
    if (item.kind === 'task') {
      const parts: string[] = [];
      if (item.priority) parts.push(priorityToLabel[item.priority]);
      if (typeof item.subtaskCount === 'number' && item.subtaskCount > 0) {
        parts.push(`${item.subtaskCount} subtask${item.subtaskCount === 1 ? '' : 's'}`);
      }
      if (item.estimateMinutes && item.estimateMinutes > 0) {
        const m = item.estimateMinutes;
        parts.push(m >= 60 && m % 60 === 0 ? `${m / 60}h` : `${m}m`);
      }
      if (item.dueLabel) parts.push(item.dueLabel);
      return parts.join(' • ');
    }

    if (item.kind === 'block') {
      const parts: string[] = [];
      if (item.timeLabel) parts.push(item.timeLabel);
      if (item.subtitle) parts.push(item.subtitle);
      return parts.join(' • ');
    }

    return undefined;
  }, [item]);

  const focusLabel =
    primaryLabel ??
    (item.kind === 'block' && item.isCurrent
      ? 'Resume Focus'
      : 'Start Focus');

  const showActions = item.kind !== 'empty';
  const checkboxState = item.kind === 'task' ? item.isCompleted : false;

  const accentColor =
    item.kind === 'block'
      ? item.color || theme.palette.primary[500]
      : item.kind === 'task' && item.priority
        ? (item.priority === 'low' || item.priority === 'none'
            ? theme.palette.gray[400]
            : item.priority === 'medium'
              ? theme.palette.warning[500]
              : theme.palette.danger[500])
        : theme.palette.gray[400];

  return (
    <DashboardCard
      onPress={item.kind === 'empty' ? undefined : onPressItem}
      padding={14}
      borderRadius={16}
      accessibilityLabel={item.kind === 'empty' ? item.title : `Next up: ${item.title}`}
      accessibilityHint={item.kind === 'empty' ? item.message : 'Opens details'}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: theme.text.secondary }]}>Next Up</Text>
        <Text style={[styles.headerRight, { color: theme.text.muted }]}>{rightBadgeLabel}</Text>
      </View>

      {item.kind === 'empty' ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.itemTitle, { color: theme.text.primary }]}>{item.title}</Text>
          <Text style={[styles.meta, { color: theme.text.secondary }]}>{item.message}</Text>
        </View>
      ) : (
        <View style={styles.itemRow}>
          <TouchableOpacity
            onPress={onToggleComplete}
            accessibilityRole="button"
            accessibilityLabel={item.kind === 'task' ? (checkboxState ? 'Mark as not done' : 'Mark as done') : undefined}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={item.kind !== 'task' || !onToggleComplete}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: accentColor,
                  backgroundColor: checkboxState ? accentColor : 'transparent',
                },
              ]}
            >
              {checkboxState ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
          </TouchableOpacity>

          <View style={styles.itemText}>
            <Text style={[styles.itemTitle, { color: theme.text.primary }]} numberOfLines={1}>
              {item.title}
            </Text>
            {metaText ? (
              <Text style={[styles.meta, { color: theme.text.secondary }]} numberOfLines={1}>
                {metaText}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      {showActions ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: theme.palette.primary[500] },
            ]}
            onPress={onStartFocus}
            accessibilityRole="button"
            accessibilityLabel={focusLabel}
          >
            <Text style={styles.primaryButtonText}>▶ {focusLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                backgroundColor: theme.isDark ? theme.palette.gray[800] : theme.palette.gray[100],
                borderColor: theme.border,
              },
            ]}
            onPress={onLater}
            accessibilityRole="button"
            accessibilityLabel={secondaryLabel}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text.primary }]}>
              {secondaryLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: theme.isDark ? theme.palette.gray[800] : theme.palette.gray[100],
                borderColor: theme.border,
              },
            ]}
            onPress={onMore}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
            <Text style={[styles.iconButtonText, { color: theme.text.primary }]}>⋯</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerRight: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
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
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  primaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  secondaryButton: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontWeight: '700',
    fontSize: 13,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: -4,
  },
  emptyWrap: {
    gap: 6,
  },
});
