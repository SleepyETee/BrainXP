// filepath: /Users/sleepyet/BrainXP/src/components/ui/ListItem.tsx
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, shadows } from '../../theme/colors';
import { TOUCH_TARGETS } from '../../utils/uxHelpers';

interface ListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  // Icons
  leftIcon?: keyof typeof Ionicons.glyphMap;
  leftIconColor?: string;
  leftIconBackground?: string;
  leftElement?: React.ReactNode;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  // Actions
  onPress?: () => void;
  onLongPress?: () => void;
  // Appearance
  variant?: 'default' | 'card' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  selected?: boolean;
  destructive?: boolean;
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const springConfig = {
  damping: 15,
  stiffness: 400,
};

/**
 * ListItem Component
 * 
 * Versatile list item with:
 * - Minimum 48px touch target
 * - Visual feedback on press
 * - Support for icons, subtitles, and custom elements
 * - Multiple variants
 */
export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  description,
  leftIcon,
  leftIconColor = colors.primary[500],
  leftIconBackground,
  leftElement,
  rightIcon,
  rightElement,
  showChevron = false,
  onPress,
  onLongPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  selected = false,
  destructive = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
}) => {
  const scale = useSharedValue(1);
  const backgroundColor = useSharedValue(0);

  const sizeConfig = {
    sm: { 
      minHeight: TOUCH_TARGETS.minimum, 
      iconSize: 20, 
      iconContainerSize: 32,
      titleSize: 14, 
      subtitleSize: 12,
      padding: 12,
    },
    md: { 
      minHeight: TOUCH_TARGETS.recommended, 
      iconSize: 22, 
      iconContainerSize: 40,
      titleSize: 16, 
      subtitleSize: 13,
      padding: 16,
    },
    lg: { 
      minHeight: TOUCH_TARGETS.comfortable, 
      iconSize: 24, 
      iconContainerSize: 48,
      titleSize: 17, 
      subtitleSize: 14,
      padding: 16,
    },
  };

  const config = sizeConfig[size];

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, springConfig);
    backgroundColor.value = withSpring(1, springConfig);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, springConfig);
    backgroundColor.value = withSpring(0, springConfig);
  }, []);

  const handlePress = useCallback(async () => {
    if (disabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [disabled, onPress]);

  const handleLongPress = useCallback(async () => {
    if (disabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.();
  }, [disabled, onLongPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getContainerStyle = (): ViewStyle[] => {
    const baseStyles: ViewStyle[] = [
      styles.container,
      { minHeight: config.minHeight, paddingHorizontal: config.padding },
    ];

    switch (variant) {
      case 'card':
        baseStyles.push(styles.containerCard, shadows.sm);
        break;
      case 'minimal':
        baseStyles.push(styles.containerMinimal);
        break;
      default:
        baseStyles.push(styles.containerDefault);
    }

    if (selected) baseStyles.push(styles.containerSelected);
    if (disabled) baseStyles.push(styles.containerDisabled);

    return baseStyles;
  };

  const titleColor = destructive ? colors.danger[500] : colors.gray[900];

  return (
    <AnimatedPressable
      onPress={onPress ? handlePress : undefined}
      onLongPress={onLongPress ? handleLongPress : undefined}
      onPressIn={onPress ? handlePressIn : undefined}
      onPressOut={onPress ? handlePressOut : undefined}
      disabled={disabled}
      style={[...getContainerStyle(), animatedStyle, style]}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, selected }}
      testID={testID}
    >
      {/* Left side */}
      {(leftIcon || leftElement) && (
        <View style={styles.leftContainer}>
          {leftElement || (
            <View
              style={[
                styles.iconContainer,
                {
                  width: config.iconContainerSize,
                  height: config.iconContainerSize,
                  borderRadius: config.iconContainerSize / 2,
                  backgroundColor: leftIconBackground || `${leftIconColor}15`,
                },
              ]}
            >
              <Ionicons
                name={leftIcon!}
                size={config.iconSize}
                color={destructive ? colors.danger[500] : leftIconColor}
              />
            </View>
          )}
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[styles.title, { fontSize: config.titleSize, color: titleColor }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.subtitle, { fontSize: config.subtitleSize }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
        {description && (
          <Text
            style={[styles.description, { fontSize: config.subtitleSize - 1 }]}
            numberOfLines={2}
          >
            {description}
          </Text>
        )}
      </View>

      {/* Right side */}
      {(rightIcon || rightElement || showChevron) && (
        <View style={styles.rightContainer}>
          {rightElement}
          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={config.iconSize}
              color={colors.gray[400]}
            />
          )}
          {showChevron && !rightIcon && !rightElement && (
            <Ionicons
              name="chevron-forward"
              size={config.iconSize}
              color={colors.gray[300]}
            />
          )}
        </View>
      )}
    </AnimatedPressable>
  );
};

/**
 * ListSection - Groups list items with an optional header
 */
interface ListSectionProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ListSection: React.FC<ListSectionProps> = ({
  title,
  children,
  style,
}) => (
  <View style={[styles.section, style]}>
    {title && <Text style={styles.sectionTitle}>{title}</Text>}
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

/**
 * ListDivider - Simple divider between list items
 */
export const ListDivider: React.FC<{ inset?: boolean }> = ({ inset = false }) => (
  <View style={[styles.divider, inset && styles.dividerInset]} />
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  containerDefault: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[100],
  },
  containerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 4,
  },
  containerMinimal: {
    backgroundColor: 'transparent',
  },
  containerSelected: {
    backgroundColor: `${colors.primary[500]}10`,
  },
  containerDisabled: {
    opacity: 0.5,
  },

  leftContainer: {
    marginRight: 12,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    color: colors.gray[900],
  },
  subtitle: {
    color: colors.gray[500],
    marginTop: 2,
  },
  description: {
    color: colors.gray[400],
    marginTop: 4,
    lineHeight: 18,
  },

  rightContainer: {
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Section styles
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray[200],
  },
  dividerInset: {
    marginLeft: 56,
  },
});

export default ListItem;
