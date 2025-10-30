import AppBar from '../components/app/AppBar';
import DailyLimitCard from '../components/Overview/DailyLimitCard';
import React from 'react';
import { View } from 'react-native';

export default function TodaysView() {

   return (
      <>
         <AppBar title='Daily Limit' />
         <View>
            <DailyLimitCard />
         </View>

      </>
   );
}
