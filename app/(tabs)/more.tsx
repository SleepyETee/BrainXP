import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { colors } from '../../src/theme/colors';

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  badge?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  badge,
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuIcon}>{icon}</Text>
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{title}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {badge && (
      <View style={styles.menuBadge}>
        <Text style={styles.menuBadgeText}>{badge}</Text>
      </View>
    )}
    {showArrow && <Text style={styles.menuArrow}>›</Text>}
  </TouchableOpacity>
);

export default function MoreScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const progress = useProgressStore((state) => state.progress);
  const settings = useSettingsStore((state) => state.settings);
  const toggleTheme = useSettingsStore((state) => state.toggleTheme);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>More</Text>
        </View>

        {/* Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push('/settings')}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Guest'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'Not signed in'}</Text>
          </View>
          <View style={styles.profileLevel}>
            <Text style={styles.levelBadge}>Lv {progress?.level || 1}</Text>
            <Text style={styles.xpText}>{progress?.totalXp || 0} XP</Text>
          </View>
        </TouchableOpacity>

        {/* AI Tools - NEW */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 AI Tools</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="🪄"
              title="Magic Breakdown"
              subtitle="Break tasks into tiny steps"
              onPress={() => router.push('/tools/magic')}
              badge="NEW"
            />
            <MenuItem
              icon="🥄"
              title="Spoon Estimator"
              subtitle="Estimate task energy cost"
              onPress={() => router.push('/tools/spoons')}
            />
            <MenuItem
              icon="✍️"
              title="Tone Rewriter"
              subtitle="Transform text to any tone"
              onPress={() => router.push('/tools/tone')}
            />
            <MenuItem
              icon="📝"
              title="Note Compiler"
              subtitle="Combine scattered notes"
              onPress={() => router.push('/tools/compile')}
            />
            <MenuItem
              icon="🤖"
              title="All AI Tools"
              subtitle="View all productivity tools"
              onPress={() => router.push('/tools')}
            />
          </View>
        </View>

        {/* Study Hub - NEW */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Learning</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="🎴"
              title="Flashcards"
              subtitle="Study with spaced repetition"
              onPress={() => router.push('/study')}
              badge="NEW"
            />
            <MenuItem
              icon="📋"
              title="Quizzes"
              subtitle="Test your knowledge"
              onPress={() => router.push('/study')}
            />
            <MenuItem
              icon="🤖"
              title="AI Generate Cards"
              subtitle="Create flashcards from any content"
              onPress={() => router.push('/study/generate')}
            />
          </View>
        </View>

        {/* Main Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="📊"
              title="Analytics"
              subtitle="View your progress and insights"
              onPress={() => router.push('/analytics')}
            />
            <MenuItem
              icon="🏆"
              title="Achievements"
              subtitle="Badges and milestones"
              onPress={() => router.push('/analytics')}
              badge={String(progress?.tasksCompleted || 0)}
            />
            <MenuItem
              icon="📝"
              title="Daily Planning"
              subtitle="Plan your day with 1-3-5 rule"
              onPress={() => router.push('/planning')}
            />
            <MenuItem
              icon="😊"
              title="Wellness"
              subtitle="Mood tracking and breathing exercises"
              onPress={() => router.push('/wellness/mood')}
            />
          </View>
        </View>

        {/* Settings Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="🎨"
              title="Appearance"
              subtitle={`Theme: ${settings.theme}`}
              onPress={toggleTheme}
            />
            <MenuItem
              icon="🔔"
              title="Notifications"
              subtitle={settings.notificationsEnabled ? 'Enabled' : 'Disabled'}
              onPress={() => router.push('/settings')}
            />
            <MenuItem
              icon="⏱️"
              title="Focus Settings"
              subtitle={`Default: ${settings.defaultFocusDuration} min`}
              onPress={() => router.push('/settings')}
            />
            <MenuItem
              icon="🎮"
              title="Gamification"
              subtitle={`Progress style: ${settings.progressMetaphor}`}
              onPress={() => router.push('/settings')}
            />
          </View>
        </View>

        {/* Support Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="❓"
              title="Help & FAQ"
              onPress={() => {}}
            />
            <MenuItem
              icon="💬"
              title="Send Feedback"
              onPress={() => {}}
            />
            <MenuItem
              icon="📄"
              title="Privacy Policy"
              onPress={() => {}}
            />
            <MenuItem
              icon="📜"
              title="Terms of Service"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="📤"
              title="Export Data"
              subtitle="Download your data"
              onPress={() => {}}
            />
            <MenuItem
              icon="🚪"
              title="Sign Out"
              onPress={handleLogout}
              showArrow={false}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>BrainXP</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>
            ADHD Support for a Better You
          </Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[800],
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[800],
  },
  profileEmail: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },
  profileLevel: {
    alignItems: 'flex-end',
  },
  levelBadge: {
    backgroundColor: colors.primary[100],
    color: colors.primary[700],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  xpText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray[800],
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  menuBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  menuBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[700],
  },
  menuArrow: {
    fontSize: 20,
    color: colors.gray[400],
  },
  appInfo: {
    alignItems: 'center',
    paddingTop: 20,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[700],
  },
  appVersion: {
    fontSize: 14,
    color: colors.gray[400],
    marginTop: 4,
  },
  appTagline: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 8,
    fontStyle: 'italic',
  },
});
