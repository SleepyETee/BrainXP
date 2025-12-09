// Accessibility Components - Neurodivergent-Friendly UI
// These components help create inclusive experiences for users with:
// - ADHD (reduced motion, focus mode)
// - Autism/sensory processing differences (animation controls)
// - Dyslexia (typography adjustments via settings)
export { 
  AnimatedView, 
  useReducedMotion, 
  useAccessibleAnimation,
  useAccessiblePress,
  AccessiblePressable 
} from './AnimatedView';
export { 
  FocusModeProvider, 
  useFocusMode, 
  FocusModeToggle,
  FocusModeContainer,
  HideInFocusMode,
  ShowInFocusMode,
} from './FocusMode';
