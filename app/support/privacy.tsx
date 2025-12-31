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
import { colors } from '../../src/theme/colors';

const PRIVACY_SECTIONS = [
  {
    title: 'Data We Collect',
    icon: '📊',
    content: `BrainXP collects the following types of data:

• Task and habit data you create
• Focus session history
• Mood and wellness check-ins
• App usage analytics (anonymized)
• Device information for crash reporting

We do NOT collect:
• Passwords (stored securely on device)
• Financial information
• Location data
• Contact lists`,
  },
  {
    title: 'How We Use Your Data',
    icon: '🔧',
    content: `Your data is used to:

• Provide app functionality
• Generate AI-powered insights and recommendations
• Improve app performance
• Send optional notifications and reminders

We never sell your personal data to third parties.`,
  },
  {
    title: 'Data Storage',
    icon: '🔒',
    content: `Your data is stored:

• Locally on your device (primary)
• On secure cloud servers (if sync enabled)
• Encrypted in transit and at rest

We use industry-standard encryption (AES-256) to protect your data.`,
  },
  {
    title: 'Your Rights',
    icon: '✅',
    content: `You have the right to:

• Access all your data (Export feature)
• Delete your data at any time
• Opt out of analytics
• Request data portability
• Withdraw consent

To exercise these rights, visit Settings or contact us.`,
  },
  {
    title: 'Third-Party Services',
    icon: '🔗',
    content: `We use the following third-party services:

• Analytics: Anonymous usage data only
• AI Services: Task and content data for AI features
• Cloud Storage: Encrypted data sync

All third parties are GDPR compliant.`,
  },
  {
    title: 'Children\'s Privacy',
    icon: '👶',
    content: `BrainXP is designed for users 13 years and older. We do not knowingly collect data from children under 13.

If you believe a child has provided us data, please contact us immediately.`,
  },
  {
    title: 'Updates to This Policy',
    icon: '📝',
    content: `We may update this privacy policy from time to time. We will notify you of significant changes through:

• In-app notifications
• Email (if provided)

Last updated: December 2024`,
  },
];

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryIcon}>🛡️</Text>
          <Text style={styles.summaryTitle}>Your Privacy Matters</Text>
          <Text style={styles.summaryText}>
            BrainXP is committed to protecting your privacy. We collect minimal data necessary to provide our services and never sell your information.
          </Text>
        </View>

        {/* Quick Facts */}
        <View style={styles.quickFacts}>
          <View style={styles.factItem}>
            <Text style={styles.factIcon}>✓</Text>
            <Text style={styles.factText}>Data stored on your device</Text>
          </View>
          <View style={styles.factItem}>
            <Text style={styles.factIcon}>✓</Text>
            <Text style={styles.factText}>End-to-end encryption</Text>
          </View>
          <View style={styles.factItem}>
            <Text style={styles.factIcon}>✓</Text>
            <Text style={styles.factText}>No data selling</Text>
          </View>
          <View style={styles.factItem}>
            <Text style={styles.factIcon}>✓</Text>
            <Text style={styles.factText}>Export & delete anytime</Text>
          </View>
        </View>

        {/* Sections */}
        {PRIVACY_SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        {/* Contact */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Questions?</Text>
          <Text style={styles.contactText}>
            Contact our privacy team at{'\n'}privacy@brainxp.app
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
  summaryCard: {
    margin: 16,
    padding: 24,
    backgroundColor: colors.primary[500],
    borderRadius: 20,
    alignItems: 'center',
  },
  summaryIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  quickFacts: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  factItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  factIcon: {
    fontSize: 16,
    color: colors.success[500],
    marginRight: 12,
    fontWeight: '700',
  },
  factText: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
  },
  sectionContent: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 22,
  },
  contactCard: {
    margin: 16,
    marginBottom: 40,
    padding: 20,
    backgroundColor: colors.gray[100],
    borderRadius: 16,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[800],
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
  },
});
