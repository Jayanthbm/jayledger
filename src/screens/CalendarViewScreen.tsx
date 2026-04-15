import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getTransactionsByDate } from '../db/queries';
import { Transaction } from '../models/types';
import { TransactionCard } from '../components/TransactionCard';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function CalendarViewScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const loadData = useCallback(async (date: Date) => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const txs = await getTransactionsByDate(session.user.id, dateStr);
      setData(txs);
    } catch (error) {
      console.error("Error loading transactions for date:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate, loadData]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const totalForDay = data.reduce((sum, tx) => sum + (tx.type === 'Income' ? tx.amount : -tx.amount), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={handlePrevMonth}>
            <MaterialIcons name="chevron-left" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: colors.text }]}>{format(currentMonth, 'MMMM yyyy')}</Text>
          <TouchableOpacity onPress={handleNextMonth}>
            <MaterialIcons name="chevron-right" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.daysGrid}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <Text key={d} style={[styles.dayLabel, { color: colors.textSecondary }]}>{d}</Text>
          ))}
          {/* Padding for first day of month if needed? Simple grid for now */}
          {daysInMonth.map(day => {
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
      </View>

      <View style={styles.daySummary}>
        <Text style={[styles.summaryDate, { color: colors.text }]}>{format(selectedDate, 'EEE, MMM d, yyyy')}</Text>
        <Text style={[styles.summaryAmount, { color: totalForDay >= 0 ? colors.success : colors.danger }]}>
          {totalForDay >= 0 ? '+' : ''}₹{totalForDay.toLocaleString()}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <TransactionCard transaction={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={64} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No activity on this day</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarCard: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
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
  daySummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  summaryDate: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
  }
});
