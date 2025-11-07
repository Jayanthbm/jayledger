import AppBar from '../components/app/AppBar';
import Divider from '../components/core/Divider';
import PageHeader from '../components/app/PageHeader';
import React from 'react';

const AllCategories = ({ route }) => {
  return (
    <>
      <AppBar />
      <PageHeader title="All Categories" />
      <Divider />
    </>
  );
};

export default AllCategories;
