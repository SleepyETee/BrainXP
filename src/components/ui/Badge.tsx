import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  icon,
  style,
  textStyle,
}) => {
  const badgeStyles: ViewStyle[] = [
    styles.base,
    styles[`variant_${variant}` as keyof typeof styles] as ViewStyle,
    styles[`size_${size}` as keyof typeof styles] as ViewStyle,
    style,
  ].filter(Boolean) as ViewStyle[];

  const labelStyles: TextStyle[] = [
    styles.label,
    styles[`label_${variant}` as keyof typeof styles] as TextStyle,
    styles[`labelSize_${size}` as keyof typeof styles] as TextStyle,
    textStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <View style={badgeStyles}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={labelStyles}>{label}</Text>
    </View>
  );
};

interface StatusBadgeProps {
  status: 'inbox' | 'todo' | 'in_progress' | 'waiting' | 'done' | 'abandoned';
  size?: BadgeSize;
}

const statusLabels: Record<StatusBadgeProps['status'], string> = {
  inbox: 'Inbox',
  todo: 'To Do',
  in_progress: 'In Progress',
  waiting: 'Waiting',
  done: 'Done',
  abandoned: 'Abandoned',
};

const statusVariants: Record<StatusBadgeProps['status'], BadgeVariant> = {
  inbox: 'default',
  todo: 'primary',
  in_progress: 'warning',
  waiting: 'secondary',
  done: 'success',
  abandoned: 'default',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => (
  <Badge
    label={statusLabels[status]}
    variant={statusVariants[status]}
    size={size}
  />
);

interface PriorityBadgeProps {
  priority: 'urgent_important' | 'important' | 'urgent' | 'low' | 'none';
  size?: BadgeSize;
}

const priorityLabels: Record<PriorityBadgeProps['priority'], string> = {
  urgent_important: 'Urgent & Important',
  important: 'Important',
  urgent: 'Urgent',
  low: 'Low',
  none: 'None',
};

const priorityVariants: Record<PriorityBadgeProps['priority'], BadgeVariant> = {
  urgent_important: 'danger',
  important: 'warning',
  urgent: 'warning',
  low: 'default',
  none: 'default',
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  if (priority === 'none') return null;

  return (
    <Badge
      label={priorityLabels[priority]}
      variant={priorityVariants[priority]}
      size={size}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  iconContainer: {
    marginRight: 4,
  },
  label: {
    fontWeight: '500',
  },

  // Variants
  variant_default: {
    backgroundColor: colors.gray[100],
  },
  variant_primary: {
    backgroundColor: colors.primary[100],
  },
  variant_secondary: {
    backgroundColor: colors.secondary[100],
  },
  variant_success: {
    backgroundColor: colors.success[100],
  },
  variant_warning: {
    backgroundColor: colors.warning[100],
  },
  variant_danger: {
    backgroundColor: colors.danger[100],
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gray[300],
  },

  // Label colors
  label_default: {
    color: colors.gray[600],
  },
  label_primary: {
    color: colors.primary[700],
  },
  label_secondary: {
    color: colors.secondary[700],
  },
  label_success: {
    color: colors.success[700],
  },
  label_warning: {
    color: colors.warning[700],
  },
  label_danger: {
    color: colors.danger[700],
  },
  label_outline: {
    color: colors.gray[600],
  },

  // Sizes
  size_sm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  size_md: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  size_lg: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  // Label sizes
  labelSize_sm: {
    fontSize: 11,
  },
  labelSize_md: {
    fontSize: 12,
  },
  labelSize_lg: {
    fontSize: 14,
  },
});

export default Badge;
