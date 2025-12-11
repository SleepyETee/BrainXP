// filepath: /Users/sleepyet/BrainXP/app/routine/_layout.tsx
import { Stack } from 'expo-router';

export default function RoutineLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
