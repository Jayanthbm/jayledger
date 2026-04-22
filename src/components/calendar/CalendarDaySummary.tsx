import type { ThemeColors } from '../../models/types';
import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface CalendarDaySummaryProps {
  selectedDate: Date;
  totalForDay: number;
  colors: ThemeColors;
  showTodayButton: boolean;
  onGoToToday: () => void;
  isCollapsed: boolean;
  showToggleButton: boolean;
  onToggleCalendar: () => void;
}

export const CalendarDaySummary: React.FC<CalendarDaySummaryProps> = ({
  selectedDate,
  totalForDay,
  colors,
  showTodayButton,
  onGoToToday,
  isCollapsed,
  showToggleButton,
  onToggleCalendar,
}) => {
  return (
    <View style={styles.daySummary}>
      <Text style={[styles.summaryDate, { color: colors.text }]}>
        {formatDate(selectedDate, 'EEE, MMM d, yyyy')}
      </Text>

      <View style={styles.centerActions}>
        {showTodayButton && (
          <TouchableOpacity
            onPress={onGoToToday}
            style={[styles.actionIcon, { backgroundColor: colors.primary + '15' }]}
          >
            <MaterialIcons name="today" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
        {showToggleButton && (
          <TouchableOpacity
            onPress={onToggleCalendar}
            style={[styles.actionIcon, { backgroundColor: colors.border + '30' }]}
          >
            <MaterialIcons
              name={isCollapsed ? 'keyboard-arrow-down' : 'keyboard-arrow-up'}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        )}
      </View>

      <Text
        style={[styles.summaryAmount, { color: totalForDay >= 0 ? colors.success : colors.danger }]}
      >
        {totalForDay >= 0 ? '+' : ''}
        {formatCurrency(totalForDay)}
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
  summaryDate: { fontSize: 13, fontWeight: 'bold', flex: 1.2 },
  summaryAmount: { fontSize: 16, fontWeight: 'bold', flex: 1, textAlign: 'right' },
  centerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
