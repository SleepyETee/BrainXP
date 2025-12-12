import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/contexts/ThemeContext';
import { colors } from '../../src/theme/colors';
import { TOUCH_TARGETS } from '../../src/utils/uxHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  label: string;
};

function TabIcon({ name, focused, color, label }: TabIconProps) {
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(focused ? 1.15 : 1, {
            damping: 15,
            stiffness: 200,
          }),
        },
        {
          translateY: withSpring(focused ? -2 : 0, {
            damping: 15,
            stiffness: 200,
          }),
        },
      ],
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(focused ? 1 : 0.7, { duration: 150 }),
      transform: [
        {
          scale: withSpring(focused ? 1 : 0.95, {
            damping: 15,
            stiffness: 200,
          }),
        },
      ],
    };
  });

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(focused ? 1 : 0, { duration: 200 }),
      transform: [
        {
          scaleX: withSpring(focused ? 1 : 0, {
            damping: 15,
            stiffness: 300,
          }),
        },
      ],
    };
  });

  return (
    <View 
      style={styles.tabIconContainer}
      accessibilityLabel={`${label} tab${focused ? ', selected' : ''}`}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
    >
      <Animated.View style={animatedIconStyle}>
        <Ionicons name={name} size={24} color={color} />
      </Animated.View>
      <Animated.Text 
        style={[
          styles.tabLabel, 
          { color },
          animatedLabelStyle,
        ]}
      >
        {label}
      </Animated.Text>
      <Animated.View 
        style={[
          styles.activeIndicator, 
          { backgroundColor: color },
          animatedIndicatorStyle,
        ]} 
      />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // Calculate safe tab bar height (thumb-friendly)
  const tabBarHeight = Math.max(
    TOUCH_TARGETS.comfortable + insets.bottom + 8,
    Platform.OS === 'ios' ? 88 : 72
  );

  const handleTabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
            backgroundColor: theme.isDark ? colors.gray[900] : '#FFFFFF',
            borderTopColor: theme.isDark ? colors.gray[800] : colors.gray[100],
          },
        ],
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarHideOnKeyboard: true,
      }}
      screenListeners={{
        tabPress: handleTabPress,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? 'home' : 'home-outline'}
              focused={focused}
              color={color}
              label="Home"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? 'checkbox' : 'checkbox-outline'}
              focused={focused}
              color={color}
              label="Tasks"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? 'refresh-circle' : 'refresh-circle-outline'}
              focused={focused}
              color={color}
              label="Habits"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? 'grid' : 'grid-outline'}
              focused={focused}
              color={color}
              label="More"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    paddingTop: 8,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: TOUCH_TARGETS.comfortable,
    minHeight: TOUCH_TARGETS.comfortable,
    paddingHorizontal: 12,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 20,
    height: 3,
    borderRadius: 1.5,
  },
});
