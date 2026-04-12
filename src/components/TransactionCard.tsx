import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { Transaction } from '../models/types';
import { useTheme } from '../store/ThemeContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { Swipeable } from 'react-native-gesture-handler';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
  onFilterCategory?: (catId: string) => void;
  onFilterPayee?: (payeeId: string | null) => void;
}

export const TransactionCard = React.memo(({ transaction, onEdit, onDelete, onFilterCategory, onFilterPayee }: TransactionCardProps) => {
  const { colors } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const isIncome = transaction.type === 'Income';

  const handleLinkPress = () => {
    if (transaction.product_link) {
      Linking.openURL(transaction.product_link).catch(err => console.error("Couldn't load page", err));
    }
  };

  const handleEdit = () => {
    swipeableRef.current?.close();
    onEdit?.(transaction);
  };

  const handleDelete = () => {
    swipeableRef.current?.close();
    onDelete?.(transaction);
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

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
    >
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.mainRow}>
          <TouchableOpacity 
            style={[styles.iconContainer, { backgroundColor: colors.background }]}
            onPress={() => onFilterCategory?.(transaction.category_id!)}
            activeOpacity={0.7}
          >
            <Icon 
              name={(transaction.category_app_icon || 'receipt') as any} 
              size={24} 
              color={isIncome ? colors.success : colors.primary} 
            />
          </TouchableOpacity>

          <View style={styles.middleSection}>
            <Text style={[styles.categoryName, { color: colors.text }]}>
              {transaction.category_name}
            </Text>
            
            {transaction.description && (
              <Text 
                style={[styles.description, { color: colors.textSecondary }]} 
                numberOfLines={2} 
                ellipsizeMode="tail"
              >
                {transaction.description}
              </Text>
            )}

            {transaction.payee_name && (
              <TouchableOpacity 
                style={styles.payeeRow}
                onPress={() => onFilterPayee?.(transaction.payee_id)}
                activeOpacity={0.6}
              >
                {transaction.payee_logo ? (
                  <Image source={{ uri: transaction.payee_logo }} style={styles.payeeLogo} />
                ) : (
                  <View style={[styles.payeeLogoPlaceholder, { backgroundColor: colors.border }]}>
                    <Icon name="person" size={10} color={colors.textSecondary} />
                  </View>
                )}
                <Text style={[styles.payeeName, { color: colors.textSecondary }]}>
                  {transaction.payee_name}
                </Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.dateTime, { color: colors.textSecondary + '80' }]}>
              {format(new Date(transaction.transaction_timestamp), 'PPp')}
            </Text>
          </View>

          <View style={styles.rightSection}>
            <Text style={[styles.amount, { color: isIncome ? colors.success : colors.danger }]}>
              {isIncome ? '+' : '-'} ₹{transaction.amount.toLocaleString()}
            </Text>
            
            {transaction.product_link && (
              <TouchableOpacity onPress={handleLinkPress} style={styles.linkButton}>
                <Icon name="link" size={14} color={colors.primary} />
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  View
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Swipeable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  middleSection: {
    flex: 1,
    paddingRight: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  payeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  },
  dateTime: {
    fontSize: 11,
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  amount: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  linkText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
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
});
