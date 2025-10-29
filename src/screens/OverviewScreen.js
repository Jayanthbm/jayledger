// src/screens/OverView/OverviewScreen.js

import AppBar from '../components/app/AppBar'
import Card from '../components/core/Card';
import DailyLimitCard from '../components/Overview/DailyLimitCard';
import { MAINSTYLE } from '../styles/style';
import PayDayCard from '../components/Overview/PayDayCard';
import React from 'react';
import RemainingForPeriodCard from '../components/Overview/RemainingForPeriodCard';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const OverviewScreen = () => {
   const navigation = useNavigation();

   return (
      <>
         <AppBar title="Overview" showBack={false} />
         <ScrollView
            style={
               MAINSTYLE
            }
         >

            {/* CARD 1: Remaining for Period */}
            <RemainingForPeriodCard />

            {/* CARD 2: Daily Limit */}
            <DailyLimitCard onPress={() => navigation.navigate('TodaysView')} />

            {/* CARD 3: Pay Day */}
            <PayDayCard onPress={() => navigation.navigate('CalendarView')} />

            {/* CARD 4: Top Categories */}
            <Card title="Top Categories" style={{
               marginTop: 5, marginBottom: 5
            }} onPress={() => navigation.navigate('MonthlySummary')} />

            {/* CARD 5: This Month */}
            <Card title="This Month" style={{
               marginTop: 5, marginBottom: 5
            }}
               onPress={() => navigation.navigate('MonthlySummary')}
            />

            {/* CARD 6: Current Year */}
            <Card title="Current Year" style={{
               marginTop: 5, marginBottom: 5
            }}
               onPress={() => navigation.navigate('YearlySummary')}
            />

            {/* CARD 7: Net Worth */}
            <Card title="Net Worth" style={{
               marginTop: 5, marginBottom: 5
            }} />
         </ScrollView >
      </>
   );
};


export default OverviewScreen;