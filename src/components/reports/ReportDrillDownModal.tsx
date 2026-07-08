import type { ThemeColors } from '../../models/types';
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { TransactionCard } from '../TransactionCard';
import Icon from '@expo/vector-icons/MaterialIcons';
import { Transaction } from '../../models/types';
import { common } from '../../styles/common';

interface ReportDrillDownModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  data: Transaction[];
  colors: ThemeColors;
  bottomInset: number;
}

export const ReportDrillDownModal: React.FC<ReportDrillDownModalProps> = ({
  visible,
  onClose,
  title,
  data,
  colors,
  bottomInset,
}) => {
  const dynamicStyles = React.useMemo(() => ({ paddingBottom: bottomInset + 40 }), [bottomInset]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} isFullScreen>
      <View style={common.flex1}>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionCard transaction={item} />}
          contentContainerStyle={dynamicStyles}
          ListEmptyComponent={
            <View style={common.alignCenterMt60}>
              <Icon name="receipt-long" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No transactions found
              </Text>
            </View>
          }
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  emptyText: { textAlign: 'center', marginTop: 12 },
});
