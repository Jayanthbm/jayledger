// src/components/app/RemainingForPeriod.js

import Card from '../core/Card';
import ProgressBar from '../core/ProgressBar'
import React from 'react';
import Skeleton from '../core/Skeleton';
import Text from '../core/Text'
import { View } from 'react-native';
import dayjs from 'dayjs';
import { useTheme } from '../../context/ThemeContext';

const RemainingForPeriodCard = ({
   remaining = 0,
   progress = 0,
   loading = false,
}) => {
   const { theme } = useTheme();

   const now = dayjs();
   const startOfMonth = now.startOf('month');
   const endOfMonth = now.endOf('month');
   const formattedStart = startOfMonth.format('DD/MM/YYYY');
   const formattedEnd = endOfMonth.format('DD/MM/YYYY');
   const subTitle = `${formattedStart} - ${formattedEnd}`;

   // ✅ Dynamic colors
   const isOverspent = progress > 1;

   return (
      <Card title="Remaining for Period" subtitle={subTitle} disabled>
         {loading ? (
            <View style={{ gap: 8 }}>
               <Skeleton height={24} borderRadius={4} />
               <Skeleton height={12} borderRadius={6} />
            </View>
         ) : (
            <>
                  {/* Amount */}
               <Text
                     color={isOverspent
                        ? theme.colors.expense
                        : theme.colors.onSurface}
                  style={{
                     fontSize: 28,
                     fontWeight: "700",
                     marginBottom: 8,
                  }}
               >
                  ₹{remaining?.toLocaleString("en-IN")}
               </Text>
                  {/* Progress bar */}
                  <ProgressBar
                     progress={Math.min(progress, 1)}
                     height={12}
                     duration={600}
                     style={{
                        backgroundColor: theme.colors.surfaceVariant,
                        borderRadius: 6,
                     }}
                  />

                  {/* Caption */}
                  <Text
                     style={{
                        fontSize: 13,
                        color: theme.colors.onSurfaceVariant,
                        marginTop: 8,
                     }}
                  >
                     {isOverspent
                        ? `You've overspent by ${Math.round((progress - 1) * 100)}% this month`
                        : `${Math.round(progress * 100)}% of your budget used`}
                  </Text>
            </>
         )}

      </Card>
   );
};

export default RemainingForPeriodCard;