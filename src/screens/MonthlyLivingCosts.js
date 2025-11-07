import AppBar from '../components/app/AppBar';
import Divider from '../components/core/Divider';
import PageHeader from '../components/app/PageHeader';
import React from 'react';

const MonthlyLivingCosts = ({ route }) => {
  return (
    <>
      <AppBar />
      <PageHeader title="Monthly Living Costs" />
      <Divider />
    </>
  );
};

export default MonthlyLivingCosts;
