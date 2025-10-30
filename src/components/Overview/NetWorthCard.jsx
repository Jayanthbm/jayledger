import Card from "../core/Card";
// src/components/app/NetWorthCard.js
import React from "react";
import Skeleton from "../core/Skeleton";
import Text from "../core/Text";
import { View } from "react-native";
import dayjs from "dayjs";
import { useTheme } from "../../context/ThemeContext";

const NetWorthCard = ({ amount = 0, loading = false }) => {
   const { theme } = useTheme();
   const formattedDate = dayjs().format("DD MMM YYYY");

   const isPositive = amount >= 0;
   const color = isPositive ? theme.colors.income : theme.colors.expense;

   return (
      <Card title="Net Worth" subtitle={`As of ${formattedDate}`} disabled>
         {loading ? (
            <View style={{ gap: 8 }}>
               <Skeleton height={28} borderRadius={6} />
            </View>
         ) : (
            <View style={{ gap: 4 }}>
               <Text
                  style={{
                     fontSize: 32,
                     fontWeight: "700",
                     color,
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
               >
                  ₹{Math.abs(amount).toLocaleString("en-IN")}
               </Text>
               <Text
                  style={{
                     fontSize: 14,
                     color: theme.colors.onSurfaceVariant,
                  }}
               >
                  {isPositive ? "Positive balance" : "In debt"}
               </Text>
            </View>
         )}
      </Card>
   );
};

export default NetWorthCard;
