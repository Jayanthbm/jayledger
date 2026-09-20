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
    <View style={[styles.selectorRow, containerStyle]}>
      <TouchableOpacity
        style={[
          styles.selectorBtn,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
        onPress={() => setShowAndroidDate(true)}
      >
        <View style={[styles.selectorIconBg, { backgroundColor: colors.card }]}>
          <Icon name="calendar-today" size={18} color={colors.textSecondary} />
        </View>
        <View style={common.flex1}>
          <Text style={[styles.selectorLabel, { color: colors.textSecondary }]} numberOfLines={1}>
            Date
          </Text>
          <Text style={[styles.selectorValue, { color: colors.text }]} numberOfLines={1}>
            {format(date, 'dd MMM yyyy')}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.selectorBtn,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
        onPress={() => setShowAndroidTime(true)}
      >
        <View style={[styles.selectorIconBg, { backgroundColor: colors.card }]}>
          <Icon name="schedule" size={18} color={colors.textSecondary} />
        </View>
        <View style={common.flex1}>
          <Text style={[styles.selectorLabel, { color: colors.textSecondary }]} numberOfLines={1}>
            Time
          </Text>
          <Text style={[styles.selectorValue, { color: colors.text }]} numberOfLines={1}>
            {format(date, 'h:mm a')}
          </Text>
        </View>
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
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  selectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  selectorIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});
