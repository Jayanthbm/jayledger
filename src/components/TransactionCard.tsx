import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Transaction, MaterialIconName } from '../models/types';
import { useTheme } from '../store/ThemeContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Swipeable } from 'react-native-gesture-handler';
import { FinancialListItem } from './common/FinancialListItem';
import { logger } from '../utils/logger';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
  onFilterPayee?: (payeeId: string | null) => void;
  onFilterCategory?: (categoryId: string | null) => void;
  compact?: boolean;
}

export const TransactionCard = React.memo(
  ({
    transaction,
    onEdit,
    onDelete,
    onFilterPayee,
    onFilterCategory,
    compact = false,
  }: TransactionCardProps) => {
    const { colors } = useTheme();
    const swipeableRef = useRef<Swipeable>(null);
    const isIncome = transaction.type === 'Income';

    const handleEdit = () => {
      swipeableRef.current?.close();
      onEdit?.(transaction);
    };

    const handleDelete = () => {
      swipeableRef.current?.close();
      onDelete?.(transaction);
    };

    const handleOpenLink = () => {
      if (transaction.product_link) {
        Linking.openURL(transaction.product_link).catch((err) =>
          logger.error('Failed to open URL:', err),
        );
      }
    };

    const renderRightActions = () => (
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleEdit}
        >
          <Icon name="edit" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.danger }]}
          onPress={handleDelete}
        >
          <Icon name="delete" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );

    const payeeNode = transaction.payee_name ? (
      <TouchableOpacity
        style={styles.payeeRow}
        onPress={() => onFilterPayee?.(transaction.payee_id)}
        activeOpacity={0.6}
      >
        {transaction.payee_logo ? (
          <Image
            source={{ uri: transaction.payee_logo }}
            style={styles.payeeLogo}
            contentFit="contain"
            transition={200}
            cachePolicy="disk"
          />
        ) : (
          <View style={[styles.payeeLogoPlaceholder, { backgroundColor: colors.border }]}>
            <Icon name="person" size={10} color={colors.textSecondary} />
          </View>
        )}
        <Text style={[styles.payeeName, { color: colors.textSecondary }]}>
          {transaction.payee_name}
        </Text>
      </TouchableOpacity>
    ) : null;

    const linkNode = transaction.product_link ? (
      <TouchableOpacity
        style={[styles.linkPill, { backgroundColor: colors.primary + '10' }]}
        onPress={handleOpenLink}
        activeOpacity={0.6}
      >
        <Icon name="link" size={14} color={colors.primary} />
        <Text style={[styles.linkText, { color: colors.primary }]}>View Product</Text>
      </TouchableOpacity>
    ) : null;

    const footerNode = (
      <View style={styles.footerRow}>
        {payeeNode}
        {payeeNode && linkNode && <View style={styles.footerSeparator} />}
        {linkNode}
      </View>
    );

    const cardContent = (
      <FinancialListItem
        title={transaction.category_name || 'No Category'}
        subtitle={transaction.description || undefined}
        icon={(transaction.category_app_icon || 'receipt') as MaterialIconName}
        iconColor={isIncome ? colors.success : colors.primary}
        amountText={`${isIncome ? '+' : '-'} ${formatCurrency(transaction.amount)}`}
        amountColor={isIncome ? colors.success : colors.danger}
        metaText={formatDate(transaction.transaction_timestamp, compact ? 'dd MMM, p' : 'PPp')}
        rightBottomNode={footerNode}
        onIconPress={() => onFilterCategory?.(transaction.category_id)}
        compact={compact}
        containerStyle={compact ? styles.containerCompact : styles.containerNormal}
      />
    );

    if (onEdit || onDelete) {
      return (
        <Swipeable
          ref={swipeableRef}
          renderRightActions={renderRightActions}
          friction={2}
          rightThreshold={40}
        >
          {cardContent}
        </Swipeable>
      );
    }

    return cardContent;
  },
);

TransactionCard.displayName = 'TransactionCard';

const styles = StyleSheet.create({
  payeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  payeeLogo: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  payeeLogoPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  payeeName: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    marginRight: 16,
  },
  actionButton: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginLeft: 8,
  },
  containerCompact: {
    marginHorizontal: 0,
  },
  containerNormal: {
    marginHorizontal: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  linkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  linkText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
