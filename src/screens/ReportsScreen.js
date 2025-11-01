import { FlatList, Pressable, ScrollView, View } from "react-native";

// src/screens/ReportsScreen.js
import AppBar from "../components/app/AppBar";
import NoDataCard from "../components/app/NoDataCard";
import PageHeader from "../components/app/PageHeader";
import React from "react";
import ReportListCard from "../components/app/ReportListCard";
import SearchBar from "../components/app/SearchBar";
import ViewModeToggle from "../components/app/ViewModeToggle";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

// 🧩 Reports configuration
const reportsList = [
   {
      title: "Monthly Living Costs",
      description: "Track your monthly essential expenses",
      onPress: "MonthlyLivingCosts",
      icon: "home",
   },
   {
      title: "Subscription and Bills",
      description: "Keep track of your recurring payments",
      onPress: "SubscriptionAndBills",
      icon: "credit-card",
   },
   {
      title: "Transactions By Payees",
      description: "Analyze transactions by payees",
      onPress: "TransactionsByPayee",
      icon: "account-multiple",
   },
   {
      title: "Transactions By Category",
      description: "See spending history by category",
      onPress: "TransactionsByCategory",
      icon: "tag",
   },
   {
      title: "Monthly Summary",
      description: "Review your monthly financial performance",
      onPress: "MonthlySummary",
      icon: "calendar-month",
   },
   {
      title: "Income vs Expense",
      description: "Compare your earnings and spendings",
      onPress: "IncomeVsExpense",
      icon: "thumbs-up-down",
   },
   {
      title: "Yearly Summary",
      description: "Analyze your yearly financial performance",
      onPress: "YearlySummary",
      icon: "chart-bar",
   },
   {
      title: "All Categories",
      description: "View all spending categories",
      onPress: "AllCategories",
      icon: "tag-multiple",
   },
   {
      title: "All Payees",
      description: "List of all payees",
      onPress: "AllPayees",
      icon: "account-tag",
   },
];

const ReportsScreen = () => {
   const navigation = useNavigation();
   const [searchQuery, setSearchQuery] = React.useState("");
   const [viewMode, setViewMode] = React.useState("list"); // 'list' | 'grid'

   const filteredReports = reportsList.filter((report) =>
      report.title.toLowerCase().includes(searchQuery.toLowerCase())
   );

   return (
      <>
         <AppBar centerContent={
            <SearchBar
               placeholder="Search reports"
               value={searchQuery}
               onChangeText={setSearchQuery}
               onClear={() => setSearchQuery("")}
            />
         } />

         <PageHeader title="Reports">
            <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
         </PageHeader>


         {filteredReports.length === 0 ? (
            <NoDataCard
               title="No reports found"
               icon="text-search"
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
