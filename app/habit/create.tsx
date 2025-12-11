import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Header } from '../../src/components/common/Header';
import { useHabitStore } from '../../src/stores/habitStore';
import { colors } from '../../src/theme/colors';

const ICONS = ['⭐', '💪', '🧘', '📚', '💊', '🥗', '🏃', '💧', '🎯', '✨', '🌟', '🔥'];
const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

const DAYS = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

export default function CreateHabitScreen() {
  const router = useRouter();
  const { habitId } = useLocalSearchParams<{ habitId?: string }>();
  const createHabit = useHabitStore((state) => state.createHabit);
  const updateHabit = useHabitStore((state) => state.updateHabit);
  const getHabitById = useHabitStore((state) => state.getHabitById);
  const isLoading = useHabitStore((state) => state.isLoading);
  const existingHabit = habitId ? getHabitById(habitId) : undefined;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⭐');
  const [color, setColor] = useState('#3B82F6');
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [anchorDescription, setAnchorDescription] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);

  React.useEffect(() => {
    if (!existingHabit) return;
    setName(existingHabit.name);
    setIcon(existingHabit.icon || '⭐');
    setColor(existingHabit.color || '#3B82F6');
    setSelectedDays(existingHabit.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
    setAnchorDescription(existingHabit.anchorDescription || '');
    setReminderEnabled(existingHabit.reminderEnabled ?? false);
  }, [existingHabit?.id]);

  const toggleDay = (day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      if (existingHabit && habitId) {
        await updateHabit(habitId, {
          name: name.trim(),
          icon,
          color,
          daysOfWeek: selectedDays,
          anchorDescription: anchorDescription.trim() || undefined,
          reminderEnabled,
          frequencyType: selectedDays.length === 7 ? 'daily' : 'specific_days',
        });
      } else {
        await createHabit({
          name: name.trim(),
          icon,
          color,
          daysOfWeek: selectedDays,
          anchorDescription: anchorDescription.trim() || undefined,
          reminderEnabled,
          frequencyType: selectedDays.length === 7 ? 'daily' : 'specific_days',
        });
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Failed to create habit:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={existingHabit ? 'Edit Habit' : 'Create Habit'} showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {existingHabit ? 'Update your habit' : 'What habit do you want to build?'}
          </Text>
          <Input
            placeholder="e.g., Morning meditation, Take vitamins..."
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        {/* Icon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose an icon</Text>
          <View style={styles.iconGrid}>
            {ICONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[styles.iconButton, icon === emoji && styles.iconButtonSelected]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setIcon(emoji);
                }}
              >
                <Text style={styles.iconText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pick a color</Text>
          <View style={styles.colorGrid}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorButton,
                  { backgroundColor: c },
                  color === c && styles.colorButtonSelected,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setColor(c);
                }}
              >
                {color === c && <Text style={styles.colorCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Which days?</Text>
          <View style={styles.daysRow}>
            {DAYS.map((day) => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayButton,
                  selectedDays.includes(day.value) && [
                    styles.dayButtonSelected,
                    { backgroundColor: color },
                  ],
                ]}
                onPress={() => toggleDay(day.value)}
              >
                <Text
                  style={[
                    styles.dayText,
                    selectedDays.includes(day.value) && styles.dayTextSelected,
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])}
          >
            <Text style={styles.selectAllText}>Select all</Text>
          </TouchableOpacity>
        </View>

        {/* Habit Stacking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habit stacking (optional)</Text>
          <Text style={styles.sectionHint}>
            Link this habit to an existing routine for better success
          </Text>
          <Input
            placeholder="After I [existing habit], I will..."
            value={anchorDescription}
            onChangeText={setAnchorDescription}
            maxLength={100}
          />
        </View>

        {/* Reminder Toggle */}
        <TouchableOpacity
          style={styles.reminderRow}
          onPress={() => {
            Haptics.selectionAsync();
            setReminderEnabled(!reminderEnabled);
          }}
        >
          <View>
            <Text style={styles.reminderTitle}>Daily Reminder</Text>
            <Text style={styles.reminderHint}>Get a gentle nudge each day</Text>
          </View>
          <View
            style={[
              styles.toggle,
              reminderEnabled && [styles.toggleActive, { backgroundColor: color }],
            ]}
          >
            <View
              style={[
                styles.toggleKnob,
                reminderEnabled && styles.toggleKnobActive,
              ]}
            />
          </View>
        </TouchableOpacity>

        {/* Submit */}
        <View style={styles.actions}>
          <Button
            title={existingHabit ? 'Save Changes' : 'Create Habit'}
            onPress={handleCreate}
            loading={isLoading}
            disabled={!name.trim() || selectedDays.length === 0}
            fullWidth
          />
        </View>

        {/* Tips */}
        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>💡 Tips for building habits</Text>
          <Text style={styles.tipsText}>
            • Start small - tiny habits stick better{'\n'}
            • Be specific about when and where{'\n'}
            • Stack new habits onto existing ones{'\n'}
            • Celebrate small wins!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 8,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconButtonSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  iconText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  colorCheck: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  dayButtonSelected: {
    borderColor: 'transparent',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  selectAllButton: {
    alignSelf: 'flex-start',
  },
  selectAllText: {
    fontSize: 13,
    color: colors.primary[500],
    fontWeight: '500',
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
  },
  reminderHint: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gray[200],
    padding: 2,
  },
  toggleActive: {
    backgroundColor: colors.primary[500],
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  actions: {
    marginBottom: 24,
  },
  tips: {
    backgroundColor: colors.success[50],
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success[700],
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: colors.success[600],
    lineHeight: 22,
  },
});

