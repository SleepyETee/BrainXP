// Focus Mode - Minimal UI for Reduced Cognitive Load
// Research: Neurodivergent users benefit from distraction-free interfaces
import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { colors, shadows } from '../../theme/colors';
import { useSettingsStore } from '../../stores/settingsStore';
import * as Haptics from 'expo-haptics';

interface FocusModeContextType {
  isEnabled: boolean;
  toggle: () => void;
  enable: () => void;
  disable: () => void;
}

const FocusModeContext = createContext<FocusModeContextType>({
  isEnabled: false,
  toggle: () => {},
  enable: () => {},
  disable: () => {},
});

/**
 * FocusModeProvider - Context provider for app-wide focus mode
 * 
 * When enabled:
 * - Reduces visual complexity
 * - Hides non-essential UI elements
 * - Minimizes animations
 * - Increases whitespace
 * - Uses calmer color palette
 */
export const FocusModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);

  const toggle = useCallback(async () => {
    if (!reduceMotion) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsEnabled((prev) => !prev);
  }, [reduceMotion]);

  const enable = useCallback(() => setIsEnabled(true), []);
  const disable = useCallback(() => setIsEnabled(false), []);

  return (
    <FocusModeContext.Provider value={{ isEnabled, toggle, enable, disable }}>
      {children}
    </FocusModeContext.Provider>
  );
};

/**
 * useFocusMode - Hook to access focus mode state
 */
export const useFocusMode = () => useContext(FocusModeContext);

/**
 * FocusModeToggle - UI component to toggle focus mode
 */
interface FocusModeToggleProps {
  variant?: 'switch' | 'button' | 'compact';
  showLabel?: boolean;
  onToggle?: (enabled: boolean) => void;
}

export const FocusModeToggle: React.FC<FocusModeToggleProps> = ({
  variant = 'switch',
  showLabel = true,
  onToggle,
}) => {
  const { isEnabled, toggle } = useFocusMode();
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);

  const handleToggle = useCallback(async () => {
    if (!reduceMotion) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggle();
    onToggle?.(!isEnabled);
  }, [toggle, isEnabled, onToggle, reduceMotion]);

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[styles.compactButton, isEnabled && styles.compactButtonActive]}
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityRole="switch"
        accessibilityState={{ checked: isEnabled }}
        accessibilityLabel="Focus Mode"
        accessibilityHint="Enables a distraction-free interface"
      >
        <Text style={styles.compactIcon}>{isEnabled ? '🎯' : '👁️'}</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'button') {
    return (
      <TouchableOpacity
        style={[styles.button, isEnabled && styles.buttonActive]}
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityRole="switch"
        accessibilityState={{ checked: isEnabled }}
        accessibilityLabel="Focus Mode"
        accessibilityHint="Enables a distraction-free interface"
      >
        <Text style={styles.buttonIcon}>🎯</Text>
        {showLabel && (
          <Text style={[styles.buttonText, isEnabled && styles.buttonTextActive]}>
            Focus Mode
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  // Default: switch variant
  return (
    <View style={styles.switchContainer}>
      <View style={styles.switchLabelContainer}>
        <Text style={styles.switchIcon}>🎯</Text>
        <View>
          <Text style={styles.switchLabel}>Focus Mode</Text>
          <Text style={styles.switchDescription}>
            Minimal UI for better concentration
          </Text>
        </View>
      </View>
      <Switch
        value={isEnabled}
        onValueChange={handleToggle}
        trackColor={{
          false: colors.gray[200],
          true: colors.primary[400],
        }}
        thumbColor={isEnabled ? colors.primary[600] : colors.gray[50]}
        ios_backgroundColor={colors.gray[200]}
        accessibilityLabel="Focus Mode toggle"
        accessibilityHint="Enables a distraction-free interface"
      />
    </View>
  );
};

/**
 * FocusModeContainer - Wrapper that adjusts styling based on focus mode
 */
interface FocusModeContainerProps {
  children: React.ReactNode;
  style?: any;
  focusStyle?: any;
}

export const FocusModeContainer: React.FC<FocusModeContainerProps> = ({
  children,
  style,
  focusStyle,
}) => {
  const { isEnabled } = useFocusMode();

  return (
    <View style={[style, isEnabled && focusStyle, isEnabled && styles.focusModeBase]}>
      {children}
    </View>
  );
};

/**
 * HideInFocusMode - Hides children when focus mode is enabled
 */
export const HideInFocusMode: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isEnabled } = useFocusMode();
  if (isEnabled) return null;
  return <>{children}</>;
};

/**
 * ShowInFocusMode - Shows children only when focus mode is enabled
 */
export const ShowInFocusMode: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isEnabled } = useFocusMode();
  if (!isEnabled) return null;
  return <>{children}</>;
};

const styles = StyleSheet.create({
  // Switch variant
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...shadows.sm,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
  },
  switchDescription: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },

  // Button variant
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: colors.gray[100],
    borderRadius: 24,
    gap: 8,
  },
  buttonActive: {
    backgroundColor: colors.primary[500],
  },
  buttonIcon: {
    fontSize: 18,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[700],
  },
  buttonTextActive: {
    color: '#FFFFFF',
  },

  // Compact variant
  compactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactButtonActive: {
    backgroundColor: colors.primary[500],
  },
  compactIcon: {
    fontSize: 20,
  },

  // Focus mode base styles
  focusModeBase: {
    // Increased spacing for breathing room
    // Calmer background
  },
});

export default FocusModeToggle;
