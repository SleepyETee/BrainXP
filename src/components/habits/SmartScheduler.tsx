// SmartScheduler - ML-Powered Scheduling Suggestions for Habits
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, shadows, gradients } from '../../theme/colors';
import { springConfigs } from '../../utils/animations';
import { useMLStore, UserPatterns, OptimalTimeSuggestion } from '../../stores/mlStore';
import { Habit } from '../../types/habit';

interface TimeSlot {
  hour: number;
  label: string;
  productivity: number;
  isOptimal: boolean;
  isPeakEnergy: boolean;
  suggestedHabits: string[];
}

interface ScheduleSuggestion {
  habitId: string;
  habitName: string;
  habitIcon: string;
  suggestedTime: string;
  suggestedHour: number;
  reason: string;
  confidence: number;
  alternativeTimes: string[];
}

interface SmartSchedulerProps {
  habits: Habit[];
  onScheduleHabit?: (habitId: string, time: string) => void;
  onViewDetails?: (habitId: string) => void;
  selectedDate?: Date;
  compact?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SmartScheduler: React.FC<SmartSchedulerProps> = ({
  habits,
  onScheduleHabit,
  onViewDetails,
  selectedDate = new Date(),
  compact = false,
}) => {
  const { patterns, fetchPatterns, isLoadingPatterns } = useMLStore();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'suggestions'>('suggestions');

  // Fetch patterns on mount
  useEffect(() => {
    fetchPatterns().catch(console.error);
  }, []);

  // Generate time slots and suggestions based on patterns
  useEffect(() => {
    if (patterns) {
      const slots = generateTimeSlots(patterns);
      setTimeSlots(slots);
      
      if (habits.length > 0) {
        const sched = generateScheduleSuggestions(habits, patterns, slots);
        setSuggestions(sched);
      }
    }
  }, [patterns, habits]);

  const generateTimeSlots = (patterns: UserPatterns): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const peakHours = new Set(patterns.bestHours?.slice(0, 3).map((h) => h.hour) ?? []);
    
    // Generate slots for waking hours (6 AM to 10 PM)
    for (let hour = 6; hour <= 22; hour++) {
      const hourData = patterns.bestHours?.find((h) => h.hour === hour);
      const productivity = hourData?.productivity ?? 0.5;
      
      const formatHour = (h: number) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
        return `${displayHour}:00 ${period}`;
      };

      slots.push({
        hour,
        label: formatHour(hour),
        productivity,
        isOptimal: productivity >= 0.7,
        isPeakEnergy: peakHours.has(hour),
        suggestedHabits: [],
      });
    }

    return slots;
  };

  const generateScheduleSuggestions = (
    habits: Habit[],
    patterns: UserPatterns,
    slots: TimeSlot[]
  ): ScheduleSuggestion[] => {
    const suggestions: ScheduleSuggestion[] = [];
    const peakHours = patterns.bestHours?.slice(0, 3) ?? [];
    const peakEnergyTime = patterns.peakEnergyTime;

    // Map energy times to hour ranges
    const energyTimeRanges: Record<string, number[]> = {
      morning: [6, 7, 8, 9, 10, 11],
      afternoon: [12, 13, 14, 15, 16],
      evening: [17, 18, 19, 20],
      night: [21, 22, 23],
    };

    const formatHour = (h: number) => {
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${displayHour}:00 ${period}`;
    };

    habits.forEach((habit) => {
      // Prioritize habits without a set preferred time
      const hasSchedule = !!habit.preferredTime;
      
      // Calculate optimal hour for this habit
      let optimalHour = peakHours[0]?.hour ?? 9;
      let reason = '';
      let confidence = 0.75;

      // High-priority habits should be scheduled at peak energy times
      const streak = habit.currentStreak ?? 0;
      const completionRate = habit.completionRate ?? 0.5;

      if (streak === 0 && completionRate < 0.5) {
        // Struggling habit - schedule at absolute peak
        optimalHour = peakHours[0]?.hour ?? 9;
        reason = `Scheduled at your peak productivity time to help rebuild momentum`;
        confidence = 0.85;
      } else if (streak >= 7) {
        // Consistent habit - can be more flexible
        const secondaryHour = peakHours[1]?.hour ?? peakHours[0]?.hour ?? 10;
        optimalHour = secondaryHour;
        reason = `Your consistency allows flexibility - scheduled at a good secondary time`;
        confidence = 0.7;
      } else {
        // Normal habit - use pattern matching
        const peakRange = energyTimeRanges[peakEnergyTime] ?? [9, 10, 11];
        optimalHour = peakRange[Math.floor(peakRange.length / 2)];
        reason = `Matched to your ${peakEnergyTime} energy peak for best results`;
        confidence = 0.8;
      }

      // Generate alternative times
      const alternativeHours = peakHours
        .filter((h) => h.hour !== optimalHour)
        .slice(0, 2)
        .map((h) => formatHour(h.hour));

      suggestions.push({
        habitId: habit.id,
        habitName: habit.name,
        habitIcon: habit.icon ?? '⭐',
        suggestedTime: formatHour(optimalHour),
        suggestedHour: optimalHour,
        reason,
        confidence,
        alternativeTimes: alternativeHours,
      });
    });

    // Sort by confidence and return
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  };

  const handleSlotPress = (hour: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSlot(selectedSlot === hour ? null : hour);
  };

  const handleSchedule = (habitId: string, time: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onScheduleHabit?.(habitId, time);
  };

  if (isLoadingPatterns) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🧠 Analyzing your patterns...</Text>
      </View>
    );
  }

  if (compact) {
    return (
      <CompactScheduler
        suggestions={suggestions.slice(0, 3)}
        onSchedule={handleSchedule}
        onViewDetails={onViewDetails}
      />
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>📅</Text>
          <View>
            <Text style={styles.headerTitle}>Smart Scheduler</Text>
            <Text style={styles.headerSubtitle}>AI-optimized habit timing</Text>
          </View>
        </View>
        
        {/* View mode toggle */}
        <View style={styles.viewToggle}>
          <Pressable
            onPress={() => setViewMode('suggestions')}
            style={[
              styles.toggleButton,
              viewMode === 'suggestions' && styles.toggleButtonActive,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === 'suggestions' && styles.toggleTextActive,
              ]}
            >
              Suggestions
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode('timeline')}
            style={[
              styles.toggleButton,
              viewMode === 'timeline' && styles.toggleButtonActive,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === 'timeline' && styles.toggleTextActive,
              ]}
            >
              Timeline
            </Text>
          </Pressable>
        </View>
      </View>

      {viewMode === 'suggestions' ? (
        <SuggestionsView
          suggestions={suggestions}
          onSchedule={handleSchedule}
          onViewDetails={onViewDetails}
        />
      ) : (
        <TimelineView
          timeSlots={timeSlots}
          suggestions={suggestions}
          selectedSlot={selectedSlot}
          onSlotPress={handleSlotPress}
          onSchedule={handleSchedule}
        />
      )}

      {/* Energy pattern summary */}
      {patterns && (
        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={styles.patternSummary}
        >
          <LinearGradient
            colors={[colors.primary[50], colors.primary[100]]}
            style={styles.patternGradient}
          >
            <Text style={styles.patternIcon}>⚡</Text>
            <View style={styles.patternText}>
              <Text style={styles.patternTitle}>Your Energy Pattern</Text>
              <Text style={styles.patternDescription}>
                Peak productivity: {patterns.peakEnergyTime} • 
                Best hours: {patterns.bestHours?.slice(0, 2).map(h => 
                  `${h.hour > 12 ? h.hour - 12 : h.hour}${h.hour >= 12 ? 'PM' : 'AM'}`
                ).join(', ')}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      )}
    </Animated.View>
  );
};

// Suggestions View Component
interface SuggestionsViewProps {
  suggestions: ScheduleSuggestion[];
  onSchedule: (habitId: string, time: string) => void;
  onViewDetails?: (habitId: string) => void;
}

const SuggestionsView: React.FC<SuggestionsViewProps> = ({
  suggestions,
  onSchedule,
  onViewDetails,
}) => {
  return (
    <ScrollView
      style={styles.suggestionsContainer}
      showsVerticalScrollIndicator={false}
    >
      {suggestions.map((suggestion, index) => (
        <SuggestionCard
          key={suggestion.habitId}
          suggestion={suggestion}
          index={index}
          onSchedule={onSchedule}
          onViewDetails={onViewDetails}
        />
      ))}
    </ScrollView>
  );
};

// Suggestion Card Component
interface SuggestionCardProps {
  suggestion: ScheduleSuggestion;
  index: number;
  onSchedule: (habitId: string, time: string) => void;
  onViewDetails?: (habitId: string) => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  index,
  onSchedule,
  onViewDetails,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfigs.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfigs.bouncy);
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const confidenceColor = suggestion.confidence >= 0.8
    ? colors.success[500]
    : suggestion.confidence >= 0.6
    ? colors.warning[500]
    : colors.gray[400];

  return (
    <Animated.View entering={SlideInRight.delay(index * 80).springify()}>
      <AnimatedPressable
        onPress={() => onViewDetails?.(suggestion.habitId)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.suggestionCard, shadows.sm, cardStyle]}
      >
        <View style={styles.suggestionHeader}>
          <View style={styles.suggestionIconContainer}>
            <Text style={styles.suggestionIcon}>{suggestion.habitIcon}</Text>
          </View>
          <View style={styles.suggestionInfo}>
            <Text style={styles.suggestionName} numberOfLines={1}>
              {suggestion.habitName}
            </Text>
            <View style={styles.confidenceContainer}>
              <View
                style={[styles.confidenceDot, { backgroundColor: confidenceColor }]}
              />
              <Text style={styles.confidenceText}>
                {Math.round(suggestion.confidence * 100)}% match
              </Text>
            </View>
          </View>
          <View style={styles.suggestedTimeContainer}>
            <Text style={styles.suggestedTimeLabel}>Best time</Text>
            <Text style={styles.suggestedTime}>{suggestion.suggestedTime}</Text>
          </View>
        </View>

        <Text style={styles.suggestionReason} numberOfLines={2}>
          💡 {suggestion.reason}
        </Text>

        <View style={styles.suggestionActions}>
          {suggestion.alternativeTimes.length > 0 && (
            <View style={styles.alternativeTimes}>
              <Text style={styles.alternativeLabel}>Also good:</Text>
              {suggestion.alternativeTimes.map((time, i) => (
                <Pressable
                  key={i}
                  onPress={() => onSchedule(suggestion.habitId, time)}
                  style={styles.alternativeChip}
                >
                  <Text style={styles.alternativeText}>{time}</Text>
                </Pressable>
              ))}
            </View>
          )}
          
          <Pressable
            onPress={() => onSchedule(suggestion.habitId, suggestion.suggestedTime)}
            style={styles.scheduleButton}
          >
            <LinearGradient
              colors={[colors.primary[500], colors.primary[600]]}
              style={styles.scheduleGradient}
            >
              <Text style={styles.scheduleText}>Set Reminder</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
};

// Timeline View Component
interface TimelineViewProps {
  timeSlots: TimeSlot[];
  suggestions: ScheduleSuggestion[];
  selectedSlot: number | null;
  onSlotPress: (hour: number) => void;
  onSchedule: (habitId: string, time: string) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  timeSlots,
  suggestions,
  selectedSlot,
  onSlotPress,
  onSchedule,
}) => {
  const getSlotHabits = (hour: number) => {
    return suggestions.filter((s) => s.suggestedHour === hour);
  };

  return (
    <ScrollView
      style={styles.timelineContainer}
      showsVerticalScrollIndicator={false}
    >
      {timeSlots.map((slot, index) => {
        const slotHabits = getSlotHabits(slot.hour);
        const isSelected = selectedSlot === slot.hour;

        return (
          <Animated.View
            key={slot.hour}
            entering={FadeInDown.delay(index * 30).springify()}
          >
            <Pressable
              onPress={() => onSlotPress(slot.hour)}
              style={[
                styles.timeSlot,
                slot.isOptimal && styles.timeSlotOptimal,
                slot.isPeakEnergy && styles.timeSlotPeak,
                isSelected && styles.timeSlotSelected,
              ]}
            >
              <View style={styles.timeSlotLeft}>
                <Text style={styles.timeSlotLabel}>{slot.label}</Text>
                {slot.isPeakEnergy && (
                  <View style={styles.peakBadge}>
                    <Text style={styles.peakBadgeText}>⚡ Peak</Text>
                  </View>
                )}
              </View>

              <View style={styles.productivityBar}>
                <View
                  style={[
                    styles.productivityFill,
                    { width: `${slot.productivity * 100}%` },
                    slot.isPeakEnergy && styles.productivityFillPeak,
                  ]}
                />
              </View>

              {slotHabits.length > 0 && (
                <View style={styles.slotHabits}>
                  {slotHabits.slice(0, 2).map((habit) => (
                    <Text key={habit.habitId} style={styles.slotHabitIcon}>
                      {habit.habitIcon}
                    </Text>
                  ))}
                  {slotHabits.length > 2 && (
                    <Text style={styles.moreHabits}>+{slotHabits.length - 2}</Text>
                  )}
                </View>
              )}
            </Pressable>

            {isSelected && slotHabits.length > 0 && (
              <Animated.View
                entering={FadeInDown.springify()}
                style={styles.expandedSlot}
              >
                {slotHabits.map((habit) => (
                  <View key={habit.habitId} style={styles.expandedHabit}>
                    <Text style={styles.expandedHabitIcon}>{habit.habitIcon}</Text>
                    <Text style={styles.expandedHabitName}>{habit.habitName}</Text>
                    <Pressable
                      onPress={() => onSchedule(habit.habitId, slot.label)}
                      style={styles.quickScheduleButton}
                    >
                      <Text style={styles.quickScheduleText}>Set</Text>
                    </Pressable>
                  </View>
                ))}
              </Animated.View>
            )}
          </Animated.View>
        );
      })}
    </ScrollView>
  );
};

// Compact Scheduler for inline use
interface CompactSchedulerProps {
  suggestions: ScheduleSuggestion[];
  onSchedule: (habitId: string, time: string) => void;
  onViewDetails?: (habitId: string) => void;
}

const CompactScheduler: React.FC<CompactSchedulerProps> = ({
  suggestions,
  onSchedule,
  onViewDetails,
}) => {
  return (
    <View style={styles.compactContainer}>
      <View style={styles.compactHeader}>
        <Text style={styles.compactIcon}>🤖</Text>
        <Text style={styles.compactTitle}>Suggested Schedule</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.compactList}>
          {suggestions.map((suggestion, index) => (
            <Animated.View
              key={suggestion.habitId}
              entering={SlideInRight.delay(index * 50).springify()}
            >
              <Pressable
                onPress={() => onSchedule(suggestion.habitId, suggestion.suggestedTime)}
                style={[styles.compactCard, shadows.sm]}
              >
                <Text style={styles.compactCardIcon}>{suggestion.habitIcon}</Text>
                <Text style={styles.compactCardTime}>{suggestion.suggestedTime}</Text>
                <Text style={styles.compactCardName} numberOfLines={1}>
                  {suggestion.habitName}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[800],
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.gray[500],
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 10,
    padding: 3,
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[500],
  },
  toggleTextActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  suggestionsContainer: {
    maxHeight: 400,
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  suggestionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  suggestionIcon: {
    fontSize: 22,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 2,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 11,
    color: colors.gray[500],
  },
  suggestedTimeContainer: {
    alignItems: 'flex-end',
  },
  suggestedTimeLabel: {
    fontSize: 10,
    color: colors.gray[400],
    marginBottom: 2,
  },
  suggestedTime: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary[600],
  },
  suggestionReason: {
    fontSize: 12,
    color: colors.gray[600],
    lineHeight: 16,
    marginBottom: 12,
  },
  suggestionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alternativeTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  alternativeLabel: {
    fontSize: 11,
    color: colors.gray[500],
  },
  alternativeChip: {
    backgroundColor: colors.gray[100],
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  alternativeText: {
    fontSize: 11,
    color: colors.gray[600],
    fontWeight: '500',
  },
  scheduleButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  scheduleGradient: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  scheduleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timelineContainer: {
    maxHeight: 350,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: colors.gray[50],
  },
  timeSlotOptimal: {
    backgroundColor: colors.primary[50],
  },
  timeSlotPeak: {
    backgroundColor: colors.success[50],
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  timeSlotSelected: {
    backgroundColor: colors.primary[100],
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  timeSlotLeft: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeSlotLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[600],
  },
  peakBadge: {
    backgroundColor: colors.success[500],
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  peakBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  productivityBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  productivityFill: {
    height: '100%',
    backgroundColor: colors.primary[400],
    borderRadius: 3,
  },
  productivityFillPeak: {
    backgroundColor: colors.success[500],
  },
  slotHabits: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotHabitIcon: {
    fontSize: 16,
  },
  moreHabits: {
    fontSize: 10,
    color: colors.gray[500],
    fontWeight: '600',
  },
  expandedSlot: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    marginLeft: 80,
  },
  expandedHabit: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  expandedHabitIcon: {
    fontSize: 18,
  },
  expandedHabitName: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[700],
  },
  quickScheduleButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  quickScheduleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  patternSummary: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  patternGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  patternIcon: {
    fontSize: 24,
  },
  patternText: {
    flex: 1,
  },
  patternTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[700],
    marginBottom: 2,
  },
  patternDescription: {
    fontSize: 11,
    color: colors.primary[600],
  },
  // Compact styles
  compactContainer: {
    marginVertical: 8,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  compactIcon: {
    fontSize: 16,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  compactList: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  compactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: 90,
  },
  compactCardIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  compactCardTime: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary[600],
    marginBottom: 2,
  },
  compactCardName: {
    fontSize: 10,
    color: colors.gray[500],
    textAlign: 'center',
  },
});

export default SmartScheduler;
