import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { format } from 'date-fns';

const TransactionItem = ({ transaction, onPress, category }) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const isExpense = transaction.type === 'Expense';
  const amountColor = isExpense ? colors.expense : colors.income;
  const iconName = category?.app_icon || (isExpense ? 'shopping-cart' : 'attach-money');

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.secondaryContainer }]}>
        <MaterialDesignIcons name={iconName} size={24} color={colors.onSecondaryContainer} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.description, { color: colors.onSurface }]} numberOfLines={1}>
          {transaction.description || 'No Description'}
        </Text>
        <Text style={[styles.date, { color: colors.onSurfaceVariant }]}>
          {format(new Date(transaction.transaction_timestamp), 'MMM dd, yyyy • hh:mm a')}
        </Text>
      </View>

      <Text style={[styles.amount, { color: amountColor }]}>
        {isExpense ? '-' : '+'}₹{Math.abs(transaction.amount).toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TransactionItem;
