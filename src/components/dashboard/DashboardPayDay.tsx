import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DashboardCard } from './DashboardCard';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface DashboardPayDayProps {
  payDayInfo: {
    daysInMonth: number;
    currentDay: number;
    remaining: number;
    nextMonth: string;
  };
  isDark: boolean;
  navigation: any;
  colors: any;
}

export const DashboardPayDay = React.memo(({ payDayInfo, isDark, navigation, colors }: DashboardPayDayProps) => {
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
          <Text style={[styles.rowLabel, { color: colors.textSecondary, marginBottom: 12 }]}>{payDayInfo.nextMonth}</Text>
          <View style={styles.dotGrid}>
            {Array.from({ length: payDayInfo.daysInMonth }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: (i + 1) < payDayInfo.currentDay ? (isDark ? '#374151' : '#E5E7EB') : colors.primary }
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.circularContainer}>
          <View style={[styles.progressCircle, {
            borderColor: colors.border,
            borderTopColor: colors.primary,
            borderRightColor: (30 - payDayInfo.remaining) > 7 ? colors.primary : colors.border,
            borderBottomColor: (30 - payDayInfo.remaining) > 15 ? colors.primary : colors.border,
            borderLeftColor: (30 - payDayInfo.remaining) > 22 ? colors.primary : colors.border,
            transform: [{ rotate: '0deg' }]
          }]}>
            <View style={[styles.progressInner, {
              backgroundColor: colors.primary + '08',
            }]}>
              <Text style={[styles.progressText, { color: colors.text }]}>{payDayInfo.remaining}</Text>
              <Text style={[styles.progressSub, { color: colors.textSecondary }]}>DAYS</Text>
            </View>
          </View>
        </View>
      </View>
    </DashboardCard>
  );
});

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  payDayMain: { flex: 1 },
  dotGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 100, gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 5 },
  circularContainer: { marginLeft: 16, alignItems: 'center', justifyContent: 'center' },
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
  progressText: { fontSize: 20, fontWeight: '800' },
  progressSub: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
});
