import AnimatedCircularProgress from "../core/AnimatedCircularProgress";
import Card from "../core/Card";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import React from "react";
import Skeleton from "../core/Skeleton";
import Text from "../core/Text";
import { View } from "react-native";
import dayjs from "dayjs";
import { formatIndianNumber } from "../../utils";
import { useTheme } from "../../context/ThemeContext";

const PeriodSummaryCard = ({
   period = "month", // "month" or "year"
   loading = false,
   income = 0,
   expense = 0,
   previncome = 0,
   prevexpense = 0,
   onPress,
}) => {
   const { theme } = useTheme();

   // 🕒 Title & subtitle logic
   const now = dayjs();
   const title = period === "year" ? "Current Year" : "Current Month";
   const subtitle = period === "year" ? now.format("YYYY") : now.format("MMMM YYYY");

   // 💰 Calculations
   const percentageSpent =
      income > 0 ? Math.min((expense / income) * 100, 100) : 0;

   const calcChange = (current, previous) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
   };

   const incomeChange = calcChange(income, previncome);
   const expenseChange = calcChange(expense, prevexpense);

   // 🎨 Colors & icons
   const getTrendColor = (type, change) => {
      const isIncrease = change > 0;
      if (type === "income") return isIncrease ? theme.colors.income : theme.colors.expense;
      if (type === "expense") return isIncrease ? theme.colors.expense : theme.colors.income;
      return theme.colors.onSurfaceVariant;
   };

   const getTrendIcon = (change) => (change >= 0 ? "arrow-up" : "arrow-down");

   return (
      <Card title={title} subtitle={subtitle} onPress={onPress}>
         {loading ? (
            <View style={{ gap: 8 }}>
               <Skeleton height={24} borderRadius={4} />
               <Skeleton height={100} borderRadius={8} />
            </View>
         ) : (
            <View
               style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
               }}
            >
               {/* ---------- Left: Income & Expense ---------- */}
               <View style={{ flex: 1, gap: 12 }}>
                  {/* Expense */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                     <View
                        style={{
                           width: 6,
                           height: 28,
                           borderRadius: 3,
                           backgroundColor: theme.colors.expense,
                        }}
                     />
                     <View style={{ flex: 1 }}>
                        <Text
                           style={{
                              fontSize: 15,
                              color: theme.colors.onSurfaceVariant,
                              fontWeight: "500",
                           }}
                        >
                           Expense
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                           <Text
                              style={{
                                 fontSize: 17,
                                 color: theme.colors.expense,
                                 fontWeight: "600",
                              }}
                           >
                                 {formatIndianNumber(expense)}
                           </Text>
                           {prevexpense > 0 && (
                              <View
                                 style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor: getTrendColor("expense", expenseChange) + "22",
                                    borderRadius: 8,
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                 }}
                              >
                                 <Ionicons
                                    name={getTrendIcon(expenseChange)}
                                    size={14}
                                    color={getTrendColor("expense", expenseChange)}
                                    style={{ marginRight: 2 }}
                                 />
                                 <Text
                                    style={{
                                       fontSize: 12,
                                       color: getTrendColor("expense", expenseChange),
                                       fontWeight: "600",
                                    }}
                                 >
                                    {Math.abs(expenseChange).toFixed(1)}%
                                 </Text>
                              </View>
                           )}
                        </View>
                     </View>
                  </View>

                  {/* Income */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                     <View
                        style={{
                           width: 6,
                           height: 28,
                           borderRadius: 3,
                           backgroundColor: theme.colors.income,
                        }}
                     />
                     <View style={{ flex: 1 }}>
                        <Text
                           style={{
                              fontSize: 15,
                              color: theme.colors.onSurfaceVariant,
                              fontWeight: "500",
                           }}
                        >
                           Income
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                           <Text
                              style={{
                                 fontSize: 17,
                                 color: theme.colors.income,
                                 fontWeight: "600",
                              }}
                           >
                                 {formatIndianNumber(income)}
                           </Text>
                           {previncome > 0 && (
                              <View
                                 style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor: getTrendColor("income", incomeChange) + "22",
                                    borderRadius: 8,
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                 }}
                              >
                                 <Ionicons
                                    name={getTrendIcon(incomeChange)}
                                    size={14}
                                    color={getTrendColor("income", incomeChange)}
                                    style={{ marginRight: 2 }}
                                 />
                                 <Text
                                    style={{
                                       fontSize: 12,
                                       color: getTrendColor("income", incomeChange),
                                       fontWeight: "600",
                                    }}
                                 >
                                    {Math.abs(incomeChange).toFixed(1)}%
                                 </Text>
                              </View>
                           )}
                        </View>
                     </View>
                  </View>
               </View>

               {/* ---------- Right: Circular Progress ---------- */}
               <View style={{ alignItems: "center", justifyContent: "center" }}>
                  <AnimatedCircularProgress
                     totalValue={100}
                     currentValue={percentageSpent}
                     valueSuffix="%"
                     text="Spent"
                  />
               </View>
            </View>
         )}
      </Card>
   );
};

export default PeriodSummaryCard;
