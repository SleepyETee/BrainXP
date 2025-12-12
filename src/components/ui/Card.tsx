import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
  TouchableOpacityProps,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { shadows, borderRadius } from '../../theme/spacing';

type CardVariant = 'default' | 'outlined' | 'elevated' | 'glass' | 'gradient';
type CardPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  animated?: boolean;
  animationDelay?: number;
  haptic?: boolean;
  gradientColors?: [string, string];
  borderColor?: string;
  accentColor?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const springConfig = {
  damping: 15,
  stiffness: 400,
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  onLongPress,
  style,
  disabled = false,
  animated = true,
  animationDelay = 0,
  haptic = true,
  gradientColors,
  borderColor,
  accentColor,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    if (onPress || onLongPress) {
      scale.value = withSpring(0.98, springConfig);
      opacity.value = withTiming(0.95, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
    opacity.value = withTiming(1, { duration: 150 });
  };

  const handlePress = async () => {
    if (haptic && onPress) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const handleLongPress = async () => {
    if (haptic && onLongPress) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onLongPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const cardStyles: ViewStyle[] = [
    styles.base,
    styles[`variant_${variant}` as keyof typeof styles] as ViewStyle,
    styles[`padding_${padding}` as keyof typeof styles] as ViewStyle,
    borderColor && { borderColor, borderWidth: 1 },
    disabled && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const content = (
    <>
      {accentColor && (
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      )}
      {children}
    </>
  );

  // Gradient variant
  if (variant === 'gradient') {
    const gradientColorValues = gradientColors || [colors.primary[500], colors.primary[600]];
    return (
      <AnimatedPressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || (!onPress && !onLongPress)}
        style={[animatedStyle]}
      >
        <Animated.View
          entering={animated ? FadeInDown.delay(animationDelay).springify() : undefined}
        >
          <LinearGradient
            colors={gradientColorValues}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[cardStyles, styles.gradientCard]}
          >
            {content}
          </LinearGradient>
        </Animated.View>
      </AnimatedPressable>
    );
  }

  // Interactive card
  if (onPress || onLongPress) {
    return (
      <Animated.View
        entering={animated ? FadeInDown.delay(animationDelay).springify() : undefined}
      >
        <AnimatedPressable
          style={[cardStyles, animatedStyle]}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
        >
          {content}
        </AnimatedPressable>
      </Animated.View>
    );
  }

  // Static card
  return (
    <Animated.View
      entering={animated ? FadeInDown.delay(animationDelay).springify() : undefined}
      style={cardStyles}
    >
      {content}
    </Animated.View>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noBorder?: boolean;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style, noBorder = false }) => (
  <View style={[styles.header, noBorder && styles.headerNoBorder, style]}>{children}</View>
);

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => (
  <View style={[styles.content, style]}>{children}</View>
);

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noBorder?: boolean;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, style, noBorder = false }) => (
  <View style={[styles.footer, noBorder && styles.footerNoBorder, style]}>{children}</View>
);

// Feature Card - for highlighting features or options
interface FeatureCardProps {
  icon: string;
  title: string;
  description?: string;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  onPress,
  selected = false,
  disabled = false,
}) => (
  <Card
    variant={selected ? 'elevated' : 'outlined'}
    padding="md"
    onPress={onPress}
    disabled={disabled}
    borderColor={selected ? colors.primary[500] : undefined}
    style={selected ? styles.selectedCard : undefined}
  >
    <View style={styles.featureContent}>
      <View style={[styles.featureIcon, selected && styles.featureIconSelected]}>
        <Animated.Text style={styles.featureIconText}>{icon}</Animated.Text>
      </View>
      <View style={styles.featureText}>
        <Animated.Text style={[styles.featureTitle, selected && styles.featureTitleSelected]}>
          {title}
        </Animated.Text>
        {description && (
          <Animated.Text style={styles.featureDescription}>{description}</Animated.Text>
        )}
      </View>
      {selected && (
        <Animated.View entering={FadeIn} style={styles.checkmark}>
          <Animated.Text style={styles.checkmarkText}>✓</Animated.Text>
        </Animated.View>
      )}
    </View>
  </Card>
);

// Stat Card - for displaying metrics
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendValue,
  color = colors.primary[500],
}) => (
  <Card variant="elevated" padding="md">
    <View style={styles.statContent}>
      {icon && (
        <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
          <Animated.Text>{icon}</Animated.Text>
        </View>
      )}
      <Animated.Text style={styles.statLabel}>{label}</Animated.Text>
      <Animated.Text style={[styles.statValue, { color }]}>{value}</Animated.Text>
      {trend && trendValue && (
        <View style={[styles.trendBadge, styles[`trend_${trend}` as keyof typeof styles] as ViewStyle]}>
          <Animated.Text style={styles.trendText}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </Animated.Text>
        </View>
      )}
    </View>
  </Card>
);

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
  gradientCard: {
    overflow: 'hidden',
  },
  selectedCard: {
    backgroundColor: colors.primary[50],
  },

  // Variants
  variant_default: {
    ...shadows.sm,
  },
  variant_outlined: {
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  variant_elevated: {
    ...shadows.lg,
  },
  variant_glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  variant_gradient: {
    // Handled by LinearGradient
  },

  // Padding
  padding_none: {
    padding: 0,
  },
  padding_xs: {
    padding: 8,
  },
  padding_sm: {
    padding: 12,
  },
  padding_md: {
    padding: 16,
  },
  padding_lg: {
    padding: 24,
  },
  padding_xl: {
    padding: 32,
  },

  // Subcomponents
  header: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    marginBottom: 12,
  },
  headerNoBorder: {
    borderBottomWidth: 0,
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    marginTop: 12,
  },
  footerNoBorder: {
    borderTopWidth: 0,
    marginTop: 8,
  },

  // Feature Card styles
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconSelected: {
    backgroundColor: colors.primary[100],
  },
  featureIconText: {
    fontSize: 20,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
  },
  featureTitleSelected: {
    color: colors.primary[700],
  },
  featureDescription: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Stat Card styles
  statContent: {
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.gray[500],
    fontWeight: '500',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trend_up: {
    backgroundColor: colors.success[100],
  },
  trend_down: {
    backgroundColor: colors.danger[100],
  },
  trend_neutral: {
    backgroundColor: colors.gray[100],
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
  },
});

export default Card;
