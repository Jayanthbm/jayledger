import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getMinTransactionDate } from '../db/queries';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { startOfMonth, endOfMonth, isBefore, isAfter } from 'date-fns';
import { BottomSheet } from './BottomSheet';
import { logger } from '../utils/logger';

interface YearMonthSelectorProps {
  year: string;
  month: number;
  onYearChange: (year: string) => void;
  onMonthChange: (month: number) => void;
  showMonths?: boolean;
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function YearMonthSelector({
  year,
  month,
  onYearChange,
  onMonthChange,
  showMonths = true,
}: YearMonthSelectorProps) {
  const { colors } = useTheme();
  const { session } = useAuth();
  const [showPicker, setShowPicker] = useState(false);
  const [minDate, setMinDate] = useState<Date>(new Date(new Date().getFullYear(), 0, 1));
  const maxDate = useMemo(() => endOfMonth(new Date()), []);

  useEffect(() => {
    const fetchMinDate = async () => {
      if (session?.user?.id) {
        try {
          const d = await getMinTransactionDate(session.user.id);
          if (d) setMinDate(new Date(d));
        } catch (error) {
          logger.error('Error fetching min transaction date:', error);
        }
      }
    };
    fetchMinDate();
  }, [session?.user?.id]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = minDate.getFullYear();
    const arr = [];
    for (let y = currentYear; y >= startYear; y--) arr.push(y.toString());
    return arr;
  }, [minDate]);

  const displayLabel = useMemo(() => {
    if (!showMonths) return year;
    return `${months[month].slice(0, 3)} ${year}`;
  }, [showMonths, month, year]);

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={[
          styles.selectorTrigger,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.triggerText, { color: colors.text }]}>{displayLabel}</Text>
        <MaterialIcons name="arrow-drop-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <BottomSheet visible={showPicker} onClose={() => setShowPicker(false)} title="Select Period">
        <View style={styles.pickerContainer}>
          <View style={styles.pickerColumns}>
            {/* YEAR COLUMN */}
            <View style={styles.pickerColumn}>
              <Text style={[styles.columnLabel, { color: colors.textSecondary }]}>YEAR</Text>
              <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
                {years.map((y) => {
                  const isSelected = year === y;
                  return (
                    <TouchableOpacity
                      key={y}
                      onPress={() => onYearChange(y)}
                      style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: isSelected ? colors.primary : colors.text },
                        ]}
                      >
                        {y}
                      </Text>
                      {isSelected && (
                        <MaterialIcons name="check" size={16} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* MONTH COLUMN */}
            {showMonths && (
              <View style={[styles.pickerColumn, styles.columnDivider]}>
                <Text style={[styles.columnLabel, { color: colors.textSecondary }]}>MONTH</Text>
                <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
                  {months.map((m, i) => {
                    const date = new Date(parseInt(year), i, 1);
                    const disabled =
                      isBefore(endOfMonth(date), startOfMonth(minDate)) ||
                      isAfter(startOfMonth(date), endOfMonth(maxDate));
                    const isSelected = month === i;
                    return (
                      <TouchableOpacity
                        key={m}
                        disabled={disabled}
                        onPress={() => onMonthChange(i)}
                        style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            {
                              color: disabled
                                ? colors.border
                                : isSelected
                                  ? colors.primary
                                  : colors.text,
                            },
                          ]}
                        >
                          {m}
                        </Text>
                        {isSelected && (
                          <MaterialIcons name="check" size={16} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.pickerFooter}>
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowPicker(false)}
            >
              <Text style={styles.doneBtnText}>Confirm Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  selectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  triggerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerContainer: {
    paddingBottom: 10,
  },
  pickerColumns: {
    flexDirection: 'row',
    height: 250,
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  columnLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  columnScroll: {
    flex: 1,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
    gap: 8,
  },
  pickerItemText: {
    fontSize: 15,
    fontWeight: '700',
  },
  doneBtn: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
  },
  doneBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  pickerFooter: {
    paddingTop: 16,
    marginTop: 'auto',
  },
  pickerItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)', // Default primary + 15
  },
  columnDivider: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 0, 0, 0.1)', // Default border + 30
  },
});
