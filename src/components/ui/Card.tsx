import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { colors } from '../../theme/colors';
import { shadows, borderRadius } from '../../theme/spacing';

type CardVariant = 'default' | 'outlined' | 'elevated';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  style,
  disabled = false,
}) => {
  const cardStyles: ViewStyle[] = [
    styles.base,
    styles[`variant_${variant}` as keyof typeof styles] as ViewStyle,
    styles[`padding_${padding}` as keyof typeof styles] as ViewStyle,
    disabled && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => (
  <View style={[styles.header, style]}>{children}</View>
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
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => (
  <View style={[styles.footer, style]}>{children}</View>
);

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
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
    ...shadows.md,
  },

  // Padding
  padding_none: {
    padding: 0,
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

  // Subcomponents
  header: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    marginBottom: 12,
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
});

export default Card;
