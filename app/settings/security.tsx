// Security Settings Screen
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
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { colors, shadows } from '../../src/theme/colors';
import { useTheme } from '../../src/theme';
import { playClick } from '../../src/utils/sound';

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuthStore();

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setIsSaving(true);
    try {
      // In production, would call API to change password
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Password changed successfully');
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      playClick();
    } catch (error) {
      Alert.alert('Error', 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBiometric = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Enable Biometrics',
        'Use Face ID or fingerprint to unlock the app?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: () => {
              setBiometricEnabled(true);
              playClick();
            },
          },
        ]
      );
    } else {
      setBiometricEnabled(false);
      playClick();
    }
  };

  const handleToggle2FA = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Enable Two-Factor Authentication',
        'This will require a verification code when signing in from new devices.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Set Up',
            onPress: () => {
              // Would open 2FA setup flow
              Alert.alert('Coming Soon', 'Two-factor authentication setup will be available soon.');
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Disable Two-Factor Authentication',
        'This will make your account less secure. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => {
              setTwoFactorEnabled(false);
              playClick();
            },
          },
        ]
      );
    }
  };

  const handleViewSessions = () => {
    Alert.alert(
      'Active Sessions',
      'You are currently signed in on:\n\n• This device (current)\n• iPhone 15 Pro - Last active 2 hours ago\n\nWould you like to sign out of other devices?',
      [
        { text: 'Keep All', style: 'cancel' },
        {
          text: 'Sign Out Others',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Signed out of all other devices');
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
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Security</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Password Section */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Password</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          {isChangingPassword ? (
            <>
              <View style={[styles.inputField, { borderBottomColor: theme.border }]}>
                <Text style={[styles.inputLabel, { color: theme.text.secondary }]}>Current Password</Text>
                <TextInput
                  style={[styles.input, { color: theme.text.primary }]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={theme.text.muted}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              <View style={[styles.inputField, { borderBottomColor: theme.border }]}>
                <Text style={[styles.inputLabel, { color: theme.text.secondary }]}>New Password</Text>
                <TextInput
                  style={[styles.input, { color: theme.text.primary }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={theme.text.muted}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              <View style={[styles.inputField, { borderBottomColor: theme.border }]}>
                <Text style={[styles.inputLabel, { color: theme.text.secondary }]}>Confirm New Password</Text>
                <TextInput
                  style={[styles.input, { color: theme.text.primary }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor={theme.text.muted}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: theme.border }]}
                  onPress={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.text.secondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.primary[500] }]}
                  onPress={handleChangePassword}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={styles.row}
              onPress={() => setIsChangingPassword(true)}
            >
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Change Password</Text>
                <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                  Last changed 3 months ago
                </Text>
              </View>
              <Text style={[styles.rowArrow, { color: theme.text.muted }]}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Authentication */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Authentication</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <View style={[styles.switchRow, { borderBottomColor: theme.border }]}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Face ID / Touch ID</Text>
              <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                Use biometrics to unlock app
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: theme.palette.gray[300], true: colors.primary[400] }}
              thumbColor={biometricEnabled ? colors.primary[600] : theme.background.card}
              ios_backgroundColor={theme.palette.gray[300]}
            />
          </View>
          <View style={styles.switchRow}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Two-Factor Authentication</Text>
              <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                {twoFactorEnabled ? 'Enabled' : 'Add extra security to your account'}
              </Text>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={handleToggle2FA}
              trackColor={{ false: theme.palette.gray[300], true: colors.primary[400] }}
              thumbColor={twoFactorEnabled ? colors.primary[600] : theme.background.card}
              ios_backgroundColor={theme.palette.gray[300]}
            />
          </View>
        </View>

        {/* Sessions */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Sessions</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <TouchableOpacity style={styles.row} onPress={handleViewSessions}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Active Sessions</Text>
              <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                Manage devices where you're signed in
              </Text>
            </View>
            <Text style={[styles.rowArrow, { color: theme.text.muted }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy */}
        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Privacy</Text>
        <View style={[styles.section, { backgroundColor: theme.background.card }]}>
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
            onPress={() => Alert.alert('Download Data', 'Your data export will be ready within 24 hours. We\'ll email you when it\'s ready.')}
          >
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text.primary }]}>Download My Data</Text>
              <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                Get a copy of all your data
              </Text>
            </View>
            <Text style={[styles.rowArrow, { color: theme.text.muted }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/settings/profile')}
          >
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: colors.danger[500] }]}>Delete Account</Text>
              <Text style={[styles.rowSubtitle, { color: theme.text.secondary }]}>
                Permanently remove your account
              </Text>
            </View>
            <Text style={[styles.rowArrow, { color: theme.text.muted }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Security Tips */}
        <View style={[styles.tipsSection, { backgroundColor: theme.background.secondary }]}>
          <Text style={[styles.tipsTitle, { color: theme.text.primary }]}>🔒 Security Tips</Text>
          <Text style={[styles.tipText, { color: theme.text.secondary }]}>
            • Use a unique password for BrainXP
          </Text>
          <Text style={[styles.tipText, { color: theme.text.secondary }]}>
            • Enable two-factor authentication
          </Text>
          <Text style={[styles.tipText, { color: theme.text.secondary }]}>
            • Review active sessions regularly
          </Text>
          <Text style={[styles.tipText, { color: theme.text.secondary }]}>
            • Never share your password with anyone
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
  rowArrow: {
    fontSize: 20,
  },
  inputField: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    fontSize: 16,
    padding: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  tipsSection: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
