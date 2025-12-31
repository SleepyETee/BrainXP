import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useDailyListStore } from '../../stores/dailyListStore';
import { DailyItemType } from '../../types/notes';
import { useTheme } from '../../theme';

type Props = {
  date?: string; // YYYY-MM-DD
};

const typeIcons: Record<DailyItemType, string> = {
  note: '🗒️',
  task: '✅',
  idea: '💡',
  reminder: '⏰',
};

export const DailyListCard: React.FC<Props> = ({ date }) => {
  const theme = useTheme();
  const [input, setInput] = useState('');
  const [activeType, setActiveType] = useState<DailyItemType>('note');

  const dateKey = useMemo(() => {
    if (date) return date.split('T')[0];
    return new Date().toISOString().split('T')[0];
  }, [date]);

  const getListForDate = useDailyListStore((state) => state.getListForDate);
  const addItem = useDailyListStore((state) => state.addItem);
  const toggleItem = useDailyListStore((state) => state.toggleItem);
  const deleteItem = useDailyListStore((state) => state.deleteItem);
  const convertToTask = useDailyListStore((state) => state.convertToTask);
  const list = useDailyListStore((state) => state.lists[dateKey]);

  useEffect(() => {
    if (!list) getListForDate(dateKey);
  }, [dateKey, list, getListForDate]);

  const handleAdd = () => {
    if (!input.trim()) return;
    addItem(dateKey, input.trim(), activeType);
    setInput('');
  };

  const displayList = list ?? getListForDate(dateKey);

  return (
    <View style={[styles.card, { backgroundColor: theme.background.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text.primary }]}>Daily List</Text>
          <Text style={[styles.subtitle, { color: theme.text.secondary }]}>{dateKey}</Text>
        </View>
        <View style={styles.typeRow}>
          {(['note', 'task', 'idea', 'reminder'] as DailyItemType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeChip,
                activeType === type && { backgroundColor: `${theme.palette.primary[500]}20`, borderColor: theme.palette.primary[500] },
              ]}
              onPress={() => setActiveType(type)}
            >
              <Text
                style={[
                  styles.typeChipText,
                  { color: activeType === type ? theme.palette.primary[500] : theme.text.secondary },
                ]}
              >
                {typeIcons[type]} {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.inputRow, { backgroundColor: theme.background.primary, borderColor: theme.border }]}>
        <TextInput
          style={[styles.input, { color: theme.text.primary }]}
          placeholder="Jot something for today…"
          placeholderTextColor={theme.text.muted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.palette.primary[500] }]}
          onPress={handleAdd}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {displayList.items.length === 0 ? (
          <Text style={{ color: theme.text.secondary }}>No items yet. Capture your day Twos-style.</Text>
        ) : (
          displayList.items
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((item) => (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  { borderColor: theme.border, backgroundColor: theme.background.primary },
                  item.isCompleted && { opacity: 0.6 },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    { borderColor: theme.border, backgroundColor: item.isCompleted ? theme.palette.primary[500] : 'transparent' },
                  ]}
                  onPress={() => toggleItem(dateKey, item.id)}
                >
                  {item.isCompleted && <Text style={styles.checkboxMark}>✓</Text>}
                </TouchableOpacity>
                <View style={styles.itemContent}>
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemType, { color: theme.text.secondary }]}>{typeIcons[item.type]} {item.type}</Text>
                    {item.convertedToTaskId && (
                      <Text style={[styles.badge, { backgroundColor: `${theme.palette.primary[500]}20`, color: theme.palette.primary[600] }]}>
                        Linked task
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.itemText, { color: theme.text.primary }]}>{item.content}</Text>
                  <View style={styles.actions}>
                    {!item.convertedToTaskId && (
                      <TouchableOpacity onPress={() => convertToTask(dateKey, item.id)}>
                        <Text style={[styles.actionText, { color: theme.palette.primary[600] }]}>Convert to task</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => deleteItem(dateKey, item.id)}>
                      <Text style={[styles.actionText, { color: theme.text.secondary }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'column',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  list: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  checkboxMark: {
    color: '#FFF',
    fontWeight: '700',
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemType: {
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  itemText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

