// Navigation Utilities
// Provides safe navigation helpers with error handling

import { useRouter } from 'expo-router';
import type { Router } from 'expo-router';

/**
 * Safely navigate back, falling back to root if back is not possible
 */
export const safeGoBack = (router: Router, fallbackRoute: string = '/(tabs)') => {
  try {
    // Check if we can go back (expo-router supports canGoBack())
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
    } else {
      // Fallback to safe route if can't go back
      router.replace(fallbackRoute as any);
    }
  } catch (error) {
    // If back fails, navigate to fallback route
    console.warn('Navigation back failed, using fallback:', fallbackRoute, error);
    try {
      router.replace(fallbackRoute as any);
    } catch (fallbackError) {
      // If replace also fails, try push as last resort
      console.error('Navigation error:', fallbackError);
      try {
        router.push(fallbackRoute as any);
      } catch (pushError) {
        console.error('All navigation attempts failed:', pushError);
      }
    }
  }
};

/**
 * Hook to safely go back with fallback
 */
export const useSafeNavigation = (fallbackRoute: string = '/(tabs)') => {
  const router = useRouter();
  
  const goBack = () => {
    safeGoBack(router, fallbackRoute);
  };
  
  return { goBack, router };
};
