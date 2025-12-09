import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function StudyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="create" />
      <Stack.Screen name="review" />
      <Stack.Screen name="generate" />
      <Stack.Screen name="quiz" />
      <Stack.Screen name="stats" />
    </Stack>
  );
}
