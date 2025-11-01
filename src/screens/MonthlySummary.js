// src/screens/Reports/MonthlySummary.js

import AppBar from '../components/app/AppBar';
import MainTabs from '../navigation/MainTabs';
import PageHeader from '../components/app/PageHeader';
import React from 'react';

const MonthlySummary = () => {
   return (
      <>
         <AppBar />
         <PageHeader title='Monthly Summary' />
      </>
   );
};

export default MonthlySummary;