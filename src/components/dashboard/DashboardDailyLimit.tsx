import type { ThemeColors } from '../../models/types';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DashboardCard } from './DashboardCard';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { AppNavigation } from '../../navigation/navigationTypes';

import { CircularProgress } from '../CircularProgress';

import { formatCurrency } from '../../utils/formatters';

interface DashboardDailyLimitProps {
  dailyLimitCalc: {
    limit: number;
    spentToday: number;
    remainingToday: number;
    remainingPercentage: number;
  };
  navigation: AppNavigation;
  colors: ThemeColors;
}

export const DashboardDailyLimit = React.memo(
  ({ dailyLimitCalc, navigation, colors }: DashboardDailyLimitProps) => {
    const { remainingToday, spentToday, remainingPercentage } = dailyLimitCalc;

    const progressColor = remainingToday > 0 ? colors.success : colors.danger;

    return (
      <DashboardCard
        colors={colors}
        title="DAILY LIMIT"
        icon="speed"
        onPress={() => navigation.navigate('daily-limit-detail')}
        headerRight={<MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />}
      >
        <View style={styles.rowBetween}>
          <View style={styles.leftMetrics}>
            <View style={styles.metricGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>REMAINING</Text>
              <Text style={[styles.valueLarge, { color: progressColor }]}>
                {formatCurrency(remainingToday)}
              </Text>
            </View>
            <View style={styles.metricGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>SPENT TODAY</Text>
              <Text style={[styles.valueSmall, { color: colors.text }]}>
                {formatCurrency(spentToday)}
              </Text>
            </View>
          </View>

          <View style={styles.rightProgress}>
            <CircularProgress
              percentage={remainingPercentage}
              progressColor={progressColor}
              borderColor={colors.border}
              value={`${Math.round(remainingPercentage)}%`}
              label="LEFT"
              textColor={colors.text}
            />
          </View>
        </View>
      </DashboardCard>
    );
  },
);
DashboardDailyLimit.displayName = 'DashboardDailyLimit';

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  leftMetrics: {
    flex: 1,
    gap: 12,
  },
  metricGroup: {
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  valueLarge: {
    fontSize: 24,
    fontWeight: '900',
  },
  valueSmall: {
    fontSize: 16,
    fontWeight: '800',
  },
  rightProgress: {
    marginLeft: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
