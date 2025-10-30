import { FlatList, ScrollView, View } from "react-native";

// src/screens/ReportsScreen.js
import AppBar from "../components/app/AppBar";
import NoDataCard from "../components/app/NoDataCard";
import PageHeader from "../components/app/PageHeader";
import React from "react";
import ReportListCard from "../components/app/ReportListCard";
import SearchBar from "../components/app/SearchBar";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

// 🧩 Reports configuration
const reportsList = [
   { title: "Monthly Living Costs", description: "Track your monthly essential expenses", onPress: "MonthlyLivingCosts", icon: "home-outline" },
   { title: "Subscription and Bills", description: "Keep track of your recurring payments", onPress: "SubscriptionAndBills", icon: "card-outline" },
   { title: "Transactions By Payees", description: "Analyze transactions by payees", onPress: "TransactionsByPayee", icon: "people-outline" },
   { title: "Transactions By Category", description: "See spending history by category", onPress: "TransactionsByCategory", icon: "pricetag-outline" },
   { title: "Monthly Summary", description: "Review your monthly financial performance", onPress: "MonthlySummary", icon: "calendar-outline" },
   { title: "Income vs Expense", description: "Compare your earnings and spendings", onPress: "IncomeVsExpense", icon: "stats-chart-outline" },
   { title: "Yearly Summary", description: "Analyze your yearly financial performance", onPress: "YearlySummary", icon: "bar-chart-outline" },
   { title: "All Categories", description: "View all spending categories", onPress: "AllCategories", icon: "grid-outline" },
   { title: "All Payees", description: "List of all payees", onPress: "AllPayees", icon: "person-outline" },
];

const ReportsScreen = () => {
   const navigation = useNavigation();
   const { theme } = useTheme();
   const [searchQuery, setSearchQuery] = React.useState("");
   const [viewMode, setViewMode] = React.useState("list"); // 'list' | 'grid'

   const filteredReports = reportsList.filter((report) =>
      report.title.toLowerCase().includes(searchQuery.toLowerCase())
   );

   return (
      <>
         <AppBar>
            <SearchBar
               placeholder="Search reports"
               value={searchQuery}
               onChangeText={setSearchQuery}
               onClear={() => setSearchQuery("")}
            />
         </AppBar>

         <PageHeader
            title="Reports"
            actions={[
               {
                  icon: viewMode === "list" ? "list-circle" : "list-circle-outline",
                  color: viewMode === "list" ? theme.colors.focus : theme.colors.onSurfaceVariant,
                  onPress: () => setViewMode("list"),
               },
               {
                  icon: viewMode === "grid" ? "grid" : "grid-outline",
                  color: viewMode === "grid" ? theme.colors.primary : theme.colors.onSurfaceVariant,
                  onPress: () => setViewMode("grid"),
               },
            ]}
         />

         {filteredReports.length === 0 ? (
            <NoDataCard
               title="No reports found"
               icon="search-outline"
               actionLabel="Clear Search"
               onActionPress={() => setSearchQuery("")}
            />
         ) : viewMode === "list" ? (
            <ScrollView
               contentContainerStyle={{ paddingBottom: 80 }}
               showsVerticalScrollIndicator={false}
            >
               {filteredReports.map((report, index) => (
                  <ReportListCard
                     key={index}
                     title={report.title}
                     description={report.description}
                     icon={report.icon}
                     onPress={() => navigation.navigate(report.onPress)}
                  />
               ))}
            </ScrollView>
         ) : (
            <FlatList
               data={filteredReports}
               keyExtractor={(item, index) => index.toString()}
               numColumns={2}
               showsVerticalScrollIndicator={false}
               columnWrapperStyle={{
                  justifyContent: "space-between",
                  paddingHorizontal: 8,
               }}
               contentContainerStyle={{ paddingBottom: 80, paddingTop: 4 }}
               renderItem={({ item }) => (
                  <View style={{ flex: 0.5, padding: 4 }}>
                     <ReportListCard
                        title={item.title}
                        description={item.description}
                        icon={item.icon}
                        onPress={() => navigation.navigate(item.onPress)}
                        compact
                     />
                  </View>
               )}
            />
         )}
      </>
   );
};

export default ReportsScreen;
