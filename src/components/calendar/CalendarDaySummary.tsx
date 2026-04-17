import type { ThemeColors } from '../../models/types';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';

interface CalendarDaySummaryProps {
  selectedDate: Date;
  totalForDay: number;
  colors: ThemeColors;
}

export const CalendarDaySummary: React.FC<CalendarDaySummaryProps> = ({
  selectedDate,
  totalForDay,
  colors,
}) => {
  return (
    <View style={styles.daySummary}>
      <Text style={[styles.summaryDate, { color: colors.text }]}>
        {format(selectedDate, 'EEE, MMM d, yyyy')}
      </Text>
      <Text
        style={[styles.summaryAmount, { color: totalForDay >= 0 ? colors.success : colors.danger }]}
      >
        {totalForDay >= 0 ? '+' : ''}₹{totalForDay.toLocaleString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  daySummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  summaryDate: { fontSize: 15, fontWeight: 'bold' },
  summaryAmount: { fontSize: 16, fontWeight: 'bold' },
});
