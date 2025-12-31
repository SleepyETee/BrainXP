import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { colors } from '../../theme/colors';
import { MicroMindfulness } from './MicroMindfulness';
import { useRouter } from 'expo-router';

interface OverwhelmButtonProps {
  taskId?: string;
  compact?: boolean;
  onActionTaken?: (action: string) => void;
}

const OVERWHELM_OPTIONS = [
  {
    id: 'breathe',
    emoji: '🫁',
    label: 'Take 3 breaths',
    description: 'Quick reset for your nervous system',
    action: 'breathing',
  },
  {
    id: 'ground',
    emoji: '🌿',
    label: 'Ground myself',
    description: 'Come back to the present moment',
    action: 'grounding',
  },
  {
    id: 'break_down',
    emoji: '🧩',
    label: 'Break it down',
    description: 'Task feels too big? Let\'s split it',
    action: 'decompose',
  },
  {
    id: 'cbt',
    emoji: '🧠',
    label: 'Check my thoughts',
    description: 'Challenge what\'s blocking me',
    action: 'cbt',
  },
  {
    id: 'switch',
    emoji: '🔄',
    label: 'Switch tasks',
    description: 'Come back to this later',
    action: 'switch',
  },
  {
    id: 'break',
    emoji: '☕',
    label: 'Take a break',
    description: 'Step away for a few minutes',
    action: 'break',
  },
];

export const OverwhelmButton: React.FC<OverwhelmButtonProps> = ({
  taskId,
  compact = false,
  onActionTaken,
}) => {
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  
  const handleSelectOption = (option: typeof OVERWHELM_OPTIONS[0]) => {
    setShowOptions(false);
    
    switch (option.action) {
      case 'breathing':
        setShowBreathing(true);
        break;
      case 'grounding':
        router.push('/therapy/grounding?variant=3_2_1&trigger=overwhelm_button' as any);
        break;
      case 'decompose':
        if (taskId) {
          router.push(`/task/${taskId}?decompose=true` as any);
        }
        break;
      case 'cbt':
        if (taskId) {
          router.push(`/therapy/cbt?taskId=${taskId}` as any);
        } else {
          router.push('/therapy/cbt' as any);
        }
        break;
      case 'switch':
        router.push('/(tabs)/tasks' as any);
        break;
      case 'break':
        // Just close - user can take a break
        break;
    }
    
    onActionTaken?.(option.action);
  };
  
  if (compact) {
    return (
      <>
        <TouchableOpacity
          style={styles.compactButton}
          onPress={() => setShowOptions(true)}
        >
          <Text style={styles.compactText}>😰 Overwhelmed?</Text>
        </TouchableOpacity>
        
        <Modal
          visible={showOptions}
          animationType="slide"
          transparent
          onRequestClose={() => setShowOptions(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalEmoji}>🫂</Text>
                <Text style={styles.modalTitle}>It's okay. Let's help.</Text>
                <Text style={styles.modalSubtitle}>What would feel good right now?</Text>
              </View>
              
              <View style={styles.optionsGrid}>
                {OVERWHELM_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.optionCard}
                    onPress={() => handleSelectOption(option)}
                  >
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowOptions(false)}
              >
                <Text style={styles.closeButtonText}>Never mind, I'm okay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        <Modal
          visible={showBreathing}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowBreathing(false)}
        >
          <MicroMindfulness
            breaths={3}
            trigger="overwhelm_button"
            contextTaskId={taskId}
            onComplete={() => setShowBreathing(false)}
            onSkip={() => setShowBreathing(false)}
          />
        </Modal>
      </>
    );
  }
  
  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowOptions(true)}
      >
        <Text style={styles.buttonEmoji}>😰</Text>
        <View style={styles.buttonContent}>
          <Text style={styles.buttonText}>I'm overwhelmed</Text>
          <Text style={styles.buttonSubtext}>Get help getting unstuck</Text>
        </View>
      </TouchableOpacity>
      
      <Modal
        visible={showOptions}
        animationType="slide"
        transparent
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalEmoji}>🫂</Text>
              <Text style={styles.modalTitle}>It's okay. Let's help.</Text>
              <Text style={styles.modalSubtitle}>What would feel good right now?</Text>
            </View>
            
            <View style={styles.optionsList}>
              {OVERWHELM_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.optionRow}
                  onPress={() => handleSelectOption(option)}
                >
                  <Text style={styles.optionRowEmoji}>{option.emoji}</Text>
                  <View style={styles.optionRowContent}>
                    <Text style={styles.optionRowLabel}>{option.label}</Text>
                    <Text style={styles.optionRowDescription}>{option.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.closeButtonText}>Never mind, I'm okay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={showBreathing}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBreathing(false)}
      >
        <MicroMindfulness
          breaths={3}
          trigger="overwhelm_button"
          contextTaskId={taskId}
          onComplete={() => setShowBreathing(false)}
          onSkip={() => setShowBreathing(false)}
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.accent[200],
  },
  buttonEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  buttonContent: {
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent[700],
  },
  buttonSubtext: {
    fontSize: 13,
    color: colors.accent[500],
    marginTop: 2,
  },
  compactButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.accent[50],
    borderRadius: 20,
  },
  compactText: {
    fontSize: 13,
    color: colors.accent[700],
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 15,
    color: colors.gray[500],
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  optionCard: {
    width: '31%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
  },
  optionEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[700],
    textAlign: 'center',
  },
  optionsList: {
    gap: 8,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
  },
  optionRowEmoji: {
    fontSize: 24,
    marginRight: 14,
  },
  optionRowContent: {
    flex: 1,
  },
  optionRowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
  },
  optionRowDescription: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  closeButtonText: {
    fontSize: 15,
    color: colors.gray[500],
    fontWeight: '500',
  },
});

export default OverwhelmButton;

