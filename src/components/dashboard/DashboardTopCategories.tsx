import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { DashboardCard } from './DashboardCard';
import { ThemeColors, ReportItem } from '../../models/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { common } from '../../styles/common';
import { ProgressBar } from '../ProgressBar';
import { formatCurrency } from '../../utils/formatters';

interface DashboardTopCategoriesProps {
  topCategories: ReportItem[];
  totalExpense: number;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  colors: ThemeColors;
}

export const DashboardTopCategories = React.memo(
  ({ topCategories, totalExpense, navigation, colors }: DashboardTopCategoriesProps) => {
    return (
      <DashboardCard
        colors={colors}
        title="TOP CATEGORIES"
        icon="pie-chart"
        onPress={() =>
          navigation.navigate('ReportDetail', {
            reportType: 'summaryByCategory',
            title: 'Transactions By Category',
          })
        }
        headerRight={<MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />}
      >
        {topCategories.length > 0 ? (
          topCategories.map((cat, idx) => (
            <View key={cat.category_name} style={styles.catRow}>
              <View style={styles.catInfo}>
                <View style={common.flexRowCenterGap4}>
                  <Text style={[styles.catName, { color: colors.text }]}>{cat.category_name}</Text>
                  <Text style={[styles.catPercent, { color: colors.textSecondary }]}>
                    ({(((cat.totalAmount || 0) / (totalExpense || 1)) * 100).toFixed(0)}%)
                  </Text>
                </View>
                <Text style={[styles.catAmt, { color: colors.textSecondary }]}>
                  {formatCurrency(cat.totalAmount || 0)}
                </Text>
              </View>
              <ProgressBar
                progress={((cat.totalAmount || 0) / (totalExpense || 1)) * 100}
                color={
                  idx === 0 ? colors.primary : idx === 1 ? colors.textSecondary : colors.border
                }
                backgroundColor="rgba(0,0,0,0.05)"
                height={6}
              />
            </View>
          ))
        ) : (
          <Text style={[styles.catEmpty, { color: colors.textSecondary }]}>No expenses yet</Text>
        )}
      </DashboardCard>
    );
  },
);
DashboardTopCategories.displayName = 'DashboardTopCategories';

const styles = StyleSheet.create({
  catRow: { marginBottom: 16 },
  catInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 14, fontWeight: '600' },
  catAmt: { fontSize: 14, fontWeight: '700' },
  catPercent: { fontSize: 11, fontWeight: '700' },
  catEmpty: { textAlign: 'center', padding: 10 },
});
