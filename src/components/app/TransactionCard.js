// src/components/app/TransactionCard.js

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import Text from '../core/Text';
import Card from '../core/Card';
import { useTheme } from '../../context/ThemeContext';
import TurboImage from 'react-native-turbo-image';

const TransactionCard = ({ transaction, category, payee }) => {
   const { theme } = useTheme();

   const isExpense = transaction.type === 'Expense';
   const amountColor = isExpense ? theme.colors.error : theme.colors.primary;
   const iconBackgroundColor = isExpense ? theme.colors.errorContainer : theme.colors.primaryContainer;
   const iconColor = isExpense ? theme.colors.onErrorContainer : theme.colors.onPrimaryContainer;

   const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
   }).format(transaction.amount);

   return (
      <Card style={styles.card}>
         <View style={styles.container}>
            {/* Left Icon */}
            <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
               <MaterialDesignIcons
                  name={category?.app_icon || 'cash'}
                  size={24}
                  color={iconColor}
               />
            </View>

            {/* Center Content */}
            <View style={styles.contentContainer}>
               <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                  {category?.name || 'Uncategorized'}
               </Text>
               {transaction.description ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                     {transaction.description}
                  </Text>
               ) : null}
               {payee ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                     <TurboImage
                        source={{ uri: payee.logo }}
                        style={{ width: 20, height: 20, borderRadius: 10 }}
                        cachePolicy="urlCache"
                     />
                     <Text variant="labelSmall" style={{ color: theme.colors.primary, marginTop: 2 }}>
                        {payee.name}
                     </Text>
                  </View>
               ) : null}
            </View>

            {/* Right Amount */}
            <Text variant="titleMedium" style={{ color: amountColor }}>
               {isExpense ? '-' : '+'}{formattedAmount}
            </Text>
         </View>
      </Card>
   );
};

const styles = StyleSheet.create({
   card: {
      marginBottom: 8,
      padding: 12,
   },
   container: {
      flexDirection: 'row',
      alignItems: 'center',
   },
   iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
   },
   contentContainer: {
      flex: 1,
      marginRight: 16,
   },
});

export default React.memo(TransactionCard);
