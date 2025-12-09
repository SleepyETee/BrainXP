import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earnedAt?: string;
  isNew?: boolean;
}

interface BadgeGridProps {
  badges: Badge[];
  earnedBadgeIds: string[];
  onBadgePress?: (badge: Badge) => void;
  columns?: number;
}

const RARITY_COLORS = {
  common: colors.gray[400],
  uncommon: colors.success[500],
  rare: colors.primary[500],
  epic: '#9333EA',
  legendary: '#F59E0B',
};

const BadgeItem: React.FC<{
  badge: Badge;
  isEarned: boolean;
  isNew?: boolean;
  onPress?: () => void;
}> = ({ badge, isEarned, isNew, onPress }) => {
  const rarityColor = RARITY_COLORS[badge.rarity];

  return (
    <TouchableOpacity
      style={[
        styles.badgeItem,
        !isEarned && styles.badgeItemLocked,
        isNew && styles.badgeItemNew,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.badgeIcon,
          { borderColor: isEarned ? rarityColor : colors.gray[300] },
          isEarned && { backgroundColor: `${rarityColor}20` },
        ]}
      >
        <Text style={[styles.icon, !isEarned && styles.iconLocked]}>
          {isEarned ? badge.icon : '🔒'}
        </Text>
      </View>
      <Text
        style={[styles.badgeName, !isEarned && styles.badgeNameLocked]}
        numberOfLines={2}
      >
        {badge.name}
      </Text>
      {isNew && (
        <View style={styles.newBadge}>
          <Text style={styles.newText}>NEW</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const BadgeGrid: React.FC<BadgeGridProps> = ({
  badges,
  earnedBadgeIds,
  onBadgePress,
  columns = 3,
}) => {
  const earnedCount = earnedBadgeIds.length;
  const totalCount = badges.length;

  const renderBadge = ({ item }: { item: Badge }) => {
    const isEarned = earnedBadgeIds.includes(item.id);
    const earnedBadge = badges.find((b) => b.id === item.id);

    return (
      <BadgeItem
        badge={item}
        isEarned={isEarned}
        isNew={earnedBadge?.isNew}
        onPress={() => onBadgePress?.(item)}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Achievements</Text>
        <Text style={styles.progress}>
          {earnedCount}/{totalCount} unlocked
        </Text>
      </View>

      <FlatList
        data={badges}
        renderItem={renderBadge}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        columnWrapperStyle={styles.row}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[800],
  },
  progress: {
    fontSize: 14,
    color: colors.gray[500],
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeItem: {
    flex: 1,
    maxWidth: '31%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeItemLocked: {
    opacity: 0.6,
  },
  badgeItemNew: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 28,
  },
  iconLocked: {
    fontSize: 20,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: colors.gray[400],
  },
  newBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.primary[500],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default BadgeGrid;

