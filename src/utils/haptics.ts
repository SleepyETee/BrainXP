import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Trigger light haptic feedback
 */
export async function lightHaptic(): Promise<void> {
  const { settings } = useSettingsStore.getState();
  if (!settings.hapticFeedback) return;

  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Trigger medium haptic feedback
 */
export async function mediumHaptic(): Promise<void> {
  const { settings } = useSettingsStore.getState();
  if (!settings.hapticFeedback) return;

  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Trigger heavy haptic feedback
 */
export async function heavyHaptic(): Promise<void> {
  const { settings } = useSettingsStore.getState();
  if (!settings.hapticFeedback) return;

  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Trigger success notification haptic
 */
export async function successHaptic(): Promise<void> {
  const { settings } = useSettingsStore.getState();
  if (!settings.hapticFeedback) return;

  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * Trigger warning notification haptic
 */
export async function warningHaptic(): Promise<void> {
  const { settings } = useSettingsStore.getState();
  if (!settings.hapticFeedback) return;

  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/**
 * Trigger error notification haptic
 */
export async function errorHaptic(): Promise<void> {
  const { settings } = useSettingsStore.getState();
  if (!settings.hapticFeedback) return;

  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/**
 * Trigger selection changed haptic
 */
export async function selectionHaptic(): Promise<void> {
  const { settings } = useSettingsStore.getState();
  if (!settings.hapticFeedback) return;

  await Haptics.selectionAsync();
}

/**
 * Haptic feedback for different actions
 */
export const hapticFeedback = {
  light: lightHaptic,
  medium: mediumHaptic,
  heavy: heavyHaptic,
  success: successHaptic,
  warning: warningHaptic,
  error: errorHaptic,
  selection: selectionHaptic,

  // Action-specific haptics
  taskComplete: successHaptic,
  taskCreate: lightHaptic,
  taskDelete: mediumHaptic,
  buttonPress: lightHaptic,
  toggle: selectionHaptic,
  timerComplete: successHaptic,
  levelUp: heavyHaptic,
  badgeUnlock: successHaptic,
  swipe: lightHaptic,
  error: errorHaptic,
} as const;
