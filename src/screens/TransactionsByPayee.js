import AppBar from '../components/app/AppBar';
import Divider from '../components/core/Divider';
import PageHeader from '../components/app/PageHeader';
import React from 'react';

const TransactionsByPayee = ({ route }) => {
  return (
    <>
      <AppBar />
      <PageHeader title="Transactions By Payee" />
      <Divider />
    </>
  );
};

export default TransactionsByPayee;
