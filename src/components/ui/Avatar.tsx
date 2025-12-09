import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { colors } from '../../theme/colors';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: string;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const fontSizeMap: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 20,
  xl: 28,
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getColorFromName = (name: string): string => {
  const colorOptions = [
    colors.primary[500],
    colors.secondary[500],
    colors.success[500],
    colors.warning[500],
    colors.danger[500],
    '#EC4899', // pink
    '#8B5CF6', // violet
    '#06B6D4', // cyan
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colorOptions[Math.abs(hash) % colorOptions.length];
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name = '',
  size = 'md',
  style,
}) => {
  const dimension = sizeMap[size];
  const fontSize = fontSizeMap[size];

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
  };

  if (source) {
    const imageStyle: ImageStyle = {
      ...styles.image,
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
      ...(style as ImageStyle),
    };
    return (
      <Image
        source={{ uri: source }}
        style={imageStyle}
      />
    );
  }

  const backgroundColor = name ? getColorFromName(name) : colors.gray[400];
  const initials = name ? getInitials(name) : '?';

  return (
    <View
      style={[
        styles.placeholder,
        containerStyle,
        { backgroundColor },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
};

interface AvatarGroupProps {
  avatars: Array<{ source?: string; name?: string }>;
  size?: AvatarSize;
  max?: number;
  style?: ViewStyle;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  size = 'md',
  max = 4,
  style,
}) => {
  const dimension = sizeMap[size];
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <View style={[styles.group, style]}>
      {visibleAvatars.map((avatar, index) => (
        <View
          key={index}
          style={[
            styles.groupItem,
            { marginLeft: index > 0 ? -dimension * 0.3 : 0, zIndex: visibleAvatars.length - index },
          ]}
        >
          <Avatar
            source={avatar.source}
            name={avatar.name}
            size={size}
            style={styles.groupAvatar}
          />
        </View>
      ))}
      {remainingCount > 0 && (
        <View
          style={[
            styles.groupItem,
            styles.remainingBadge,
            {
              marginLeft: -dimension * 0.3,
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
        >
          <Text style={[styles.remainingText, { fontSize: fontSizeMap[size] }]}>
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.gray[200],
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupItem: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 100,
  },
  groupAvatar: {
    borderWidth: 0,
  },
  remainingBadge: {
    backgroundColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingText: {
    color: colors.gray[700],
    fontWeight: '600',
  },
});

export default Avatar;
