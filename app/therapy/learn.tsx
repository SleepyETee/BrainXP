import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useTherapyStore } from '../../src/stores/therapyStore';
import { ADHDCardViewer, ADHDCardPreview } from '../../src/components/therapy';
import { ADHD_CARDS, getCardsByCategory, getCategoryCounts } from '../../src/data/adhdCards';
import { ADHDCard, ADHDCardCategory } from '../../src/types/therapy';

const CATEGORY_INFO: Record<ADHDCardCategory, { emoji: string; label: string }> = {
  understanding_adhd: { emoji: '🧠', label: 'Understanding ADHD' },
  time_management: { emoji: '⏰', label: 'Time Management' },
  focus_strategies: { emoji: '🎯', label: 'Focus Strategies' },
  emotional_regulation: { emoji: '💚', label: 'Emotional Regulation' },
  organization: { emoji: '📋', label: 'Organization' },
  relationships: { emoji: '👥', label: 'Relationships' },
  self_care: { emoji: '🌿', label: 'Self Care' },
  medication: { emoji: '💊', label: 'Medication' },
  coping_strategies: { emoji: '🛡️', label: 'Coping Strategies' },
};

export default function LearnScreen() {
  const router = useRouter();
  const progress = useTherapyStore((state) => state.progress);
  const isCardViewed = useTherapyStore((state) => state.isCardViewed);
  const getBookmarkedCards = useTherapyStore((state) => state.getBookmarkedCards);
  
  const [selectedCategory, setSelectedCategory] = useState<ADHDCardCategory | 'all' | 'bookmarks'>('all');
  const [selectedCard, setSelectedCard] = useState<ADHDCard | null>(null);
  
  const categoryCounts = getCategoryCounts();
  const bookmarkedIds = React.useMemo(() => getBookmarkedCards(), [progress]);
  
  const getFilteredCards = () => {
    if (selectedCategory === 'all') {
      return ADHD_CARDS;
    }
    if (selectedCategory === 'bookmarks') {
      return ADHD_CARDS.filter((card) => bookmarkedIds.includes(card.id));
    }
    return getCardsByCategory(selectedCategory);
  };
  
  const filteredCards = getFilteredCards();
  const viewedCount = progress?.cardsViewed.length || 0;
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>ADHD Cards</Text>
          <Text style={styles.subtitle}>
            Quick reads to understand your brain better
          </Text>
        </View>
        
        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Cards read</Text>
            <Text style={styles.progressValue}>{viewedCount} / {ADHD_CARDS.length}</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(viewedCount / ADHD_CARDS.length) * 100}%` },
              ]}
            />
          </View>
        </View>
        
        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'all' && styles.categoryChipSelected,
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === 'all' && styles.categoryChipTextSelected,
              ]}
            >
              All ({ADHD_CARDS.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'bookmarks' && styles.categoryChipSelected,
            ]}
            onPress={() => setSelectedCategory('bookmarks')}
          >
            <Text style={styles.categoryEmoji}>🔖</Text>
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === 'bookmarks' && styles.categoryChipTextSelected,
              ]}
            >
              Saved ({bookmarkedIds.length})
            </Text>
          </TouchableOpacity>
          
          {(Object.keys(CATEGORY_INFO) as ADHDCardCategory[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={styles.categoryEmoji}>{CATEGORY_INFO[cat].emoji}</Text>
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextSelected,
                ]}
              >
                {CATEGORY_INFO[cat].label} ({categoryCounts[cat] || 0})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Cards List */}
        <View style={styles.cardsList}>
          {filteredCards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyText}>
                {selectedCategory === 'bookmarks'
                  ? 'No saved cards yet. Tap the bookmark icon when reading a card to save it.'
                  : 'No cards in this category yet.'}
              </Text>
            </View>
          ) : (
            filteredCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.cardItem,
                  isCardViewed(card.id) && styles.cardItemViewed,
                ]}
                onPress={() => setSelectedCard(card)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>
                    {CATEGORY_INFO[card.category].emoji}
                  </Text>
                  <View style={styles.cardBadges}>
                    {bookmarkedIds.includes(card.id) && (
                      <Text style={styles.bookmarkBadge}>🔖</Text>
                    )}
                    {isCardViewed(card.id) && (
                      <Text style={styles.viewedBadge}>✓</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardTakeaway} numberOfLines={2}>
                  {card.keyTakeaway}
                </Text>
                <Text style={styles.cardTime}>
                  {Math.ceil(card.readTimeSeconds / 60)} min read
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
      
      {/* Card Viewer Modal */}
      <Modal
        visible={selectedCard !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedCard(null)}
      >
        {selectedCard && (
          <ADHDCardViewer
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </Modal>
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
  header: {
    padding: 20,
    paddingTop: 12,
  },
  backButton: {
    fontSize: 16,
    color: colors.primary[600],
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[500],
  },
  progressCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  categoriesScroll: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryChipText: {
    fontSize: 13,
    color: colors.gray[700],
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  cardsList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  cardItemViewed: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  bookmarkBadge: {
    fontSize: 16,
  },
  viewedBadge: {
    fontSize: 14,
    color: colors.success[500],
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 8,
    lineHeight: 22,
  },
  cardTakeaway: {
    fontSize: 14,
    color: colors.gray[500],
    lineHeight: 20,
    marginBottom: 12,
  },
  cardTime: {
    fontSize: 12,
    color: colors.gray[400],
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
});
