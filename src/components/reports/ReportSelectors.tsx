import type { ThemeColors } from '../../models/types';
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { SegmentedControl } from '../SegmentedControl';
import { YearMonthSelector } from '../YearMonthSelector';
import {
  isBefore,
  isAfter,
  endOfMonth,
  startOfMonth,
  subMonths,
  subYears,
  addMonths,
  addYears,
} from 'date-fns';
import { common } from '../../styles/common';

interface ReportSelectorsProps {
  type: 'Expense' | 'Income';
  setType: (type: 'Expense' | 'Income') => void;
  year: string;
  month: number;
  setYear: (year: string) => void;
  setMonth: (month: number) => void;
  reportType: string;
  minDate: Date;
  maxDate: Date;
  showTypeToggle: boolean;
  showYearSelector: boolean;
  showMonthSelector: boolean;
  colors: ThemeColors;
}

export const ReportSelectors: React.FC<ReportSelectorsProps> = ({
  type,
  setType,
  year,
  month,
  setYear,
  setMonth,
  reportType,
  minDate,
  maxDate,
  showTypeToggle,
  showYearSelector,
  showMonthSelector,
  colors,
}) => {
  const handlePrev = () => {
    const current = new Date(parseInt(year), month, 1);
    const prev = reportType === 'yearlySummary' ? subYears(current, 1) : subMonths(current, 1);

    if (!isBefore(endOfMonth(prev), startOfMonth(minDate))) {
      setYear(prev.getFullYear().toString());
      setMonth(prev.getMonth());
    }
  };

  const handleNext = () => {
    const current = new Date(parseInt(year), month, 1);
    const next = reportType === 'yearlySummary' ? addYears(current, 1) : addMonths(current, 1);

    if (!isAfter(startOfMonth(next), endOfMonth(maxDate))) {
      setYear(next.getFullYear().toString());
      setMonth(next.getMonth());
    }
  };

  const prevDisabled =
    reportType === 'yearlySummary'
      ? isBefore(endOfMonth(subYears(new Date(parseInt(year), month, 1), 1)), startOfMonth(minDate))
      : isBefore(
          endOfMonth(subMonths(new Date(parseInt(year), month, 1), 1)),
          startOfMonth(minDate),
        );

  const nextDisabled =
    reportType === 'yearlySummary'
      ? isAfter(startOfMonth(addYears(new Date(parseInt(year), month, 1), 1)), endOfMonth(maxDate))
      : isAfter(
          startOfMonth(addMonths(new Date(parseInt(year), month, 1), 1)),
          endOfMonth(maxDate),
        );

  return (
    <View style={styles.selectors}>
      {showTypeToggle && (
        <SegmentedControl
          options={[
            { label: 'Expense', value: 'Expense', activeColor: colors.danger },
            { label: 'Income', value: 'Income', activeColor: colors.success },
          ]}
          selectedValue={type}
          onValueChange={(val) => setType(val as 'Expense' | 'Income')}
          variant="medium"
          containerStyle={common.mb16}
        />
      )}

      {showYearSelector && (
        <View style={styles.dateSelectorContainer}>
          <TouchableOpacity style={styles.navArrow} onPress={handlePrev} disabled={prevDisabled}>
            <Icon
              name="chevron-left"
              size={28}
              color={prevDisabled ? colors.border : colors.text}
            />
          </TouchableOpacity>
          <View style={styles.selectorWrapper}>
            <YearMonthSelector
              year={year}
              month={month}
              onYearChange={setYear}
              onMonthChange={setMonth}
              showMonths={showMonthSelector}
            />
          </View>
          <TouchableOpacity style={styles.navArrow} onPress={handleNext} disabled={nextDisabled}>
            <Icon
              name="chevron-right"
              size={28}
              color={nextDisabled ? colors.border : colors.text}
            />
          </TouchableOpacity>
        </View>
      )}

      {((reportType === 'yearlySummary' && parseInt(year) !== new Date().getFullYear()) ||
        (reportType !== 'payees' &&
          reportType !== 'categories' &&
          reportType !== 'yearlySummary' &&
          (month !== new Date().getMonth() || parseInt(year) !== new Date().getFullYear()))) && (
        <View style={styles.backToCurrentContainer}>
          <TouchableOpacity
            style={[styles.backToCurrentBtn, { backgroundColor: colors.primary + '15' }]}
            onPress={() => {
              setYear(new Date().getFullYear().toString());
              setMonth(new Date().getMonth());
            }}
          >
            <Icon name="today" size={14} color={colors.primary} style={styles.backToCurrentIcon} />
            <Text style={[styles.backToCurrentText, { color: colors.primary }]}>
              {reportType === 'yearlySummary' ? 'Back to Current Year' : 'Back to Current Month'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  selectors: { paddingHorizontal: 16, marginBottom: 16, paddingTop: 12 },
  dateSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
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
  backToCurrentContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  backToCurrentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  backToCurrentIcon: {
    marginRight: 6,
  },
  backToCurrentText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
