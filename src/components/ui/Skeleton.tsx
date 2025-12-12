import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Dimensions, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Skeleton loading placeholder
 * Improves perceived performance by showing content structure while loading
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius,
  style,
  variant = 'text',
  animation = 'wave',
}) => {
  const shimmerPosition = useSharedValue(-1);
  const pulseOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (animation === 'wave') {
      shimmerPosition.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.ease }),
        -1,
        false
      );
    } else if (animation === 'pulse') {
      pulseOpacity.value = withRepeat(
        withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [animation]);

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'circular':
        return {
          borderRadius: typeof height === 'number' ? height / 2 : 50,
          width: height,
          height: height,
        };
      case 'rectangular':
        return { borderRadius: 0 };
      case 'rounded':
        return { borderRadius: 12 };
      case 'text':
      default:
        return { borderRadius: 4 };
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    if (animation === 'pulse') {
      return { opacity: pulseOpacity.value };
    }
    return { opacity: 1 };
  });

  const shimmerStyle = useAnimatedStyle(() => {
    if (animation !== 'wave') return { opacity: 0 };
    
    const translateX = interpolate(
      shimmerPosition.value,
      [-1, 1],
      [-SCREEN_WIDTH, SCREEN_WIDTH]
    );
    
    return {
      transform: [{ translateX }],
    };
  });

  const computedBorderRadius = borderRadius ?? getVariantStyles().borderRadius;

  return (
    <Animated.View
      style={[
        styles.skeleton,
        getVariantStyles(),
        {
          width: width as DimensionValue,
          height,
          borderRadius: computedBorderRadius as number,
        },
        animatedStyle,
        style,
      ]}
    >
      {animation === 'wave' && (
        <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
          <LinearGradient
            colors={[
              'transparent',
              'rgba(255,255,255,0.4)',
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmer}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
};

/**
 * Pre-built skeleton layouts for common UI patterns
 */

// Card skeleton
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.card, style]}>
    <View style={styles.cardHeader}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.cardHeaderText}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
      </View>
    </View>
    <Skeleton width="100%" height={12} style={{ marginTop: 16 }} />
    <Skeleton width="80%" height={12} style={{ marginTop: 8 }} />
  </View>
);

// List item skeleton
export const SkeletonListItem: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.listItem, style]}>
    <Skeleton width={40} height={40} borderRadius={20} />
    <View style={styles.listItemContent}>
      <Skeleton width="70%" height={14} />
      <Skeleton width="50%" height={12} style={{ marginTop: 6 }} />
    </View>
    <Skeleton width={24} height={24} borderRadius={12} />
  </View>
);

// Avatar skeleton
export const SkeletonAvatar: React.FC<{ size?: number; style?: ViewStyle }> = ({ 
  size = 48, 
  style 
}) => (
  <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />
);

// Text line skeleton
export const SkeletonText: React.FC<{ 
  lines?: number; 
  style?: ViewStyle;
  lastLineWidth?: DimensionValue;
}> = ({ 
  lines = 3, 
  style,
  lastLineWidth = '60%',
}) => (
  <View style={style}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        width={index === lines - 1 ? lastLineWidth : '100%'}
        height={14}
        style={index > 0 ? { marginTop: 8 } : undefined}
      />
    ))}
  </View>
);

// Button skeleton
export const SkeletonButton: React.FC<{ 
  width?: DimensionValue;
  style?: ViewStyle;
}> = ({ 
  width = 120,
  style,
}) => (
  <Skeleton width={width} height={48} borderRadius={12} style={style} />
);

// Image skeleton
export const SkeletonImage: React.FC<{ 
  width?: DimensionValue;
  height?: number;
  style?: ViewStyle;
}> = ({ 
  width = '100%',
  height = 200,
  style,
}) => (
  <Skeleton width={width} height={height} borderRadius={12} style={style} />
);

// Full screen skeleton (for loading states)
export const SkeletonScreen: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.screen, style]}>
    {/* Header */}
    <View style={styles.screenHeader}>
      <Skeleton width={32} height={32} borderRadius={16} />
      <Skeleton width={150} height={24} style={{ marginLeft: 16 }} />
    </View>

    {/* Content */}
    <SkeletonCard style={{ marginTop: 24 }} />
    
    <View style={{ marginTop: 24 }}>
      <Skeleton width={120} height={18} style={{ marginBottom: 16 }} />
      <SkeletonListItem />
      <SkeletonListItem style={{ marginTop: 12 }} />
      <SkeletonListItem style={{ marginTop: 12 }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.gray[200],
    overflow: 'hidden',
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmer: {
    flex: 1,
    width: '50%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  listItemContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  screen: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.gray[50],
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default Skeleton;
