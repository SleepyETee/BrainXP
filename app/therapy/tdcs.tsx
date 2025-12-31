import React from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { TDCSTracker } from '../../src/components/therapy';

export default function TDCSScreen() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      </View>
      <TDCSTracker />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    padding: 16,
    paddingBottom: 0,
  },
  backButton: {
    fontSize: 16,
    color: colors.primary[600],
  },
});

