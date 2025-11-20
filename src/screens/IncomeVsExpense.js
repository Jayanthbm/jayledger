import { TouchableOpacity, View } from 'react-native';

import AppBar from '../components/app/AppBar';
import PageHeader from '../components/app/PageHeader';
import React from 'react';
import RowText from '../components/core/RowText';
import SwipeableListItem from '../components/core/SwipeableListItem';
import Text from '../components/core/Text';
import { useNavigation } from '@react-navigation/native';

const IncomeVsExpense = ({ route }) => {
  const navigation = useNavigation();
  const EXPENSES = [
    {
      id: 1,
      title: 'Loans',
      amount: '44000',
      percentage: '34',
    },
    {
      id: 2,
      title: 'Home',
      amount: '43000',
      percentage: '34',
    },
    {
      id: 3,
      title: 'Repairs',
      amount: '4000',
      percentage: '34',
    },
  ];

  const INCOME = [
    {
      id: 23,
      title: 'Salary',
      amount: '44000',
      percentage: '34',
    },
  ];
  return (
    <>
      <AppBar title="" />
      <PageHeader title="Income vs Expense" />
      <View>
        <Text variant="subtitle">Expense</Text>
        {EXPENSES.map((expense) => {
          return (
            <TouchableOpacity
              style={{ marginBottom: 2 }}
              onPress={() => {
                navigation.navigate('Transactions', {
                  data: [],
                });
              }}
            >
              <SwipeableListItem key={expense.id}>
                <RowText
                  left={expense.title}
                  leftSecondary={expense.amount}
                  rightSecondary={expense.percentage}
                />
              </SwipeableListItem>
            </TouchableOpacity>
          );
        })}
        <Text variant="subtitle">Income</Text>
        {INCOME.map((income) => {
          return (
            <TouchableOpacity
              style={{ marginBottom: 2 }}
              onPress={() => {
                navigation.navigate('Transactions', {
                  data: [],
                });
              }}
            >
              <SwipeableListItem key={income.id}>
                <RowText
                  left={income.title}
                  leftSecondary={income.amount}
                  rightSecondary={income.percentage}
                />
              </SwipeableListItem>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
};

export default IncomeVsExpense;
