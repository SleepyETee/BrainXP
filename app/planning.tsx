// Daily Planning Screen - ADHD-Friendly Planning Tools
// Combines 1-3-5 Rule, Time Blocking, and Mind Maps
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, shadows } from '../src/theme/colors';
import { DailyPlanner135 } from '../src/components/planning/DailyPlanner135';
import { TimeBlocking } from '../src/components/planning/TimeBlocking';
import { MindMap } from '../src/components/planning/MindMap';
import { AnimatedView } from '../src/components/accessibility/AnimatedView';
import { useSettingsStore } from '../src/stores/settingsStore';
import * as Haptics from 'expo-haptics';

type PlanningTab = '135' | 'timeblock' | 'mindmap';

const TAB_CONFIG = {
  '135': {
    label: '1-3-5 Rule',
    emoji: '📋',
    description: 'Plan your day with focus',
  },
  timeblock: {
    label: 'Time Blocks',
    emoji: '⏰',
    description: 'Visualize your schedule',
  },
  mindmap: {
    label: 'Mind Map',
    emoji: '🧠',
    description: 'Connect your ideas',
  },
};

export default function PlanningScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PlanningTab>('135');
  const reduceMotion = useSettingsStore((state) => state.settings.reduceMotion);

  const handleTabChange = async (tab: PlanningTab) => {
    if (!reduceMotion) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
  };

  const handlePlanComplete = (tasks: any[]) => {
    // Save plan and navigate
    console.log('Plan saved:', tasks);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Go back"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Plan Your Day</Text>
          <Text style={styles.headerSubtitle}>
            Choose your planning style
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab selector */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {(Object.keys(TAB_CONFIG) as PlanningTab[]).map((tab) => {
            const config = TAB_CONFIG[tab];
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => handleTabChange(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`${config.label}: ${config.description}`}
              >
                <Text style={styles.tabEmoji}>{config.emoji}</Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <AnimatedView animation="fadeIn" key={activeTab}>
          {activeTab === '135' && (
            <DailyPlanner135 onPlanComplete={handlePlanComplete} />
          )}
          {activeTab === 'timeblock' && <TimeBlocking />}
          {activeTab === 'mindmap' && <MindMap title="Today's Ideas" />}
        </AnimatedView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: colors.gray[600],
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },

  // Tabs
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  tabScroll: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: colors.gray[50],
    gap: 8,
  },
  tabActive: {
    backgroundColor: colors.primary[500],
  },
  tabEmoji: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },

  // Content
  content: {
    flex: 1,
  },
});

