import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  LayoutAnimation,
} from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { Transaction } from '../models/types';
import { TransactionCard } from '../components/TransactionCard';
import { YearMonthSelector } from '../components/YearMonthSelector';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isAfter,
  isBefore,
} from 'date-fns';

import {
  fetchMinDate,
  fetchTransactionsForDate,
  calculateDailyNetTotal,
  getNewDateForPeriod,
} from '../services/calendarService';

// Modular Components
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { CalendarDaySummary } from '../components/calendar/CalendarDaySummary';
import { logger } from '../utils/logger';

export default function CalendarViewScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [minDate, setMinDate] = useState<Date>(new Date());
  const maxDate = useMemo(() => endOfMonth(new Date()), []);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // LayoutAnimation works without experimental flags in modern React Native
  const toggleCollapsed = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    const initMinDate = async () => {
      if (session?.user?.id) {
        const d = await fetchMinDate(session.user.id);
        setMinDate(d);
      }
    };
    initMinDate();
  }, [session]);

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

  const loadData = useCallback(
    async (date: Date) => {
      if (!session?.user?.id) return;
      setLoading(true);
      try {
        const txs = await fetchTransactionsForDate(session.user.id, date);
        setData(txs);
      } catch (error) {
        logger.error('Error loading transactions for date:', error);
      } finally {
        setLoading(false);
      }
    },
    [session],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(selectedDate);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedDate, loadData]);

  const updatePeriod = (year: number, month: number) => {
    const newDate = getNewDateForPeriod(year, month, selectedDate.getDate());
    setCurrentMonth(newDate);
    setSelectedDate(newDate);
  };

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
    if (isCollapsed) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsCollapsed(false);
    }
  };

  const totalForDay = useMemo(() => calculateDailyNetTotal(data), [data]);

  const prevDisabled = isBefore(endOfMonth(subMonths(currentMonth, 1)), startOfMonth(minDate));
  const nextDisabled = isAfter(startOfMonth(addMonths(currentMonth, 1)), endOfMonth(maxDate));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!isCollapsed && (
        <View
          style={[
            styles.calendarCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={handlePrevMonth} disabled={prevDisabled}>
              <MaterialIcons
                name="chevron-left"
                size={28}
                color={prevDisabled ? colors.border : colors.text}
              />
            </TouchableOpacity>
            <YearMonthSelector
              year={currentMonth.getFullYear().toString()}
              month={currentMonth.getMonth()}
              onYearChange={(y) => updatePeriod(parseInt(y), currentMonth.getMonth())}
              onMonthChange={(m) => updatePeriod(currentMonth.getFullYear(), m)}
            />
            <TouchableOpacity onPress={handleNextMonth} disabled={nextDisabled}>
              <MaterialIcons
                name="chevron-right"
                size={28}
                color={nextDisabled ? colors.border : colors.text}
              />
            </TouchableOpacity>
          </View>

          <CalendarGrid
            days={daysInMonth}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            colors={colors}
          />
        </View>
      )}

      <CalendarDaySummary
        selectedDate={selectedDate}
        totalForDay={totalForDay}
        colors={colors}
        showTodayButton={!isSameDay(selectedDate, new Date())}
        onGoToToday={goToToday}
        isCollapsed={isCollapsed}
        showToggleButton={isCollapsed || data.length > 2}
        onToggleCalendar={toggleCollapsed}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionCard transaction={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={64} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No activity on this day
              </Text>
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
  listContent: { paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 15, marginTop: 12 },
  loader: {
    marginTop: 40,
  },
});
