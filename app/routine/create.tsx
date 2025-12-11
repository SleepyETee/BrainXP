// Create Routine Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, shadows } from '../../src/theme/colors';
import { useRoutineStore } from '../../src/stores/routineStore';
import { RoutineType } from '../../src/types/routine';

interface NewStep {
  id: string;
  name: string;
  icon: string;
  estimatedMinutes: number;
}

const ROUTINE_TYPES = [
  { type: 'morning' as RoutineType, icon: '🌅', label: 'Morning' },
  { type: 'evening' as RoutineType, icon: '🌙', label: 'Evening' },
  { type: 'work' as RoutineType, icon: '💼', label: 'Work' },
  { type: 'custom' as RoutineType, icon: '✨', label: 'Custom' },
];

const STEP_ICONS = ['🧘', '💧', '📋', '🥣', '💊', '🚿', '📖', '🏃', '🧹', '💤', '📝', '☕'];

export default function CreateRoutineScreen() {
  const router = useRouter();
  const createRoutine = useRoutineStore((state) => state.createRoutine);
  
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<RoutineType>('morning');
  const [steps, setSteps] = useState<NewStep[]>([]);
  const [newStepName, setNewStepName] = useState('');
  const [newStepIcon, setNewStepIcon] = useState('📋');
  const [newStepMinutes, setNewStepMinutes] = useState('5');
  const [showStepForm, setShowStepForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleAddStep = async () => {
    if (!newStepName.trim()) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const step: NewStep = {
      id: Date.now().toString(),
      name: newStepName.trim(),
      icon: newStepIcon,
      estimatedMinutes: parseInt(newStepMinutes) || 5,
    };
    
    setSteps(prev => [...prev, step]);
    setNewStepName('');
    setNewStepMinutes('5');
    setShowStepForm(false);
  };

  const handleRemoveStep = async (stepId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSteps(prev => prev.filter(s => s.id !== stepId));
  };

  const handleCreate = async () => {
    if (!name.trim() || steps.length === 0 || isCreating) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsCreating(true);
    try {
      const routineType = ROUTINE_TYPES.find(t => t.type === selectedType);
      
      await createRoutine({
        name: name.trim(),
        icon: routineType?.icon || '📋',
        type: selectedType,
        daysActive: [0, 1, 2, 3, 4, 5, 6], // Default to every day
        steps: steps.map(s => ({
          name: s.name,
          icon: s.icon,
          estimatedMinutes: s.estimatedMinutes,
        })),
      });
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Failed to create routine:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsCreating(false);
    }
  };

  const totalMinutes = steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Routine</Text>
        <TouchableOpacity 
          onPress={handleCreate}
          disabled={!name.trim() || steps.length === 0}
        >
          <Text style={[
            styles.createButton,
            (!name.trim() || steps.length === 0) && styles.createButtonDisabled
          ]}>
            Create
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <Text style={styles.label}>Routine Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Morning Power-Up"
            placeholderTextColor={colors.gray[400]}
            value={name}
            onChangeText={setName}
            maxLength={40}
          />
        </Animated.View>

        {/* Type */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeGrid}>
            {ROUTINE_TYPES.map(({ type, icon, label }) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  selectedType === type && styles.typeOptionSelected
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={styles.typeIcon}>{icon}</Text>
                <Text style={[
                  styles.typeLabel,
                  selectedType === type && styles.typeLabelSelected
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Steps */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <View style={styles.stepsHeader}>
            <Text style={styles.label}>Steps ({steps.length})</Text>
            {totalMinutes > 0 && (
              <Text style={styles.totalTime}>~{totalMinutes} min total</Text>
            )}
          </View>

          {steps.map((step, index) => (
            <View key={step.id} style={styles.stepCard}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
              <Text style={styles.stepIcon}>{step.icon}</Text>
              <View style={styles.stepInfo}>
                <Text style={styles.stepName}>{step.name}</Text>
                <Text style={styles.stepDuration}>{step.estimatedMinutes} min</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveStep(step.id)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Step Form */}
          {showStepForm ? (
            <View style={styles.addStepForm}>
              <Text style={styles.addStepTitle}>Add Step</Text>
              
              {/* Icon Picker */}
              <View style={styles.iconPicker}>
                {STEP_ICONS.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      newStepIcon === icon && styles.iconOptionSelected
                    ]}
                    onPress={() => setNewStepIcon(icon)}
                  >
                    <Text style={styles.iconEmoji}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Step name"
                placeholderTextColor={colors.gray[400]}
                value={newStepName}
                onChangeText={setNewStepName}
              />

              <View style={styles.minutesRow}>
                <Text style={styles.minutesLabel}>Estimated time:</Text>
                <TextInput
                  style={styles.minutesInput}
                  placeholder="5"
                  placeholderTextColor={colors.gray[400]}
                  value={newStepMinutes}
                  onChangeText={setNewStepMinutes}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <Text style={styles.minutesUnit}>min</Text>
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelStepButton}
                  onPress={() => setShowStepForm(false)}
                >
                  <Text style={styles.cancelStepText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addStepButton}
                  onPress={handleAddStep}
                >
                  <Text style={styles.addStepButtonText}>Add Step</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addStepCard}
              onPress={() => setShowStepForm(true)}
            >
              <Text style={styles.addStepIcon}>➕</Text>
              <Text style={styles.addStepText}>Add a step</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Tips */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips for effective routines</Text>
          <Text style={styles.tipItem}>• Start small - 3-5 steps max</Text>
          <Text style={styles.tipItem}>• Keep each step under 15 minutes</Text>
          <Text style={styles.tipItem}>• Link to existing habits for consistency</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  cancelButton: {
    fontSize: 16,
    color: colors.gray[500],
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[900],
  },
  createButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[500],
  },
  createButtonDisabled: {
    color: colors.gray[300],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray[800],
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  typeOptionSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[600],
  },
  typeLabelSelected: {
    color: colors.primary[700],
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalTime: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '500',
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[100],
    color: colors.primary[700],
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 10,
  },
  stepIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[800],
  },
  stepDuration: {
    fontSize: 12,
    color: colors.gray[500],
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  addStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
  },
  addStepIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  addStepText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.gray[600],
  },
  addStepForm: {
    backgroundColor: colors.primary[50],
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  addStepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[700],
    marginBottom: 12,
  },
  iconPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  iconOptionSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[100],
  },
  iconEmoji: {
    fontSize: 18,
  },
  minutesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  minutesLabel: {
    fontSize: 14,
    color: colors.gray[700],
    marginRight: 10,
  },
  minutesInput: {
    width: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.gray[800],
    textAlign: 'center',
  },
  minutesUnit: {
    fontSize: 14,
    color: colors.gray[500],
    marginLeft: 8,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelStepButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  cancelStepText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
  },
  addStepButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.primary[500],
  },
  addStepButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tipsCard: {
    backgroundColor: colors.success[50],
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.success[100],
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.success[700],
    marginBottom: 10,
  },
  tipItem: {
    fontSize: 14,
    color: colors.success[600],
    marginBottom: 4,
    lineHeight: 20,
  },
});
