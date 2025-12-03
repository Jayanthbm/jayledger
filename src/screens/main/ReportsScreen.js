import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import Card from '../../components/Card';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { TransactionModel } from '../../database/transactions/transactionModel';
import { CategoryModel } from '../../database/categories/categoryModel';

const ReportsScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const colors = theme.colors;

  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;

    const txs = await TransactionModel.getAll(user.id);
    const cats = await CategoryModel.getAll(user.id);
    const catMap = {};
    cats.forEach((c) => (catMap[c.id] = c.name));

    // 1. Category Pie Chart (Expenses)
    const categoryTotals = {};
    let totalExpense = 0;

    txs.forEach((t) => {
      if (t.type === 'Expense') {
        const catName = catMap[t.category_id] || 'Uncategorized';
        categoryTotals[catName] = (categoryTotals[catName] || 0) + t.amount;
        totalExpense += t.amount;
      }
    });

    const pData = Object.keys(categoryTotals).map((cat, index) => {
      const colorsList = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFF5'];
      return {
        value: categoryTotals[cat],
        color: colorsList[index % colorsList.length],
        text: `${Math.round((categoryTotals[cat] / totalExpense) * 100)}%`,
        label: cat,
      };
    });
    setPieData(pData);

    // 2. Monthly Bar Chart (Income vs Expense)
    // Simplified: Last 6 transactions for demo, ideally aggregate by month
    // For this demo, let's just show Income vs Expense total
    let totalIncome = 0;
    txs.forEach((t) => {
      if (t.type === 'Income') totalIncome += t.amount;
    });

    const bData = [
      { value: totalIncome, label: 'Income', frontColor: colors.income },
      { value: totalExpense, label: 'Expense', frontColor: colors.expense },
    ];
    setBarData(bData);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.header, { color: colors.onBackground }]}>Reports</Text>

      <Card mode="elevated" style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: colors.onSurface }]}>Expenses by Category</Text>
        {pieData.length > 0 ? (
          <View style={{ alignItems: 'center' }}>
            <PieChart
              data={pieData}
              donut
              showText
              textColor="black"
              radius={100}
              textSize={12}
              focusOnPress
              showValuesAsLabels={false}
            />
            <View style={styles.legendContainer}>
              {pieData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: colors.onSurface }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={{ textAlign: 'center', margin: 20, color: colors.onSurfaceVariant }}>
            No data
          </Text>
        )}
      </Card>

      <Card mode="elevated" style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: colors.onSurface }]}>Income vs Expense</Text>
        {barData.length > 0 ? (
          <BarChart
            data={barData}
            barWidth={60}
            noOfSections={4}
            barBorderRadius={4}
            frontColor={colors.primary}
            yAxisThickness={0}
            xAxisThickness={0}
            hideRules
            height={200}
            width={300}
            yAxisTextStyle={{ color: colors.onSurfaceVariant }}
            xAxisLabelTextStyle={{ color: colors.onSurface, fontSize: 12 }}
          />
        ) : (
          <Text style={{ textAlign: 'center', margin: 20, color: colors.onSurfaceVariant }}>
            No data
          </Text>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartCard: {
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
  },
});

export default ReportsScreen;
