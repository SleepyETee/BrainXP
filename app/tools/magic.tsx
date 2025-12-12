import React from 'react';
import { SafeAreaView, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MagicBreakdown } from '../../src/components/aiTools/MagicBreakdown';
import { colors } from '../../src/theme/colors';

export default function MagicBreakdownScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🪄 Magic Breakdown</Text>
        <View style={styles.placeholder} />
      </View>
      <MagicBreakdown />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 18, color: colors.gray[700] },
  title: { fontSize: 18, fontWeight: '700', color: colors.gray[900] },
  placeholder: { width: 32 },
});
