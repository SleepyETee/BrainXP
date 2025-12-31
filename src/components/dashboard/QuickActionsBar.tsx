import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

type QuickActionsBarProps = {
  style?: ViewStyle;
  onQuickCapture: () => void;
  onCreateTask: () => void;
  onPlanDay: () => void;
  onBreakDown: () => void;
  onOpenTools?: () => void;
};

export function QuickActionsBar({
  style,
  onQuickCapture,
  onCreateTask,
  onPlanDay,
  onBreakDown,
  onOpenTools,
}: QuickActionsBarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background.card,
          borderColor: theme.border,
          shadowColor: theme.isDark ? 'transparent' : '#000',
        },
        style,
      ]}
    >
      {/* Quick capture row */}
      <View style={styles.captureRow}>
        <TouchableOpacity
          style={[
            styles.captureInput,
            {
              backgroundColor: theme.isDark ? theme.palette.gray[900] : theme.palette.gray[50],
              borderColor: theme.border,
            },
          ]}
          onPress={onQuickCapture}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Quick capture"
          accessibilityHint="Open inbox to capture a thought"
        >
          <Text style={[styles.capturePlaceholder, { color: theme.text.muted }]}>
            Quick capture…
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: theme.palette.primary[500] },
          ]}
          onPress={onCreateTask}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Create task"
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Action tiles */}
      <View style={styles.actionsRow}>
        <ActionTile
          icon="🧠"
          label="Brain dump"
          onPress={onQuickCapture}
        />
        <ActionTile
          icon="📅"
          label="Plan day"
          onPress={onPlanDay}
        />
        <ActionTile
          icon="🪄"
          label="Break down"
          onPress={onBreakDown}
        />
        {onOpenTools ? (
          <ActionTile icon="🤖" label="Tools" onPress={onOpenTools} />
        ) : null}
      </View>
    </View>
  );
}

function ActionTile({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.tile,
        {
          backgroundColor: theme.isDark ? theme.palette.gray[900] : theme.palette.gray[50],
          borderColor: theme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.tileIcon}>{icon}</Text>
      <Text style={[styles.tileLabel, { color: theme.text.primary }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 6,
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  captureInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  capturePlaceholder: {
    fontSize: 13,
    fontWeight: '600',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tileIcon: {
    fontSize: 18,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
});
