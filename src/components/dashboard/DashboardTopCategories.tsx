import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { DashboardCard } from './DashboardCard';

interface DashboardTopCategoriesProps {
  topCategories: any[];
  totalExpense: number;
  navigation: any;
  colors: any;
}

export const DashboardTopCategories = React.memo(({ topCategories, totalExpense, navigation, colors }: DashboardTopCategoriesProps) => {
  return (
    <DashboardCard
      colors={colors}
      title="TOP CATEGORIES"
      icon="pie-chart"
      onPress={() => navigation.navigate('ReportDetail', { reportType: 'summaryByCategory', title: 'Transactions By Category' })}
      headerRight={<MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />}
    >
      {topCategories.length > 0 ? topCategories.map((cat, idx) => (
        <View key={cat.category_name} style={styles.catRow}>
          <View style={styles.catInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.catName, { color: colors.text }]}>{cat.category_name}</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>
                ({((cat.totalAmount / (totalExpense || 1)) * 100).toFixed(0)}%)
              </Text>
            </View>
            <Text style={[styles.catAmt, { color: colors.textSecondary }]}>₹{cat.totalAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.catProgressBg}>
            <View style={[styles.catProgressFill, {
              width: `${Math.min(100, (cat.totalAmount / (totalExpense || 1)) * 100)}%`,
              backgroundColor: idx === 0 ? colors.primary : idx === 1 ? colors.textSecondary : colors.border
            }]} />
          </View>
        </View>
      )) : (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 10 }}>No expenses yet</Text>
      )}
    </DashboardCard>
  );
});

const styles = StyleSheet.create({
  catRow: { marginBottom: 16 },
  catInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 14, fontWeight: '600' },
  catAmt: { fontSize: 14, fontWeight: '700' },
  catProgressBg: { height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.05)', overflow: 'hidden' },
  catProgressFill: { height: '100%', borderRadius: 3 },
});
