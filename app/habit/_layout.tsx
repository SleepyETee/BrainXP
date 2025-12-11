// filepath: /Users/sleepyet/BrainXP/app/habit/_layout.tsx
import { Stack } from 'expo-router';

export default function HabitLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
