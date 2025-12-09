// Time Blocking - Visual Schedule for ADHD
// Research: Visual schedules help with time blindness and transitions
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, shadows, adhdPalette } from '../../theme/colors';
import { useSettingsStore } from '../../stores/settingsStore';
import { AnimatedView } from '../accessibility/AnimatedView';

interface TimeBlock {
  id: string;
  title: string;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  color: string;
  category?: 'work' | 'break' | 'personal' | 'health' | 'other';
}

interface TimeBlockingProps {
  blocks?: TimeBlock[];
  onBlockAdd?: (block: Omit<TimeBlock, 'id'>) => void;
  onBlockRemove?: (blockId: string) => void;
  onBlockUpdate?: (block: TimeBlock) => void;
  startHour?: number;
  endHour?: number;
}

// ADHD-friendly color categories - distinct but not overwhelming
const CATEGORY_COLORS = {
  work: colors.primary[400],
  break: colors.secondary[400],
  personal: colors.accent[300],
  health: colors.success[400],
  other: colors.gray[400],
};

const CATEGORY_LABELS = {
  work: { label: 'Work', emoji: '💼' },
  break: { label: 'Break', emoji: '☕' },
  personal: { label: 'Personal', emoji: '🏠' },
  health: { label: 'Health', emoji: '🧘' },
  other: { label: 'Other', emoji: '📌' },
};

const formatTime = (hour: number, minute: number = 0): string => {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  const m = minute.toString().padStart(2, '0');
  return minute === 0 ? `${h} ${ampm}` : `${h}:${m} ${ampm}`;
};

const HOUR_HEIGHT = 60; // pixels per hour

export const TimeBlocking: React.FC<TimeBlockingProps> = ({
  blocks = [],
  onBlockAdd,
  onBlockRemove,
  onBlockUpdate,
  startHour = 6,
  endHour = 22,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [newBlock, setNewBlock] = useState({
    title: '',
    category: 'work' as keyof typeof CATEGORY_COLORS,
    duration: 60,
  });
  
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(hour);
    }
    return slots;
  }, [startHour, endHour]);

  // Get blocks for a specific hour
  const getBlocksAtHour = useCallback(
    (hour: number) => {
      return blocks.filter(
        (block) =>
          hour >= block.startHour &&
          hour < block.startHour + block.durationMinutes / 60
      );
    },
    [blocks]
  );

  const handleSlotPress = useCallback(
    async (hour: number) => {
      // Check if slot is already occupied
      const existingBlocks = getBlocksAtHour(hour);
      if (existingBlocks.length > 0) return;

      if (!reduceMotion) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setSelectedHour(hour);
      setShowAddModal(true);
    },
    [getBlocksAtHour, reduceMotion]
  );

  const handleAddBlock = useCallback(async () => {
    if (!selectedHour || !newBlock.title.trim()) return;

    if (!reduceMotion) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onBlockAdd?.({
      title: newBlock.title,
      startHour: selectedHour,
      startMinute: 0,
      durationMinutes: newBlock.duration,
      color: CATEGORY_COLORS[newBlock.category],
      category: newBlock.category,
    });

    setShowAddModal(false);
    setSelectedHour(null);
    setNewBlock({ title: '', category: 'work', duration: 60 });
  }, [selectedHour, newBlock, onBlockAdd, reduceMotion]);

  const handleRemoveBlock = useCallback(
    async (blockId: string) => {
      if (!reduceMotion) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onBlockRemove?.(blockId);
    },
    [onBlockRemove, reduceMotion]
  );

  // Calculate current time indicator position
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isWithinRange = currentHour >= startHour && currentHour <= endHour;
  const currentTimePosition =
    (currentHour - startHour) * HOUR_HEIGHT + (currentMinute / 60) * HOUR_HEIGHT;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Time Blocks</Text>
          <Text style={styles.headerSubtitle}>
            Visualize your day to reduce time blindness
          </Text>
        </View>
      </View>

      {/* Info tip */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipIcon}>💡</Text>
        <Text style={styles.tipText}>
          Tap an empty slot to add a time block. Color-code activities for quick recognition.
        </Text>
      </View>

      {/* Timeline */}
      <ScrollView
        style={styles.timeline}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.timelineContent}
      >
        {/* Current time indicator */}
        {isWithinRange && (
          <View style={[styles.currentTimeIndicator, { top: currentTimePosition }]}>
            <View style={styles.currentTimeDot} />
            <View style={styles.currentTimeLine} />
            <Text style={styles.currentTimeText}>Now</Text>
          </View>
        )}

        {timeSlots.map((hour, index) => {
          const blocksAtHour = blocks.filter((b) => b.startHour === hour);
          const isOccupied = getBlocksAtHour(hour).length > 0;
          const isPast = hour < currentHour;

          return (
            <AnimatedView key={hour} delay={index * 20} animation="fadeInLeft">
              <View style={styles.timeSlot}>
                {/* Time label */}
                <View style={styles.timeLabel}>
                  <Text style={[styles.timeLabelText, isPast && styles.timeLabelPast]}>
                    {formatTime(hour)}
                  </Text>
                </View>

                {/* Slot content */}
                <TouchableOpacity
                  style={[
                    styles.slotContent,
                    isPast && styles.slotContentPast,
                  ]}
                  onPress={() => handleSlotPress(hour)}
                  disabled={isOccupied}
                  activeOpacity={0.7}
                  accessibilityLabel={`${formatTime(hour)} time slot`}
                  accessibilityHint={isOccupied ? 'Slot is occupied' : 'Tap to add a time block'}
                >
                  {blocksAtHour.map((block) => (
                    <TouchableOpacity
                      key={block.id}
                      style={[
                        styles.blockCard,
                        { 
                          backgroundColor: `${block.color}15`,
                          borderLeftColor: block.color,
                          height: (block.durationMinutes / 60) * HOUR_HEIGHT - 8,
                        },
                      ]}
                      onLongPress={() => handleRemoveBlock(block.id)}
                      activeOpacity={0.8}
                      accessibilityLabel={`${block.title}, ${block.durationMinutes} minutes`}
                      accessibilityHint="Long press to remove"
                    >
                      <View style={styles.blockHeader}>
                        <Text style={[styles.blockTitle, { color: block.color }]}>
                          {block.title}
                        </Text>
                        <Text style={styles.blockDuration}>
                          {block.durationMinutes}m
                        </Text>
                      </View>
                      {block.category && (
                        <Text style={styles.blockCategory}>
                          {CATEGORY_LABELS[block.category].emoji}{' '}
                          {CATEGORY_LABELS[block.category].label}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  
                  {!isOccupied && (
                    <View style={styles.emptySlotHint}>
                      <Text style={styles.emptySlotText}>+ Add block</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </AnimatedView>
          );
        })}
      </ScrollView>

      {/* Add Block Modal */}
      <Modal
        visible={showAddModal}
        animationType={reduceMotion ? 'none' : 'slide'}
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Time Block</Text>
              <Text style={styles.modalSubtitle}>
                {selectedHour !== null && `Starting at ${formatTime(selectedHour)}`}
              </Text>
            </View>

            {/* Title input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>What are you doing?</Text>
              <TextInput
                style={styles.textInput}
                value={newBlock.title}
                onChangeText={(text) => setNewBlock((prev) => ({ ...prev, title: text }))}
                placeholder="e.g., Deep work on project"
                placeholderTextColor={colors.gray[400]}
                autoFocus
              />
            </View>

            {/* Category selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {(Object.keys(CATEGORY_COLORS) as Array<keyof typeof CATEGORY_COLORS>).map(
                  (category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        { borderColor: CATEGORY_COLORS[category] },
                        newBlock.category === category && {
                          backgroundColor: `${CATEGORY_COLORS[category]}20`,
                        },
                      ]}
                      onPress={() => setNewBlock((prev) => ({ ...prev, category }))}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: newBlock.category === category }}
                    >
                      <Text style={styles.categoryEmoji}>
                        {CATEGORY_LABELS[category].emoji}
                      </Text>
                      <Text
                        style={[
                          styles.categoryText,
                          { color: CATEGORY_COLORS[category] },
                        ]}
                      >
                        {CATEGORY_LABELS[category].label}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            {/* Duration selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration</Text>
              <View style={styles.durationGrid}>
                {[30, 60, 90, 120].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.durationButton,
                      newBlock.duration === mins && styles.durationButtonActive,
                    ]}
                    onPress={() => setNewBlock((prev) => ({ ...prev, duration: mins }))}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: newBlock.duration === mins }}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        newBlock.duration === mins && styles.durationTextActive,
                      ]}
                    >
                      {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  !newBlock.title.trim() && styles.addButtonDisabled,
                ]}
                onPress={handleAddBlock}
                disabled={!newBlock.title.trim()}
              >
                <Text style={styles.addButtonText}>Add Block</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },

  // Tip
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.primary[50],
    borderRadius: 10,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary[700],
    lineHeight: 18,
  },

  // Timeline
  timeline: {
    flex: 1,
  },
  timelineContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  timeSlot: {
    flexDirection: 'row',
    height: HOUR_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  timeLabel: {
    width: 70,
    paddingRight: 12,
    justifyContent: 'flex-start',
  },
  timeLabelText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[500],
    marginTop: -7,
  },
  timeLabelPast: {
    color: colors.gray[300],
  },
  slotContent: {
    flex: 1,
    paddingVertical: 4,
    minHeight: HOUR_HEIGHT - 8,
  },
  slotContentPast: {
    opacity: 0.6,
  },

  // Time block card
  blockCard: {
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  blockDuration: {
    fontSize: 12,
    color: colors.gray[500],
    marginLeft: 8,
  },
  blockCategory: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 4,
  },

  // Empty slot
  emptySlotHint: {
    flex: 1,
    justifyContent: 'center',
  },
  emptySlotText: {
    fontSize: 13,
    color: colors.gray[300],
  },

  // Current time indicator
  currentTimeIndicator: {
    position: 'absolute',
    left: 70,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  currentTimeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger[500],
    marginLeft: -5,
  },
  currentTimeLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.danger[500],
  },
  currentTimeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.danger[500],
    marginLeft: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[900],
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },

  // Input groups
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    color: colors.gray[800],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.gray[50],
  },

  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Duration grid
  durationGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  durationButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
  },
  durationButtonActive: {
    backgroundColor: colors.primary[500],
  },
  durationText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[600],
  },
  durationTextActive: {
    color: '#FFFFFF',
  },

  // Modal actions
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[600],
  },
  addButton: {
    flex: 2,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
  },
  addButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TimeBlocking;
