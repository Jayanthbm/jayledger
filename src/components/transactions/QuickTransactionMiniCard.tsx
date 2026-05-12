import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { QuickTransaction } from '../../models/types';
import { useTheme } from '../../store/ThemeContext';
import { formatCurrency } from '../../utils/formatters';

interface QuickTransactionMiniCardProps {
  item: QuickTransaction;
  onPress: (item: QuickTransaction) => void;
}

export const QuickTransactionMiniCard: React.FC<QuickTransactionMiniCardProps> = ({
  item,
  onPress,
}) => {
  const { colors } = useTheme();

  const isIncome = item.type === 'Income';
  const accentColor = isIncome ? colors.success : colors.danger;
  const bgColor = isIncome ? colors.success + '15' : colors.danger + '15';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.identifierCircle, { backgroundColor: bgColor }]}>
        <Text style={[styles.identifierText, { color: accentColor }]}>
          {item.identifier || item.name.slice(0, 2).toUpperCase()}
        </Text>
      </View>

      <Text style={[styles.amount, { color: accentColor }]} numberOfLines={1}>
        {item.amount ? formatCurrency(item.amount).replace('.00', '') : 'Flex'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 4,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  identifierCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  identifierText: {
    fontSize: 14,
    fontWeight: '800',
  },
  amount: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
