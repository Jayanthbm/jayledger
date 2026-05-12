import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { common } from '../../styles/common';

export interface TransactionFormFieldsProps {
  amount: string;
  setAmount: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  productLink: string;
  setProductLink: (val: string) => void;
  identifier?: string;
  setIdentifier?: (val: string) => void;
  iconColor: string;
  colors: Record<string, string>;
  autoFocus?: boolean;
}

export const TransactionFormFields = ({
  amount,
  setAmount,
  description,
  setDescription,
  productLink,
  setProductLink,
  identifier,
  setIdentifier,
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

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.descInput, { color: colors.text }]}
          placeholder="Add a note..."
          placeholderTextColor={colors.textSecondary + '70'}
          value={description}
          onChangeText={setDescription}
          maxLength={255}
        />
        {setIdentifier && (
          <>
            <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
            <TextInput
              style={[styles.identifierInput, { color: colors.text }]}
              placeholder="ID"
              placeholderTextColor={colors.textSecondary + '70'}
              value={identifier}
              onChangeText={(text) => setIdentifier(text.toUpperCase().slice(0, 2))}
              maxLength={2}
              autoCapitalize="characters"
            />
          </>
        )}
      </View>

      <View
        style={[styles.divider, styles.dividerWithMargin, { backgroundColor: colors.border }]}
      />

      <View style={styles.linkRow}>
        <Icon name="link" size={20} color={colors.textSecondary} style={common.mr8} />
        <TextInput
          style={[styles.linkInput, { color: colors.text }]}
          placeholder="Product link (optional)..."
          placeholderTextColor={colors.textSecondary + '70'}
          value={productLink}
          onChangeText={setProductLink}
          keyboardType="url"
          autoCapitalize="none"
        />
      </View>
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
  },
  dividerWithMargin: {
    marginTop: 16,
    marginBottom: 16,
  },
  descInput: {
    fontSize: 16,
    paddingVertical: 8,
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verticalDivider: {
    width: 1,
    height: 24,
  },
  identifierInput: {
    fontSize: 16,
    fontWeight: '700',
    width: 40,
    textAlign: 'center',
    paddingVertical: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkInput: {
    fontSize: 14,
    flex: 1,
    paddingVertical: 8,
  },
});
