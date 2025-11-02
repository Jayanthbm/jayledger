import { Pressable, View } from 'react-native';

import AppBar from '../components/app/AppBar';
import DailyLimitCard from '../components/Overview/DailyLimitCard';
import Divider from '../components/core/Divider';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import PageHeader from '../components/app/PageHeader';
import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function TodaysView({ route }) {
   const { data } = route.params;
   const { theme, toggleTheme } = useTheme()
   return (
      <>
         <AppBar rightContent={
            <Pressable onPress={toggleTheme}>
               <MaterialDesignIcons
                  name="theme-light-dark"
                  size={30}
                  color={theme.colors.onSurface}
               />
            </Pressable>
         } />
         <View>
            <DailyLimitCard limit={data?.limit}
               remaining={data?.remaining}
               spent={data?.spent} />
            <PageHeader title='Transactions' />
            <Divider />
         </View>

      </>
   );
}
