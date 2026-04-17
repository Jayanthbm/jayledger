import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { BottomSheet } from '../BottomSheet';
import { Transaction } from '../../models/types';

interface TransactionDeleteModalProps {
  transaction: Transaction | null;
  onCancel: () => void;
  onConfirm: () => void;
  colors: any;
}

export const TransactionDeleteModal = React.memo(({ transaction, onCancel, onConfirm, colors }: TransactionDeleteModalProps) => (
  <BottomSheet
    visible={!!transaction}
    onClose={onCancel}
    title="Delete Transaction?"
  >
    <View style={{ paddingBottom: 10 }}>
        <View style={styles.deleteHeader}>
          <View style={[styles.deleteIconBg, { backgroundColor: colors.danger + '15' }]}>
            <Icon name="delete-outline" size={28} color={colors.danger} />
          </View>
          <Text style={[styles.deleteSub, { color: colors.textSecondary, textAlign: 'center', marginTop: 12, fontSize: 16 }]}>This action cannot be undone. Are you sure you want to delete this transaction?</Text>
        </View>

        <View style={[styles.deleteActions, { marginTop: 24 }]}>
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: colors.danger, borderRadius: 16, height: 56 }]}
            onPress={onConfirm}
          >
            <Text style={styles.deleteBtnText}>Confirm Delete</Text>
          </TouchableOpacity>
        </View>
    </View>
  </BottomSheet>
));

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
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  deleteActions: {
    width: '100%',
    gap: 12,
  },
  deleteBtn: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
});
