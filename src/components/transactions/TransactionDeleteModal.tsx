import type { ThemeColors } from '../../models/types';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { BottomSheet } from '../BottomSheet';
import { Transaction } from '../../models/types';
import { common } from '../../styles/common';

interface TransactionDeleteModalProps {
  transaction: Transaction | null;
  onCancel: () => void;
  onConfirm: () => void;
  colors: ThemeColors;
}

export const TransactionDeleteModal = React.memo(
  ({ transaction, onCancel, onConfirm, colors }: TransactionDeleteModalProps) => (
    <BottomSheet visible={!!transaction} onClose={onCancel} title="Delete Transaction?">
      <View style={common.pb10}>
        <View style={styles.deleteHeader}>
          <View style={[styles.deleteIconBg, { backgroundColor: colors.danger + '15' }]}>
            <Icon name="delete-outline" size={28} color={colors.danger} />
          </View>
          <Text style={[styles.deleteSub, { color: colors.textSecondary }]}>
            This action cannot be undone. Are you sure you want to delete this transaction?
          </Text>
        </View>

        <View style={[styles.deleteActions, common.mt24]}>
          <TouchableOpacity
            style={[styles.deleteBtn, styles.deleteBtnDanger, { backgroundColor: colors.danger }]}
            onPress={onConfirm}
          >
            <Text style={styles.deleteBtnText}>Confirm Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  ),
);
TransactionDeleteModal.displayName = 'TransactionDeleteModal';

const styles = StyleSheet.create({
  deleteHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  deleteIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteSub: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  deleteActions: {
    width: '100%',
    gap: 12,
  },
  deleteBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnDanger: {
    height: 56,
    borderRadius: 16,
  },
  deleteBtnText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
});
