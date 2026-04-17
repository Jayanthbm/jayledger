import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format, isSameDay } from 'date-fns';

interface CalendarGridProps {
  days: Date[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  colors: any;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  selectedDate,
  setSelectedDate,
  colors
}) => {
  return (
    <View style={styles.daysGrid}>
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
        <Text key={d} style={[styles.dayLabel, { color: colors.textSecondary }]}>{d}</Text>
      ))}
      {days.map(day => {
        const isSelected = isSameDay(day, selectedDate);
        return (
          <TouchableOpacity
            key={day.toISOString()}
            style={[
              styles.dayCell,
              isSelected && { backgroundColor: colors.primary, borderRadius: 12 }
            ]}
            onPress={() => setSelectedDate(day)}
          >
            <Text style={[
              styles.dayText,
              { color: isSelected ? '#fff' : colors.text }
            ]}>
              {format(day, 'd')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
