import type { ThemeColors } from '../../models/types';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DashboardCard } from './DashboardCard';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { AppNavigation } from '../../navigation/navigationTypes';

import { CircularProgress } from '../CircularProgress';

interface DashboardPayDayProps {
  payDayInfo: {
    daysInMonth: number;
    currentDay: number;
    remaining: number;
    nextMonth: string;
  };
  isDark: boolean;
  navigation: AppNavigation;
  colors: ThemeColors;
}

export const DashboardPayDay = React.memo(
  ({ payDayInfo, isDark, navigation, colors }: DashboardPayDayProps) => {
    const percentage =
      ((payDayInfo.daysInMonth - payDayInfo.remaining) / payDayInfo.daysInMonth) * 100;

    return (
      <DashboardCard
        colors={colors}
        title="PAY DAY"
        icon="event"
        onPress={() => navigation.navigate('CalendarView')}
        headerRight={<MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />}
      >
        <View style={styles.rowBetween}>
          <View style={styles.payDayMain}>
            <Text style={[styles.rowLabel, styles.rowLabelSpaced, { color: colors.textSecondary }]}>
              {payDayInfo.nextMonth}
            </Text>
            <View style={styles.dotGrid}>
              {Array.from({ length: payDayInfo.daysInMonth }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i + 1 < payDayInfo.currentDay
                          ? isDark
                            ? '#374151'
                            : '#E5E7EB'
                          : colors.primary,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.circularContainer}>
            <CircularProgress
              percentage={percentage}
              progressColor={colors.primary}
              borderColor={colors.border}
              value={payDayInfo.remaining}
              label="DAYS"
              textColor={colors.text}
            />
          </View>
        </View>
      </DashboardCard>
    );
  },
);
DashboardPayDay.displayName = 'DashboardPayDay';

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  rowLabelSpaced: { marginBottom: 12 },
  payDayMain: { flex: 1 },
  dotGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 100, gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 5 },
  circularContainer: { marginLeft: 16, alignItems: 'center', justifyContent: 'center' },
});
