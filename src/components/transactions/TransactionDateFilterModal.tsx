import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Icon from '@expo/vector-icons/MaterialIcons';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
} from 'date-fns';
import { BottomSheet } from '../BottomSheet';
import { ThemeColors } from '../../models/types';
import { common } from '../../styles/common';

interface TransactionDateFilterModalProps {
  visible: boolean;
  onClose: () => void;
  startDate: string | null;
  endDate: string | null;
  onApply: (start: string | null, end: string | null) => void;
  colors: ThemeColors;
}

export const TransactionDateFilterModal = ({
  visible,
  onClose,
  startDate,
  endDate,
  onApply,
  colors,
}: TransactionDateFilterModalProps) => {
  const [prevVisible, setPrevVisible] = useState(visible);
  const [tempStart, setTempStart] = useState<Date | null>(null);
  const [tempEnd, setTempEnd] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Sync state with props when modal becomes visible
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setTempStart(startDate ? parseISO(startDate) : null);
      setTempEnd(endDate ? parseISO(endDate) : null);
    }
  }

  const handleStartChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowStartPicker(false);
    if (date) {
      setTempStart(date);
      // If end date exists and is before start date, update it
      if (tempEnd && date > tempEnd) {
        setTempEnd(date);
      }
    }
  };

  const handleEndChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowEndPicker(false);
    if (date) {
      setTempEnd(date);
      // If start date exists and is after end date, update it
      if (tempStart && date < tempStart) {
        setTempStart(date);
      }
    }
  };

  const applyPreset = (preset: 'today' | 'week' | 'month' | 'year' | 'clear') => {
    const today = new Date();
    switch (preset) {
      case 'today':
        setTempStart(today);
        setTempEnd(today);
        break;
      case 'week':
        setTempStart(startOfWeek(today, { weekStartsOn: 1 }));
        setTempEnd(endOfWeek(today, { weekStartsOn: 1 }));
        break;
      case 'month':
        setTempStart(startOfMonth(today));
        setTempEnd(endOfMonth(today));
        break;
      case 'year':
        setTempStart(startOfYear(today));
        setTempEnd(endOfYear(today));
        break;
      case 'clear':
        setTempStart(null);
        setTempEnd(null);
        break;
    }
  };

  const handleApply = () => {
    const startStr = tempStart ? format(tempStart, 'yyyy-MM-dd') : null;
    const endStr = tempEnd ? format(tempEnd, 'yyyy-MM-dd') : null;
    onApply(startStr, endStr);
  };

  const dateButtonBg = colors.background;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Select Date Range">
      <View style={styles.container}>
        {/* Date Selectors */}
        <View style={styles.selectorsRow}>
          <TouchableOpacity
            style={[
              styles.dateButton,
              { backgroundColor: dateButtonBg, borderColor: colors.border },
            ]}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={[styles.dateButtonLabel, { color: colors.textSecondary }]}>
              Start Date
            </Text>
            <Text style={[styles.dateButtonValue, { color: colors.text }]}>
              {tempStart ? format(tempStart, 'dd MMM yyyy') : 'Any Date'}
            </Text>
          </TouchableOpacity>

          <Icon name="arrow-forward" size={20} color={colors.textSecondary} />

          <TouchableOpacity
            style={[
              styles.dateButton,
              { backgroundColor: dateButtonBg, borderColor: colors.border },
            ]}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={[styles.dateButtonLabel, { color: colors.textSecondary }]}>End Date</Text>
            <Text style={[styles.dateButtonValue, { color: colors.text }]}>
              {tempEnd ? format(tempEnd, 'dd MMM yyyy') : 'Any Date'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preset Ranges */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Quick Ranges</Text>
        <View style={styles.presetsGrid}>
          <TouchableOpacity
            style={[
              styles.presetItem,
              { backgroundColor: dateButtonBg, borderColor: colors.border },
            ]}
            onPress={() => applyPreset('today')}
          >
            <Text style={[styles.presetText, { color: colors.text }]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.presetItem,
              { backgroundColor: dateButtonBg, borderColor: colors.border },
            ]}
            onPress={() => applyPreset('week')}
          >
            <Text style={[styles.presetText, { color: colors.text }]}>This Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.presetItem,
              { backgroundColor: dateButtonBg, borderColor: colors.border },
            ]}
            onPress={() => applyPreset('month')}
          >
            <Text style={[styles.presetText, { color: colors.text }]}>This Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.presetItem,
              { backgroundColor: dateButtonBg, borderColor: colors.border },
            ]}
            onPress={() => applyPreset('year')}
          >
            <Text style={[styles.presetText, { color: colors.text }]}>This Year</Text>
          </TouchableOpacity>
        </View>

        {/* Clear Button */}
        {(tempStart || tempEnd) && (
          <TouchableOpacity
            style={[styles.clearButton, { borderColor: colors.danger }]}
            onPress={() => applyPreset('clear')}
          >
            <Icon name="clear" size={16} color={colors.danger} />
            <Text style={[styles.clearButtonText, { color: colors.danger }]}>
              Clear Selected Dates
            </Text>
          </TouchableOpacity>
        )}

        {/* Native Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={tempStart || new Date()}
            mode="date"
            display="default"
            onChange={handleStartChange}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={tempEnd || new Date()}
            mode="date"
            display="default"
            onChange={handleEndChange}
          />
        )}

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.applyButton, { backgroundColor: colors.primary }]}
          onPress={handleApply}
        >
          <Text style={common.textWhiteBold16}>Apply Date Filter</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
  },
  selectorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  dateButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  dateButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateButtonValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  presetItem: {
    width: '48%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  applyButton: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
});
