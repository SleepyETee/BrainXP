// filepath: /Users/sleepyet/BrainXP/app/wellness/_layout.tsx
import { Stack } from 'expo-router';

export default function WellnessLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
