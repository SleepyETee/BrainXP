// filepath: /Users/sleepyet/BrainXP/app/habit/_layout.tsx
import { Stack } from 'expo-router';

export default function HabitLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="create"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
