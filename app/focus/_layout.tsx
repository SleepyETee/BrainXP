// filepath: /Users/sleepyet/BrainXP/app/focus/_layout.tsx
import { Stack } from 'expo-router';

export default function FocusLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
