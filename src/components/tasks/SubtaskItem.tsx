import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
  Layout,
  SlideInRight,
  SlideOutLeft,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Subtask } from '../../types/task';
import { colors } from '../../theme/colors';
import { springConfigs } from '../../utils/animations';

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: () => void;
  onPress?: () => void;
  onDelete: () => void;
  isEditing?: boolean;
  onEdit?: (title: string) => void;
  onEditSubmit?: () => void;
  onStartEdit?: () => void;
  showDragHandle?: boolean;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SubtaskItem: React.FC<SubtaskItemProps> = ({
  subtask,
  onToggle,
  onPress,
  onDelete,
  isEditing = false,
  onEdit,
  onEditSubmit,
  onStartEdit,
  showDragHandle = false,
  index = 0,
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  const inputRef = useRef<TextInput>(null);
  const isDone = subtask.completed;

  // Animation values
  const checkboxScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const strikethroughWidth = useSharedValue(isDone ? 100 : 0);

  const handleToggle = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Checkbox bounce animation
    checkboxScale.value = withSequence(
      withSpring(1.3, springConfigs.wobbly),
      withSpring(1, springConfigs.gentle)
    );

    // Glow effect
    glowOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 400 })
    );

    // Strikethrough animation
    strikethroughWidth.value = withTiming(isDone ? 0 : 100, { duration: 300 });

    onToggle();
  }, [isDone, onToggle]);

  const handleDelete = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swipeableRef.current?.close();
    onDelete();
  }, [onDelete]);

  const handleLongPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStartEdit?.();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [onStartEdit]);

  const handlePressIn = () => {
    cardScale.value = withSpring(0.98, springConfigs.snappy);
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, springConfigs.bouncy);
  };

  // Animated styles
  const checkboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkboxScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const strikethroughStyle = useAnimatedStyle(() => ({
    width: `${strikethroughWidth.value}%`,
  }));

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={handleDelete}
      activeOpacity={0.8}
    >
      <Text style={styles.deleteActionIcon}>🗑️</Text>
      <Text style={styles.deleteActionText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View
      entering={SlideInRight.delay(index * 30).springify()}
      exiting={SlideOutLeft.duration(200)}
      layout={Layout.springify()}
    >
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        friction={2}
        overshootRight={false}
        rightThreshold={40}
      >
        <AnimatedPressable
          onPress={onPress}
          onLongPress={handleLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.container, isDone && styles.containerDone, cardStyle]}
        >
          {/* Drag handle */}
          {showDragHandle && (
            <View style={styles.dragHandle}>
              <Text style={styles.dragHandleIcon}>⋮⋮</Text>
            </View>
          )}

          {/* Checkbox with glow effect */}
          <View style={styles.checkboxContainer}>
            <Animated.View style={[styles.glowEffect, glowStyle]}>
              <LinearGradient
                colors={[`${colors.success[400]}60`, 'transparent']}
                style={styles.glowGradient}
              />
            </Animated.View>

            <TouchableOpacity
              onPress={handleToggle}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Animated.View
                style={[
                  styles.checkbox,
                  isDone && styles.checkboxDone,
                  checkboxStyle,
                ]}
              >
                {isDone && (
                  <LinearGradient
                    colors={[colors.success[500], colors.success[400]]}
                    style={styles.checkboxFill}
                  >
                    <Text style={styles.checkmark}>✓</Text>
                  </LinearGradient>
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Title with inline editing */}
          <View style={styles.titleContainer}>
            {isEditing ? (
              <TextInput
                ref={inputRef}
                style={styles.editInput}
                value={subtask.title}
                onChangeText={onEdit}
                onSubmitEditing={onEditSubmit}
                onBlur={onEditSubmit}
                autoFocus
                returnKeyType="done"
                selectTextOnFocus
                placeholder="Subtask name..."
                placeholderTextColor={colors.gray[400]}
              />
            ) : (
              <View style={styles.titleWrapper}>
                <Text
                  style={[styles.title, isDone && styles.titleDone]}
                  numberOfLines={2}
                >
                  {subtask.title}
                </Text>
                {/* Animated strikethrough */}
                <Animated.View style={[styles.strikethrough, strikethroughStyle]} />
              </View>
            )}
          </View>

          {/* Quick action hint */}
          {!isEditing && !isDone && (
            <TouchableOpacity
              style={styles.quickAction}
              onPress={onStartEdit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.quickActionIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </AnimatedPressable>
      </Swipeable>
    </Animated.View>
  );
};

interface AddSubtaskInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const AddSubtaskInput: React.FC<AddSubtaskInputProps> = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = 'Add a subtask...',
  autoFocus = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputScale = useSharedValue(1);

  const handleFocus = () => {
    setIsFocused(true);
    inputScale.value = withSpring(1.01, springConfigs.snappy);
  };

  const handleBlur = () => {
    setIsFocused(false);
    inputScale.value = withSpring(1, springConfigs.gentle);
    if (!value.trim()) {
      onCancel?.();
    }
  };

  const handleSubmit = async () => {
    if (value.trim()) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSubmit();
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[
        styles.addContainer,
        isFocused && styles.addContainerFocused,
        containerStyle,
      ]}
    >
      <View style={[styles.addIcon, isFocused && styles.addIconFocused]}>
        <Text style={[styles.addIconText, isFocused && styles.addIconTextFocused]}>+</Text>
      </View>
      <TextInput
        style={styles.addInput}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={handleSubmit}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.gray[400]}
        returnKeyType="done"
        autoFocus={autoFocus}
        blurOnSubmit={false}
      />
      {value.trim().length > 0 && (
        <Animated.View entering={FadeIn.duration(150)}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary[500], colors.primary[600]]}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
};

// Progress indicator for subtasks
interface SubtaskProgressProps {
  total: number;
  completed: number;
  showLabel?: boolean;
}

export const SubtaskProgress: React.FC<SubtaskProgressProps> = ({
  total,
  completed,
  showLabel = true,
}) => {
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const progressWidth = useSharedValue(0);

  React.useEffect(() => {
    progressWidth.value = withSpring(progress, springConfigs.gentle);
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const isComplete = completed === total && total > 0;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progressFill,
            isComplete && styles.progressFillComplete,
            progressStyle,
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.progressLabel, isComplete && styles.progressLabelComplete]}>
          {completed}/{total} {isComplete ? '🎉' : ''}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 3,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  containerDone: {
    backgroundColor: colors.gray[50],
    borderColor: colors.gray[100],
  },
  dragHandle: {
    paddingRight: 10,
    paddingVertical: 4,
  },
  dragHandleIcon: {
    fontSize: 14,
    color: colors.gray[300],
    letterSpacing: -2,
  },
  checkboxContainer: {
    position: 'relative',
    marginRight: 12,
  },
  glowEffect: {
    position: 'absolute',
    width: 40,
    height: 40,
    left: -10,
    top: -10,
    borderRadius: 20,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  checkboxDone: {
    borderWidth: 0,
  },
  checkboxFill: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
  },
  titleWrapper: {
    position: 'relative',
  },
  title: {
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 20,
  },
  titleDone: {
    color: colors.gray[400],
  },
  strikethrough: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: colors.gray[400],
    top: '50%',
    left: 0,
    borderRadius: 1,
  },
  editInput: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[700],
    padding: 0,
    lineHeight: 20,
  },
  quickAction: {
    padding: 6,
    marginLeft: 8,
  },
  quickActionIcon: {
    fontSize: 14,
    opacity: 0.5,
  },
  deleteAction: {
    backgroundColor: colors.danger[500],
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 3,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    gap: 4,
  },
  deleteActionIcon: {
    fontSize: 18,
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Add subtask input styles
  addContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
    marginVertical: 3,
  },
  addContainerFocused: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
    borderStyle: 'solid',
  },
  addIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addIconFocused: {
    backgroundColor: colors.primary[500],
  },
  addIconText: {
    fontSize: 16,
    color: colors.gray[500],
    fontWeight: '600',
    marginTop: -1,
  },
  addIconTextFocused: {
    color: '#FFFFFF',
  },
  addInput: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[700],
    padding: 0,
  },
  submitButton: {
    marginLeft: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  // Progress styles
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
  progressFillComplete: {
    backgroundColor: colors.success[500],
  },
  progressLabel: {
    fontSize: 13,
    color: colors.gray[500],
    fontWeight: '500',
    minWidth: 50,
  },
  progressLabelComplete: {
    color: colors.success[600],
    fontWeight: '600',
  },
});

export default SubtaskItem;
