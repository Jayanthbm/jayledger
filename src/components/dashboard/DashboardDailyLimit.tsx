import type { ThemeColors } from '../../models/types';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DashboardCard } from './DashboardCard';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { AppNavigation } from '../../navigation/navigationTypes';

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
        onPress={() => navigation.navigate('DailyLimitDetail')}
        headerRight={<MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />}
      >
        <View style={styles.rowBetween}>
          <View style={styles.leftMetrics}>
            <View style={styles.metricGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>REMAINING</Text>
              <Text style={[styles.valueLarge, { color: progressColor }]}>
                ₹{Math.round(remainingToday).toLocaleString()}
              </Text>
            </View>
            <View style={styles.metricGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>SPENT TODAY</Text>
              <Text style={[styles.valueSmall, { color: colors.text }]}>
                ₹{Math.round(spentToday).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.rightProgress}>
            <View
              style={[
                styles.progressCircle,
                {
                  borderColor: colors.border,
                  borderTopColor: remainingPercentage > 0 ? progressColor : colors.border,
                  borderRightColor: remainingPercentage > 25 ? progressColor : colors.border,
                  borderBottomColor: remainingPercentage > 50 ? progressColor : colors.border,
                  borderLeftColor: remainingPercentage > 75 ? progressColor : colors.border,
                  transform: [{ rotate: '0deg' }],
                },
              ]}
            >
              <View
                style={[
                  styles.progressInner,
                  {
                    backgroundColor: progressColor + '08',
                  },
                ]}
              >
                <Text style={[styles.percentageText, { color: colors.text }]}>
                  {Math.round(remainingPercentage)}%
                </Text>
                <Text style={[styles.percentageLabel, { color: colors.textSecondary }]}>LEFT</Text>
              </View>
            </View>
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
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 18,
    fontWeight: '900',
  },
  percentageLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
