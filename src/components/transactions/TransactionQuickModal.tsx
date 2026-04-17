import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { BottomSheet } from '../BottomSheet';
import { QuickTransaction } from '../../models/types';
import { common } from '../../styles/common';

interface TransactionQuickModalProps {
  visible: boolean;
  onClose: () => void;
  quickTransactions: QuickTransaction[];
  onSelect: (item: QuickTransaction) => void;
  colors: any;
}

export const TransactionQuickModal = React.memo(
  ({ visible, onClose, quickTransactions, onSelect, colors }: TransactionQuickModalProps) => (
    <BottomSheet visible={visible} onClose={onClose} title="Quick Transactions">
      <FlatList
        data={quickTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.quickItem,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
            onPress={() => onSelect(item)}
          >
            <View
              style={[
                styles.quickIcon,
                {
                  backgroundColor:
                    item.type === 'Income' ? colors.success + '20' : colors.danger + '20',
                },
              ]}
            >
              <Icon
                name={item.type === 'Income' ? 'add' : 'remove'}
                size={24}
                color={item.type === 'Income' ? colors.success : colors.danger}
              />
            </View>
            <View style={common.flex1}>
              <Text style={[styles.quickName, { color: colors.text }]}>{item.name}</Text>
              {item.amount ? (
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  ₹{item.amount.toLocaleString()}
                </Text>
              ) : null}
            </View>
            <Icon name="chevron-right" size={24} color={colors.border} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={common.alignCenterMt40}>
            <Text style={{ color: colors.textSecondary }}>
              No templates found. Define some in Settings.
            </Text>
          </View>
        }
      />
    </BottomSheet>
  ),
);
TransactionQuickModal.displayName = 'TransactionQuickModal';

const styles = StyleSheet.create({
  quickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickName: {
    fontSize: 16,
    fontWeight: '700',
  },
});
