import AppBar from '../components/app/AppBar';
import Divider from '../components/core/Divider';
import PageHeader from '../components/app/PageHeader';
import React, { useState } from 'react';

const TransactionsByCategory = ({ route }) => {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <>
      <AppBar title="" showSearch={true} onSearch={setSearchQuery} searchValue={searchQuery} onSearchClear={() => setSearchQuery('')} />
      <PageHeader title="Transactions By Category" />
      <Divider />
    </>
  );
};

export default TransactionsByCategory;
