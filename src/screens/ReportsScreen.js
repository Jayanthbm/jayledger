import AppBar from '../components/app/AppBar';
import Card from '../components/core/Card';
import React from 'react';
import { ScrollView, } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ReportsScreen = () => {
   const navigation = useNavigation();
   const reportsList = [
      {
         title: "Monthly Living Costs",
         description: "Track your monthly essential expenses",
         onPress: "MonthlyLivingCosts",
      },
      {
         title: "Subscription and Bills",
         description: "Keep track of your recurring payments",
         onPress: "SubscriptionAndBills",
      },
      {
         title: "Transactions By Payees",
         description: "Analyze transactions by payees",
         onPress: "TransactionsByPayee",
      },
      {
         title: "Transactions By Category",
         description: "See the complete history about a category",
         onPress: "TransactionsByCategory",
      },
      {
         title: "Monthly Summary",
         description: "Review your yearly financial performance",
         onPress: "MonthlySummary",
      },
      {
         title: "Income vs Expense",
         description: "Compare how much you earned vs spent",
         onPress: "IncomeVsExpense",
      },
      {
         title: "Yearly Summary",
         description: "Review your yearly financial performance",
         onPress: "YearlySummary",
      },
   ];
   return (
      <>
         <AppBar title='Reports' />
         <ScrollView>
            {reportsList.map((report, index) => {
               return (
                  <Card key={index} title={report.title} subtitle={report.description} onPress={() => navigation.navigate(report.onPress)} />
               )
            })}
         </ScrollView>
      </>
   );
};

export default ReportsScreen;