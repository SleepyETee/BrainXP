import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useTherapyStore } from '../../stores/therapyStore';
import { ADHDCard, ADHDCardCategory, THERAPY_DISCLAIMER } from '../../types/therapy';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface ADHDCardViewerProps {
  card: ADHDCard;
  onClose: () => void;
  onRateHelpful?: (rating: number) => void;
  showRelated?: boolean;
  onViewRelated?: (cardId: string) => void;
}

const CATEGORY_INFO: Record<ADHDCardCategory, { emoji: string; color: string }> = {
  understanding_adhd: { emoji: '🧠', color: colors.primary[500] },
  time_management: { emoji: '⏰', color: colors.warning[500] },
  focus_strategies: { emoji: '🎯', color: colors.secondary[500] },
  emotional_regulation: { emoji: '💚', color: colors.success[500] },
  organization: { emoji: '📋', color: colors.primary[400] },
  relationships: { emoji: '👥', color: colors.accent[400] },
  self_care: { emoji: '🌿', color: colors.secondary[400] },
  medication: { emoji: '💊', color: colors.gray[500] },
  coping_strategies: { emoji: '🛡️', color: colors.primary[600] },
};

export const ADHDCardViewer: React.FC<ADHDCardViewerProps> = ({
  card,
  onClose,
  onRateHelpful,
  showRelated = true,
  onViewRelated,
}) => {
  const progress = useTherapyStore((state) => state.progress);
  const markCardViewed = useTherapyStore((state) => state.markCardViewed);
  const toggleBookmark = useTherapyStore((state) => state.toggleBookmark);
  const isCardViewed = useTherapyStore((state) => state.isCardViewed);
  const getBookmarkedCards = useTherapyStore((state) => state.getBookmarkedCards);
  const [hasRated, setHasRated] = useState(false);
  
  const categoryInfo = CATEGORY_INFO[card.category];
  const bookmarkedIds = React.useMemo(() => getBookmarkedCards(), [progress]);
  const isBookmarked = bookmarkedIds.includes(card.id);
  
  React.useEffect(() => {
    markCardViewed(card.id);
  }, [card.id]);
  
  const handleBookmark = () => {
    toggleBookmark(card.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleRate = (rating: number) => {
    setHasRated(true);
    onRateHelpful?.(rating);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleBookmark} style={styles.bookmarkButton}>
          <Text style={styles.bookmarkText}>{isBookmarked ? '🔖' : '📑'}</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Category badge */}
        <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '15' }]}>
          <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
          <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
            {card.category.replace(/_/g, ' ')}
          </Text>
        </View>
        
        {/* Title */}
        <Text style={styles.title}>{card.title}</Text>
        
        {/* Read time */}
        <Text style={styles.readTime}>
          {Math.ceil(card.readTimeSeconds / 60)} min read
        </Text>
        
        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.content}>{card.content}</Text>
        </View>
        
        {/* Key takeaway */}
        <View style={styles.takeawayCard}>
          <Text style={styles.takeawayLabel}>💡 Key Takeaway</Text>
          <Text style={styles.takeawayText}>{card.keyTakeaway}</Text>
        </View>
        
        {/* Practical tips */}
        {card.practicalTips.length > 0 && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Try This:</Text>
            {card.practicalTips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <Text style={styles.tipNumber}>{index + 1}</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Tags */}
        {card.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {card.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Rating */}
        {onRateHelpful && !hasRated && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Was this helpful?</Text>
            <View style={styles.ratingButtons}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={styles.ratingButton}
                  onPress={() => handleRate(rating)}
                >
                  <Text style={styles.ratingEmoji}>
                    {rating <= 2 ? '👎' : rating === 3 ? '😐' : '👍'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        
        {hasRated && (
          <View style={styles.thankYouContainer}>
            <Text style={styles.thankYouText}>Thanks for your feedback! 🙏</Text>
          </View>
        )}
        
        {/* Related cards */}
        {showRelated && card.relatedCards.length > 0 && onViewRelated && (
          <View style={styles.relatedContainer}>
            <Text style={styles.relatedTitle}>Related topics:</Text>
            {/* Would render related card previews here */}
          </View>
        )}
        
        <Text style={styles.disclaimer}>{THERAPY_DISCLAIMER.education}</Text>
      </ScrollView>
    </View>
  );
};

// Card preview component for lists
interface ADHDCardPreviewProps {
  card: ADHDCard;
  onPress: () => void;
  compact?: boolean;
}

export const ADHDCardPreview: React.FC<ADHDCardPreviewProps> = ({
  card,
  onPress,
  compact = false,
}) => {
  const progress = useTherapyStore((state) => state.progress);
  const isCardViewed = useTherapyStore((state) => state.isCardViewed);
  const getBookmarkedCards = useTherapyStore((state) => state.getBookmarkedCards);
  const categoryInfo = CATEGORY_INFO[card.category];
  const viewed = isCardViewed(card.id);
  const bookmarkedIds = React.useMemo(() => getBookmarkedCards(), [progress]);
  const bookmarked = bookmarkedIds.includes(card.id);
  
  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress}>
        <Text style={styles.compactEmoji}>{categoryInfo.emoji}</Text>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={2}>{card.title}</Text>
          <Text style={styles.compactTime}>{Math.ceil(card.readTimeSeconds / 60)} min</Text>
        </View>
        {viewed && <Text style={styles.viewedBadge}>✓</Text>}
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      style={[styles.previewCard, viewed && styles.previewCardViewed]}
      onPress={onPress}
    >
      <View style={styles.previewHeader}>
        <View style={[styles.previewCategory, { backgroundColor: categoryInfo.color + '15' }]}>
          <Text style={styles.previewEmoji}>{categoryInfo.emoji}</Text>
        </View>
        {bookmarked && <Text style={styles.bookmarkIcon}>🔖</Text>}
      </View>
      <Text style={styles.previewTitle} numberOfLines={2}>{card.title}</Text>
      <Text style={styles.previewTakeaway} numberOfLines={2}>{card.keyTakeaway}</Text>
      <View style={styles.previewFooter}>
        <Text style={styles.previewTime}>{Math.ceil(card.readTimeSeconds / 60)} min read</Text>
        {viewed && <Text style={styles.previewViewed}>Read ✓</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    color: colors.gray[400],
  },
  bookmarkButton: {
    padding: 8,
  },
  bookmarkText: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[900],
    lineHeight: 36,
    marginBottom: 8,
  },
  readTime: {
    fontSize: 13,
    color: colors.gray[400],
    marginBottom: 24,
  },
  contentContainer: {
    marginBottom: 24,
  },
  content: {
    fontSize: 17,
    color: colors.gray[700],
    lineHeight: 28,
  },
  takeawayCard: {
    backgroundColor: colors.warning[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[400],
  },
  takeawayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.warning[700],
    marginBottom: 8,
  },
  takeawayText: {
    fontSize: 16,
    color: colors.warning[800],
    lineHeight: 24,
    fontWeight: '500',
  },
  tipsContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 16,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[100],
    color: colors.primary[700],
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
  },
  tag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: colors.gray[600],
  },
  ratingContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 15,
    color: colors.gray[600],
    marginBottom: 16,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  ratingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  ratingEmoji: {
    fontSize: 24,
  },
  thankYouContainer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 24,
  },
  thankYouText: {
    fontSize: 15,
    color: colors.primary[600],
    fontWeight: '500',
  },
  relatedContainer: {
    marginBottom: 24,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: 12,
  },
  disclaimer: {
    fontSize: 11,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Preview card styles
  previewCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  previewCardViewed: {
    opacity: 0.7,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewCategory: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmoji: {
    fontSize: 18,
  },
  bookmarkIcon: {
    fontSize: 16,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 8,
    lineHeight: 20,
  },
  previewTakeaway: {
    fontSize: 13,
    color: colors.gray[500],
    lineHeight: 18,
    marginBottom: 12,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTime: {
    fontSize: 12,
    color: colors.gray[400],
  },
  previewViewed: {
    fontSize: 12,
    color: colors.success[500],
    fontWeight: '500',
  },
  
  // Compact card styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  compactEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 2,
  },
  compactTime: {
    fontSize: 12,
    color: colors.gray[400],
  },
  viewedBadge: {
    fontSize: 14,
    color: colors.success[500],
    marginLeft: 8,
  },
});

export default ADHDCardViewer;
