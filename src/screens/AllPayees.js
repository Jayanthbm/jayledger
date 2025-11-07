import AppBar from '../components/app/AppBar';
import Divider from '../components/core/Divider';
import PageHeader from '../components/app/PageHeader';
import React from 'react';

const AllPayees = ({ route }) => {
  return (
    <>
      <AppBar />
      <PageHeader title="All Payees" />
      <Divider />
    </>
  );
};

export default AllPayees;
