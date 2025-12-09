import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { colors } from '../../src/theme/colors';

export default function ReadyScreen() {
  const router = useRouter();
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);

  const handleGetStarted = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>
            Your personalized ADHD support system is ready.
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.tips}>
          <View style={styles.tip}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              Start with one small task today - that's how momentum builds
            </Text>
          </View>

          <View style={styles.tip}>
            <Text style={styles.tipIcon}>🎯</Text>
            <Text style={styles.tipText}>
              Try a 5-minute focus session to get the feel of it
            </Text>
          </View>

          <View style={styles.tip}>
            <Text style={styles.tipIcon}>🌱</Text>
            <Text style={styles.tipText}>
              Progress over perfection - we celebrate every small win
            </Text>
          </View>
        </View>

        {/* Encouragement */}
        <View style={styles.encouragement}>
          <Text style={styles.encouragementText}>
            Remember: You've already taken the first step by being here. That
            takes courage. 💪
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <Button
            title="Let's Do This!"
            onPress={handleGetStarted}
            fullWidth
            size="lg"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    marginTop: 40,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.gray[800],
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: colors.gray[500],
    textAlign: 'center',
  },
  tips: {
    gap: 16,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray[50],
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  tipIcon: {
    fontSize: 24,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 22,
  },
  encouragement: {
    backgroundColor: colors.primary[50],
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  encouragementText: {
    fontSize: 15,
    color: colors.primary[800],
    lineHeight: 22,
    fontStyle: 'italic',
  },
  cta: {
    paddingVertical: 16,
  },
});

