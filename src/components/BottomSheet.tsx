import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ViewStyle,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../store/ThemeContext';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isFullScreen?: boolean;
  showCloseButton?: boolean;
  containerStyle?: ViewStyle | ViewStyle[];
  headerRight?: React.ReactNode;
}

export const BottomSheet = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  isFullScreen = false,
  showCloseButton = true,
  containerStyle,
  headerRight,
}: BottomSheetProps) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const themedStyles = React.useMemo(
    () => ({
      closeButton: { backgroundColor: isDark ? colors.border : '#eee' },
      fullModal: { backgroundColor: colors.background, paddingTop: insets.top },
      modalContent: {
        backgroundColor: colors.card,
        borderColor: colors.border,
        paddingBottom: insets.bottom + 20,
      },
    }),
    [colors.background, colors.border, colors.card, insets.bottom, insets.top, isDark],
  );

  const renderHeader = () => (
    <View style={styles.modalHeader}>
      <View style={styles.leftAction}>
        {showCloseButton && (
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, themedStyles.closeButton]}
            activeOpacity={0.7}
          >
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerAction}>
        <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightAction}>{headerRight}</View>
    </View>
  );

  if (isFullScreen) {
    return (
      <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
        <View style={[styles.fullModal, themedStyles.fullModal]}>
          <View style={styles.fullHeaderContainer}>{renderHeader()}</View>
          <View style={styles.flex1}>{children}</View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={onClose} />
          <View style={[styles.modalContent, themedStyles.modalContent, containerStyle]}>
            {renderHeader()}
            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  fullModal: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '90%',
    borderTopWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    minHeight: 40,
  },
  leftAction: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  rightAction: {
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },
  centerAction: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullHeaderContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  flex1: {
    flex: 1,
  },
});
