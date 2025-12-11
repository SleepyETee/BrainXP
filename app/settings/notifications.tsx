// Notifications Settings Screen
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { colors, shadows } from '../../src/theme/colors';
import { useTheme } from '../../src/theme';
import { playClick } from '../../src/utils/sound';

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { settings, updateSettings } = useSettingsStore();
  
  // Destructure settings for easier access
  const {
    notificationsEnabled,
    focusReminders,
    dailySummary,
    habitReminderTime,
    taskReminders,
    habitReminders,
    dailySummaryTime,
  } = settings;

  const handleToggle = (key: string, value: boolean) => {
    updateSettings({ [key]: value });
    playClick();
  };

  const handleTimeChange = (type: 'habitReminderTime' | 'dailySummaryTime', currentTime: string) => {
    // In production, would show a time picker
    Alert.alert(
      'Set Time',
      `Current: ${currentTime}\n\nTime picker would appear here to select a new time.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.text.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Main Toggle */}
        <View style={[styles.section, { backgroundColor: theme.background.card, marginTop: 20 }]}>
          <View style={styles.switchRow}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Enable Notifications</Text>
              <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                Turn off to disable all notifications
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => handleToggle('notificationsEnabled', value)}
              trackColor={{ false: theme.palette.gray[300], true: colors.primary[400] }}
              thumbColor={notificationsEnabled ? colors.primary[600] : theme.background.card}
              ios_backgroundColor={theme.palette.gray[300]}
            />
          </View>
        </View>

        {/* Task Reminders */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Tasks</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card, opacity: notificationsEnabled ? 1 : 0.5 }]}>
          <View style={[styles.switchRow, { borderBottomColor: theme.border }]}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Task Due Reminders</Text>
              <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                Get reminded before tasks are due
              </Text>
            </View>
            <Switch
              value={taskReminders}
              onValueChange={(value) => handleToggle('taskReminders', value)}
              trackColor={{ false: theme.palette.gray[300], true: colors.primary[400] }}
              thumbColor={taskReminders ? colors.primary[600] : theme.background.card}
              ios_backgroundColor={theme.palette.gray[300]}
              disabled={!notificationsEnabled}
            />
          </View>
          <View style={styles.switchRow}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Overdue Task Alerts</Text>
              <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                Notify when tasks become overdue
              </Text>
            </View>
            <Switch
              value={taskReminders}
              onValueChange={(value) => handleToggle('overdueAlerts', value)}
              trackColor={{ false: theme.palette.gray[300], true: colors.primary[400] }}
              thumbColor={taskReminders ? colors.primary[600] : theme.background.card}
              ios_backgroundColor={theme.palette.gray[300]}
              disabled={!notificationsEnabled}
            />
          </View>
        </View>

        {/* Habit Reminders */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Habits</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card, opacity: notificationsEnabled ? 1 : 0.5 }]}>
          <View style={[styles.switchRow, { borderBottomColor: theme.border }]}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Habit Reminders</Text>
              <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                Daily reminder to complete habits
              </Text>
            </View>
            <Switch
              value={habitReminders}
              onValueChange={(value) => handleToggle('habitReminders', value)}
              trackColor={{ false: theme.palette.gray[300], true: colors.primary[400] }}
              thumbColor={habitReminders ? colors.primary[600] : theme.background.card}
              ios_backgroundColor={theme.palette.gray[300]}
              disabled={!notificationsEnabled}
            />
          </View>
          <TouchableOpacity 
            style={styles.row}
            onPress={() => handleTimeChange('habitReminderTime', habitReminderTime)}
            disabled={!notificationsEnabled}
          >
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Reminder Time</Text>
              <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                When to send daily habit reminder
              </Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.primary[500] }]}>{habitReminderTime}</Text>
          </TouchableOpacity>
        </View>

        {/* Focus Reminders */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Focus Sessions</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card, opacity: notificationsEnabled ? 1 : 0.5 }]}>
          <View style={[styles.switchRow, { borderBottomColor: theme.border }]}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Focus Reminders</Text>
              <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                Remind to start focus sessions
              </Text>
            </View>
            <Switch
              value={focusReminders}
              onValueChange={(value) => handleToggle('focusReminders', value)}
              trackColor={{ false: theme.palette.gray[300], true: colors.primary[400] }}
              thumbColor={focusReminders ? colors.primary[600] : theme.background.card}
              ios_backgroundColor={theme.palette.gray[300]}
              disabled={!notificationsEnabled}
            />
          </View>
          <View style={styles.switchRow}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Break Reminders</Text>
              <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                Notify when it's time for a break
              </Text>
            </View>
            <Switch
              value={focusReminders}
              onValueChange={(value) => handleToggle('breakReminders', value)}
              trackColor={{ false: theme.palette.gray[300], true: colors.primary[400] }}
              thumbColor={focusReminders ? colors.primary[600] : theme.background.card}
              ios_backgroundColor={theme.palette.gray[300]}
              disabled={!notificationsEnabled}
            />
          </View>
        </View>

        {/* Daily Summary */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Daily Summary</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card, opacity: notificationsEnabled ? 1 : 0.5 }]}>
          <View style={[styles.switchRow, { borderBottomColor: theme.border }]}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Daily Summary</Text>
              <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                Get a daily overview of your progress
              </Text>
            </View>
            <Switch
              value={dailySummary}
              onValueChange={(value) => handleToggle('dailySummary', value)}
              trackColor={{ false: theme.palette.gray[300], true: colors.primary[400] }}
              thumbColor={dailySummary ? colors.primary[600] : theme.background.card}
              ios_backgroundColor={theme.palette.gray[300]}
              disabled={!notificationsEnabled}
            />
          </View>
          <TouchableOpacity 
            style={styles.row}
            onPress={() => handleTimeChange('dailySummaryTime', dailySummaryTime)}
            disabled={!notificationsEnabled || !dailySummary}
          >
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Summary Time</Text>
              <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                When to receive daily summary
              </Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.primary[500] }]}>{dailySummaryTime}</Text>
          </TouchableOpacity>
        </View>

        {/* Other Notifications */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Other</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card, opacity: notificationsEnabled ? 1 : 0.5 }]}>
          <View style={[styles.switchRow, { borderBottomColor: theme.border }]}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Achievement Alerts</Text>
              <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                Celebrate when you earn achievements
              </Text>
            </View>
            <Switch
              value={true}
              onValueChange={(value) => handleToggle('achievementAlerts', value)}
              trackColor={{ false: theme.palette.gray[300], true: colors.primary[400] }}
              thumbColor={colors.primary[600]}
              ios_backgroundColor={theme.palette.gray[300]}
              disabled={!notificationsEnabled}
            />
          </View>
          <View style={[styles.switchRow, { borderBottomColor: theme.border }]}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Streak Warnings</Text>
              <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                Alert before losing a streak
              </Text>
            </View>
            <Switch
              value={true}
              onValueChange={(value) => handleToggle('streakWarnings', value)}
              trackColor={{ false: theme.palette.gray[300], true: colors.primary[400] }}
              thumbColor={colors.primary[600]}
              ios_backgroundColor={theme.palette.gray[300]}
              disabled={!notificationsEnabled}
            />
          </View>
          <View style={styles.switchRow}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Tips & Suggestions</Text>
              <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                Occasional productivity tips
              </Text>
            </View>
            <Switch
              value={false}
              onValueChange={(value) => handleToggle('tips', value)}
              trackColor={{ false: theme.palette.gray[300], true: colors.primary[400] }}
              thumbColor={theme.background.card}
              ios_backgroundColor={theme.palette.gray[300]}
              disabled={!notificationsEnabled}
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoText, { color: theme.text.muted }]}>
            Notifications help you stay on track with your goals. You can customize which notifications you receive and when.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  infoSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
