// src/screens/Reports/MonthlySummary.js

import React, { useEffect, useState } from 'react';

import AppBar from '../components/app/AppBar';
import Divider from '../components/core/Divider';
import PageHeader from '../components/app/PageHeader';
import dayjs from 'dayjs';

const MonthlySummary = ({ route }) => {
  let pageTitle = route?.params?.title ? route.params.title : 'Monthly Summary';
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);

  const [type, setType] = useState('expense');

  const [selectedYear, setSelectedYear] = useState(); // set current year as selected
  const [selectedMonth, setSelectedMonth] = useState(); // set current month as selected

  useEffect(() => {
    async function calcualte() {}

    if (selectedYear && selectedMonth) {
      calcualte();
    }
  }, [selectedYear, selectedMonth]);
  return (
    <>
      <AppBar />
      <PageHeader title={pageTitle} />
      <Divider />
    </>
  );
};

export default MonthlySummary;
