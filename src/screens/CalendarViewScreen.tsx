import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getTransactionsByDate, getMinTransactionDate } from '../db/queries';
import { Transaction } from '../models/types';
import { TransactionCard } from '../components/TransactionCard';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isAfter, isBefore, getDaysInMonth } from 'date-fns';
import { YearMonthSelector } from '../components/YearMonthSelector';

export default function CalendarViewScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [minDate, setMinDate] = useState<Date>(new Date());
  const [maxDate] = useState<Date>(endOfMonth(new Date()));

  useEffect(() => {
    const fetchMinDate = async () => {
      if (session?.user?.id) {
        const d = await getMinTransactionDate(session.user.id);
        if (d) setMinDate(new Date(d));
      }
    };
    fetchMinDate();
  }, [session?.user?.id]);

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

  const handlePrevMonth = () => {
    const prev = subMonths(currentMonth, 1);
    if (!isBefore(endOfMonth(prev), startOfMonth(minDate))) {
      updatePeriod(prev.getFullYear(), prev.getMonth());
    }
  };
  const handleNextMonth = () => {
    const next = addMonths(currentMonth, 1);
    if (!isAfter(startOfMonth(next), endOfMonth(maxDate))) {
      updatePeriod(next.getFullYear(), next.getMonth());
    }
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  const updatePeriod = (year: number, month: number) => {
    const currentDay = selectedDate.getDate();
    const daysInNewMonth = getDaysInMonth(new Date(year, month));

    let newDay = currentDay;
    if (currentDay > daysInNewMonth) {
      newDay = 1;
    }

    const newDate = new Date(year, month, newDay);
    setCurrentMonth(newDate);
    setSelectedDate(newDate);
  };

  const totalForDay = data.reduce((sum, tx) => sum + (tx.type === 'Income' ? tx.amount : -tx.amount), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={handlePrevMonth} disabled={isBefore(endOfMonth(subMonths(currentMonth, 1)), startOfMonth(minDate))}>
            <MaterialIcons name="chevron-left" size={28} color={isBefore(endOfMonth(subMonths(currentMonth, 1)), startOfMonth(minDate)) ? colors.border : colors.text} />
          </TouchableOpacity>
          <YearMonthSelector
            year={currentMonth.getFullYear().toString()}
            month={currentMonth.getMonth()}
            onYearChange={(y) => updatePeriod(parseInt(y), currentMonth.getMonth())}
            onMonthChange={(m) => updatePeriod(currentMonth.getFullYear(), m)}
          />
          <TouchableOpacity onPress={handleNextMonth} disabled={isAfter(startOfMonth(addMonths(currentMonth, 1)), endOfMonth(maxDate))}>
            <MaterialIcons name="chevron-right" size={28} color={isAfter(startOfMonth(addMonths(currentMonth, 1)), endOfMonth(maxDate)) ? colors.border : colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.daysGrid}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <Text key={d} style={[styles.dayLabel, { color: colors.textSecondary }]}>{d}</Text>
          ))}
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
        {!isSameDay(selectedDate, new Date()) && (
          <TouchableOpacity style={[styles.todayBtn, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '05' }]} onPress={goToToday}>
             <MaterialIcons name="today" size={16} color={colors.primary} />
             <Text style={[styles.todayBtnText, { color: colors.primary }]}>Go to Today</Text>
          </TouchableOpacity>
        )}
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
  container: { flex: 1 },
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
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  todayBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  daySummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  summaryDate: { fontSize: 15, fontWeight: 'bold' },
  summaryAmount: { fontSize: 16, fontWeight: 'bold' },
  listContent: { paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 15, marginTop: 12 },
});
