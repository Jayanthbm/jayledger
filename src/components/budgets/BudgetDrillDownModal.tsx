import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { TransactionCard } from '../TransactionCard';
import { useTheme } from '../../store/ThemeContext';
import { Transaction } from '../../models/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  transactions
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      isFullScreen
    >
      <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <TransactionCard transaction={item} />}
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            ListEmptyComponent={
              <View style={styles.emptyDrill}>
                <MaterialIcons name="search-off" size={64} color={colors.border} />
                <Text style={{ textAlign: 'center', marginTop: 12, color: colors.textSecondary }}>
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

const styles = StyleSheet.create({
  emptyDrill: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
});
