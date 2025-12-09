import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { TaskForm } from '../../src/components/tasks/TaskForm';
import { useTaskStore } from '../../src/stores/taskStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { colors } from '../../src/theme/colors';
import { CreateTaskInput } from '../../src/types/task';

export default function CreateTaskScreen() {
  const router = useRouter();
  const createTask = useTaskStore((state) => state.createTask);
  const isLoading = useTaskStore((state) => state.isLoading);
  const addXP = useProgressStore((state) => state.addXP);

  const handleSubmit = async (data: CreateTaskInput) => {
    try {
      const task = await createTask(data);
      await addXP(5, 'task_complete', 'Created a new task', task.id);
      router.back();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Task</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Form */}
      <TaskForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isLoading={isLoading}
        submitLabel="Create Task"
      />
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  closeButton: {
    fontSize: 24,
    color: colors.gray[500],
    width: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[800],
  },
  placeholder: {
    width: 32,
  },
});

