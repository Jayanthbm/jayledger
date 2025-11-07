// src/screens/Reports/SubscrptionAndBills.js

import AppBar from '../components/app/AppBar';
import Card from '../components/core/Card';
import PageHeader from '../components/app/PageHeader';
import React from 'react';
import Text from '../components/core/Text';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SubscriptionAndBills = ({ route }) => {
  const navigation = useNavigation();
  return (
    <>
      <AppBar />
      <PageHeader title="Subscription And Bills" />
      <View>
        <Card
          title="Subscrptions"
          subtitle="Total spent on subscriptions in Oct, 2025"
          onPress={() => {
            navigation.navigate('Transactions', {
              data: [],
            });
          }}
        >
          <Text>162</Text>
        </Card>
        <Card
          title="Bills"
          subtitle="Total spent on bills in Oct, 2025"
          onPress={() => {
            navigation.navigate('Transactions', {
              data: [],
            });
          }}
        >
          <Text>3192</Text>
        </Card>
      </View>
    </>
  );
};

export default SubscriptionAndBills;
