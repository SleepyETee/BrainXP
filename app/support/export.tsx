import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../src/stores/taskStore';
import { useHabitStore } from '../../src/stores/habitStore';
import { useFocusStore } from '../../src/stores/focusStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { colors } from '../../src/theme/colors';

type ExportFormat = 'json' | 'csv';

interface ExportOption {
  key: string;
  label: string;
  emoji: string;
  description: string;
  enabled: boolean;
}

export default function ExportScreen() {
  const router = useRouter();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOption[]>([
    { key: 'tasks', label: 'Tasks', emoji: '✅', description: 'All tasks and subtasks', enabled: true },
    { key: 'habits', label: 'Habits', emoji: '🔄', description: 'Habits and completion logs', enabled: true },
    { key: 'focus', label: 'Focus Sessions', emoji: '⏱️', description: 'Focus history and stats', enabled: true },
    { key: 'progress', label: 'Progress & XP', emoji: '📊', description: 'Level, XP, badges', enabled: true },
    { key: 'settings', label: 'Settings', emoji: '⚙️', description: 'App preferences', enabled: false },
  ]);

  // Get store data
  const tasks = useTaskStore((state) => state.tasks);
  const habits = useHabitStore((state) => state.habits);
  const sessions = useFocusStore((state) => state.sessions);
  const progress = useProgressStore((state) => state.progress);
  const settings = useSettingsStore((state) => state.settings);

  const toggleOption = (key: string) => {
    setExportOptions(options =>
      options.map(opt =>
        opt.key === key ? { ...opt, enabled: !opt.enabled } : opt
      )
    );
  };

  const generateExportData = () => {
    const data: Record<string, unknown> = {
      exportInfo: {
        app: 'BrainXP',
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        format: selectedFormat,
      },
    };

    exportOptions.forEach(option => {
      if (option.enabled) {
        switch (option.key) {
          case 'tasks':
            data.tasks = tasks.map(t => ({
              id: t.id,
              title: t.title,
              description: t.description,
              status: t.status,
              dueDate: t.dueDate,
              priority: t.priority,
              tags: t.tags,
              createdAt: t.createdAt,
              completedAt: t.completedAt,
            }));
            break;
          case 'habits':
            data.habits = habits.map(h => ({
              id: h.id,
              name: h.name,
              frequency: h.frequency,
              currentStreak: h.currentStreak,
              longestStreak: h.longestStreak,
              createdAt: h.createdAt,
            }));
            break;
          case 'focus':
            data.focusSessions = sessions.map(s => ({
              id: s.id,
              duration: s.plannedDuration,
              actualDuration: s.actualDuration,
              startTime: s.startTime,
              endTime: s.endTime,
              completed: !!s.endTime,
            }));
            break;
          case 'progress':
            data.progress = {
              level: progress?.level || 1,
              totalXp: progress?.totalXp || 0,
              currentStreak: progress?.currentStreak || 0,
              longestStreak: progress?.longestStreak || 0,
              tasksCompleted: progress?.tasksCompleted || 0,
            };
            break;
          case 'settings':
            data.settings = {
              theme: settings.theme,
              defaultFocusDuration: settings.defaultFocusDuration,
              notificationsEnabled: settings.notificationsEnabled,
            };
            break;
        }
      }
    });

    return data;
  };

  const handleExport = async () => {
    const enabledCount = exportOptions.filter(o => o.enabled).length;
    if (enabledCount === 0) {
      const message = 'Please select at least one data type to export';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('No Data Selected', message);
      }
      return;
    }

    setIsExporting(true);

    try {
      const data = generateExportData();
      const jsonString = JSON.stringify(data, null, 2);

      if (Platform.OS === 'web') {
        // For web, create a downloadable file
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brainxp-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        window.alert('Export successful! Check your downloads folder.');
      } else {
        // For native, use Share
        await Share.share({
          message: jsonString,
          title: 'BrainXP Data Export',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      const message = 'Failed to export data. Please try again.';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Export Failed', message);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const totalItems = 
    (exportOptions.find(o => o.key === 'tasks')?.enabled ? tasks.length : 0) +
    (exportOptions.find(o => o.key === 'habits')?.enabled ? habits.length : 0) +
    (exportOptions.find(o => o.key === 'focus')?.enabled ? sessions.length : 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Export Data</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>📤</Text>
          <Text style={styles.infoTitle}>Export Your Data</Text>
          <Text style={styles.infoText}>
            Download all your BrainXP data. You can import this backup later or use it with other apps.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tasks.length}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{habits.length}</Text>
            <Text style={styles.statLabel}>Habits</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sessions.length}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
        </View>

        {/* Data Selection */}
        <Text style={styles.sectionLabel}>Select data to export</Text>
        <View style={styles.optionsList}>
          {exportOptions.map(option => (
            <TouchableOpacity
              key={option.key}
              style={styles.optionItem}
              onPress={() => toggleOption(option.key)}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <View style={[
                styles.checkbox,
                option.enabled && styles.checkboxActive,
              ]}>
                {option.enabled && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Format Selection */}
        <Text style={styles.sectionLabel}>Export format</Text>
        <View style={styles.formatRow}>
          <TouchableOpacity
            style={[
              styles.formatButton,
              selectedFormat === 'json' && styles.formatButtonActive,
            ]}
            onPress={() => setSelectedFormat('json')}
          >
            <Text style={[
              styles.formatText,
              selectedFormat === 'json' && styles.formatTextActive,
            ]}>
              JSON
            </Text>
            <Text style={styles.formatSubtext}>Recommended</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.formatButton,
              selectedFormat === 'csv' && styles.formatButtonActive,
              styles.formatDisabled,
            ]}
            disabled
          >
            <Text style={[styles.formatText, styles.formatTextDisabled]}>
              CSV
            </Text>
            <Text style={styles.formatSubtext}>Coming soon</Text>
          </TouchableOpacity>
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
          onPress={handleExport}
          disabled={isExporting}
        >
          <Text style={styles.exportButtonText}>
            {isExporting ? 'Exporting...' : `Export ${totalItems} Items`}
          </Text>
        </TouchableOpacity>

        {/* Note */}
        <Text style={styles.noteText}>
          Your data never leaves your device unless you choose to share it.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: colors.primary[600],
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    margin: 16,
    padding: 24,
    backgroundColor: colors.primary[500],
    borderRadius: 20,
    alignItems: 'center',
  },
  infoEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray[900],
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
    marginHorizontal: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  optionsList: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
  },
  optionDescription: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  formatRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  formatButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[200],
    alignItems: 'center',
  },
  formatButtonActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  formatDisabled: {
    opacity: 0.5,
  },
  formatText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[600],
  },
  formatTextActive: {
    color: colors.primary[700],
  },
  formatTextDisabled: {
    color: colors.gray[400],
  },
  formatSubtext: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  exportButton: {
    marginHorizontal: 16,
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noteText: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: 'center',
    marginVertical: 16,
    marginHorizontal: 32,
  },
});
