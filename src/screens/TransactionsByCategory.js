import AppBar from '../components/app/AppBar';
import Divider from '../components/core/Divider';
import PageHeader from '../components/app/PageHeader';
import React from 'react';

const TransactionsByCategory = ({ route }) => {
  return (
    <>
      <AppBar />
      <PageHeader title="Transactions By Category" />
      <Divider />
    </>
  );
};

export default TransactionsByCategory;
