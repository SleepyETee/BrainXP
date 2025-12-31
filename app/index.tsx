import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../src/stores/authStore';
import { colors } from '../src/theme/colors';

const ONBOARDING_KEY = '@brainxp_onboarding_complete';

export default function Index() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [isChecking, setIsChecking] = useState(true);
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!navigationState?.key) return;

    const checkRoute = async () => {
      try {
        // Check if user has completed onboarding
        const hasOnboarded = await AsyncStorage.getItem(ONBOARDING_KEY);
        
        if (isAuthenticated && user) {
          // Returning authenticated user -> go to dashboard
          router.replace('/(tabs)');
        } else if (hasOnboarded === 'true') {
          // Has seen onboarding but not logged in -> go to login
          router.replace('/(auth)/login');
        } else {
          // First time user -> show welcome/onboarding
          router.replace('/welcome');
        }
      } catch (error) {
        // On error, default to login
        router.replace('/(auth)/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkRoute();
  }, [navigationState?.key, isAuthenticated, user]);

  // Show loading while checking
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary[500]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
