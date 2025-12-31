import React, { useState } from 'react';
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

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    category: 'Getting Started',
    question: 'How do I create a task?',
    answer: 'Tap the + button on the Tasks tab, or use the quick add bar at the top. You can type naturally like "Call mom tomorrow" and the app will parse the date automatically.',
  },
  {
    category: 'Getting Started',
    question: 'What is the inbox?',
    answer: 'The inbox is where quick captures and tasks without due dates go. Review it regularly to organize your tasks.',
  },
  {
    category: 'Spoon Theory',
    question: 'How does spoon theory work?',
    answer: 'Spoons represent your energy/mental capacity. Each person starts the day with limited spoons. Tasks cost spoons based on their difficulty. When you\'re low on spoons, focus on low-energy tasks.',
  },
  {
    category: 'Spoon Theory',
    question: 'How do I estimate spoons for a task?',
    answer: 'Use the AI Spoon Estimator tool, or manually set it when creating a task. Low energy tasks = 1-2 spoons, medium = 3-4, high = 5+ spoons.',
  },
  {
    category: 'Focus Timer',
    question: 'What is the focus timer?',
    answer: 'A Pomodoro-style timer to help you concentrate. Set a duration (default 25 min), start the timer, and focus on one task. Take breaks between sessions.',
  },
  {
    category: 'Focus Timer',
    question: 'Can I customize focus session length?',
    answer: 'Yes! Go to Settings > Focus Settings to change the default duration. You can also adjust it before each session.',
  },
  {
    category: 'Gamification',
    question: 'How do I earn XP?',
    answer: 'Complete tasks (+10-50 XP), finish focus sessions (+20 XP), log habits (+5 XP), do mood check-ins (+5 XP), and maintain streaks for bonus XP!',
  },
  {
    category: 'Gamification',
    question: 'What are badges?',
    answer: 'Badges are achievements you unlock by reaching milestones. View your badges in the Analytics screen. Some are common, others are rare!',
  },
  {
    category: 'Habits',
    question: 'How do flexible streaks work?',
    answer: 'Unlike strict streaks, flexible streaks allow you to miss a day without losing progress. Configure the flexibility window in Settings.',
  },
  {
    category: 'AI Features',
    question: 'What AI tools are available?',
    answer: 'Magic Breakdown (splits tasks into steps), Spoon Estimator, Tone Rewriter, Note Compiler, Time Estimator, and AI-generated flashcards.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(FAQ_DATA.map(item => item.category))];
  
  const filteredFAQs = selectedCategory 
    ? FAQ_DATA.filter(item => item.category === selectedCategory)
    : FAQ_DATA;

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Help & FAQ</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Category Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FAQ Items */}
        <View style={styles.faqList}>
          {filteredFAQs.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => toggleExpand(index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Text style={styles.expandIcon}>
                  {expandedIndex === index ? '−' : '+'}
                </Text>
              </View>
              {expandedIndex === index && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{item.answer}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.category}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>
            Contact us at support@brainxp.app
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
  categoryRow: {
    padding: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  faqList: {
    paddingHorizontal: 16,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
    marginRight: 12,
  },
  expandIcon: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary[500],
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: 12,
  },
  faqAnswerText: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 22,
  },
  categoryBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
  },
  categoryBadgeText: {
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: '500',
  },
  contactSection: {
    margin: 16,
    padding: 20,
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary[700],
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: colors.primary[600],
  },
});
