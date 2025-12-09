import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { CaptureItem } from '../../types/capture';
import { colors } from '../../theme/colors';
import { formatRelativeTime } from '../../utils/date';

interface InboxItemProps {
  item: CaptureItem;
  onProcess: () => void;
  onConvertToTask: () => void;
  onConvertToHabit: () => void;
  onDismiss: () => void;
}

export const InboxItem: React.FC<InboxItemProps> = ({
  item,
  onProcess,
  onConvertToTask,
  onConvertToHabit,
  onDismiss,
}) => {
  const swipeableRef = React.useRef<Swipeable>(null);

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swipeableRef.current?.close();
    onDismiss();
  };

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.dismissButton}
      onPress={handleDismiss}
    >
      <Text style={styles.dismissText}>Dismiss</Text>
    </TouchableOpacity>
  );

  const getIcon = () => {
    switch (item.contentType) {
      case 'voice':
        return '🎙️';
      case 'photo':
        return '📷';
      case 'link':
        return '🔗';
      default:
        return '📝';
    }
  };

  const getContent = () => {
    if (item.textContent) return item.textContent;
    if (item.voiceTranscript) return item.voiceTranscript;
    if (item.linkUrl) return item.linkUrl;
    return 'Tap to view';
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
    >
      <TouchableOpacity
        style={styles.container}
        onPress={onProcess}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getIcon()}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.text} numberOfLines={2}>
            {getContent()}
          </Text>
          <View style={styles.metadata}>
            <Text style={styles.time}>
              {formatRelativeTime(new Date(item.capturedAt))}
            </Text>
            {item.source !== 'app' && (
              <Text style={styles.source}>via {item.source}</Text>
            )}
          </View>

          {item.aiSuggestion && (
            <View style={styles.suggestionBadge}>
              <Text style={styles.suggestionText}>
                ✨ AI suggests: {item.aiSuggestion.suggestedType}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.taskButton]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onConvertToTask();
            }}
          >
            <Text style={styles.actionEmoji}>✅</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.habitButton]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onConvertToHabit();
            }}
          >
            <Text style={styles.actionEmoji}>🔄</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 15,
    color: colors.gray[800],
    lineHeight: 22,
  },
  metadata: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 8,
  },
  time: {
    fontSize: 12,
    color: colors.gray[400],
  },
  source: {
    fontSize: 12,
    color: colors.gray[400],
  },
  suggestionBadge: {
    marginTop: 8,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  suggestionText: {
    fontSize: 11,
    color: colors.primary[600],
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskButton: {
    backgroundColor: colors.success[50],
  },
  habitButton: {
    backgroundColor: colors.primary[50],
  },
  actionEmoji: {
    fontSize: 16,
  },
  dismissButton: {
    backgroundColor: colors.danger[500],
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 4,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  dismissText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default InboxItem;

