import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { TransactionCard } from '../TransactionCard';
import { useTheme } from '../../store/ThemeContext';
import { Transaction } from '../../models/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { common } from '../../styles/common';

interface BudgetDrillDownModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  loading: boolean;
  transactions: Transaction[];
}

export const BudgetDrillDownModal: React.FC<BudgetDrillDownModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  loading,
  transactions,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const dynamicStyles = React.useMemo(
    () => ({ paddingBottom: insets.bottom + 40 }),
    [insets.bottom],
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} subtitle={subtitle} isFullScreen>
      <View style={common.flex1}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={common.mt40} />
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TransactionCard transaction={item} />}
            contentContainerStyle={dynamicStyles}
            ListEmptyComponent={
              <View style={styles.emptyDrill}>
                <MaterialIcons name="search-off" size={64} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No transactions found for this budget
                </Text>
              </View>
            }
          />
        )}
      </View>
    </BottomSheet>
  );
};
BudgetDrillDownModal.displayName = 'BudgetDrillDownModal';

const styles = StyleSheet.create({
  emptyDrill: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 12,
  },
});
