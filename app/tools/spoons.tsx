// Spoon Estimator Tool Screen
import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SpoonEstimator } from '../../src/components/aiTools/SpoonEstimator';

export default function SpoonEstimatorScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SpoonEstimator
        onEstimateComplete={(estimate) => {
          console.log('Estimate completed:', estimate);
        }}
        onClose={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
  },
});

