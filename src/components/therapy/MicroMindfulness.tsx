import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useTherapyStore } from '../../stores/therapyStore';
import { MindfulnessTrigger, THERAPY_DISCLAIMER } from '../../types/therapy';
import * as Haptics from 'expo-haptics';

interface MicroMindfulnessProps {
  breaths?: number;
  trigger: MindfulnessTrigger;
  contextTaskId?: string;
  onComplete: () => void;
  onSkip?: () => void;
  compact?: boolean;
}

const BREATH_CYCLE = {
  inhale: 4000,
  hold: 1000,
  exhale: 4000,
};

export const MicroMindfulness: React.FC<MicroMindfulnessProps> = ({
  breaths = 3,
  trigger,
  contextTaskId,
  onComplete,
  onSkip,
  compact = false,
}) => {
  const [phase, setPhase] = useState<'ready' | 'breathing' | 'complete'>('ready');
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [currentBreath, setCurrentBreath] = useState(0);
  
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;
  
  const startSession = useTherapyStore((state) => state.startSession);
  const completeSession = useTherapyStore((state) => state.completeSession);
  const activeSession = useTherapyStore((state) => state.activeSession);
  
  useEffect(() => {
    if (phase !== 'breathing') return;
    
    let isMounted = true;
    
    const runBreathCycle = async () => {
      for (let i = 0; i < breaths && isMounted; i++) {
        setCurrentBreath(i + 1);
        
        // Inhale
        setBreathPhase('inhale');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.4,
            duration: BREATH_CYCLE.inhale,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: BREATH_CYCLE.inhale,
            useNativeDriver: true,
          }),
        ]).start();
        
        await new Promise(resolve => setTimeout(resolve, BREATH_CYCLE.inhale));
        if (!isMounted) return;
        
        // Hold
        setBreathPhase('hold');
        await new Promise(resolve => setTimeout(resolve, BREATH_CYCLE.hold));
        if (!isMounted) return;
        
        // Exhale
        setBreathPhase('exhale');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: BREATH_CYCLE.exhale,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: BREATH_CYCLE.exhale,
            useNativeDriver: true,
          }),
        ]).start();
        
        await new Promise(resolve => setTimeout(resolve, BREATH_CYCLE.exhale));
        if (!isMounted) return;
      }
      
      if (isMounted) {
        setPhase('complete');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        if (activeSession) {
          completeSession(activeSession.id);
        }
        
        // Auto-complete after a moment
        setTimeout(() => {
          if (isMounted) onComplete();
        }, 1500);
      }
    };
    
    runBreathCycle();
    
    return () => {
      isMounted = false;
    };
  }, [phase]);
  
  const handleStart = () => {
    startSession('mindful_breathing', trigger, contextTaskId);
    setPhase('breathing');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {phase === 'ready' && (
          <TouchableOpacity style={styles.compactButton} onPress={handleStart}>
            <Text style={styles.compactEmoji}>🧘</Text>
            <Text style={styles.compactText}>Take 3 mindful breaths</Text>
          </TouchableOpacity>
        )}
        
        {phase === 'breathing' && (
          <View style={styles.compactBreathing}>
            <Animated.View
              style={[
                styles.compactCircle,
                {
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            />
            <Text style={styles.compactPhaseText}>
              {breathPhase === 'inhale' && 'Breathe in...'}
              {breathPhase === 'hold' && 'Hold...'}
              {breathPhase === 'exhale' && 'Breathe out...'}
            </Text>
          </View>
        )}
        
        {phase === 'complete' && (
          <View style={styles.compactComplete}>
            <Text style={styles.compactEmoji}>✨</Text>
            <Text style={styles.compactText}>Better?</Text>
          </View>
        )}
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {phase === 'ready' && (
        <View style={styles.readyContainer}>
          <Text style={styles.readyEmoji}>🧘</Text>
          <Text style={styles.readyTitle}>Take a breath</Text>
          <Text style={styles.readyText}>
            Let's pause for {breaths} mindful breaths.
            {'\n'}This takes about {Math.ceil((BREATH_CYCLE.inhale + BREATH_CYCLE.hold + BREATH_CYCLE.exhale) * breaths / 1000)} seconds.
          </Text>
          
          <View style={styles.buttonRow}>
            {onSkip && (
              <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipButtonText}>Not now</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Text style={styles.startButtonText}>Begin</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {phase === 'breathing' && (
        <View style={styles.breathingContainer}>
          <View style={styles.circleContainer}>
            <Animated.View
              style={[
                styles.breathCircle,
                {
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            />
            <View style={styles.innerContent}>
              <Text style={styles.phaseText}>
                {breathPhase === 'inhale' && 'Breathe in'}
                {breathPhase === 'hold' && 'Hold'}
                {breathPhase === 'exhale' && 'Breathe out'}
              </Text>
              <Text style={styles.breathCount}>
                {currentBreath} of {breaths}
              </Text>
            </View>
          </View>
          
          <Text style={styles.instruction}>
            Follow the circle with your breath
          </Text>
        </View>
      )}
      
      {phase === 'complete' && (
        <View style={styles.completeContainer}>
          <Text style={styles.completeEmoji}>✨</Text>
          <Text style={styles.completeTitle}>Nice</Text>
          <Text style={styles.completeText}>
            You just did something good for yourself.
          </Text>
        </View>
      )}
      
      <Text style={styles.disclaimer}>{THERAPY_DISCLAIMER.mindfulness}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    justifyContent: 'center',
  },
  
  // Ready phase
  readyContainer: {
    alignItems: 'center',
  },
  readyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  readyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
  },
  readyText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 16,
    color: colors.gray[500],
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Breathing phase
  breathingContainer: {
    alignItems: 'center',
  },
  circleContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  breathCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primary[400],
  },
  innerContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  phaseText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  breathCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  instruction: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
  },
  
  // Complete phase
  completeContainer: {
    alignItems: 'center',
  },
  completeEmoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
  },
  completeText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
  },
  
  // Compact mode
  compactContainer: {
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    overflow: 'hidden',
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  compactEmoji: {
    fontSize: 24,
  },
  compactText: {
    fontSize: 15,
    color: colors.primary[700],
    fontWeight: '500',
  },
  compactBreathing: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  compactCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[400],
  },
  compactPhaseText: {
    fontSize: 15,
    color: colors.primary[700],
    fontWeight: '500',
  },
  compactComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  
  disclaimer: {
    fontSize: 11,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 24,
  },
});

export default MicroMindfulness;
