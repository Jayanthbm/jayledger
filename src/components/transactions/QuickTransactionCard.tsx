import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { QuickTransaction } from '../../models/types';
import { useTheme } from '../../store/ThemeContext';
import { formatCurrency } from '../../utils/formatters';

interface QuickTransactionCardProps {
  item: QuickTransaction;
  onPress: (item: QuickTransaction) => void;
  onLongPress?: (item: QuickTransaction) => void;
  showDelete?: boolean;
  onDelete?: (id: string) => void;
}

export const QuickTransactionCard: React.FC<QuickTransactionCardProps> = ({
  item,
  onPress,
  onLongPress,
  showDelete,
  onDelete,
}) => {
  const { colors } = useTheme();

  const isIncome = item.type === 'Income';
  const accentColor = isIncome ? colors.success : colors.danger;
  const bgColor = isIncome ? colors.success + '15' : colors.danger + '15';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
        <Icon
          name={isIncome ? 'add-circle-outline' : 'remove-circle-outline'}
          size={28}
          color={accentColor}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.amount, { color: accentColor }]}>
          {item.amount ? formatCurrency(item.amount) : 'Flexible'}
        </Text>
      </View>

      {showDelete && (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete?.(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  content: {
    alignItems: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  amount: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
