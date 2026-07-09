import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { useReportData } from '../../hooks/useReportData';
import { ReportSelectors } from '../../components/reports/ReportSelectors';
import { ReportSummary } from '../../components/reports/ReportSummary';
import { ReportEmptyState } from '../../components/reports/ReportEmptyState';
import { common } from '../../styles/common';

type Props = NativeStackScreenProps<RootStackParamList, 'MonthlySummaryReport'>;

export default function MonthlySummaryReportScreen({ route, navigation }: Props) {
  const { title = 'Monthly Summary', reportType = 'monthlySummary' } = route.params || {};
  const { colors } = useTheme();

  const report = useReportData({ reportType });

  const displayTitle = title;

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity activeOpacity={0.7} style={common.headerTitleContainer}>
          <Text style={[common.navHeaderTitle, { color: colors.text }]}>{displayTitle}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, displayTitle]);

  return (
    <View style={[common.flex1, { backgroundColor: colors.background }]}>
      <ReportSelectors
        type={report.type}
        setType={report.setType}
        year={report.year}
        month={report.month}
        setYear={report.setYear}
        setMonth={report.setMonth}
        reportType={reportType}
        minDate={report.minDate}
        maxDate={report.maxDate}
        showTypeToggle={false}
        showYearSelector={true}
        showMonthSelector={true}
        colors={colors}
      />

      {report.isCurrentPeriod && (
        <View style={styles.comparisonIconRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.comparisonIconBtn,
              {
                backgroundColor: report.useFullPreviousPeriod ? colors.primary + '15' : colors.card,
                borderColor: report.useFullPreviousPeriod ? colors.primary : colors.border,
              },
            ]}
            onPress={() => report.setUseFullPreviousPeriod(!report.useFullPreviousPeriod)}
          >
            <Icon
              name={report.useFullPreviousPeriod ? 'history-toggle-off' : 'history'}
              size={18}
              color={report.useFullPreviousPeriod ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.comparisonIconText,
                { color: report.useFullPreviousPeriod ? colors.primary : colors.textSecondary },
              ]}
            >
              Full Month
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {report.loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {report.data.length === 0 ? (
            <ReportEmptyState
              searchQuery=""
              reportType={reportType}
              colors={colors}
              onClearFilters={() => {}}
              onOpenConfig={() => {}}
            />
          ) : (
            <ReportSummary
              isSummary={true}
              summaryMetrics={report.summaryMetrics}
              totalAmount={report.totalAmount}
              totalDiff={report.totalDiff}
              prevTotal={report.prevTotal}
              showTrends={report.showTrends}
              type={report.type}
              data={report.data}
              searchQuery=""
              sortedDataLength={report.data.length}
              colors={colors}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 16 },
  loader: { marginTop: 40 },
  comparisonIconRow: {
    paddingHorizontal: 20,
    marginTop: -8,
    marginBottom: 8,
    alignItems: 'center',
  },
  comparisonIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  comparisonIconText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
