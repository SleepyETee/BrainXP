import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

interface ConfettiProps {
  visible: boolean;
  onComplete?: () => void;
  colors?: string[];
  particleCount?: number;
}

const { width, height } = Dimensions.get('window');

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
];

const ConfettiParticle: React.FC<{
  delay: number;
  startX: number;
  color: string;
}> = ({ delay, startX, color }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animations = Animated.parallel([
      Animated.timing(translateY, {
        toValue: height + 100,
        duration: 3000 + Math.random() * 1000,
        delay,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: (Math.random() - 0.5) * 200,
          duration: 1500,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: (Math.random() - 0.5) * 100,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rotate, {
        toValue: Math.random() * 10,
        duration: 3000 + Math.random() * 1000,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1000,
        delay: delay + 2000,
        useNativeDriver: true,
      }),
    ]);

    animations.start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 10],
    outputRange: ['0deg', '3600deg'],
  });

  const size = 8 + Math.random() * 8;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: Math.random() > 0.5 ? size / 2 : 0,
          opacity,
          transform: [
            { translateY },
            { translateX },
            { rotate: spin },
          ],
        },
      ]}
    />
  );
};

export const Confetti: React.FC<ConfettiProps> = ({
  visible,
  onComplete,
  colors = DEFAULT_COLORS,
  particleCount = 50,
}) => {
  useEffect(() => {
    if (visible && onComplete) {
      const timeout = setTimeout(onComplete, 4000);
      return () => clearTimeout(timeout);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    delay: Math.random() * 500,
    startX: Math.random() * width,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <ConfettiParticle
          key={particle.id}
          delay={particle.delay}
          startX={particle.startX}
          color={particle.color}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    top: 0,
  },
});

export default Confetti;

