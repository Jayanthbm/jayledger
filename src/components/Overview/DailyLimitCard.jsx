// src/components/app/DailyLimitCard.js

import { StyleSheet, View } from "react-native";

import Card from '../core/Card';
import Divider from '../core/Divider'
import React from 'react';
import Skeleton from '../core/Skeleton';
import Text from '../core/Text'
import { useTheme } from '../../context/ThemeContext';

const DailyLimitCard = ({ limit = 3129, remaining = 3129, spent = 0, loading = false, onPress }) => {

   const { theme } = useTheme();
   const formattedLimit = limit ? `Limit: ₹${limit.toLocaleString("en-IN")}` : "";
   const remainingColor = remaining <= 0 ? {
      color: theme.colors.expense
   } : {
      color: theme.colors.income
   };
   return (
      <Card title="Daily Limit" subtitle={formattedLimit} style={{
         marginTop: 5, marginBottom: 5
      }} onPress={onPress}>
         {loading ? (
            <Skeleton height={25} borderRadius={4} />
         ) : (
            <>
               <View style={styles.row}>
                  {/* Remaining Column */}
                  <View style={styles.column}>
                     <Text style={styles.label}>Remaining</Text>
                     <Text style={[styles.amount, remainingColor]}>
                        ₹{remaining.toLocaleString("en-IN")}
                     </Text>
                  </View>

                  {/* Vertical Divider */}
                  <Divider orientation="vertical" />

                  {/* Spent Column */}
                  <View style={styles.column}>
                     <Text style={styles.label}>Spent</Text>
                     <Text style={[styles.amount, {
                        color: theme.colors.expense
                     }]}>₹{spent.toLocaleString("en-IN")}</Text>
                  </View>
               </View>
            </>
         )}
      </Card>
   );
};

const styles = StyleSheet.create({
   row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
   },
   column: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
   },
   label: {
      fontSize: 20,
      color: "#666",
      marginBottom: 2,
      marginTop: 8,
   },
   amount: {
      fontSize: 22,
      fontWeight: 700,
      marginTop: 2,
   },
   divider: {
      width: 1,
      height: "60%",
      marginHorizontal: 12,
   },
});
export default DailyLimitCard;