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
        <Text style={styles.headerEmoji}>🪄</Text>
        <Text style={styles.headerTitle}>Magic Breakdown</Text>
        <Text style={styles.headerSubtitle}>
          Transform overwhelming tasks into tiny, doable steps
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!result ? (
          <>
            {/* Task Input */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.inputSection}>
              <Text style={styles.label}>What task feels overwhelming?</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Clean my entire apartment..."
                placeholderTextColor={colors.gray[400]}
                value={task}
                onChangeText={setTask}
                multiline
                textAlignVertical="top"
              />
            </Animated.View>

            {/* Granularity */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.inputSection}>
              <Text style={styles.label}>How small should the steps be?</Text>
              <View style={styles.granularityOptions}>
                {GRANULARITY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.granularityOption,
                      granularity === option.value && styles.granularityOptionSelected,
                    ]}
                    onPress={() => setGranularity(option.value)}
                  >
                    <Text style={styles.granularityEmoji}>{option.emoji}</Text>
                    <Text style={styles.granularityLabel}>{option.label}</Text>
                    <Text style={styles.granularityDesc}>{option.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Energy Level */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.inputSection}>
              <Text style={styles.label}>Current energy level? (Optional)</Text>
              <View style={styles.energyOptions}>
                {ENERGY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.energyOption,
                      currentEnergy === option.value && styles.energyOptionSelected,
                    ]}
                    onPress={() => setCurrentEnergy(option.value)}
                  >
                    <Text style={styles.energyEmoji}>{option.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {error && <Text style={styles.error}>{error}</Text>}

            <Animated.View entering={FadeInDown.delay(400)}>
              <TouchableOpacity
                style={[styles.breakdownButton, isLoading && styles.buttonDisabled]}
                onPress={handleBreakdown}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.buttonEmoji}>✨</Text>
                    <Text style={styles.buttonText}>Break It Down</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          /* Results */
          <Animated.View entering={FadeIn}>
            {/* First Step Highlight */}
            <View style={styles.firstStepCard}>
              <Text style={styles.firstStepLabel}>🚀 Start Here (Under 2 min)</Text>
              <Text style={styles.firstStepText}>{result.smallestFirstStep}</Text>
            </View>

            {/* Encouragement */}
            <View style={styles.encouragementCard}>
              <Text style={styles.encouragementText}>{result.encouragement}</Text>
            </View>

            {/* Steps */}
            <Text style={styles.stepsTitle}>Your Steps</Text>
            {result.steps.map((step, index) => (
              <Animated.View
                key={step.id}
                entering={FadeInDown.delay(index * 80)}
                style={styles.stepCard}
              >
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepEmoji}>{step.emoji}</Text>
                  <View style={styles.stepMeta}>
                    <Text style={styles.stepTime}>~{step.estimatedMinutes}m</Text>
                    <Text style={styles.stepSpoons}>{'🥄'.repeat(step.spoons)}</Text>
                  </View>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                {step.description && (
                  <Text style={styles.stepDescription}>{step.description}</Text>
                )}
                {step.tip && (
                  <Text style={styles.stepTip}>💡 {step.tip}</Text>
                )}
              </Animated.View>
            ))}

            {/* Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total time:</Text>
                <Text style={styles.summaryValue}>~{result.totalEstimatedMinutes} min</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total energy:</Text>
                <Text style={styles.summaryValue}>
                  {'🥄'.repeat(Math.min(result.totalSpoons, 5))}
                  {result.totalSpoons > 5 ? '+' : ''}
                </Text>
              </View>
            </View>

            {/* Checkpoints */}
            {result.progressCheckpoints.length > 0 && (
              <View style={styles.checkpointsCard}>
                <Text style={styles.checkpointsTitle}>🎯 Celebration Points</Text>
                {result.progressCheckpoints.map((checkpoint, index) => (
                  <Text key={index} style={styles.checkpoint}>
                    • {checkpoint}
                  </Text>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.addTasksButton}
                onPress={handleAddToTasks}
              >
                <Text style={styles.addTasksButtonText}>Add to My Tasks</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tryAgainButton}
                onPress={() => setResult(null)}
              >
                <Text style={styles.tryAgainButtonText}>Try Different Settings</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
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
