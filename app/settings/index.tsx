// Settings Screen - Main Settings Hub
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
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { colors, shadows } from '../../src/theme/colors';
import { useTheme } from '../../src/theme';
import { playClick, playCelebrate } from '../../src/utils/sound';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/stores/authStore';

interface SettingRowProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  value?: string;
  showArrow?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  value,
  showArrow = true,
}) => {
  const theme = useTheme();
  return (
    <TouchableOpacity
      style={[styles.settingRow, { backgroundColor: theme.background.card, borderBottomColor: theme.border }]}
      onPress={onPress}
    >
      <Text style={[styles.settingIcon, { color: theme.text.primary }]}>{icon}</Text>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.text.primary }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: theme.text.secondary }]}>{subtitle}</Text>}
      </View>
      {value && <Text style={[styles.settingValue, { color: theme.text.secondary }]}>{value}</Text>}
      {showArrow && <Text style={[styles.settingArrow, { color: theme.text.muted }]}>›</Text>}
    </TouchableOpacity>
  );
};

interface SettingSwitchRowProps {
  icon: string;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const SettingSwitchRow: React.FC<SettingSwitchRowProps> = ({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}) => {
  const theme = useTheme();
  return (
    <View style={[styles.settingRow, { backgroundColor: theme.background.card, borderBottomColor: theme.border }]}>
      <Text style={[styles.settingIcon, { color: theme.text.primary }]}>{icon}</Text>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.text.primary }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: theme.text.secondary }]}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.palette.gray[300], true: colors.primary[400] }}
        thumbColor={value ? colors.primary[600] : theme.background.card}
        ios_backgroundColor={theme.palette.gray[300]}
      />
    </View>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const resetSettings = useSettingsStore((state) => state.resetSettings);
  const setPaletteMode = useSettingsStore((state) => state.setPaletteMode);
  const theme = useTheme();
  const { user, logout } = useAuthStore();

  const handleExportData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const data = await AsyncStorage.multiGet(keys);
      const exportData = Object.fromEntries(data.map(([k, v]) => [k, v ? JSON.parse(v) : null]));
      
      Alert.alert(
        'Export Data',
        'Your data has been prepared for export. In a production app, this would save to a file or share.',
        [{ text: 'OK' }]
      );
      console.log('Exported data:', exportData);
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Local Data',
      'This will remove all cached data. Your account data will be preserved. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              resetSettings();
              Alert.alert('Success', 'Local data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const cycleDailySummaryTime = () => {
    const times = ['08:00', '12:00', '18:00', '20:00', '21:00'];
    const currentIndex = times.indexOf(settings.dailySummaryTime);
    const nextIndex = (currentIndex + 1) % times.length;
    playClick();
    updateSettings({ dailySummaryTime: times[nextIndex] });
  };

  const cycleHabitReminderTime = () => {
    const times = ['06:00', '07:00', '08:00', '09:00', '10:00', '12:00', '18:00', '20:00'];
    const currentIndex = times.indexOf(settings.habitReminderTime);
    const nextIndex = (currentIndex + 1) % times.length;
    playClick();
    updateSettings({ habitReminderTime: times[nextIndex] });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => {
            const didGoBack = router.canGoBack?.() ? (router.back(), true) : false;
            if (!didGoBack) {
              router.replace('/(tabs)');
            }
          }}
          style={styles.backButton}
        >
          <Text style={[styles.backButtonText, { color: theme.text.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Account */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Account</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <SettingRow
            icon="👤"
            title={user?.name || 'Guest User'}
            subtitle={user?.email || 'Not signed in'}
            onPress={() => router.push('/settings/profile')}
          />
          <SettingRow
            icon="🔐"
            title="Security"
            subtitle="Password and authentication"
            onPress={() => router.push('/settings/security')}
          />
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Appearance</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <SettingRow
            icon="🎨"
            title="Theme"
            subtitle="Change app appearance"
            value={settings.theme === 'dark' ? 'Dark' : settings.theme === 'auto' ? 'Auto' : 'Light'}
            onPress={() => {
              playClick();
              const themes: Array<'light' | 'auto' | 'dark'> = ['light', 'auto', 'dark'];
              const currentIndex = themes.indexOf(settings.theme);
              const nextIndex = (currentIndex + 1) % themes.length;
              updateSettings({ theme: themes[nextIndex] });
            }}
          />
          <View style={styles.themePicker}>
            {(['light', 'auto', 'dark'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.themePreview,
                  { borderColor: theme.border },
                  settings.theme === mode && { borderColor: colors.primary[500], borderWidth: 2 },
                  { backgroundColor: mode === 'dark' ? colors.gray[900] : mode === 'light' ? colors.gray[100] : theme.background.secondary },
                ]}
                onPress={() => {
                  playClick();
                  updateSettings({ theme: mode });
                }}
              >
                <Text style={{ color: mode === 'dark' ? '#FFF' : colors.gray[900], fontWeight: '700', fontSize: 12 }}>
                  {mode.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionSubtitleInline, { color: theme.text.secondary }]}>Color Style</Text>
          <View style={styles.themePicker}>
            {([
              { id: 'minimal', label: 'Minimal', preview: ['#93C0BA', '#CEE4B8'] },
              { id: 'game', label: 'Game', preview: ['#6C5CE7', '#FF5E57'] },
              { id: 'study', label: 'Study', preview: ['#4C6FFF', '#7C3AED'] },
            ] as const).map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.themePreview,
                  { borderColor: theme.border, backgroundColor: theme.background.secondary },
                  settings.paletteMode === p.id && { borderColor: colors.primary[500], borderWidth: 2 },
                ]}
                onPress={() => {
                  playClick();
                  setPaletteMode(p.id);
                }}
              >
                <Text style={{ color: theme.text.primary, fontWeight: '700', fontSize: 12 }}>{p.label}</Text>
                <View style={styles.paletteSwatchRow}>
                  {p.preview.map((c) => (
                    <View key={c} style={[styles.paletteSwatch, { backgroundColor: c }]} />
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          <SettingSwitchRow
            icon="📦"
            title="Compact Mode"
            subtitle="Reduce spacing for more content"
            value={settings.compactMode}
            onValueChange={(value) => updateSettings({ compactMode: value })}
          />
          <SettingRow
            icon="♿"
            title="Accessibility"
            subtitle="Customize for your needs"
            onPress={() => router.push('/settings/accessibility')}
          />
        </View>

        {/* Tasks */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Tasks</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <SettingRow
            icon="📋"
            title="Default View"
            value={settings.defaultTaskView === 'list' ? 'List' : 'Board'}
            onPress={() => {
              playClick();
              updateSettings({ defaultTaskView: settings.defaultTaskView === 'list' ? 'board' : 'list' });
            }}
          />
          <SettingRow
            icon="🔀"
            title="Sort By"
            value={settings.taskSortBy === 'dueDate' ? 'Due Date' : 
                   settings.taskSortBy === 'priority' ? 'Priority' :
                   settings.taskSortBy === 'createdAt' ? 'Created' : 'Custom'}
            onPress={() => {
              const sortOptions: Array<'dueDate' | 'priority' | 'createdAt' | 'custom'> = ['dueDate', 'priority', 'createdAt', 'custom'];
              const currentIndex = sortOptions.indexOf(settings.taskSortBy);
              const nextIndex = (currentIndex + 1) % sortOptions.length;
              playClick();
              updateSettings({ taskSortBy: sortOptions[nextIndex] });
            }}
          />
          <SettingSwitchRow
            icon="✅"
            title="Show Completed Tasks"
            subtitle="Display finished tasks in lists"
            value={settings.showCompletedTasks}
            onValueChange={(value) => updateSettings({ showCompletedTasks: value })}
          />
          <SettingSwitchRow
            icon="🤖"
            title="Auto-Schedule Suggestions"
            subtitle="AI suggests optimal task times"
            value={settings.autoScheduleSuggestions}
            onValueChange={(value) => updateSettings({ autoScheduleSuggestions: value })}
          />
        </View>

        {/* Habits */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Habits</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <SettingRow
            icon="⏰"
            title="Daily Reminder Time"
            value={formatTime(settings.habitReminderTime)}
            onPress={cycleHabitReminderTime}
          />
          <SettingRow
            icon="🔥"
            title="Flexible Streak Window"
            subtitle="Days before streak breaks"
            value={`${settings.flexibleStreakWindow} days`}
            onPress={() => {
              const windows = [7, 14, 21, 30];
              const currentIndex = windows.indexOf(settings.flexibleStreakWindow);
              const nextIndex = (currentIndex + 1) % windows.length;
              playClick();
              updateSettings({ flexibleStreakWindow: windows[nextIndex] });
            }}
          />
          <SettingSwitchRow
            icon="📊"
            title="Show Streak Counter"
            subtitle="Display streak on habit cards"
            value={settings.showHabitStreak}
            onValueChange={(value) => updateSettings({ showHabitStreak: value })}
          />
        </View>

        {/* Focus & Productivity */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Focus & Productivity</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <SettingRow
            icon="⏱️"
            title="Default Focus Duration"
            value={`${settings.defaultFocusDuration} min`}
            onPress={() => {
              const durations = [15, 20, 25, 30, 45, 60];
              const currentIndex = durations.indexOf(settings.defaultFocusDuration);
              const nextIndex = (currentIndex + 1) % durations.length;
              playClick();
              updateSettings({ defaultFocusDuration: durations[nextIndex] });
            }}
          />
          <SettingRow
            icon="☕"
            title="Default Break Duration"
            value={`${settings.defaultBreakDuration} min`}
            onPress={() => {
              const durations = [3, 5, 10, 15];
              const currentIndex = durations.indexOf(settings.defaultBreakDuration);
              const nextIndex = (currentIndex + 1) % durations.length;
              playClick();
              updateSettings({ defaultBreakDuration: durations[nextIndex] });
            }}
          />
          <SettingRow
            icon="🎯"
            title="Daily Focus Goal"
            value={`${settings.focusDailyGoal} min`}
            onPress={() => {
              const goals = [30, 60, 90, 120, 180, 240];
              const currentIndex = goals.indexOf(settings.focusDailyGoal);
              const nextIndex = (currentIndex + 1) % goals.length;
              playClick();
              updateSettings({ focusDailyGoal: goals[nextIndex] });
            }}
          />
          <SettingRow
            icon="🔊"
            title="Background Sound"
            value={settings.defaultBackgroundSound === 'none' ? 'None' : 
                   settings.defaultBackgroundSound.charAt(0).toUpperCase() + settings.defaultBackgroundSound.slice(1).replace('_', ' ')}
            title="Default Focus Sound"
            value={settings.defaultBackgroundSound || 'None'}
            onPress={() => {
              const sounds = ['none', 'rain', 'cafe', 'nature', 'white_noise'];
              const currentIndex = sounds.indexOf(settings.defaultBackgroundSound || 'none');
              const currentIndex = sounds.indexOf(settings.defaultBackgroundSound || 'none');
              const nextIndex = (currentIndex + 1) % sounds.length;
              playClick();
              updateSettings({ defaultBackgroundSound: sounds[nextIndex] });
            }}
          />
          <SettingSwitchRow
            icon="▶️"
            title="Auto-start Breaks"
            subtitle="Automatically start breaks after focus sessions"
            value={settings.autoStartBreaks}
            onValueChange={(value) => updateSettings({ autoStartBreaks: value })}
              updateSettings({ defaultBackgroundSound: sounds[nextIndex] });
            }}
          />
        </View>

        {/* Notifications */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Notifications</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <SettingSwitchRow
            icon="🔔"
            title="Push Notifications"
            subtitle="Reminders and updates"
            value={settings.notificationsEnabled}
            onValueChange={(value) => updateSettings({ notificationsEnabled: value })}
          />
          <SettingSwitchRow
            icon="✅"
            title="Task Reminders"
            subtitle="Get reminded about due tasks"
            value={settings.taskReminders}
            onValueChange={(value) => updateSettings({ taskReminders: value })}
          />
          <SettingSwitchRow
            icon="🔄"
            title="Habit Reminders"
            subtitle="Daily habit check-ins"
            value={settings.habitReminders}
            onValueChange={(value) => updateSettings({ habitReminders: value })}
          />
          <SettingSwitchRow
            icon="🎯"
            title="Focus Reminders"
            subtitle="Nudges to start focus sessions"
            value={settings.focusReminders}
            onValueChange={(value) => updateSettings({ focusReminders: value })}
          />
          <SettingSwitchRow
            icon="📝"
            title="Daily Summary"
            subtitle="Evening recap of your day"
            value={settings.dailySummary}
            onValueChange={(value) => updateSettings({ dailySummary: value })}
          />
          {settings.dailySummary && (
            <SettingRow
              icon="🕐"
              title="Summary Time"
              value={formatTime(settings.dailySummaryTime)}
              onPress={cycleDailySummaryTime}
            />
          )}
        </View>

        {/* Haptics & Sound */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Haptics & Sound</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <SettingSwitchRow
            icon="📳"
            title="Haptic Feedback"
            subtitle="Vibrations for interactions"
            value={settings.hapticFeedback}
            onValueChange={(value) => updateSettings({ hapticFeedback: value })}
          />
          <SettingSwitchRow
            icon="🔊"
            title="Sound Effects"
            subtitle="UI sounds and feedback"
            value={settings.soundEffects}
            onValueChange={(value) => updateSettings({ soundEffects: value })}
          />
          <SettingSwitchRow
            icon="🎉"
            title="Celebration Sounds"
            subtitle="Play sounds on achievements"
            value={settings.celebrationSounds}
            onValueChange={(value) => updateSettings({ celebrationSounds: value })}
          />
        </View>

        {/* Gamification */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Gamification</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <SettingRow
            icon="🎮"
            title="Progress Style"
            subtitle="How your progress is displayed"
            value={settings.progressMetaphor === 'minimal' ? 'Minimal' : 
                   settings.progressMetaphor === 'garden' ? 'Garden' :
                   settings.progressMetaphor === 'pet' ? 'Pet' : 'Adventure'}
            onPress={() => {
              const metaphors: Array<'minimal' | 'garden' | 'pet' | 'adventure'> = ['minimal', 'garden', 'pet', 'adventure'];
              const currentIndex = metaphors.indexOf(settings.progressMetaphor);
              const nextIndex = (currentIndex + 1) % metaphors.length;
              playCelebrate();
              updateSettings({ progressMetaphor: metaphors[nextIndex] });
            }}
          />
          <SettingSwitchRow
            icon="🎊"
            title="Celebrations"
            subtitle="Show confetti on achievements"
            value={settings.celebrationsEnabled}
            onValueChange={(value) => updateSettings({ celebrationsEnabled: value })}
          />
          <SettingSwitchRow
            icon="✨"
            title="XP Animations"
            subtitle="Show XP gain effects"
            value={settings.showXPAnimations}
            onValueChange={(value) => updateSettings({ showXPAnimations: value })}
          />
          <SettingSwitchRow
            icon="💬"
            title="XP Popups"
            subtitle="Show XP notifications"
            value={settings.showXPPopups}
            onValueChange={(value) => updateSettings({ showXPPopups: value })}
          />
          <SettingSwitchRow
            icon="🏅"
            title="Show Level Badge"
            subtitle="Display your level on profile"
            value={settings.showLevelBadge}
            onValueChange={(value) => updateSettings({ showLevelBadge: value })}
          />
          <SettingRow
            icon="🎊"
            title="Test Celebration"
            subtitle="Preview sounds and animations"
            onPress={() => playCelebrate()}
            showArrow={false}
          />
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() =>
              updateSettings({ showXPPopups: !settings.showXPPopups })
            }
          >
            <Text style={styles.settingIcon}>✨</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>XP Animations</Text>
              <Text style={styles.settingSubtitle}>Show celebratory effects</Text>
            </View>
            <View
              style={[
                styles.toggle,
                settings.showXPPopups && styles.toggleActive,
              ]}
            >
              <View
                style={[
                  styles.toggleKnob,
                  settings.showXPPopups && styles.toggleKnobActive,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Data & Privacy */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Data & Privacy</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <SettingSwitchRow
            icon="📊"
            title="Analytics"
            subtitle="Help improve the app with usage data"
            value={settings.analyticsEnabled}
            onValueChange={(value) => updateSettings({ analyticsEnabled: value })}
          />
          <SettingSwitchRow
            icon="🐛"
            title="Crash Reports"
            subtitle="Automatically send crash reports"
            value={settings.crashReportsEnabled}
            onValueChange={(value) => updateSettings({ crashReportsEnabled: value })}
          />
          <SettingSwitchRow
            icon="☁️"
            title="Cloud Sync"
            subtitle="Sync data across devices"
            value={settings.upshiftSyncEnabled}
            onValueChange={(value) => updateSettings({ upshiftSyncEnabled: value })}
          />
          <SettingRow
            icon="📤"
            title="Export My Data"
            subtitle="Download all your data"
            onPress={handleExportData}
          />
          <SettingRow
            icon="🗑️"
            title="Clear Local Data"
            subtitle="Remove cached data"
            onPress={handleClearData}
          />
        </View>

        {/* About */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>About</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <SettingRow
            icon="📖"
            title="User Guide"
            subtitle="Learn how to use BrainXP"
            onPress={() => Linking.openURL('https://brainxp.app/guide')}
          />
          <SettingRow
            icon="❓"
            title="FAQ"
            subtitle="Frequently asked questions"
            onPress={() => Linking.openURL('https://brainxp.app/faq')}
          />
          <SettingRow
            icon="💬"
            title="Send Feedback"
            subtitle="Help us improve BrainXP"
            onPress={() => Linking.openURL('mailto:feedback@brainxp.app')}
          />
          <SettingRow
            icon="📜"
            title="Privacy Policy"
            onPress={() => Linking.openURL('https://brainxp.app/privacy')}
          />
          <SettingRow
            icon="📋"
            title="Terms of Service"
            onPress={() => Linking.openURL('https://brainxp.app/terms')}
          />
          <SettingRow
            icon="⭐"
            title="Rate BrainXP"
            subtitle="Leave us a review"
            onPress={() => {
              // Would open app store
              Alert.alert('Thanks!', 'This would open the app store for rating.');
            }}
          />
        </View>

        {/* Sign Out */}
        <View style={[styles.section, { backgroundColor: theme.background.card, marginTop: 24 }]}>
          <TouchableOpacity
            style={[styles.signOutButton]}
            onPress={handleLogout}
          >
            <Text style={[styles.signOutText, { color: colors.danger[500] }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: theme.text.muted }]}>BrainXP v1.0.0</Text>
          <Text style={[styles.appTagline, { color: theme.text.muted }]}>Built with 💙 for ADHD minds</Text>
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
  themePicker: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  themePreview: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  sectionSubtitleInline: {
    marginTop: 12,
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '600',
  },
  paletteSwatchRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  paletteSwatch: {
    width: 20,
    height: 20,
    borderRadius: 6,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    marginRight: 8,
  },
  settingArrow: {
    fontSize: 20,
  },
  signOutButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
