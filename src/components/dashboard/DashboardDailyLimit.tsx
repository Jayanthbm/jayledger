import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DashboardCard } from './DashboardCard';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { common } from '../../styles/common';

interface DashboardDailyLimitProps {
  dailyLimitCalc: {
    limit: number;
    spentToday: number;
    remainingToday: number;
  };
  navigation: any;
  colors: any;
}

export const DashboardDailyLimit = React.memo(
  ({ dailyLimitCalc, navigation, colors }: DashboardDailyLimitProps) => {
    return (
      <DashboardCard
        colors={colors}
        title="DAILY LIMIT"
        icon="speed"
        onPress={() => navigation.navigate('DailyLimitDetail')}
        headerRight={<MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />}
      >
        <View style={styles.rowBetween}>
          <View>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>REMAINING</Text>
            <Text
              style={[
                styles.rowValue,
                { color: dailyLimitCalc.remainingToday >= 0 ? colors.success : colors.danger },
              ]}
            >
              ₹{Math.abs(dailyLimitCalc.remainingToday).toLocaleString()}
            </Text>
          </View>
          <View style={common.alignEnd}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>SPENT</Text>
            <Text style={[styles.rowValue, { color: colors.danger }]}>
              ₹{dailyLimitCalc.spentToday.toLocaleString()}
            </Text>
          </View>
        </View>
      </DashboardCard>
    );
  },
);
DashboardDailyLimit.displayName = 'DashboardDailyLimit';

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  rowValue: { fontSize: 20, fontWeight: '800' },
});
