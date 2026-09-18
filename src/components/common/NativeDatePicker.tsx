import React from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Icon from '@expo/vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { common } from '../../styles/common';
import { useTheme } from '../../store/ThemeContext';

interface NativeDatePickerProps {
  date: Date;
  onDateChange: (newDate: Date) => void;
  displayedComponents?: 'date' | 'hourAndMinute' | ('date' | 'hourAndMinute')[];
  title?: string;
  containerStyle?: ViewStyle;
}

export const NativeDatePicker: React.FC<NativeDatePickerProps> = ({
  date,
  onDateChange,
  displayedComponents = ['date', 'hourAndMinute'],
  title = 'Date & Time',
  containerStyle,
}) => {
  const { colors } = useTheme();
  const [showAndroidDate, setShowAndroidDate] = React.useState(false);
  const [showAndroidTime, setShowAndroidTime] = React.useState(false);

  // On iOS, render native SwiftUI DatePicker when available
  if (Platform.OS === 'ios') {
    try {
      const { DatePicker: SwiftUIDatePicker, Host } = require('@expo/ui/swift-ui');
      if (SwiftUIDatePicker && Host) {
        return (
          <Host style={[{ height: 44, width: '100%', justifyContent: 'center' }, containerStyle]}>
            <SwiftUIDatePicker
              title={title}
              selection={date}
              displayedComponents={displayedComponents}
              datePickerStyle="compact"
              onDateChange={onDateChange}
            />
          </Host>
        );
      }
    } catch {
      // Fall through to fallback
    }
  }

  // Cross-platform standard fallback chips
  const handleAndroidDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowAndroidDate(false);
    if (selectedDate) {
      const newD = new Date(date);
      newD.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      onDateChange(newD);
    }
  };

  const handleAndroidTimeChange = (_event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowAndroidTime(false);
    if (selectedTime) {
      const newD = new Date(date);
      newD.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      onDateChange(newD);
    }
  };

  return (
    <View style={[styles.dateTimeRow, containerStyle]}>
      <TouchableOpacity
        style={[
          styles.dateTimeChip,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
        onPress={() => setShowAndroidDate(true)}
      >
        <Icon name="calendar-today" size={14} color={colors.textSecondary} style={common.mr6} />
        <Text style={[styles.dateTimeText, { color: colors.text }]}>
          {format(date, 'dd MMM yyyy')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.dateTimeChip,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
        onPress={() => setShowAndroidTime(true)}
      >
        <Icon name="schedule" size={14} color={colors.textSecondary} style={common.mr6} />
        <Text style={[styles.dateTimeText, { color: colors.text }]}>{format(date, 'h:mm a')}</Text>
      </TouchableOpacity>

      {showAndroidDate && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleAndroidDateChange}
        />
      )}

      {showAndroidTime && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={handleAndroidTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dateTimeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dateTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateTimeText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
