import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
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
  containerStyle?: any;
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
  headerRight
}: BottomSheetProps) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const Header = () => (
    <View style={styles.modalHeader}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={styles.headerActions}>
        {headerRight}
        {showCloseButton && (
          <TouchableOpacity 
            onPress={onClose} 
            style={[styles.closeBtn, { backgroundColor: isDark ? colors.border : '#eee' }]}
            activeOpacity={0.7}
          >
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isFullScreen) {
    return (
      <Modal 
        visible={visible} 
        animationType="slide" 
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View style={[styles.fullModal, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
            <Header />
          </View>
          <View style={{ flex: 1 }}>
            {children}
          </View>
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
        style={{ flex: 1 }}
      >
        <View style={[styles.modalOverlay, { flex: 1 }]}>
          <TouchableOpacity 
            style={styles.modalDismiss} 
            activeOpacity={1} 
            onPress={onClose} 
          />
          <View style={[
            styles.modalContent,
            { 
              backgroundColor: colors.card, 
              borderColor: colors.border, 
              paddingBottom: insets.bottom + 20 
            },
            containerStyle
          ]}>
            <Header />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
