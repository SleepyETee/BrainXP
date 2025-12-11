// Accessibility Settings - Neurodivergent-Friendly Customization
// Provides extensive personalization for different needs
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
import { colors, shadows } from '../../src/theme/colors';
import { useTheme } from '../../src/theme';
import { useSettingsStore } from '../../src/stores/settingsStore';
import * as Haptics from 'expo-haptics';

// Setting item component
const SettingSwitch: React.FC<{
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: string;
}> = ({ label, description, value, onValueChange, icon }) => {
  const theme = useTheme();
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);

  const handleChange = async (newValue: boolean) => {
    if (!reduceMotion) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onValueChange(newValue);
  };

  return (
    <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
      <View style={styles.settingContent}>
        {icon && <Text style={styles.settingIcon}>{icon}</Text>}
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingLabel, { color: theme.text.primary }]}>{label}</Text>
          {description && (
            <Text style={[styles.settingDescription, { color: theme.text.secondary }]}>{description}</Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={handleChange}
        trackColor={{
          false: theme.palette.gray[300],
          true: colors.primary[400],
        }}
        thumbColor={value ? colors.primary[600] : theme.background.card}
        ios_backgroundColor={theme.palette.gray[300]}
        accessibilityLabel={label}
        accessibilityHint={description}
      />
    </View>
  );
};

// Setting section header
const SectionHeader: React.FC<{ title: string; emoji: string }> = ({
  title,
  emoji,
}) => {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionEmoji}>{emoji}</Text>
      <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>{title}</Text>
    </View>
  );
};

// Selection option component
const SettingOption: React.FC<{
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  label: string;
  description?: string;
}> = ({ options, selected, onSelect, label, description }) => {
  const theme = useTheme();
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);

  return (
    <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingLabel, { color: theme.text.primary }]}>{label}</Text>
        {description && (
          <Text style={[styles.settingDescription, { color: theme.text.secondary }]}>{description}</Text>
        )}
      </View>
      <View style={styles.optionRow}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              { backgroundColor: theme.palette.gray[200] },
              selected === option.value && { backgroundColor: colors.primary[500] },
            ]}
            onPress={async () => {
              if (!reduceMotion) {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onSelect(option.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === option.value }}
          >
            <Text
              style={[
                styles.optionText,
                { color: theme.text.secondary },
                selected === option.value && { color: '#FFFFFF' },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default function AccessibilitySettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  const handleReset = () => {
    Alert.alert(
      'Reset Accessibility Settings',
      'This will reset all accessibility settings to their defaults. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            updateSettings({
              reduceMotion: false,
              animationSpeed: 'normal',
              largeText: false,
              highContrast: false,
              dimBrightColors: false,
              dyslexiaFont: false,
              lineSpacing: 'normal',
              letterSpacing: 'normal',
              focusModeEnabled: false,
              hideNonEssential: false,
              simplifyNavigation: false,
              showTaskCounts: true,
              hapticFeedback: true,
              quietMode: false,
              disableAutoplay: true,
              gentleReminders: true,
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.backButtonText, { color: theme.text.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Accessibility</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Intro */}
      <View style={[styles.intro, { backgroundColor: colors.primary[50], borderBottomColor: colors.primary[100] }]}>
        <Text style={[styles.introText, { color: colors.primary[800] }]}>
          Customize your experience to match how your brain works best. These settings help reduce overwhelm and improve focus.
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Motion & Animation */}
        <SectionHeader title="Motion & Animation" emoji="✨" />
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <SettingSwitch
            label="Reduce Motion"
            description="Minimize animations throughout the app"
            value={settings.reduceMotion}
            onValueChange={(value) => updateSettings({ reduceMotion: value })}
            icon="🚫"
          />
          <SettingOption
            label="Animation Speed"
            options={[
              { value: 'none', label: 'Off' },
              { value: 'slow', label: 'Slow' },
              { value: 'normal', label: 'Normal' },
              { value: 'fast', label: 'Fast' },
            ]}
            selected={settings.animationSpeed}
            onSelect={(value) =>
              updateSettings({
                animationSpeed: value as 'none' | 'slow' | 'normal' | 'fast',
              })
            }
          />
        </View>

        {/* Visual */}
        <SectionHeader title="Visual" emoji="👁️" />
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <SettingSwitch
            label="Large Text"
            description="Increase base font size for easier reading"
            value={settings.largeText}
            onValueChange={(value) => updateSettings({ largeText: value })}
            icon="🔤"
          />
          <SettingSwitch
            label="High Contrast"
            description="Increase color contrast for better visibility"
            value={settings.highContrast}
            onValueChange={(value) => updateSettings({ highContrast: value })}
            icon="🎨"
          />
          <SettingSwitch
            label="Dim Bright Colors"
            description="Reduce color saturation for sensory comfort"
            value={settings.dimBrightColors}
            onValueChange={(value) => updateSettings({ dimBrightColors: value })}
            icon="🌙"
          />
        </View>

        {/* Reading & Focus */}
        <SectionHeader title="Reading & Focus" emoji="📖" />
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <SettingSwitch
            label="Dyslexia-Friendly Font"
            description="Use a font designed for easier reading"
            value={settings.dyslexiaFont}
            onValueChange={(value) => updateSettings({ dyslexiaFont: value })}
            icon="📝"
          />
          <SettingOption
            label="Line Spacing"
            description="Space between lines of text"
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'normal', label: 'Normal' },
              { value: 'relaxed', label: 'Relaxed' },
              { value: 'loose', label: 'Loose' },
            ]}
            selected={settings.lineSpacing}
            onSelect={(value) =>
              updateSettings({
                lineSpacing: value as 'compact' | 'normal' | 'relaxed' | 'loose',
              })
            }
          />
          <SettingOption
            label="Letter Spacing"
            description="Space between letters"
            options={[
              { value: 'tight', label: 'Tight' },
              { value: 'normal', label: 'Normal' },
              { value: 'wide', label: 'Wide' },
            ]}
            selected={settings.letterSpacing}
            onSelect={(value) =>
              updateSettings({
                letterSpacing: value as 'tight' | 'normal' | 'wide',
              })
            }
          />
        </View>

        {/* Cognitive Load */}
        <SectionHeader title="Cognitive Load" emoji="🧠" />
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <SettingSwitch
            label="Focus Mode"
            description="Minimal UI with reduced distractions"
            value={settings.focusModeEnabled}
            onValueChange={(value) =>
              updateSettings({ focusModeEnabled: value })
            }
            icon="🎯"
          />
          <SettingSwitch
            label="Hide Non-Essential"
            description="Hide decorative elements and extra info"
            value={settings.hideNonEssential}
            onValueChange={(value) =>
              updateSettings({ hideNonEssential: value })
            }
            icon="🚿"
          />
          <SettingSwitch
            label="Simplify Navigation"
            description="Show fewer options for easier decisions"
            value={settings.simplifyNavigation}
            onValueChange={(value) =>
              updateSettings({ simplifyNavigation: value })
            }
            icon="🧭"
          />
          <SettingSwitch
            label="Show Task Counts"
            description="Display numbers on sections (e.g., Tasks: 5)"
            value={settings.showTaskCounts}
            onValueChange={(value) =>
              updateSettings({ showTaskCounts: value })
            }
            icon="🔢"
          />
        </View>

        {/* Sensory */}
        <SectionHeader title="Sensory" emoji="👂" />
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <SettingSwitch
            label="Haptic Feedback"
            description="Vibrations for interactions"
            value={settings.hapticFeedback}
            onValueChange={(value) =>
              updateSettings({ hapticFeedback: value })
            }
            icon="📳"
          />
          <SettingSwitch
            label="Quiet Mode"
            description="Minimize all sounds and notifications"
            value={settings.quietMode}
            onValueChange={(value) => updateSettings({ quietMode: value })}
            icon="🔇"
          />
          <SettingSwitch
            label="Disable Autoplay"
            description="Never auto-play videos or sounds"
            value={settings.disableAutoplay}
            onValueChange={(value) =>
              updateSettings({ disableAutoplay: value })
            }
            icon="⏸️"
          />
        </View>

        {/* Reminders */}
        <SectionHeader title="Reminders" emoji="⏰" />
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <SettingSwitch
            label="Gentle Reminders"
            description="Use softer, less urgent notification style"
            value={settings.gentleReminders}
            onValueChange={(value) =>
              updateSettings({ gentleReminders: value })
            }
            icon="💆"
          />
        </View>

        {/* Reset */}
        <View style={styles.resetSection}>
          <TouchableOpacity
            style={[styles.resetButton, { borderColor: theme.border }]}
            onPress={handleReset}
          >
            <Text style={[styles.resetButtonText, { color: theme.text.secondary }]}>Reset to Defaults</Text>
          </TouchableOpacity>
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
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },

  // Intro
  intro: {
    padding: 16,
    borderBottomWidth: 1,
  },
  introText: {
    fontSize: 14,
    lineHeight: 21,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    gap: 8,
  },
  sectionEmoji: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    ...shadows.sm,
  },

  // Setting item
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 17,
  },

  // Option buttons
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  optionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Reset
  resetSection: {
    padding: 24,
    alignItems: 'center',
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
