import AppBar from '../components/app/AppBar';
import Divider from '../components/core/Divider';
import PageHeader from '../components/app/PageHeader';
import React from 'react';

const YearlySummary = ({ route }) => {
  let pageTitle = route?.params?.title ? route.params.title : 'Yearly Summary';
  return (
    <>
      <AppBar title="" />
      <PageHeader title={pageTitle} />
      <Divider />
    </>
  );
};

export default YearlySummary;
