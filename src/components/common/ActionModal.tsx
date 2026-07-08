import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import { MaterialIconName } from '../../models/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ActionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: MaterialIconName;
  iconColor?: string;
  children?: React.ReactNode;
  primaryAction?: {
    label: string;
    onPress: () => void;
    color?: string;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

export const ActionModal: React.FC<ActionModalProps> = ({
  visible,
  onClose,
  title,
  description,
  icon,
  iconColor,
  children,
  primaryAction,
  secondaryAction,
}) => {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  {icon && (
                    <Icon
                      name={icon}
                      size={24}
                      color={iconColor || colors.primary}
                      style={styles.headerIcon}
                    />
                  )}
                  <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Icon name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {description && (
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {description}
                </Text>
              )}

              <View style={styles.content}>{children}</View>

              {(primaryAction || secondaryAction) && (
                <View style={styles.footer}>
                  {secondaryAction && (
                    <TouchableOpacity
                      style={[styles.button, styles.secondaryButton]}
                      onPress={secondaryAction.onPress}
                    >
                      <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
                        {secondaryAction.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {primaryAction && (
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.primaryButton,
                        { backgroundColor: primaryAction.color || colors.primary },
                      ]}
                      onPress={primaryAction.onPress}
                      disabled={primaryAction.loading}
                    >
                      <Text style={styles.primaryActionText}>{primaryAction.label}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.8,
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  content: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    // Background color from prop
  },
  secondaryButton: {
    // Transparency / Border if needed
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
