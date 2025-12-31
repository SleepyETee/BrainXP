// Smart Scheduler - ML-powered scheduling suggestions
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useMLStore } from '../../stores/mlStore';
import { colors, shadows } from '../../theme/colors';
import { springConfigs } from '../../utils/animations';

interface TimeSlot {
  id: string;
  time: string;
  hour: number;
  energyLevel: 'high' | 'medium' | 'low';
  recommended: boolean;
  taskTypes: string[];
  reason: string;
}

interface SmartSchedulerProps {
  onSelectSlot?: (slot: TimeSlot) => void;
  taskType?: 'focus' | 'creative' | 'routine' | 'any';
  showHeader?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SmartScheduler: React.FC<SmartSchedulerProps> = ({
  onSelectSlot,
  taskType = 'any',
  showHeader = true,
}) => {
  const { patterns, isLoadingPatterns } = useMLStore();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Generate ML-powered time slots
  useEffect(() => {
    if (patterns) {
      const generateSlots = () => {
        const slots: TimeSlot[] = [];
        const now = new Date();
        const currentHour = now.getHours();

        // Generate slots for the rest of the day
        for (let hour = Math.max(currentHour, 6); hour <= 22; hour++) {
          const isPeakHour = patterns.bestHours?.some(h => h.hour === hour);
          const energyAtHour = getEnergyLevel(hour, patterns.peakEnergyTime);
          const taskTypesForHour = getTaskTypesForHour(hour, energyAtHour);
          const isRecommended = shouldRecommend(hour, taskType, energyAtHour, taskTypesForHour);

          slots.push({
            id: `slot-${hour}`,
            time: formatHour(hour),
            hour,
            energyLevel: energyAtHour,
            recommended: isRecommended,
            taskTypes: taskTypesForHour,
            reason: getReasonForSlot(hour, energyAtHour, patterns),
          });
        }

        setTimeSlots(slots);
      };

      generateSlots();
    }
  }, [patterns, taskType]);

  const getEnergyLevel = (hour: number, peakTime: string): 'high' | 'medium' | 'low' => {
    const peakHour = peakTime === 'morning' ? 10 : peakTime === 'afternoon' ? 14 : 20;
    const diff = Math.abs(hour - peakHour);
    
    if (diff <= 2) return 'high';
    if (diff <= 4) return 'medium';
    return 'low';
  };

  const getTaskTypesForHour = (hour: number, energy: string): string[] => {
    if (energy === 'high') return ['🎯 Deep Focus', '🧠 Complex Tasks', '✍️ Creative Work'];
    if (energy === 'medium') return ['📋 Planning', '💬 Meetings', '📧 Communication'];
    return ['🔄 Routine Tasks', '📖 Light Reading', '🧹 Organization'];
  };

  const shouldRecommend = (
    hour: number, 
    taskType: string, 
    energy: string,
    taskTypes: string[]
  ): boolean => {
    if (taskType === 'focus') return energy === 'high';
    if (taskType === 'creative') return energy === 'high' || energy === 'medium';
    if (taskType === 'routine') return energy === 'low' || energy === 'medium';
    return energy === 'high';
  };

  const getReasonForSlot = (hour: number, energy: string, patterns: any): string => {
    if (energy === 'high') {
      return `Peak productivity window based on your ${patterns.peakEnergyTime} pattern`;
    }
    if (energy === 'medium') {
      return 'Good for collaborative work and planning';
    }
    return 'Best for low-effort tasks and wind-down activities';
  };

  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const handleSelectSlot = async (slot: TimeSlot) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSlot(slot.id);
    onSelectSlot?.(slot);
  };

  const getEnergyColor = (energy: string) => {
    switch (energy) {
      case 'high': return colors.success[500];
      case 'medium': return colors.warning[500];
      case 'low': return colors.gray[400];
      default: return colors.gray[400];
    }
  };

  const getEnergyGradient = (energy: string): [string, string] => {
    switch (energy) {
      case 'high': return [colors.success[400], colors.success[500]];
      case 'medium': return [colors.warning[400], colors.warning[500]];
      case 'low': return [colors.gray[300], colors.gray[400]];
      default: return [colors.gray[300], colors.gray[400]];
    }
  };

  if (isLoadingPatterns && !patterns) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>🤖</Text>
        <Text style={styles.loadingText}>Analyzing your patterns...</Text>
        <Text style={styles.loadingSubtext}>
          The more you use BrainXP, the smarter I get!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showHeader && (
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerEmoji}>⏰</Text>
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Smart Schedule</Text>
            <Text style={styles.headerSubtitle}>
              AI-optimized time slots based on your energy patterns
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Energy Legend */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success[500] }]} />
          <Text style={styles.legendText}>High Energy</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning[500] }]} />
          <Text style={styles.legendText}>Medium</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.gray[400] }]} />
          <Text style={styles.legendText}>Low</Text>
        </View>
      </Animated.View>

      {/* Time Slots */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slotsContainer}
      >
        {timeSlots.map((slot, index) => (
          <TimeSlotCard
            key={slot.id}
            slot={slot}
            index={index}
            isSelected={selectedSlot === slot.id}
            onSelect={() => handleSelectSlot(slot)}
            getEnergyGradient={getEnergyGradient}
          />
        ))}
      </ScrollView>

      {/* Selected Slot Details */}
      {selectedSlot && (
        <Animated.View 
          entering={FadeInDown.springify()} 
          style={styles.selectedDetails}
        >
          {(() => {
            const slot = timeSlots.find(s => s.id === selectedSlot);
            if (!slot) return null;
            
            return (
              <>
                <Text style={styles.selectedTitle}>
                  {slot.time} - {slot.energyLevel.charAt(0).toUpperCase() + slot.energyLevel.slice(1)} Energy
                </Text>
                <Text style={styles.selectedReason}>{slot.reason}</Text>
                <View style={styles.taskTypesContainer}>
                  {slot.taskTypes.map((type, i) => (
                    <View key={i} style={styles.taskTypeBadge}>
                      <Text style={styles.taskTypeText}>{type}</Text>
                    </View>
                  ))}
                </View>
              </>
            );
          })()}
        </Animated.View>
      )}
    </View>
  );
};

// Time Slot Card Component
interface TimeSlotCardProps {
  slot: TimeSlot;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  getEnergyGradient: (energy: string) => [string, string];
}

const TimeSlotCard: React.FC<TimeSlotCardProps> = ({
  slot,
  index,
  isSelected,
  onSelect,
  getEnergyGradient,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, springConfigs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfigs.bouncy);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
      <AnimatedPressable
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.slotCard,
          shadows.sm,
          isSelected && styles.slotCardSelected,
          animatedStyle,
        ]}
      >
        {slot.recommended && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>✨ Best</Text>
          </View>
        )}
        
        <LinearGradient
          colors={getEnergyGradient(slot.energyLevel)}
          style={styles.energyIndicator}
        />
        
        <Text style={styles.slotTime}>{slot.time}</Text>
        <Text style={styles.slotEnergy}>
          {slot.energyLevel === 'high' && '⚡'}
          {slot.energyLevel === 'medium' && '💪'}
          {slot.energyLevel === 'low' && '🌙'}
        </Text>
      </AnimatedPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: '500',
  },
  slotsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  slotCard: {
    width: 90,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  slotCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  recommendedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.primary[500],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  energyIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 4,
  },
  slotEnergy: {
    fontSize: 20,
  },
  selectedDetails: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    padding: 16,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary[800],
    marginBottom: 6,
  },
  selectedReason: {
    fontSize: 14,
    color: colors.primary[700],
    marginBottom: 12,
  },
  taskTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  taskTypeBadge: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  taskTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[700],
  },
});

export default SmartScheduler;
