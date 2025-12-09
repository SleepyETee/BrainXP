import { Stack } from 'expo-router';

export default function TherapyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="cbt" />
      <Stack.Screen name="mindfulness" />
      <Stack.Screen name="learn" />
      <Stack.Screen name="tdcs" />
      <Stack.Screen name="cognitive" />
      <Stack.Screen name="training" />
      <Stack.Screen 
        name="grounding" 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }} 
      />
      <Stack.Screen 
        name="breathing" 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }} 
      />
    </Stack>
  );
}
