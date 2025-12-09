import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useTherapyStore } from '../../stores/therapyStore';
import { TDCSSession, TDCSSideEffect, THERAPY_DISCLAIMER } from '../../types/therapy';
import { Card } from '../ui/Card';
import * as Haptics from 'expo-haptics';

interface TDCSTrackerProps {
  onSessionLogged?: (session: TDCSSession) => void;
}

const SIDE_EFFECT_OPTIONS: { type: TDCSSideEffect['type']; label: string; emoji: string }[] = [
  { type: 'tingling', label: 'Tingling', emoji: '⚡' },
  { type: 'itching', label: 'Itching', emoji: '🤏' },
  { type: 'burning', label: 'Burning sensation', emoji: '🔥' },
  { type: 'headache', label: 'Headache', emoji: '🤕' },
  { type: 'fatigue', label: 'Fatigue', emoji: '😴' },
  { type: 'dizziness', label: 'Dizziness', emoji: '💫' },
  { type: 'skin_irritation', label: 'Skin irritation', emoji: '🔴' },
];

export const TDCSTracker: React.FC<TDCSTrackerProps> = ({ onSessionLogged }) => {
  const isEnrolledInStudy = useTherapyStore((state) => state.isEnrolledInStudy);
  const setStudyEnrollment = useTherapyStore((state) => state.setStudyEnrollment);
  const logSession = useTherapyStore((state) => state.logTDCSSession);
  
  const [showForm, setShowForm] = useState(false);
  const [duration, setDuration] = useState('');
  const [studyProtocol, setStudyProtocol] = useState('');
  const [preFocus, setPreFocus] = useState(3);
  const [preMood, setPreMood] = useState(3);
  const [preEnergy, setPreEnergy] = useState(3);
  const [postFocus, setPostFocus] = useState<number | null>(null);
  const [postMood, setPostMood] = useState<number | null>(null);
  const [postEnergy, setPostEnergy] = useState<number | null>(null);
  const [sideEffects, setSideEffects] = useState<TDCSSideEffect[]>([]);
  const [notes, setNotes] = useState('');
  
  const handleEnrollToggle = () => {
    if (!isEnrolledInStudy) {
      Alert.alert(
        'tDCS Study Tracking',
        'This feature is only for people participating in supervised tDCS research studies.\n\nAre you enrolled in a supervised tDCS study?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, I am',
            onPress: () => {
              setStudyEnrollment(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            },
          },
        ]
      );
    } else {
      setStudyEnrollment(false);
      setShowForm(false);
    }
  };
  
  const toggleSideEffect = (type: TDCSSideEffect['type']) => {
    const existing = sideEffects.find((s) => s.type === type);
    if (existing) {
      setSideEffects(sideEffects.filter((s) => s.type !== type));
    } else {
      setSideEffects([
        ...sideEffects,
        { id: Math.random().toString(), type, severity: 'mild' },
      ]);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const updateSideEffectSeverity = (type: TDCSSideEffect['type'], severity: TDCSSideEffect['severity']) => {
    setSideEffects(
      sideEffects.map((s) =>
        s.type === type ? { ...s, severity } : s
      )
    );
  };
  
  const handleSubmit = () => {
    const session = logSession({
      userId: '1',
      sessionDate: new Date().toISOString().split('T')[0],
      sessionTime: new Date().toTimeString().split(' ')[0],
      duration: parseInt(duration) || 20,
      studyProtocol,
      preFocusRating: preFocus,
      preMoodRating: preMood,
      preEnergyRating: preEnergy,
      postFocusRating: postFocus || undefined,
      postMoodRating: postMood || undefined,
      postEnergyRating: postEnergy || undefined,
      sideEffects,
      notes,
    });
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSessionLogged?.(session);
    resetForm();
    setShowForm(false);
  };
  
  const resetForm = () => {
    setDuration('');
    setStudyProtocol('');
    setPreFocus(3);
    setPreMood(3);
    setPreEnergy(3);
    setPostFocus(null);
    setPostMood(null);
    setPostEnergy(null);
    setSideEffects([]);
    setNotes('');
  };
  
  const RatingSelector: React.FC<{
    label: string;
    value: number | null;
    onChange: (val: number) => void;
    showNull?: boolean;
  }> = ({ label, value, onChange, showNull }) => (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.ratingButtons}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            style={[
              styles.ratingButton,
              value === n && styles.ratingButtonSelected,
            ]}
            onPress={() => onChange(n)}
          >
            <Text
              style={[
                styles.ratingButtonText,
                value === n && styles.ratingButtonTextSelected,
              ]}
            >
              {n}
            </Text>
          </TouchableOpacity>
        ))}
        {showNull && (
          <TouchableOpacity
            style={[styles.ratingButton, value === null && styles.ratingButtonSelected]}
            onPress={() => onChange(0)}
          >
            <Text style={styles.ratingButtonText}>-</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
  
  // Education content when not enrolled
  if (!isEnrolledInStudy) {
    return (
      <ScrollView style={styles.container}>
        <Card style={styles.educationCard}>
          <Text style={styles.educationEmoji}>⚡</Text>
          <Text style={styles.educationTitle}>About tDCS</Text>
          <Text style={styles.educationText}>
            Transcranial Direct Current Stimulation (tDCS) is a form of brain
            stimulation that uses low electrical currents. It's being researched
            as a potential treatment for ADHD symptoms.
          </Text>
          
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Important Safety Information</Text>
            <Text style={styles.warningText}>
              • tDCS is still experimental and should only be done under medical supervision{'\n'}
              • DIY tDCS devices and protocols can be dangerous{'\n'}
              • Do NOT attempt to use tDCS without proper medical guidance{'\n'}
              • If interested, talk to your doctor or find a research study
            </Text>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>What the research shows:</Text>
            <Text style={styles.infoText}>
              Some studies suggest modest benefits for attention in adults with ADHD,
              but results are mixed and more research is needed. It's not yet an
              established treatment.
            </Text>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>If you're in a supervised study:</Text>
            <Text style={styles.infoText}>
              This app can help you track your sessions, side effects, and how you
              feel before/after to share with your research team or doctor.
            </Text>
          </View>
        </Card>
        
        <TouchableOpacity style={styles.enrollButton} onPress={handleEnrollToggle}>
          <Text style={styles.enrollButtonText}>I'm in a supervised tDCS study</Text>
        </TouchableOpacity>
        
        <Text style={styles.disclaimer}>{THERAPY_DISCLAIMER.tdcs}</Text>
      </ScrollView>
    );
  }
  
  // Tracking form when enrolled
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>tDCS Session Tracker</Text>
        <TouchableOpacity onPress={handleEnrollToggle}>
          <Text style={styles.unenrollText}>Leave study mode</Text>
        </TouchableOpacity>
      </View>
      
      {!showForm ? (
        <TouchableOpacity
          style={styles.newSessionButton}
          onPress={() => setShowForm(true)}
        >
          <Text style={styles.newSessionEmoji}>📝</Text>
          <Text style={styles.newSessionText}>Log a tDCS Session</Text>
        </TouchableOpacity>
      ) : (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Log Session</Text>
          
          {/* Duration */}
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              placeholder="20"
              placeholderTextColor={colors.gray[400]}
            />
          </View>
          
          {/* Study Protocol */}
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Study/Protocol (optional)</Text>
            <TextInput
              style={styles.input}
              value={studyProtocol}
              onChangeText={setStudyProtocol}
              placeholder="e.g., DLPFC anodal"
              placeholderTextColor={colors.gray[400]}
            />
          </View>
          
          {/* Pre-session ratings */}
          <Text style={styles.sectionTitle}>Before Session</Text>
          <RatingSelector label="Focus" value={preFocus} onChange={setPreFocus} />
          <RatingSelector label="Mood" value={preMood} onChange={setPreMood} />
          <RatingSelector label="Energy" value={preEnergy} onChange={setPreEnergy} />
          
          {/* Post-session ratings */}
          <Text style={styles.sectionTitle}>After Session</Text>
          <RatingSelector
            label="Focus"
            value={postFocus}
            onChange={(v) => setPostFocus(v === 0 ? null : v)}
            showNull
          />
          <RatingSelector
            label="Mood"
            value={postMood}
            onChange={(v) => setPostMood(v === 0 ? null : v)}
            showNull
          />
          <RatingSelector
            label="Energy"
            value={postEnergy}
            onChange={(v) => setPostEnergy(v === 0 ? null : v)}
            showNull
          />
          
          {/* Side effects */}
          <Text style={styles.sectionTitle}>Side Effects</Text>
          <View style={styles.sideEffectsGrid}>
            {SIDE_EFFECT_OPTIONS.map((option) => {
              const selected = sideEffects.find((s) => s.type === option.type);
              return (
                <View key={option.type}>
                  <TouchableOpacity
                    style={[
                      styles.sideEffectButton,
                      selected && styles.sideEffectButtonSelected,
                    ]}
                    onPress={() => toggleSideEffect(option.type)}
                  >
                    <Text style={styles.sideEffectEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.sideEffectLabel,
                        selected && styles.sideEffectLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                  
                  {selected && (
                    <View style={styles.severityRow}>
                      {(['mild', 'moderate', 'severe'] as const).map((sev) => (
                        <TouchableOpacity
                          key={sev}
                          style={[
                            styles.severityButton,
                            selected.severity === sev && styles.severityButtonSelected,
                          ]}
                          onPress={() => updateSideEffectSeverity(option.type, sev)}
                        >
                          <Text
                            style={[
                              styles.severityText,
                              selected.severity === sev && styles.severityTextSelected,
                            ]}
                          >
                            {sev}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          
          {/* Notes */}
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any observations for your doctor..."
            placeholderTextColor={colors.gray[400]}
            multiline
          />
          
          <View style={styles.formButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Save Session</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}
      
      <Text style={styles.disclaimer}>{THERAPY_DISCLAIMER.tdcs}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
  },
  unenrollText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  
  // Education styles
  educationCard: {
    alignItems: 'center',
    padding: 24,
  },
  educationEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  educationTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
  },
  educationText: {
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  warningBox: {
    width: '100%',
    backgroundColor: colors.danger[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger[400],
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger[700],
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: colors.danger[600],
    lineHeight: 22,
  },
  infoSection: {
    width: '100%',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 21,
  },
  enrollButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  enrollButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Form styles
  newSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
  },
  newSessionEmoji: {
    fontSize: 24,
  },
  newSessionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
  },
  formCard: {
    padding: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 20,
  },
  formRow: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: colors.gray[800],
    backgroundColor: colors.gray[50],
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
    marginTop: 16,
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingButtonSelected: {
    backgroundColor: colors.primary[500],
  },
  ratingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[600],
  },
  ratingButtonTextSelected: {
    color: '#FFFFFF',
  },
  sideEffectsGrid: {
    gap: 10,
  },
  sideEffectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 10,
  },
  sideEffectButtonSelected: {
    backgroundColor: colors.warning[50],
    borderColor: colors.warning[300],
  },
  sideEffectEmoji: {
    fontSize: 18,
  },
  sideEffectLabel: {
    fontSize: 14,
    color: colors.gray[700],
  },
  sideEffectLabelSelected: {
    color: colors.warning[700],
    fontWeight: '500',
  },
  severityRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginLeft: 36,
    gap: 8,
  },
  severityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.gray[100],
  },
  severityButtonSelected: {
    backgroundColor: colors.warning[400],
  },
  severityText: {
    fontSize: 12,
    color: colors.gray[600],
    textTransform: 'capitalize',
  },
  severityTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: colors.gray[500],
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
});

export default TDCSTracker;
