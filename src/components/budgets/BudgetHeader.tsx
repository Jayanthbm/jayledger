import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { YearMonthSelector } from '../YearMonthSelector';
import {
  getYear,
  getMonth,
  endOfMonth,
  subMonths,
  addMonths,
  isBefore,
  startOfMonth,
  isAfter,
} from 'date-fns';
import { common } from '../../styles/common';

interface BudgetHeaderProps {
  selectedDate: Date;
  minDate: Date;
  maxDate: Date;
  sortBy: string;
  sortAsc: boolean;
  onPrev: () => void;
  onNext: () => void;
  onYearMonthChange: (date: Date) => void;
  onSortPress: () => void;
}

export const BudgetHeader: React.FC<BudgetHeaderProps> = ({
  selectedDate,
  minDate,
  maxDate,
  sortBy,
  sortAsc,
  onPrev,
  onNext,
  onYearMonthChange,
  onSortPress,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
    >
      <View style={styles.headerControls}>
        <View style={styles.periodNavigation}>
          <TouchableOpacity
            style={styles.navArrow}
            onPress={onPrev}
            disabled={isBefore(endOfMonth(subMonths(selectedDate, 1)), startOfMonth(minDate))}
          >
            <MaterialIcons
              name="chevron-left"
              size={28}
              color={
                isBefore(endOfMonth(subMonths(selectedDate, 1)), startOfMonth(minDate))
                  ? colors.border
                  : colors.text
              }
            />
          </TouchableOpacity>
          <View style={styles.selectorWrapper}>
            <YearMonthSelector
              year={getYear(selectedDate).toString()}
              month={getMonth(selectedDate)}
              onYearChange={(y) => {
                const newDate = new Date(selectedDate);
                newDate.setFullYear(parseInt(y));
                onYearMonthChange(newDate);
              }}
              onMonthChange={(m) => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(m);
                onYearMonthChange(newDate);
              }}
            />
          </View>
          <TouchableOpacity
            style={styles.navArrow}
            onPress={onNext}
            disabled={isAfter(startOfMonth(addMonths(selectedDate, 1)), endOfMonth(maxDate))}
          >
            <MaterialIcons
              name="chevron-right"
              size={28}
              color={
                isAfter(startOfMonth(addMonths(selectedDate, 1)), endOfMonth(maxDate))
                  ? colors.border
                  : colors.text
              }
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.sortButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={onSortPress}
        >
          <View style={common.flexRowCenterGap4}>
            <MaterialIcons name="sort" size={18} color={colors.primary} />
            <MaterialIcons
              name={sortAsc ? 'arrow-upward' : 'arrow-downward'}
              size={14}
              color={colors.primary}
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.captionRow}>
        <Text style={[styles.sortCaption, { color: colors.textSecondary }]}>
          Sorted by {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
        </Text>
      </View>
    </View>
  );
};
BudgetHeader.displayName = 'BudgetHeader';

const styles = StyleSheet.create({
  header: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1.5,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navArrow: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorWrapper: {
    width: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortButton: {
    width: 64,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionRow: {
    marginTop: 2,
    alignItems: 'flex-end',
  },
  sortCaption: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
