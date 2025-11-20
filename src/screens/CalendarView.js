// src/screens/CalendarView.js

import { Calendar, toDateId } from '@marceloterreiro/flash-calendar';
import { FlatList, Pressable, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';

import AppBar from '../components/app/AppBar';
import Divider from '../components/core/Divider';
import Loader from '../components/core/Loader';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import PageHeader from '../components/app/PageHeader';
import RowText from '../components/core/RowText';
import dayjs from 'dayjs';
import { formatIndianNumber } from '../utils';
import { useTheme } from '../context/ThemeContext';

const CalendarView = ({ route }) => {
  const { theme } = useTheme();
  const [selected, setSelected] = useState(toDateId(new Date()));
  const [formattedDate, setFormattedDate] = useState(dayjs().format('DD MMM YYYY'));
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  // Ref for the calendar list if needed for programmatic scrolling
  const calendarRef = useRef(null);

  const minDate = '2020-01-01';
  const maxDate = dayjs().add(30, 'day').format('YYYY-MM-DD');

  // 🔹 Mock fetch data for selected date
  const fetchTransactions = (date) => {
    setLoading(true);
    setFormattedDate(dayjs(date).format('DD MMM YYYY'));
    let transactions = [
      { id: 1, title: 'Groceries', amount: 1200, type: 'expense' },
      { id: 2, title: 'Coffee', amount: 180, type: 'expense' },
      { id: 3, title: 'Transport', amount: 4000, type: 'expense' },
      { id: 4, title: 'Salary', amount: 2000, type: 'income' },
    ];
    let total = transactions.reduce((sum, t) => {
      if (t.type === 'income') {
        return sum + t.amount;
      } else {
        return sum - t.amount;
      }
    }, 0);
    setTimeout(() => {
      setTransactions(transactions);
      setLoading(false);
      setTotalAmount(total);
    }, 800);
  };

  useEffect(() => {
    fetchTransactions(selected);
  }, [selected]);

  // 🔹 Jump back to today’s date
  const handleTodayPress = () => {
    const now = new Date();
    const today = toDateId(now);
    setSelected(today);
    if (calendarRef.current) {
      calendarRef.current.scrollToDate(now, { animated: true });
    }
  };

  const calendarTheme = {
    rowMonthHeader: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      fontSize: 16,
    },
    itemDay: {
      base: () => ({
        container: {
          borderRadius: 20, // Round selection
        },
        content: {
          color: theme.colors.onSurface,
        },
      }),
      today: () => ({
        content: {
          color: theme.colors.primary,
          fontWeight: '700',
        },
      }),
      active: () => ({
        container: {
          backgroundColor: theme.colors.primary,
        },
        content: {
          color: theme.colors.onPrimary,
        },
      }),
    },
  };

  return (
    <>
      <AppBar title="" />

      <PageHeader title="Calendar View">
        <Pressable
          onPress={handleTodayPress}
          style={({ pressed }) => [
            {
              padding: 8,
              borderRadius: 10,
              backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface,
              elevation: 1,
            },
          ]}
        >
          <MaterialDesignIcons name="calendar-today" color={theme.colors.onSurface} size={25} />
        </Pressable>
      </PageHeader>

      <View
        style={{
          height: 250,
          marginTop: 2,
          marginBottom: 2
        }}
      >
        <Calendar.List
          ref={calendarRef}
          calendarActiveDateRanges={[
            {
              startId: selected,
              endId: selected,
            },
          ]}
          calendarInitialMonthId={selected}
          calendarMinDateId={minDate}
          calendarMaxDateId={maxDate}
          onCalendarDayPress={setSelected}
          theme={calendarTheme}
          calendarDayHeight={30}
          calendarRowHorizontalSpacing={0}
          calendarRowVerticalSpacing={4}
          calendarSpacing={10}
          horizontal={false}
        />
      </View>

      <RowText
        left={formattedDate}
        leftStyle={{
          fontSize: 20,
          fontWeight: '500',
          color: theme.colors.onSurfaceVariant,
        }}
        right={formatIndianNumber(totalAmount)}
        rightStyle={{
          fontSize: 20,
          fontWeight: '900',
          color: totalAmount > 0 ? theme.colors.income : theme.colors.expense,
        }}
      />
      <Divider />

      {loading ? (
        <Loader inline position="center" />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <RowText
              left={item.title}
              leftStyle={{ fontSize: 16 }}
              right={formatIndianNumber(item.amount)}
              rightStyle={{ fontSize: 16, fontWeight: '500' }}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        />
      )}
    </>
  );
};

export default CalendarView;
