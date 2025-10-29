// src/components/app/RemainingForPeriod.js

import Card from '../core/Card';
import ProgressBar from '../core/ProgressBar'
import React from 'react';
import Skeleton from '../core/Skeleton';
import Text from '../core/Text'
import dayjs from 'dayjs';
import { useTheme } from '../../context/ThemeContext';

const RemainingForPeriodCard = ({ remaining = 40689, progress = 0.6, loading = false }) => {
   const { theme } = useTheme();

   const now = dayjs();
   const startOfMonth = now.startOf('month');
   const endOfMonth = now.endOf('month');
   const formattedStart = startOfMonth.format('DD/MM/YYYY');
   const formattedEnd = endOfMonth.format('DD/MM/YYYY');
   const subTitle = `${formattedStart} - ${formattedEnd}`;

   return (
      <Card title="Remaining for Period" subtitle={subTitle} style={{
         marginTop: 5, marginBottom: 5
      }} >
         {loading ? (
            <Skeleton height={25} borderRadius={4} />
         ) : (
            <>
               <Text
                  variant="headingLarge"
                  color={remaining >= 0 ? theme.colors.income : theme.colors.expense}
                  style={{
                     marginBottom: 5,
                  }}
               >
                  ₹{remaining?.toLocaleString("en-IN")}
               </Text>
               <ProgressBar progress={progress} height={12} />
            </>
         )}

      </Card>
   );
};

export default RemainingForPeriodCard;