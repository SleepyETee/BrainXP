import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'gradient';
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  dot?: boolean;
  pulse?: boolean;
  animated?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  icon,
  dot = false,
  pulse = false,
  animated = true,
  style,
  textStyle,
}) => {
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (pulse) {
      pulseScale.value = withRepeat(
        withSequence(
          withSpring(1.1, { damping: 10 }),
          withSpring(1, { damping: 10 })
        ),
        -1,
        true
      );
    }
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const badgeStyles: ViewStyle[] = [
    styles.base,
    styles[`size_${size}` as keyof typeof styles] as ViewStyle,
    variant !== 'gradient' && (styles[`variant_${variant}` as keyof typeof styles] as ViewStyle),
    style,
  ].filter(Boolean) as ViewStyle[];

  const labelStyles: TextStyle[] = [
    styles.label,
    styles[`label_${variant}` as keyof typeof styles] as TextStyle,
    styles[`labelSize_${size}` as keyof typeof styles] as TextStyle,
    textStyle,
  ].filter(Boolean) as TextStyle[];

  const content = (
    <>
      {dot && (
        <Animated.View 
          style={[
            styles.dot,
            styles[`dot_${variant}` as keyof typeof styles] as ViewStyle,
            pulse && pulseStyle,
          ]} 
        />
      )}
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={labelStyles}>{label}</Text>
    </>
  );

  if (variant === 'gradient') {
    return (
      <Animated.View entering={animated ? FadeIn.duration(200) : undefined}>
        <LinearGradient
          colors={[colors.primary[500], colors.primary[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[badgeStyles, styles.gradientBadge]}
        >
          {content}
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      entering={animated ? FadeIn.duration(200) : undefined}
      style={badgeStyles}
    >
      {content}
    </Animated.View>
  );
};

// Notification Badge (for counts)
interface NotificationBadgeProps {
  count: number;
  max?: number;
  variant?: 'primary' | 'danger' | 'warning';
  size?: 'sm' | 'md';
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  max = 99,
  variant = 'danger',
  size = 'sm',
}) => {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[
        styles.notificationBadge,
        styles[`notification_${variant}` as keyof typeof styles] as ViewStyle,
        styles[`notificationSize_${size}` as keyof typeof styles] as ViewStyle,
      ]}
    >
      <Text style={[styles.notificationText, styles[`notificationTextSize_${size}` as keyof typeof styles] as TextStyle]}>
        {displayCount}
      </Text>
    </Animated.View>
  );
};

interface StatusBadgeProps {
  status: 'inbox' | 'todo' | 'in_progress' | 'waiting' | 'done' | 'abandoned';
  size?: BadgeSize;
  showDot?: boolean;
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

const statusIcons: Record<StatusBadgeProps['status'], string> = {
  inbox: '📥',
  todo: '📋',
  in_progress: '⏳',
  waiting: '⏸️',
  done: '✅',
  abandoned: '🚫',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', showDot = false }) => (
  <Badge
    label={statusLabels[status]}
    variant={statusVariants[status]}
    size={size}
    dot={showDot}
    pulse={status === 'in_progress'}
  />
);

interface PriorityBadgeProps {
  priority: 'urgent_important' | 'important' | 'urgent' | 'high' | 'medium' | 'low' | 'none';
  size?: BadgeSize;
  showIcon?: boolean;
}

const priorityLabels: Record<PriorityBadgeProps['priority'], string> = {
  urgent_important: 'Urgent & Important',
  important: 'Important',
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'None',
};

const priorityVariants: Record<PriorityBadgeProps['priority'], BadgeVariant> = {
  urgent_important: 'danger',
  important: 'warning',
  urgent: 'warning',
  high: 'warning',
  medium: 'default',
  low: 'default',
  none: 'default',
};

const priorityIcons: Record<PriorityBadgeProps['priority'], string> = {
  urgent_important: '🔥',
  important: '⭐',
  urgent: '⚡',
  high: '🔺',
  medium: '➖',
  low: '🔽',
  none: '',
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm', showIcon = false }) => {
  if (priority === 'none') return null;

  return (
    <Badge
      label={showIcon ? `${priorityIcons[priority]} ${priorityLabels[priority]}` : priorityLabels[priority]}
      variant={priorityVariants[priority]}
      size={size}
    />
  );
};

// Energy Badge
interface EnergyBadgeProps {
  level: 'low' | 'medium' | 'high';
  size?: BadgeSize;
}

const energyLabels: Record<EnergyBadgeProps['level'], string> = {
  low: 'Low Energy',
  medium: 'Medium',
  high: 'High Energy',
};

const energyIcons: Record<EnergyBadgeProps['level'], string> = {
  low: '🔋',
  medium: '⚡',
  high: '⚡⚡',
};

export const EnergyBadge: React.FC<EnergyBadgeProps> = ({ level, size = 'sm' }) => (
  <Badge
    label={`${energyIcons[level]} ${energyLabels[level]}`}
    variant={level === 'high' ? 'warning' : level === 'low' ? 'success' : 'default'}
    size={size}
  />
);

// XP Badge
interface XPBadgeProps {
  xp: number;
  size?: BadgeSize;
}

export const XPBadge: React.FC<XPBadgeProps> = ({ xp, size = 'sm' }) => (
  <Badge
    label={`+${xp} XP`}
    variant="gradient"
    size={size}
  />
);

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  gradientBadge: {
    overflow: 'hidden',
  },
  iconContainer: {
    marginRight: 4,
  },
  label: {
    fontWeight: '600',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  // Dot colors
  dot_default: { backgroundColor: colors.gray[500] },
  dot_primary: { backgroundColor: colors.primary[500] },
  dot_secondary: { backgroundColor: colors.secondary[500] },
  dot_success: { backgroundColor: colors.success[500] },
  dot_warning: { backgroundColor: colors.warning[500] },
  dot_danger: { backgroundColor: colors.danger[500] },
  dot_outline: { backgroundColor: colors.gray[500] },
  dot_gradient: { backgroundColor: colors.primary[500] },

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
  label_gradient: {
    color: '#FFFFFF',
  },

  // Sizes
  size_xs: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  size_sm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  size_md: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  size_lg: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

  // Label sizes
  labelSize_xs: {
    fontSize: 10,
  },
  labelSize_sm: {
    fontSize: 11,
  },
  labelSize_md: {
    fontSize: 12,
  },
  labelSize_lg: {
    fontSize: 14,
  },

  // Notification badge
  notificationBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  notification_primary: {
    backgroundColor: colors.primary[500],
  },
  notification_danger: {
    backgroundColor: colors.danger[500],
  },
  notification_warning: {
    backgroundColor: colors.warning[500],
  },
  notificationSize_sm: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
  },
  notificationSize_md: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
  },
  notificationText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  notificationTextSize_sm: {
    fontSize: 10,
  },
  notificationTextSize_md: {
    fontSize: 12,
  },
});

export default Badge;
