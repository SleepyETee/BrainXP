import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Input, TextArea } from '../ui/Input';
import { Button } from '../ui/Button';
import { colors } from '../../theme/colors';
import { CreateTaskInput, TaskPriority, EnergyLevel } from '../../types/task';
import { matchProject, ProjectCandidate, ProjectMatchResult } from '../../services/api/ai';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  estimatedMinutes: z.number().min(1).max(480).optional(),
  priority: z.enum(['urgent_important', 'important', 'urgent', 'high', 'medium', 'low', 'none']),
  energyRequired: z.enum(['low', 'medium', 'high']),
  tags: z.array(z.string()).optional(),
  projectId: z.string().optional(),
  smallestFirstStep: z.string().max(200).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  initialValues?: Partial<CreateTaskInput>;
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  availableProjects?: ProjectCandidate[];
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'urgent_important', label: 'Urgent & Important', color: colors.danger[500] },
  { value: 'important', label: 'Important', color: colors.warning[500] },
  { value: 'urgent', label: 'Urgent', color: '#F97316' },
  { value: 'low', label: 'Low', color: colors.gray[400] },
  { value: 'none', label: 'None', color: colors.gray[300] },
];

const ENERGY_OPTIONS: { value: EnergyLevel; label: string; emoji: string }[] = [
  { value: 'low', label: 'Low', emoji: '🌱' },
  { value: 'medium', label: 'Medium', emoji: '⚡' },
  { value: 'high', label: 'High', emoji: '🔥' },
];

const TIME_PRESETS = [5, 15, 25, 45, 60, 90];

const DEFAULT_PROJECTS: ProjectCandidate[] = [
  { id: 'work', name: 'Work' },
  { id: 'home', name: 'Home / Life' },
  { id: 'health', name: 'Health' },
  { id: 'learning', name: 'Learning' },
];

export const TaskForm: React.FC<TaskFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Create Task',
  availableProjects,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [projectSuggestion, setProjectSuggestion] = useState<ProjectMatchResult['recommendedProject'] | null>(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [hasAutoSuggestedProject, setHasAutoSuggestedProject] = useState(false);
  const projectOptions = (availableProjects && availableProjects.length ? availableProjects : DEFAULT_PROJECTS);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: initialValues?.title || '',
      description: initialValues?.description || '',
      dueDate: initialValues?.dueDate,
      dueTime: initialValues?.dueTime,
      estimatedMinutes: initialValues?.estimatedMinutes,
      priority: initialValues?.priority || 'none',
      energyRequired: initialValues?.energyRequired || 'medium',
      tags: initialValues?.tags || [],
      projectId: initialValues?.projectId,
      smallestFirstStep: initialValues?.smallestFirstStep || '',
    },
  });

  const watchedTags = watch('tags') || [];
  const watchedDueDate = watch('dueDate');
  const watchedEstimate = watch('estimatedMinutes');
  const watchedProjectId = watch('projectId');
  const watchedTitle = watch('title');
  const watchedDescription = watch('description');

  const handleAddTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      setValue('tags', [...watchedTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setValue('tags', watchedTags.filter((t) => t !== tag));
  };

  const handleSelectProject = (projectId: string) => {
    setValue('projectId', projectId);
    setProjectSuggestion(null);
  };

  const handleMatchProject = async () => {
    if (!watchedTitle?.trim()) {
      setProjectError('Add a title first to get a suggestion');
      return;
    }

    setProjectLoading(true);
    setProjectError(null);

    try {
      const result = await matchProject({
        taskTitle: watchedTitle.trim(),
        taskDescription: watchedDescription,
        projects: projectOptions,
      });
      setProjectSuggestion(result.recommendedProject);
      setValue('projectId', result.recommendedProject.id);
    } catch (error) {
      console.error('Failed to match project:', error);
      setProjectError('Could not get a suggestion right now');
    } finally {
      setProjectLoading(false);
    }
  };

  useEffect(() => {
    if (hasAutoSuggestedProject) return;
    if (!initialValues?.title) return;
    if (projectLoading) return;
    if (initialValues?.projectId) return;
    if (!watchedTitle?.trim()) return;

    setHasAutoSuggestedProject(true);
    handleMatchProject();
  }, [hasAutoSuggestedProject, projectLoading, initialValues?.projectId, watchedTitle]);

  const handleFormSubmit = async (data: TaskFormData) => {
    await onSubmit(data as CreateTaskInput);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="What needs to be done?"
              placeholder="Enter task title..."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.title?.message}
              autoFocus
            />
          )}
        />

        {/* Smallest First Step */}
        <Controller
          control={control}
          name="smallestFirstStep"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="What's the smallest first step?"
              placeholder="e.g., Open the document..."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              hint="Breaking it down makes starting easier"
            />
          )}
        />

        {/* Description */}
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextArea
              label="Notes (optional)"
              placeholder="Add any additional details..."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              rows={3}
            />
          )}
        />

        {/* Project (optional) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Project (optional)</Text>
          <View style={styles.projectChips}>
            {projectOptions.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={[
                  styles.projectChip,
                  watchedProjectId === project.id && styles.projectChipActive,
                ]}
                onPress={() => handleSelectProject(project.id)}
              >
                <Text
                  style={[
                    styles.projectChipText,
                    watchedProjectId === project.id && styles.projectChipTextActive,
                  ]}
                >
                  {project.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {projectSuggestion && (
            <View style={styles.projectSuggestion}>
              <Text style={styles.projectSuggestionTitle}>✨ Suggested: {projectSuggestion.name}</Text>
              {projectSuggestion.reason && (
                <Text style={styles.projectSuggestionReason}>{projectSuggestion.reason}</Text>
              )}
              {typeof projectSuggestion.confidence === 'number' && (
                <Text style={styles.projectConfidence}>
                  Confidence: {(projectSuggestion.confidence * 100).toFixed(0)}%
                </Text>
              )}
            </View>
          )}
          {projectError && <Text style={styles.errorText}>{projectError}</Text>}
          <TouchableOpacity
            style={[styles.projectButton, projectLoading && styles.buttonDisabled]}
            onPress={handleMatchProject}
            disabled={projectLoading}
          >
            {projectLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.projectButtonText}>Ask AI to suggest a project</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Due Date */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Due Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateButtonText, !watchedDueDate && styles.placeholder]}>
              {watchedDueDate
                ? new Date(watchedDueDate).toLocaleDateString()
                : 'Set due date'}
            </Text>
          </TouchableOpacity>
          {watchedDueDate && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setValue('dueDate', undefined)}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={watchedDueDate ? new Date(watchedDueDate) : new Date()}
            mode="date"
            onChange={(event: DateTimePickerEvent, date?: Date) => {
              setShowDatePicker(false);
              if (date) {
                setValue('dueDate', date.toISOString().split('T')[0]);
              }
            }}
          />
        )}

        {/* Time Estimate */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Time Estimate</Text>
          <View style={styles.timePresets}>
            {TIME_PRESETS.map((minutes) => (
              <TouchableOpacity
                key={minutes}
                style={[
                  styles.timePreset,
                  watchedEstimate === minutes && styles.timePresetActive,
                ]}
                onPress={() => setValue('estimatedMinutes', minutes)}
              >
                <Text
                  style={[
                    styles.timePresetText,
                    watchedEstimate === minutes && styles.timePresetTextActive,
                  ]}
                >
                  {minutes}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Priority</Text>
          <Controller
            control={control}
            name="priority"
            render={({ field: { value, onChange } }) => (
              <View style={styles.priorityOptions}>
                {PRIORITY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.priorityOption,
                      value === option.value && styles.priorityOptionActive,
                      value === option.value && { borderColor: option.color },
                    ]}
                    onPress={() => onChange(option.value)}
                  >
                    <View
                      style={[styles.priorityDot, { backgroundColor: option.color }]}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        value === option.value && styles.priorityTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        </View>

        {/* Energy Required */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Energy Required</Text>
          <Controller
            control={control}
            name="energyRequired"
            render={({ field: { value, onChange } }) => (
              <View style={styles.energyOptions}>
                {ENERGY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.energyOption,
                      value === option.value && styles.energyOptionActive,
                    ]}
                    onPress={() => onChange(option.value)}
                  >
                    <Text style={styles.energyEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.energyText,
                        value === option.value && styles.energyTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        </View>

        {/* Tags */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagInputRow}>
            <Input
              placeholder="Add a tag..."
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
              containerStyle={styles.tagInputContainer}
            />
            <Button title="Add" size="sm" onPress={handleAddTag} />
          </View>
          {watchedTags.length > 0 && (
            <View style={styles.tagsList}>
              {watchedTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.tagChip}
                  onPress={() => handleRemoveTag(tag)}
                >
                  <Text style={styles.tagChipText}>{tag}</Text>
                  <Text style={styles.tagRemove}>×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Cancel"
          variant="ghost"
          onPress={onCancel}
          style={styles.cancelButton}
        />
        <Button
          title={submitLabel}
          onPress={handleSubmit(handleFormSubmit)}
          loading={isLoading}
          style={styles.submitButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  dateButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.gray[800],
  },
  placeholder: {
    color: colors.gray[400],
  },
  clearButton: {
    marginTop: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.primary[500],
  },
  timePresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timePreset: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  timePresetActive: {
    backgroundColor: colors.primary[500],
  },
  timePresetText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
  },
  timePresetTextActive: {
    color: '#FFFFFF',
  },
  priorityOptions: {
    gap: 8,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    gap: 10,
  },
  priorityOptionActive: {
    backgroundColor: colors.gray[50],
    borderWidth: 2,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 15,
    color: colors.gray[600],
  },
  priorityTextActive: {
    fontWeight: '600',
    color: colors.gray[800],
  },
  energyOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  energyOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    gap: 8,
  },
  energyOptionActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  energyEmoji: {
    fontSize: 24,
  },
  energyText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  energyTextActive: {
    fontWeight: '600',
    color: colors.primary[700],
  },
  projectChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  projectChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: '#FFFFFF',
  },
  projectChipActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  projectChipText: {
    color: colors.gray[700],
    fontWeight: '500',
  },
  projectChipTextActive: {
    color: colors.primary[700],
  },
  projectSuggestion: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primary[100],
    marginBottom: 10,
  },
  projectSuggestionTitle: {
    fontWeight: '700',
    color: colors.primary[700],
    marginBottom: 4,
  },
  projectSuggestionReason: {
    color: colors.gray[700],
    fontSize: 13,
    marginBottom: 4,
  },
  projectConfidence: {
    color: colors.gray[500],
    fontSize: 12,
  },
  projectButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.primary[600],
  },
  projectButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorText: {
    color: colors.danger ? colors.danger[500] : '#DC2626',
    marginBottom: 6,
    fontSize: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  tagInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 16,
    gap: 4,
  },
  tagChipText: {
    fontSize: 13,
    color: colors.primary[700],
  },
  tagRemove: {
    fontSize: 18,
    color: colors.primary[500],
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});

export default TaskForm;
