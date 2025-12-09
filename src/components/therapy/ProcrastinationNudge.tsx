import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useTherapyStore } from '../../stores/therapyStore';
import { THERAPY_DISCLAIMER } from '../../types/therapy';
import * as Haptics from 'expo-haptics';

interface ProcrastinationNudgeProps {
  taskId: string;
  taskTitle: string;
  overdueCount: number;
  visible: boolean;
  onClose: () => void;
  onBreakDown: () => void;
  onLowerBar: (goodEnoughVersion: string) => void;
  onDropTask: () => void;
  onRenegotiate: (newDeadline: string) => void;
}

type SelectedOption = 'break_down' | 'lower_bar' | 'drop' | 'renegotiate' | null;

export const ProcrastinationNudge: React.FC<ProcrastinationNudgeProps> = ({
  taskId,
  taskTitle,
  overdueCount,
  visible,
  onClose,
  onBreakDown,
  onLowerBar,
  onDropTask,
  onRenegotiate,
}) => {
  const [selectedOption, setSelectedOption] = useState<SelectedOption>(null);
  const [goodEnoughVersion, setGoodEnoughVersion] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  
  const startIntervention = useTherapyStore((state) => state.startIntervention);
  const completeIntervention = useTherapyStore((state) => state.completeIntervention);
  
  const handleSelectOption = (option: SelectedOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOption(option);
  };
  
  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const intervention = startIntervention(taskId, 'overdue_nudge');
    
    switch (selectedOption) {
      case 'break_down':
        completeIntervention(intervention.id, 'broke_down_task');
        onBreakDown();
        break;
      case 'lower_bar':
        completeIntervention(intervention.id, 'lowered_bar', goodEnoughVersion);
        onLowerBar(goodEnoughVersion);
        break;
      case 'drop':
        completeIntervention(intervention.id, 'dropped_task');
        onDropTask();
        break;
      case 'renegotiate':
        completeIntervention(intervention.id, 'lowered_bar', `New deadline: ${newDeadline}`);
        onRenegotiate(newDeadline);
        break;
    }
    
    resetAndClose();
  };
  
  const resetAndClose = () => {
    setSelectedOption(null);
    setGoodEnoughVersion('');
    setNewDeadline('');
    onClose();
  };
  
  const renderOptionDetails = () => {
    switch (selectedOption) {
      case 'lower_bar':
        return (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>What's a "good enough" version?</Text>
            <Text style={styles.detailsSubtitle}>
              Lower the bar. Perfect is the enemy of done.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Just write the outline, not the full essay..."
              value={goodEnoughVersion}
              onChangeText={setGoodEnoughVersion}
              placeholderTextColor={colors.gray[400]}
              multiline
              autoFocus
            />
          </View>
        );
      
      case 'renegotiate':
        return (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>When can you realistically do this?</Text>
            <Text style={styles.detailsSubtitle}>
              Be honest with yourself. It's okay to adjust.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Next Monday, After the exam..."
              value={newDeadline}
              onChangeText={setNewDeadline}
              placeholderTextColor={colors.gray[400]}
              autoFocus
            />
          </View>
        );
      
      case 'drop':
        return (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Ready to let this go?</Text>
            <Text style={styles.detailsSubtitle}>
              Sometimes the kindest thing is to admit this isn't serving you.
              {'\n\n'}
              We'll archive this task so you can focus on what matters.
            </Text>
          </View>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={resetAndClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={resetAndClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          {!selectedOption ? (
            <>
              <Text style={styles.emoji}>🫂</Text>
              <Text style={styles.title}>This one seems heavy</Text>
              <Text style={styles.subtitle}>
                "{taskTitle}" has been overdue {overdueCount} times.
                {'\n'}Let's figure out what to do with it.
              </Text>
              
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => handleSelectOption('break_down')}
                >
                  <Text style={styles.optionEmoji}>🧩</Text>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Break it down</Text>
                    <Text style={styles.optionDescription}>
                      Let AI help split this into smaller, doable steps
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => handleSelectOption('lower_bar')}
                >
                  <Text style={styles.optionEmoji}>📉</Text>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Lower the bar</Text>
                    <Text style={styles.optionDescription}>
                      Define a "good enough" version you can actually finish
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => handleSelectOption('renegotiate')}
                >
                  <Text style={styles.optionEmoji}>📅</Text>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Renegotiate deadline</Text>
                    <Text style={styles.optionDescription}>
                      Set a more realistic due date
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.optionCard, styles.dropOption]}
                  onPress={() => handleSelectOption('drop')}
                >
                  <Text style={styles.optionEmoji}>🗑️</Text>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Consciously drop it</Text>
                    <Text style={styles.optionDescription}>
                      It's okay to let go of things that no longer serve you
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setSelectedOption(null)}
              >
                <Text style={styles.backButtonText}>← Back to options</Text>
              </TouchableOpacity>
              
              {renderOptionDetails()}
              
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  selectedOption === 'lower_bar' && !goodEnoughVersion.trim() && styles.confirmButtonDisabled,
                  selectedOption === 'renegotiate' && !newDeadline.trim() && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={
                  (selectedOption === 'lower_bar' && !goodEnoughVersion.trim()) ||
                  (selectedOption === 'renegotiate' && !newDeadline.trim())
                }
              >
                <Text style={styles.confirmButtonText}>
                  {selectedOption === 'break_down' && "Let's break it down"}
                  {selectedOption === 'lower_bar' && 'Update task'}
                  {selectedOption === 'renegotiate' && 'Set new deadline'}
                  {selectedOption === 'drop' && 'Archive task'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        
        <Text style={styles.disclaimer}>{THERAPY_DISCLAIMER.cbt}</Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    color: colors.gray[400],
  },
  content: {
    flex: 1,
    padding: 24,
  },
  emoji: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  dropOption: {
    backgroundColor: colors.accent[50],
    borderColor: colors.accent[200],
  },
  optionEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.gray[500],
    lineHeight: 20,
  },
  backButton: {
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 15,
    color: colors.gray[600],
    fontWeight: '500',
  },
  detailsContainer: {
    flex: 1,
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 8,
  },
  detailsSubtitle: {
    fontSize: 15,
    color: colors.gray[600],
    lineHeight: 22,
    marginBottom: 24,
  },
  input: {
    fontSize: 16,
    color: colors.gray[800],
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    minHeight: 100,
    textAlignVertical: 'top',
  },
  confirmButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    color: colors.gray[400],
    textAlign: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
});

export default ProcrastinationNudge;
