import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { QuickTransaction } from '../../models/types';
import { common } from '../../styles/common';
import { useTheme } from '../../store/ThemeContext';
import { QuickTransactionMiniCard } from './QuickTransactionMiniCard';

interface TransactionQuickModalProps {
  visible: boolean;
  onClose: () => void;
  quickTransactions: QuickTransaction[];
  onSelect: (item: QuickTransaction) => void;
}

export const TransactionQuickModal = React.memo(
  ({ visible, onClose, quickTransactions, onSelect }: TransactionQuickModalProps) => {
    const { colors } = useTheme();
    const themedStyles = React.useMemo(
      () => ({
        emptyText: { color: colors.textSecondary },
        gridContainer: { padding: 4 },
      }),
      [colors.textSecondary],
    );

    return (
      <BottomSheet visible={visible} onClose={onClose} title="Quick Transactions">
        <FlatList
          data={quickTransactions}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={({ item }) => <QuickTransactionMiniCard item={item} onPress={onSelect} />}
          contentContainerStyle={themedStyles.gridContainer}
          ListEmptyComponent={
            <View style={common.alignCenterMt40}>
              <Text style={themedStyles.emptyText}>
                No templates found. Define some in Settings.
              </Text>
            </View>
          }
        />
      </BottomSheet>
    );
  },
);
TransactionQuickModal.displayName = 'TransactionQuickModal';
