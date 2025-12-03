import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '../core/Text';
import { useTheme } from '../../context/ThemeContext';
import { formatIndianNumber } from '../../utils';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

const BalanceCard = ({ balance, daysLeft }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primaryContainer }]}>
      <View style={styles.content}>
        <View>
          <Text variant="labelLarge" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>
            Remaining Balance
          </Text>
          <Text variant="displayMedium" style={{ color: theme.colors.onPrimaryContainer, marginTop: 4, fontWeight: 'bold' }}>
            {formatIndianNumber(balance)}
          </Text>
        </View>

        <View style={[styles.daysContainer, { backgroundColor: theme.colors.surface }]}>
          <MaterialDesignIcons name="calendar-clock" size={20} color={theme.colors.primary} />
          <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: '600' }}>
            {daysLeft} Days Left
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 24,
    marginVertical: 8,
  },
  content: {
    gap: 16,
  },
  daysContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
});

export default BalanceCard;
