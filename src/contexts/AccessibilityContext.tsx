// filepath: /Users/sleepyet/BrainXP/src/contexts/AccessibilityContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccessibilitySettings {
  // System settings (read-only)
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isBoldTextEnabled: boolean;
  isGrayscaleEnabled: boolean;
  isInvertColorsEnabled: boolean;
  
  // User preferences
  hapticFeedbackEnabled: boolean;
  largeTextEnabled: boolean;
  highContrastEnabled: boolean;
  reducedAnimations: boolean;
  buttonVibration: boolean;
}

interface AccessibilityContextType extends AccessibilitySettings {
  // Actions
  setHapticFeedback: (enabled: boolean) => void;
  setLargeText: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setReducedAnimations: (enabled: boolean) => void;
  setButtonVibration: (enabled: boolean) => void;
  // Helpers
  getAnimationDuration: (baseDuration: number) => number;
  getFontScale: () => number;
  announceForAccessibility: (message: string) => void;
}

const defaultSettings: AccessibilitySettings = {
  isScreenReaderEnabled: false,
  isReduceMotionEnabled: false,
  isBoldTextEnabled: false,
  isGrayscaleEnabled: false,
  isInvertColorsEnabled: false,
  hapticFeedbackEnabled: true,
  largeTextEnabled: false,
  highContrastEnabled: false,
  reducedAnimations: false,
  buttonVibration: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const STORAGE_KEY = '@brainxp_accessibility_settings';

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  // Load saved preferences
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings(prev => ({ ...prev, ...parsed }));
        }
      } catch (error) {
        console.warn('Failed to load accessibility settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Save preferences when they change
  const saveSettings = useCallback(async (newSettings: Partial<AccessibilitySettings>) => {
    try {
      const userPrefs = {
        hapticFeedbackEnabled: newSettings.hapticFeedbackEnabled ?? settings.hapticFeedbackEnabled,
        largeTextEnabled: newSettings.largeTextEnabled ?? settings.largeTextEnabled,
        highContrastEnabled: newSettings.highContrastEnabled ?? settings.highContrastEnabled,
        reducedAnimations: newSettings.reducedAnimations ?? settings.reducedAnimations,
        buttonVibration: newSettings.buttonVibration ?? settings.buttonVibration,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userPrefs));
    } catch (error) {
      console.warn('Failed to save accessibility settings:', error);
    }
  }, [settings]);

  // Listen to system accessibility settings
  useEffect(() => {
    const listeners: (() => void)[] = [];

    // Screen reader
    AccessibilityInfo.isScreenReaderEnabled().then(enabled => {
      setSettings(prev => ({ ...prev, isScreenReaderEnabled: enabled }));
    });
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      enabled => setSettings(prev => ({ ...prev, isScreenReaderEnabled: enabled }))
    );
    listeners.push(() => screenReaderListener.remove());

    // Reduce motion
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      setSettings(prev => ({ 
        ...prev, 
        isReduceMotionEnabled: enabled,
        reducedAnimations: enabled, // Sync with user pref
      }));
    });
    const reduceMotionListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      enabled => setSettings(prev => ({ 
        ...prev, 
        isReduceMotionEnabled: enabled,
        reducedAnimations: enabled,
      }))
    );
    listeners.push(() => reduceMotionListener.remove());

    // Bold text (iOS only)
    if (Platform.OS === 'ios') {
      AccessibilityInfo.isBoldTextEnabled().then(enabled => {
        setSettings(prev => ({ ...prev, isBoldTextEnabled: enabled }));
      });
      const boldTextListener = AccessibilityInfo.addEventListener(
        'boldTextChanged',
        enabled => setSettings(prev => ({ ...prev, isBoldTextEnabled: enabled }))
      );
      listeners.push(() => boldTextListener.remove());

      // Grayscale
      AccessibilityInfo.isGrayscaleEnabled().then(enabled => {
        setSettings(prev => ({ ...prev, isGrayscaleEnabled: enabled }));
      });
      const grayscaleListener = AccessibilityInfo.addEventListener(
        'grayscaleChanged',
        enabled => setSettings(prev => ({ ...prev, isGrayscaleEnabled: enabled }))
      );
      listeners.push(() => grayscaleListener.remove());

      // Invert colors
      AccessibilityInfo.isInvertColorsEnabled().then(enabled => {
        setSettings(prev => ({ ...prev, isInvertColorsEnabled: enabled }));
      });
      const invertListener = AccessibilityInfo.addEventListener(
        'invertColorsChanged',
        enabled => setSettings(prev => ({ ...prev, isInvertColorsEnabled: enabled }))
      );
      listeners.push(() => invertListener.remove());
    }

    return () => {
      listeners.forEach(remove => remove());
    };
  }, []);

  // User preference setters
  const setHapticFeedback = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, hapticFeedbackEnabled: enabled }));
    saveSettings({ hapticFeedbackEnabled: enabled });
  }, [saveSettings]);

  const setLargeText = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, largeTextEnabled: enabled }));
    saveSettings({ largeTextEnabled: enabled });
  }, [saveSettings]);

  const setHighContrast = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, highContrastEnabled: enabled }));
    saveSettings({ highContrastEnabled: enabled });
  }, [saveSettings]);

  const setReducedAnimations = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, reducedAnimations: enabled }));
    saveSettings({ reducedAnimations: enabled });
  }, [saveSettings]);

  const setButtonVibration = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, buttonVibration: enabled }));
    saveSettings({ buttonVibration: enabled });
  }, [saveSettings]);

  // Helper functions
  const getAnimationDuration = useCallback((baseDuration: number): number => {
    if (settings.reducedAnimations || settings.isReduceMotionEnabled) {
      return 0; // No animation
    }
    return baseDuration;
  }, [settings.reducedAnimations, settings.isReduceMotionEnabled]);

  const getFontScale = useCallback((): number => {
    if (settings.largeTextEnabled) {
      return 1.2;
    }
    return 1;
  }, [settings.largeTextEnabled]);

  const announceForAccessibility = useCallback((message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  const value: AccessibilityContextType = {
    ...settings,
    setHapticFeedback,
    setLargeText,
    setHighContrast,
    setReducedAnimations,
    setButtonVibration,
    getAnimationDuration,
    getFontScale,
    announceForAccessibility,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

/**
 * Hook to conditionally apply haptic feedback based on user preferences
 */
export const useHaptics = () => {
  const { hapticFeedbackEnabled, buttonVibration } = useAccessibility();
  
  return {
    isEnabled: hapticFeedbackEnabled,
    canVibrate: buttonVibration,
  };
};

export default AccessibilityContext;
