// Tone Rewriter Tool Screen
import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { ToneRewriter } from '../../src/components/aiTools/ToneRewriter';

export default function ToneRewriterScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ToneRewriter
        onRewriteComplete={(result) => {
          console.log('Rewrite completed:', result);
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

