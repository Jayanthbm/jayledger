import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export interface TransactionFormFieldsProps {
  amount: string;
  setAmount: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  iconColor: string;
  colors: Record<string, string>;
  autoFocus?: boolean;
}

export const TransactionFormFields = ({
  amount,
  setAmount,
  description,
  setDescription,
  iconColor,
  colors,
  autoFocus = false,
}: TransactionFormFieldsProps) => {
  return (
    <View
      style={[
        styles.mainFormCard,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      <View style={styles.amountRow}>
        <Text style={[styles.currencySymbol, { color: iconColor }]}>₹</Text>
        <TextInput
          style={[styles.amountInput, { color: iconColor }]}
          placeholder="0"
          placeholderTextColor={colors.border}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          autoFocus={autoFocus}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <TextInput
        style={[styles.descInput, { color: colors.text }]}
        placeholder="Add a note..."
        placeholderTextColor={colors.textSecondary + '70'}
        value={description}
        onChangeText={setDescription}
        maxLength={255}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainFormCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '700',
    flex: 1,
    padding: 0,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 16,
  },
  descInput: {
    fontSize: 16,
    padding: 0,
  },
});
