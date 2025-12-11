import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { borderRadius, shadows } from '../../theme/spacing';

type ModalSize = 'sm' | 'md' | 'lg' | 'full';
type ModalAnimation = 'fade' | 'slide' | 'zoom';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
  size?: ModalSize;
  animation?: ModalAnimation;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  footer?: React.ReactNode;
  style?: ViewStyle;
  haptic?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  children,
  size = 'md',
  animation = 'slide',
  showCloseButton = true,
  closeOnBackdrop = true,
  footer,
  style,
  haptic = true,
}) => {
  const handleBackdropPress = async () => {
    if (closeOnBackdrop) {
      if (haptic) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onClose();
    }
  };

  const handleClose = async () => {
    if (haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const getEnteringAnimation = () => {
    switch (animation) {
      case 'fade':
        return FadeIn.duration(200);
      case 'zoom':
        return ZoomIn.duration(200).springify();
      case 'slide':
      default:
        return SlideInDown.duration(300).springify();
    }
  };

  const getExitingAnimation = () => {
    switch (animation) {
      case 'fade':
        return FadeOut.duration(150);
      case 'zoom':
        return ZoomOut.duration(150);
      case 'slide':
      default:
        return SlideOutDown.duration(200);
    }
  };

  const modalContentStyles: ViewStyle[] = [
    styles.modalContent,
    styles[`size_${size}` as keyof typeof styles] as ViewStyle,
    style,
  ].filter(Boolean) as ViewStyle[];

  if (!visible) return null;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <AnimatedPressable
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.backdrop}
          onPress={handleBackdropPress}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          pointerEvents="box-none"
        >
          <Animated.View
            entering={getEnteringAnimation()}
            exiting={getExitingAnimation()}
            style={modalContentStyles}
          >
            {/* Header */}
            {(title || showCloseButton || icon) && (
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  {icon && (
                    <View style={styles.iconContainer}>
                      <Text style={styles.icon}>{icon}</Text>
                    </View>
                  )}
                  <View style={styles.headerText}>
                    {title && <Text style={styles.title}>{title}</Text>}
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                  </View>
                </View>
                {showCloseButton && (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Body */}
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {children}
            </ScrollView>

            {/* Footer */}
            {footer && <View style={styles.footer}>{footer}</View>}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
};

// Confirm Modal with enhanced styling
interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  icon,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
}) => {
  const handleConfirm = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  const getConfirmButtonColors = (): [string, string] => {
    switch (confirmVariant) {
      case 'danger':
        return [colors.danger[500], colors.danger[600]];
      case 'success':
        return [colors.success[500], colors.success[600]];
      default:
        return [colors.primary[500], colors.primary[600]];
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      size="sm"
      animation="zoom"
      showCloseButton={false}
      closeOnBackdrop={!loading}
    >
      <View style={styles.confirmContent}>
        {icon && (
          <View style={styles.confirmIconContainer}>
            <Text style={styles.confirmIcon}>{icon}</Text>
          </View>
        )}
        <Text style={styles.confirmTitle}>{title}</Text>
        <Text style={styles.confirmMessage}>{message}</Text>
      </View>
      <View style={styles.confirmFooter}>
        <TouchableOpacity
          style={[styles.confirmButton, styles.cancelButton]}
          onPress={onClose}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>{cancelText}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={getConfirmButtonColors()}
            style={styles.confirmButtonGradient}
          >
            <Text style={styles.confirmButtonText}>
              {loading ? '...' : confirmText}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// Action Sheet Modal
interface ActionSheetOption {
  label: string;
  icon?: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
  cancelLabel?: string;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  visible,
  onClose,
  title,
  options,
  cancelLabel = 'Cancel',
}) => {
  const handleOptionPress = async (option: ActionSheetOption) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    option.onPress();
    onClose();
  };

  if (!visible) return null;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <AnimatedPressable
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.backdrop}
          onPress={onClose}
        />
        <Animated.View
          entering={SlideInDown.duration(300).springify()}
          exiting={SlideOutDown.duration(200)}
          style={styles.actionSheetContainer}
        >
          <View style={styles.actionSheet}>
            {title && <Text style={styles.actionSheetTitle}>{title}</Text>}
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionSheetOption,
                  index === 0 && !title && styles.actionSheetOptionFirst,
                  option.disabled && styles.actionSheetOptionDisabled,
                ]}
                onPress={() => handleOptionPress(option)}
                disabled={option.disabled}
                activeOpacity={0.7}
              >
                {option.icon && (
                  <Text style={styles.actionSheetIcon}>{option.icon}</Text>
                )}
                <Text
                  style={[
                    styles.actionSheetLabel,
                    option.destructive && styles.actionSheetLabelDestructive,
                    option.disabled && styles.actionSheetLabelDisabled,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.actionSheetCancel}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.actionSheetCancelText}>{cancelLabel}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    ...shadows.xl,
    maxHeight: '90%',
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[800],
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 16,
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.gray[500],
    fontWeight: '600',
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },

  // Sizes
  size_sm: {
    maxWidth: 340,
  },
  size_md: {
    maxWidth: 480,
  },
  size_lg: {
    maxWidth: 640,
  },
  size_full: {
    maxWidth: '100%',
    maxHeight: '100%',
    borderRadius: 0,
  },

  // Confirm modal
  confirmContent: {
    alignItems: 'center',
    paddingTop: 8,
  },
  confirmIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmIcon: {
    fontSize: 32,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[800],
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 15,
    color: colors.gray[600],
    lineHeight: 22,
    textAlign: 'center',
  },
  confirmFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  confirmButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray[100],
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Action Sheet
  actionSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 34,
  },
  actionSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionSheetTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[500],
    textAlign: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  actionSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: 10,
  },
  actionSheetOptionFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  actionSheetOptionDisabled: {
    opacity: 0.5,
  },
  actionSheetIcon: {
    fontSize: 20,
  },
  actionSheetLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.primary[500],
  },
  actionSheetLabelDestructive: {
    color: colors.danger[500],
  },
  actionSheetLabelDisabled: {
    color: colors.gray[400],
  },
  actionSheetCancel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  actionSheetCancelText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[600],
  },
});

export default Modal;
