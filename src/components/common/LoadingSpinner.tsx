import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../../theme/colors';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  message?: string;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = colors.primary[500],
  message,
  overlay = false,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sizeConfig = {
    sm: { spinner: 24, border: 2, fontSize: 12 },
    md: { spinner: 40, border: 3, fontSize: 14 },
    lg: { spinner: 64, border: 4, fontSize: 16 },
  };

  const config = sizeConfig[size];

  const content = (
    <View style={styles.content}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: config.spinner,
            height: config.spinner,
            borderWidth: config.border,
            borderColor: `${color}30`,
            borderTopColor: color,
            transform: [{ rotate: spin }],
          },
        ]}
      />
      {message && (
        <Text style={[styles.message, { fontSize: config.fontSize }]}>
          {message}
        </Text>
      )}
    </View>
  );

  if (overlay) {
    return (
      <View style={styles.overlay}>
        <View style={styles.overlayContent}>{content}</View>
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  spinner: {
    borderRadius: 100,
  },
  message: {
    marginTop: 12,
    color: colors.gray[600],
    fontWeight: '500',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default LoadingSpinner;

