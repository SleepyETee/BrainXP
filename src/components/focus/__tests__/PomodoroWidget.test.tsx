import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { PomodoroWidget } from '../PomodoroWidget';

// Mock dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));

jest.mock('react-native/Libraries/AccessibilityInfo/AccessibilityInfo', () => ({
  isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  announceForAccessibility: jest.fn(),
}));

jest.mock('../../../stores/settingsStore', () => ({
  useSettingsStore: jest.fn((selector) => {
    const state = {
      settings: {
        reduceMotion: false,
        hapticFeedback: true,
        largeText: false,
      },
    };
    return selector(state);
  }),
}));

jest.mock('../../../theme', () => ({
  useTheme: () => ({
    background: { card: '#fff', secondary: '#f5f5f5', primary: '#fff' },
    text: { primary: '#000', secondary: '#666', muted: '#999' },
    palette: {
      primary: { 50: '#e3f2fd', 400: '#42a5f5', 500: '#2196f3', 600: '#1e88e5', 700: '#1976d2' },
      gray: { 200: '#eee', 400: '#bbb' },
      success: { 50: '#e8f5e9', 500: '#4caf50', 600: '#43a047', 700: '#388e3c' },
      warning: { 500: '#ff9800' },
      danger: { 500: '#f44336' },
    },
    border: '#ddd',
  }),
  spacing: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20 },
  borderRadius: { lg: 12, xl: 16, full: 999 },
}));

jest.mock('../../../theme/colors', () => ({
  colors: {
    primary: { 50: '#e3f2fd', 400: '#42a5f5', 500: '#2196f3', 600: '#1e88e5', 700: '#1976d2' },
    gray: { 200: '#eee', 400: '#bbb' },
    success: { 50: '#e8f5e9', 500: '#4caf50', 600: '#43a047', 700: '#388e3c' },
    warning: { 500: '#ff9800' },
  },
}));

describe('PomodoroWidget', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly with default props', () => {
    const { getByText, getByRole } = render(<PomodoroWidget />);
    
    expect(getByText('🍅 Pomodoro')).toBeTruthy();
    expect(getByText('25:00')).toBeTruthy();
    expect(getByText('🎯 Focus')).toBeTruthy();
  });

  it('shows correct preset options', () => {
    const { getByText } = render(<PomodoroWidget />);
    
    expect(getByText('🍅')).toBeTruthy();
    expect(getByText('⚡')).toBeTruthy();
    expect(getByText('🚀')).toBeTruthy();
    expect(getByText('🧠')).toBeTruthy();
  });

  it('changes duration when selecting different preset', () => {
    const { getByText, getByLabelText } = render(<PomodoroWidget />);
    
    // Select short focus preset (10 min)
    const shortPreset = getByLabelText(/10-3 Rule/);
    fireEvent.press(shortPreset);
    
    expect(getByText('10:00')).toBeTruthy();
  });

  it('starts timer when play button is pressed', async () => {
    const onSessionStart = jest.fn();
    const { getByLabelText, getByText } = render(
      <PomodoroWidget onSessionStart={onSessionStart} />
    );
    
    const startButton = getByLabelText(/Start focus timer/);
    fireEvent.press(startButton);
    
    expect(onSessionStart).toHaveBeenCalledWith(25);
    
    // Advance timer by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(getByText('24:59')).toBeTruthy();
  });

  it('pauses and resumes timer correctly', () => {
    const { getByLabelText, getByText } = render(<PomodoroWidget />);
    
    // Start timer
    fireEvent.press(getByLabelText(/Start focus timer/));
    
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    expect(getByText('24:55')).toBeTruthy();
    
    // Pause timer
    fireEvent.press(getByLabelText(/Pause timer/));
    
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // Time should not have changed
    expect(getByText('24:55')).toBeTruthy();
    
    // Resume timer
    fireEvent.press(getByLabelText(/Resume timer/));
    
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    expect(getByText('24:50')).toBeTruthy();
  });

  it('resets timer when reset button is pressed', () => {
    const { getByLabelText, getByText } = render(<PomodoroWidget />);
    
    // Start and advance timer
    fireEvent.press(getByLabelText(/Start focus timer/));
    
    act(() => {
      jest.advanceTimersByTime(60000); // 1 minute
    });
    
    expect(getByText('24:00')).toBeTruthy();
    
    // Reset timer
    fireEvent.press(getByLabelText(/Reset timer/));
    
    expect(getByText('25:00')).toBeTruthy();
  });

  it('calls onSessionComplete when work session ends', async () => {
    const onSessionComplete = jest.fn();
    const { getByLabelText } = render(
      <PomodoroWidget 
        onSessionComplete={onSessionComplete}
        initialPreset="short" // 10 min for faster test
      />
    );
    
    fireEvent.press(getByLabelText(/Start focus timer/));
    
    // Advance to end of session (10 minutes)
    act(() => {
      jest.advanceTimersByTime(10 * 60 * 1000);
    });
    
    await waitFor(() => {
      expect(onSessionComplete).toHaveBeenCalled();
    });
  });

  it('shows stats when showStats is true', () => {
    const { getByText } = render(<PomodoroWidget showStats={true} />);
    
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Focus Time')).toBeTruthy();
    expect(getByText('Day Streak')).toBeTruthy();
  });

  it('hides stats in compact mode', () => {
    const { queryByText } = render(<PomodoroWidget compact={true} />);
    
    expect(queryByText('Today')).toBeNull();
    expect(queryByText('Day Streak')).toBeNull();
  });

  it('has proper accessibility labels', () => {
    const { getByLabelText, getByRole } = render(<PomodoroWidget />);
    
    expect(getByLabelText(/Pomodoro timer/)).toBeTruthy();
    expect(getByLabelText(/Timer preset selection/)).toBeTruthy();
    expect(getByLabelText(/Start focus timer/)).toBeTruthy();
    expect(getByLabelText(/Reset timer/)).toBeTruthy();
  });

  it('disables preset selection while timer is running', () => {
    const { getByLabelText } = render(<PomodoroWidget />);
    
    fireEvent.press(getByLabelText(/Start focus timer/));
    
    const shortPreset = getByLabelText(/10-3 Rule/);
    expect(shortPreset.props.accessibilityState.disabled).toBe(true);
  });
});
