// Settings Screen - Main Settings Hub
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { colors, shadows } from '../../src/theme/colors';

interface SettingRowProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  value?: string;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  value,
}) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress}>
    <Text style={styles.settingIcon}>{icon}</Text>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {value && <Text style={styles.settingValue}>{value}</Text>}
    <Text style={styles.settingArrow}>›</Text>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useSettingsStore((state) => state.settings);
  const toggleTheme = useSettingsStore((state) => state.toggleTheme);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.section}>
          <SettingRow
            icon="🎨"
            title="Theme"
            subtitle="Change app appearance"
            value={settings.theme === 'dark' ? 'Dark' : 'Light'}
            onPress={toggleTheme}
          />
          <SettingRow
            icon="♿"
            title="Accessibility"
            subtitle="Customize for your needs"
            onPress={() => router.push('/settings/accessibility')}
          />
        </View>

        {/* Focus & Productivity */}
        <Text style={styles.sectionTitle}>Focus & Productivity</Text>
        <View style={styles.section}>
          <SettingRow
            icon="⏱️"
            title="Default Focus Duration"
            value={`${settings.defaultFocusDuration} min`}
            onPress={() => {
              // Cycle through common durations
              const durations = [15, 20, 25, 30, 45, 60];
              const currentIndex = durations.indexOf(settings.defaultFocusDuration);
              const nextIndex = (currentIndex + 1) % durations.length;
              updateSettings({ defaultFocusDuration: durations[nextIndex] });
            }}
          />
          <SettingRow
            icon="🔊"
            title="Default Focus Sound"
            value={settings.defaultFocusSound || 'None'}
            onPress={() => {
              const sounds = ['none', 'rain', 'cafe', 'nature', 'white_noise'];
              const currentIndex = sounds.indexOf(settings.defaultFocusSound || 'none');
              const nextIndex = (currentIndex + 1) % sounds.length;
              updateSettings({ defaultFocusSound: sounds[nextIndex] as any });
            }}
          />
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() =>
              updateSettings({ notificationsEnabled: !settings.notificationsEnabled })
            }
          >
            <Text style={styles.settingIcon}>🔔</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingSubtitle}>Reminders and updates</Text>
            </View>
            <View
              style={[
                styles.toggle,
                settings.notificationsEnabled && styles.toggleActive,
              ]}
            >
              <View
                style={[
                  styles.toggleKnob,
                  settings.notificationsEnabled && styles.toggleKnobActive,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Gamification */}
        <Text style={styles.sectionTitle}>Gamification</Text>
        <View style={styles.section}>
          <SettingRow
            icon="🎮"
            title="Progress Style"
            subtitle="How your progress is displayed"
            value={settings.progressMetaphor || 'XP & Levels'}
            onPress={() => {
              const metaphors = ['xp_levels', 'garden', 'journey', 'simple'];
              const currentIndex = metaphors.indexOf(settings.progressMetaphor || 'xp_levels');
              const nextIndex = (currentIndex + 1) % metaphors.length;
              updateSettings({ progressMetaphor: metaphors[nextIndex] as any });
            }}
          />
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() =>
              updateSettings({ showXPAnimations: !settings.showXPAnimations })
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
                settings.showXPAnimations && styles.toggleActive,
              ]}
            >
              <View
                style={[
                  styles.toggleKnob,
                  settings.showXPAnimations && styles.toggleKnobActive,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Data & Privacy */}
        <Text style={styles.sectionTitle}>Data & Privacy</Text>
        <View style={styles.section}>
          <SettingRow
            icon="📤"
            title="Export My Data"
            subtitle="Download all your data"
            onPress={() => console.log('Export data')}
          />
          <SettingRow
            icon="🗑️"
            title="Clear Local Data"
            subtitle="Remove cached data"
            onPress={() => console.log('Clear data')}
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>BrainXP v1.0.0</Text>
          <Text style={styles.appTagline}>Built with 💙 for ADHD minds</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: colors.gray[600],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
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
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    ...shadows.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
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
    color: colors.gray[800],
  },
  settingSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    color: colors.gray[500],
    marginRight: 8,
  },
  settingArrow: {
    fontSize: 20,
    color: colors.gray[400],
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gray[200],
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primary[500],
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appVersion: {
    fontSize: 14,
    color: colors.gray[400],
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 13,
    color: colors.gray[400],
    fontStyle: 'italic',
  },
});
