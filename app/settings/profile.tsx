// Profile Settings Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { colors, shadows } from '../../src/theme/colors';
import { useTheme } from '../../src/theme';
import { playClick } from '../../src/utils/sound';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, updateUser, isLoading } = useAuthStore();
  const { progress } = useProgressStore();
  
  // Get values from progress with defaults
  const level = progress?.level ?? 1;
  const xp = progress?.totalXp ?? 0;
  const streak = progress?.currentStreak ?? 0;

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      await updateUser({ name: name.trim() });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
      playClick();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Type DELETE to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'I understand',
                  style: 'destructive',
                  onPress: () => {
                    // In production, would call API to delete account
                    Alert.alert('Account Deletion', 'This feature would delete your account in production.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.text.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Profile</Text>
        {isEditing ? (
          <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            ) : (
              <Text style={[styles.saveButtonText, { color: colors.primary[500] }]}>Save</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.saveButton}>
            <Text style={[styles.saveButtonText, { color: colors.primary[500] }]}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary[100] }]}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          {isEditing && (
            <TouchableOpacity style={[styles.changeAvatarButton, { borderColor: theme.border }]}>
              <Text style={[styles.changeAvatarText, { color: colors.primary[500] }]}>
                Change Photo
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Info */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Profile Information</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <View style={[styles.field, { borderBottomColor: theme.border }]}>
            <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Name</Text>
            {isEditing ? (
              <TextInput
                style={[styles.fieldInput, { color: theme.text.primary }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={theme.text.muted}
                autoCapitalize="words"
              />
            ) : (
              <Text style={[styles.fieldValue, { color: theme.text.primary }]}>{user?.name || 'Not set'}</Text>
            )}
          </View>
          <View style={[styles.field, { borderBottomColor: theme.border }]}>
            <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Email</Text>
            <Text style={[styles.fieldValue, { color: theme.text.primary }]}>{user?.email || 'Not set'}</Text>
            <Text style={[styles.fieldHint, { color: theme.text.muted }]}>
              Contact support to change email
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Member Since</Text>
            <Text style={[styles.fieldValue, { color: theme.text.primary }]}>
              {user?.createdAt 
                ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })
                : 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Your Stats</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary[500] }]}>
                {level || 1}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Level</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary[500] }]}>
                {xp || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Total XP</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary[500] }]}>
                {streak || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Day Streak</Text>
            </View>
          </View>
        </View>

        {/* Goals */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Your Goals</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          {user?.primaryGoals && user.primaryGoals.length > 0 ? (
            user.primaryGoals.map((goal, index) => (
              <View 
                key={goal} 
                style={[
                  styles.goalItem, 
                  index < user.primaryGoals!.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }
                ]}
              >
                <Text style={[styles.goalText, { color: theme.text.primary }]}>{goal}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.text.muted }]}>No goals set</Text>
          )}
          <TouchableOpacity 
            style={[styles.updateGoalsButton, { borderTopColor: theme.border }]}
            onPress={() => router.push('/(onboarding)/goals')}
          >
            <Text style={[styles.updateGoalsText, { color: colors.primary[500] }]}>
              Update Goals
            </Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { color: colors.danger[500] }]}>Danger Zone</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
            <Text style={[styles.dangerButtonText, { color: colors.danger[500] }]}>
              Delete Account
            </Text>
            <Text style={[styles.dangerButtonSubtext, { color: theme.text.muted }]}>
              Permanently delete your account and all data
            </Text>
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
  saveButton: {
    width: 60,
    alignItems: 'flex-end',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.primary[600],
  },
  changeAvatarButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  changeAvatarText: {
    fontSize: 14,
    fontWeight: '500',
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
  field: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  fieldInput: {
    fontSize: 16,
    fontWeight: '500',
    padding: 0,
  },
  fieldHint: {
    fontSize: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  goalItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  goalText: {
    fontSize: 15,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 20,
  },
  updateGoalsButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  updateGoalsText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dangerButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButtonSubtext: {
    fontSize: 13,
    marginTop: 4,
  },
});
