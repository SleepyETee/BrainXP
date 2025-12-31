import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProgressStore } from '../src/stores/progressStore';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function RootLayoutContent() {
  const initializeProgress = useProgressStore((state) => state.initializeProgress);
  const { isDark, theme } = useTheme();

  useEffect(() => {
    // Initialize progress tracking on app start
    initializeProgress();
  }, [initializeProgress]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="task" />
        <Stack.Screen name="focus" />
        <Stack.Screen
          name="inbox"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="habit" />
        <Stack.Screen name="wellness" />
        <Stack.Screen name="analytics" />
        <Stack.Screen
          name="planning"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="therapy" />
        <Stack.Screen name="tools" />
        <Stack.Screen name="study" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="routine" />
        <Stack.Screen name="support" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RootLayoutContent />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
