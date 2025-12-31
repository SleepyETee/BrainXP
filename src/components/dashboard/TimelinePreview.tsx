import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import { TimelineBlockWithTask } from '../../types/timeline';
import { DashboardCard } from './DashboardCard';
import { SectionHeader } from './SectionHeader';

type TimelinePreviewProps = {
  dayLabel: string;
  blocks: TimelineBlockWithTask[];
  now: Date;
  currentBlockId?: string;
  maxItems?: number;
  onPressBlock?: (block: TimelineBlockWithTask) => void;
  onPressEdit?: () => void;
  onPressAdd?: () => void;
};

const formatShortTime = (iso: string) => {
  const d = new Date(iso);
  // Show e.g. "9:00" (no AM/PM) for quick scanning.
  const t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return t.replace(/\s?(AM|PM)$/i, '');
};

const minutesBetween = (startIso: string, endIso: string) => {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.max(0, Math.round((end - start) / 60000));
};

export function TimelinePreview({
  dayLabel,
  blocks,
  now,
  currentBlockId,
  maxItems = 4,
  onPressBlock,
  onPressEdit,
  onPressAdd,
}: TimelinePreviewProps) {
  const theme = useTheme();

  const visibleBlocks = useMemo(() => blocks.slice(0, maxItems), [blocks, maxItems]);

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Today's Timeline"
        rightLabel="Edit"
        rightHint="Open planning"
        onPressRight={onPressEdit}
      />

      <Text style={[styles.dayLabel, { color: theme.text.muted }]}>{dayLabel}</Text>

      {visibleBlocks.length === 0 ? (
        <DashboardCard
          tone="muted"
          onPress={onPressAdd || onPressEdit}
          accessibilityLabel="No time blocks"
          accessibilityHint="Open planning to add blocks"
        >
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No blocks yet</Text>
          <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
            Add a few blocks to make time feel more real.
          </Text>
          <View style={styles.emptyCtas}>
            <Text style={[styles.emptyCta, { color: theme.palette.primary[500] }]}>+ Add time block</Text>
          </View>
        </DashboardCard>
      ) : (
        <View style={styles.list}>
          {visibleBlocks.map((block) => {
            const isCurrent = currentBlockId === block.id;
            const borderColor = block.color || theme.palette.primary[400];

            const durationMinutes = minutesBetween(block.startTime, block.endTime);
            const timeLabel = `${formatShortTime(block.startTime)}`;

            const startMs = new Date(block.startTime).getTime();
            const endMs = new Date(block.endTime).getTime();
            const pct =
              endMs > startMs
                ? Math.min(1, Math.max(0, (now.getTime() - startMs) / (endMs - startMs)))
                : 0;

            return (
              <TouchableOpacity
                key={block.id}
                onPress={() => onPressBlock?.(block)}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel={`Timeline block: ${block.title}`}
              >
                <View style={styles.row}>
                  <View style={styles.timeCol}>
                    <Text style={[styles.timeText, { color: theme.text.muted }]}>{timeLabel}</Text>
                  </View>

                  <View
                    style={[
                      styles.blockCard,
                      {
                        backgroundColor: theme.background.card,
                        borderColor: theme.border,
                        borderLeftColor: borderColor,
                      },
                      isCurrent && {
                        backgroundColor: theme.isDark
                          ? theme.palette.success[900]
                          : theme.palette.success[50],
                      },
                    ]}
                  >
                    <View style={styles.blockTopRow}>
                      <Text
                        style={[styles.blockTitle, { color: theme.text.primary }]}
                        numberOfLines={1}
                      >
                        {block.title}
                      </Text>
                      <Text style={[styles.duration, { color: theme.text.muted }]}>
                        {durationMinutes >= 60 && durationMinutes % 60 === 0
                          ? `${durationMinutes / 60}h`
                          : `${durationMinutes}m`}
                      </Text>
                    </View>

                    {block.task?.title ? (
                      <Text style={[styles.blockSubtitle, { color: theme.text.secondary }]} numberOfLines={1}>
                        {block.task.title}
                      </Text>
                    ) : null}

                    {isCurrent ? (
                      <View style={styles.progressWrap}>
                        <View style={[styles.progressBg, { backgroundColor: theme.isDark ? theme.palette.gray[700] : theme.palette.gray[100] }]}>
                          <View
                            style={[
                              styles.progressFill,
                              { backgroundColor: theme.palette.success[500], width: `${Math.round(pct * 100)}%` },
                            ]}
                          />
                        </View>
                        <Text style={[styles.nowPill, { color: theme.palette.success[700] }]}>Now</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={onPressAdd || onPressEdit}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Add time block"
          >
            <View
              style={[
                styles.addRow,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.isDark ? theme.palette.gray[900] : theme.palette.gray[50],
                },
              ]}
            >
              <Text style={[styles.addText, { color: theme.text.secondary }]}>+ Add time block</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  timeCol: {
    width: 52,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  blockCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  blockTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  duration: {
    fontSize: 12,
    fontWeight: '700',
  },
  blockSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressWrap: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBg: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  nowPill: {
    fontSize: 11,
    fontWeight: '800',
  },
  addRow: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: 13,
    fontWeight: '700',
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
  emptyCtas: {
    marginTop: 10,
  },
  emptyCta: {
    fontSize: 13,
    fontWeight: '800',
  },
});
