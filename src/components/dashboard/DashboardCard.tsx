import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';

type DashboardCardTone = 'default' | 'muted';

type DashboardCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
  borderRadius?: number;
  tone?: DashboardCardTone;
  animated?: boolean;
  animationDelay?: number;
  accessible?: boolean;
  accessibilityRole?: 'button' | 'none';
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DashboardCard({
  children,
  style,
  onPress,
  padding = 14,
  borderRadius = 16,
  tone = 'default',
  animated = true,
  animationDelay = 0,
  accessible = true,
  accessibilityRole = onPress ? 'button' : 'none',
  accessibilityLabel,
  accessibilityHint,
}: DashboardCardProps) {
  const theme = useTheme();
  const reduceMotion = useSettingsStore((s) => s.settings.reduceMotion);

  const backgroundColor =
    tone === 'muted' ? theme.background.secondary : theme.background.card;

  const cardStyle: ViewStyle = {
    backgroundColor,
    borderColor: theme.border,
    borderRadius,
    padding,
  };

  const shadowStyle = theme.isDark ? undefined : styles.shadow;

  const content = (
    <View style={[styles.inner, cardStyle, shadowStyle, style]}>{children}</View>
  );

  if (!onPress) {
    return (
      <Animated.View
        entering={!reduceMotion && animated ? FadeInDown.delay(animationDelay).springify() : undefined}
      >
        {content}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={!reduceMotion && animated ? FadeInDown.delay(animationDelay).springify() : undefined}
    >
      <AnimatedPressable
        onPress={onPress}
        accessible={accessible}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {content}
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inner: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
});
