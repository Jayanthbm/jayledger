// src/screens/OverView/OverviewScreen.js

import React, { useEffect, useState } from 'react';

import AppBar from '../components/app/AppBar'
import Card from '../components/core/Card';
import DailyLimitCard from '../components/Overview/DailyLimitCard';
import NetWorthCard from '../components/Overview/NetWorthCard';
import PageTitle from '../components/app/PageTitle';
import PayDayCard from '../components/Overview/PayDayCard';
import PeriodSummaryCard from '../components/Overview/PeriodSummaryCard';
import RemainingForPeriodCard from '../components/Overview/RemainingForPeriodCard';
import { ScrollView, } from 'react-native';
import Text from '../components/core/Text';
import TopCategoriesCard from '../components/Overview/TopCategoriesCard';
import { useNavigation } from '@react-navigation/native';

const OverviewScreen = () => {
   const navigation = useNavigation();

   // State for Remaining for Period Card
   const [remainingLoading, setRemainingLoading] = useState(true);
   const [remaining, setRemaining] = useState(0);
   const [progressRemaining, setProgressRemaining] = useState(0);


   // State for Daily Limit Card
   const [dailyLimitLoading, setDailyLimitLoading] = useState(true);
   const [dailyLimit, setDailyLimit] = useState(0);
   const [spentToday, setSpentToday] = useState(0);

   // State for Top Categories Card
   const [topCategoriesLoading, setTopCategoriesLoading] = useState(true);
   const [topCategories, setTopCategories] = useState([]);

   // State for This Month
   const [monthDataLoading, setMonthDataLoading] = useState(true);
   const [monthExpense, setMonthExpense] = useState(0);
   const [prevMonthExpense, setPrevMonthExpense] = useState(0)
   const [monthIncome, setMonthIncome] = useState(0);
   const [prevMonthIncome, setPrevMonthIncome] = useState(0)

   // State for Current Year
   const [yearDataLoading, setYearDataLoading] = useState(true);
   const [yearExpense, setYearExpense] = useState(0);
   const [prevYearExpense, setPrevYearExpense] = useState(0);
   const [yearIncome, setYearIncome] = useState(0);
   const [prevYearIncome, setPrevYearIncome] = useState(0);


   // State for Net Worth
   const [netWorthLoading, setNetWorthLoading] = useState(true);
   const [netWorth, setNetWorth] = useState(0);

   useEffect(() => {
      async function calcualte() {
         try {
            // Remaining for Period calculations
            setRemaining(40689);
            setProgressRemaining(0.6);
            setRemainingLoading(false);

            // Daily Limit calculations
            setDailyLimit(3129.94);
            setSpentToday(200);
            setDailyLimitLoading(false);

            // Top Categories calculations
            setTopCategories([
               { name: "Loans", amount: 44998, percent: 49.21, color: "#4285F4" },
               { name: "Insurance", amount: 17796, percent: 19.46, color: "#FBBC04" },
               { name: "Other", amount: 28648.82, percent: 31.33, color: "#34A853" },
            ])
            setTopCategoriesLoading(false);

            // This Month calculations
            setMonthIncome(132132);
            setPrevMonthIncome(143234)
            setMonthExpense(91442.82);
            setPrevMonthExpense(80000);

            setMonthDataLoading(false);

            // Current Year calculations
            setYearExpense(1000866.63);
            setPrevYearExpense(2455545);
            setYearIncome(1362537);
            setPrevYearIncome(4564456);
            setYearDataLoading(false);

            // Net Worth calculations
            setNetWorthLoading(false);
            setNetWorth(636861);
         } catch (error) {
            console.log("Error in calculation")
         } finally {
         }
      }

      calcualte();
   }, []);


   return (
      <>
         <AppBar showBack={false}>
            <Text variant='headingMedium' style={{
               textAlign: 'center'
            }}>JayLedger</Text>
         </AppBar>
         <ScrollView style={{ flex: 1 }}
            contentContainerStyle={{
               paddingBottom: 80,
            }}
            showsVerticalScrollIndicator={false}>
            <PageTitle title="Overview" />
            {/* CARD 1: Remaining for Period */}
            <RemainingForPeriodCard
               loading={dailyLimitLoading}
               progress={progressRemaining}
               remaining={remaining}
            />

            {/* CARD 2: Daily Limit */}
            <DailyLimitCard
               limit={dailyLimit}
               remaining={dailyLimit - spentToday}
               spent={spentToday}
               loading={false}
               onPress={() => navigation.navigate('TodaysView')}
            />

            {/* CARD 3: Pay Day */}
            <PayDayCard
               onPress={() => navigation.navigate('CalendarView')}
            />

            {/* CARD 4: Top Categories */}
            <TopCategoriesCard
               loading={topCategoriesLoading}
               data={topCategories}
               onPress={() => navigation.navigate('MonthlySummary')}
            />

            {/* CARD 5: This Month */}
            <PeriodSummaryCard
               period="month"
               loading={monthDataLoading}
               expense={monthExpense}
               income={monthIncome}
               previncome={prevMonthIncome}
               prevexpense={prevMonthExpense}
               onPress={() => navigation.navigate('MonthlySummary')}
            />

            {/* CARD 6: Current Year */}
            <PeriodSummaryCard
               period="year"
               loading={yearDataLoading}
               expense={yearExpense}
               income={yearIncome}
               previncome={prevYearIncome}
               prevexpense={prevYearExpense}
               onPress={() => navigation.navigate('YearlySummary')}
            />

            {/* CARD 7: Net Worth */}
            <NetWorthCard amount={netWorth} loading={netWorthLoading} />

         </ScrollView>

      </>
   );
};

export default OverviewScreen;