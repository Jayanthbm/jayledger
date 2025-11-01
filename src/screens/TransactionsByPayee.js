import AppBar from '../components/app/AppBar';
import PageHeader from '../components/app/PageHeader';
import React from 'react';

const TransactionsByPayee = () => {
   return (
      <>
         <AppBar />
         <PageHeader title='Transactions By Payee' />
      </>
   );
};

export default TransactionsByPayee;