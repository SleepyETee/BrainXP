import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function ToolsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="magic" />
      <Stack.Screen name="spoons" />
      <Stack.Screen name="tone" />
      <Stack.Screen name="compile" />
      <Stack.Screen name="time" />
      <Stack.Screen name="flashcards" />
      <Stack.Screen name="quiz" />
    </Stack>
  );
}

