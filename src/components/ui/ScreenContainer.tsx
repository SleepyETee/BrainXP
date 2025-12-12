// filepath: /Users/sleepyet/BrainXP/src/components/ui/ScreenContainer.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN CONTAINER
// A consistent, accessible screen wrapper with:
// - Safe area handling
// - Keyboard avoidance
// - Pull to refresh
// - Loading states
// - Scroll behavior optimization
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ViewStyle,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { Layout } from '../../utils/uxHelpers';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

interface ScreenContainerProps {
  children: React.ReactNode;
  // Scroll behavior
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  // Layout
  padding?: 'none' | 'default' | 'large';
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  // Appearance
  backgroundColor?: string;
  statusBarStyle?: 'light' | 'dark';
  // Header behavior
  stickyHeader?: React.ReactNode;
  headerFadeOnScroll?: boolean;
  // Bottom content (for thumb-friendly primary actions)
  bottomContent?: React.ReactNode;
  bottomContentStyle?: ViewStyle;
  // Keyboard
  keyboardAvoiding?: boolean;
  keyboardVerticalOffset?: number;
  // Loading
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  // Accessibility
  accessibilityLabel?: string;
  // Style overrides
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  refreshing = false,
  onRefresh,
  padding = 'default',
  edges = ['top', 'bottom'],
  backgroundColor = colors.gray[50],
  statusBarStyle = 'dark',
  stickyHeader,
  headerFadeOnScroll = false,
  bottomContent,
  bottomContentStyle,
  keyboardAvoiding = true,
  keyboardVerticalOffset = 0,
  loading = false,
  loadingComponent,
  accessibilityLabel,
  style,
  contentContainerStyle,
}) => {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [isRefreshing, setIsRefreshing] = useState(refreshing);

  // Scroll handler for animations
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Header fade animation based on scroll
  const headerAnimatedStyle = useAnimatedStyle(() => {
    if (!headerFadeOnScroll) return {};
    return {
      opacity: interpolate(
        scrollY.value,
        [0, 50],
        [1, 0.9],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [0, 100],
            [0, -10],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
    // Announce for screen readers
    AccessibilityInfo.announceForAccessibility('Content refreshed');
  }, [onRefresh]);

  // Padding values
  const paddingValue = padding === 'none' ? 0 : padding === 'large' ? Layout.SCREEN_PADDING_LARGE : Layout.SCREEN_PADDING;

  // Content wrapper
  const content = (
    <>
      {stickyHeader && (
        <Animated.View style={[styles.stickyHeader, headerAnimatedStyle]}>
          {stickyHeader}
        </Animated.View>
      )}
      
      {loading && loadingComponent ? (
        loadingComponent
      ) : (
        <Animated.View 
          entering={FadeIn.duration(200)}
          style={[styles.content, { paddingHorizontal: paddingValue }]}
        >
          {children}
        </Animated.View>
      )}
    </>
  );

  // Scrollable content
  const scrollableContent = scrollable ? (
    <AnimatedScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: bottomContent ? 100 : insets.bottom + 20 },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
            progressBackgroundColor={colors.gray[50]}
          />
        ) : undefined
      }
    >
      {content}
    </AnimatedScrollView>
  ) : (
    <View style={[styles.staticContent, contentContainerStyle]}>
      {content}
    </View>
  );

  // Keyboard avoiding wrapper
  const keyboardContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {scrollableContent}
    </KeyboardAvoidingView>
  ) : (
    scrollableContent
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }, style]}
      edges={edges}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="none"
    >
      <StatusBar
        barStyle={statusBarStyle === 'dark' ? 'dark-content' : 'light-content'}
        backgroundColor={backgroundColor}
      />
      
      {keyboardContent}
      
      {/* Bottom content - thumb-friendly zone */}
      {bottomContent && (
        <Animated.View
          entering={FadeIn.delay(100)}
          style={[
            styles.bottomContent,
            {
              paddingBottom: insets.bottom + 16,
              paddingHorizontal: paddingValue,
            },
            bottomContentStyle,
          ]}
        >
          {bottomContent}
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION COMPONENT
// For organizing content into visual groups
// ═══════════════════════════════════════════════════════════════════════════════

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
  spacing?: 'compact' | 'default' | 'relaxed';
}

export const Section: React.FC<SectionProps> = ({
  children,
  title,
  subtitle,
  action,
  style,
  spacing = 'default',
}) => {
  const spacingValue = spacing === 'compact' ? 16 : spacing === 'relaxed' ? 32 : 24;
  
  return (
    <View style={[styles.section, { marginBottom: spacingValue }, style]}>
      {(title || action) && (
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            {title && (
              <Animated.Text 
                style={styles.sectionTitle}
                accessibilityRole="header"
              >
                {title}
              </Animated.Text>
            )}
            {subtitle && (
              <Animated.Text style={styles.sectionSubtitle}>
                {subtitle}
              </Animated.Text>
            )}
          </View>
          {action}
        </View>
      )}
      {children}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// BOTTOM ACTION BAR
// Thumb-friendly action container for primary actions
// ═══════════════════════════════════════════════════════════════════════════════

interface BottomActionBarProps {
  children: React.ReactNode;
  blur?: boolean;
  style?: ViewStyle;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  children,
  blur = false,
  style,
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View
      style={[
        styles.bottomActionBar,
        { paddingBottom: insets.bottom + 16 },
        blur && styles.bottomActionBarBlur,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  staticContent: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  stickyHeader: {
    zIndex: 10,
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.gray[50],
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[800],
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  bottomActionBarBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});

export default ScreenContainer;
