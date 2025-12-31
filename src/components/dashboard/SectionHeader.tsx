import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

type SectionHeaderProps = {
  title: string;
  rightLabel?: string;
  rightHint?: string;
  onPressRight?: () => void;
  style?: ViewStyle;
};

export function SectionHeader({
  title,
  rightLabel,
  rightHint,
  onPressRight,
  style,
}: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, { color: theme.text.primary }]}>{title}</Text>
      {rightLabel && onPressRight ? (
        <TouchableOpacity
          onPress={onPressRight}
          accessibilityRole="button"
          accessibilityLabel={rightLabel}
          accessibilityHint={rightHint}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.rightLabel, { color: theme.palette.primary[500] }]}>
            {rightLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  rightLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
