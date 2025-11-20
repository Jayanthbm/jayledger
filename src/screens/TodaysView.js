import AppBar from '../components/app/AppBar';
import DailyLimitCard from '../components/Overview/DailyLimitCard';
import Divider from '../components/core/Divider';
import PageHeader from '../components/app/PageHeader';
import React from 'react';
import { View } from 'react-native';

export default function TodaysView({ route }) {
  const { data } = route.params;
  return (
    <>
      <AppBar title="" />
      <View>
        <DailyLimitCard
          limit={data?.limit}
          remaining={data?.remaining}
          spent={data?.spent}
          disabled={true}
        />
        <PageHeader title="Transactions" />
        <Divider />
      </View>
    </>
  );
}
