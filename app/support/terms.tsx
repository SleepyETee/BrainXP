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

const TERMS_SECTIONS = [
  {
    title: 'Acceptance of Terms',
    content: `By downloading, installing, or using BrainXP ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.

These terms constitute a legal agreement between you and BrainXP.`,
  },
  {
    title: 'Description of Service',
    content: `BrainXP is a productivity and wellness application designed to help individuals with ADHD manage tasks, build habits, and improve focus. The App includes:

• Task management and organization
• Focus timer and Pomodoro sessions
• Habit tracking with flexible streaks
• AI-powered productivity tools
• Mood and wellness tracking
• Gamification features (XP, badges, levels)`,
  },
  {
    title: 'User Accounts',
    content: `You may use BrainXP as a guest or create an account. If you create an account:

• You are responsible for maintaining account security
• You must provide accurate information
• You may not share your account with others
• You may delete your account at any time

We reserve the right to suspend accounts that violate these terms.`,
  },
  {
    title: 'Acceptable Use',
    content: `You agree to use BrainXP only for lawful purposes. You may NOT:

• Use the App to harass or harm others
• Attempt to gain unauthorized access
• Reverse engineer or modify the App
• Use AI features to generate harmful content
• Violate any applicable laws or regulations
• Interfere with App functionality`,
  },
  {
    title: 'AI Features',
    content: `BrainXP includes AI-powered features. By using these features:

• You acknowledge AI outputs may not be perfect
• You retain ownership of content you provide
• AI suggestions are not professional advice
• We may use anonymized data to improve AI

Do not input sensitive personal information into AI features.`,
  },
  {
    title: 'Intellectual Property',
    content: `The App, including its design, features, and content, is owned by BrainXP and protected by intellectual property laws.

You retain ownership of the content you create in the App. By using the App, you grant us a limited license to store and process your content to provide our services.`,
  },
  {
    title: 'Disclaimer of Warranties',
    content: `THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.

• We do not guarantee uninterrupted service
• We are not responsible for data loss
• The App is not a substitute for professional medical or mental health advice
• AI features may produce inaccurate results

Use the App at your own risk.`,
  },
  {
    title: 'Limitation of Liability',
    content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW:

BrainXP shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the App.

Our total liability shall not exceed the amount you paid for the App in the past 12 months.`,
  },
  {
    title: 'Changes to Terms',
    content: `We may modify these terms at any time. We will notify you of significant changes through:

• In-app notifications
• Email notification
• Updated "Last Modified" date

Continued use of the App after changes constitutes acceptance of the new terms.`,
  },
  {
    title: 'Termination',
    content: `You may stop using the App at any time. We may terminate or suspend your access if you:

• Violate these terms
• Engage in fraudulent activity
• Abuse App features or other users

Upon termination, your right to use the App ceases immediately.`,
  },
  {
    title: 'Governing Law',
    content: `These terms shall be governed by the laws of the jurisdiction in which BrainXP operates, without regard to conflict of law principles.

Any disputes shall be resolved through binding arbitration, except where prohibited by law.`,
  },
];

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <Text style={styles.headerIcon}>📜</Text>
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <Text style={styles.headerSubtitle}>Last updated: December 2024</Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Quick Summary</Text>
          <Text style={styles.summaryText}>
            • Use the app responsibly{'\n'}
            • You own your content{'\n'}
            • Don't misuse AI features{'\n'}
            • We provide the app "as is"{'\n'}
            • You can leave anytime
          </Text>
        </View>

        {/* Sections */}
        {TERMS_SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionNumber}>{index + 1}</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionText}>{section.content}</Text>
            </View>
          </View>
        ))}

        {/* Contact */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Questions about these terms?</Text>
          <Text style={styles.contactText}>
            Contact us at legal@brainxp.app
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
  headerCard: {
    margin: 16,
    padding: 24,
    backgroundColor: colors.gray[800],
    borderRadius: 20,
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary[700],
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: colors.primary[600],
    lineHeight: 24,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[100],
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[600],
    marginRight: 16,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 8,
  },
  sectionText: {
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
  },
});
