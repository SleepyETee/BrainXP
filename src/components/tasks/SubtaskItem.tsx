import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Task } from '../../types/task';
import { colors } from '../../theme/colors';

interface SubtaskItemProps {
  subtask: Task;
  onToggle: () => void;
  onPress: () => void;
  onDelete: () => void;
  isEditing?: boolean;
  onEdit?: (title: string) => void;
  onEditSubmit?: () => void;
}

export const SubtaskItem: React.FC<SubtaskItemProps> = ({
  subtask,
  onToggle,
  onPress,
  onDelete,
  isEditing = false,
  onEdit,
  onEditSubmit,
}) => {
  const checkboxScale = useRef(new Animated.Value(1)).current;
  const isDone = subtask.status === 'done';

  const handleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.sequence([
      Animated.spring(checkboxScale, {
        toValue: 1.2,
        useNativeDriver: true,
      }),
      Animated.spring(checkboxScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle();
  };

  return (
    <View style={styles.container}>
      {/* Checkbox */}
      <Animated.View style={{ transform: [{ scale: checkboxScale }] }}>
        <TouchableOpacity
          style={[styles.checkbox, isDone && styles.checkboxDone]}
          onPress={handleToggle}
        >
          {isDone && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      </Animated.View>

      {/* Title */}
      {isEditing ? (
        <TextInput
          style={styles.editInput}
          value={subtask.title}
          onChangeText={onEdit}
          onSubmitEditing={onEditSubmit}
          autoFocus
          returnKeyType="done"
        />
      ) : (
        <TouchableOpacity style={styles.titleContainer} onPress={onPress}>
          <Text
            style={[styles.title, isDone && styles.titleDone]}
            numberOfLines={2}
          >
            {subtask.title}
          </Text>
        </TouchableOpacity>
      )}

      {/* Time estimate */}
      {subtask.estimatedMinutes && (
        <Text style={styles.estimate}>{subtask.estimatedMinutes}m</Text>
      )}

      {/* Delete button */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.deleteIcon}>×</Text>
      </TouchableOpacity>
    </View>
  );
};

interface AddSubtaskInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export const AddSubtaskInput: React.FC<AddSubtaskInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Add a subtask...',
}) => {
  return (
    <View style={styles.addContainer}>
      <View style={styles.addIcon}>
        <Text style={styles.addIconText}>+</Text>
      </View>
      <TextInput
        style={styles.addInput}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.gray[400]}
        returnKeyType="done"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    marginVertical: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray[300],
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.success[500],
    borderColor: colors.success[500],
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: colors.gray[700],
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: colors.gray[400],
  },
  editInput: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[700],
    padding: 0,
  },
  estimate: {
    fontSize: 12,
    color: colors.gray[400],
    marginLeft: 8,
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  },
  deleteIcon: {
    fontSize: 20,
    color: colors.gray[400],
    fontWeight: '600',
  },
  addContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
    marginVertical: 2,
  },
  addIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  addIconText: {
    fontSize: 14,
    color: colors.gray[500],
    fontWeight: '600',
  },
  addInput: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[700],
    padding: 0,
  },
});

export default SubtaskItem;
