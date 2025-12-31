// Note Compiler Tool Screen
import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { NoteCompiler } from '../../src/components/aiTools/NoteCompiler';

export default function NoteCompilerScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <NoteCompiler
        onCompileComplete={(result) => {
          console.log('Compile completed:', result);
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

