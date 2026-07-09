import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useReportData } from '@/hooks/useReportData';
import { ReportSelectors } from '@/components/reports/ReportSelectors';
import { ReportSummary } from '@/components/reports/ReportSummary';
import { ReportListItem } from '@/components/reports/ReportListItem';
import { ReportEmptyState } from '@/components/reports/ReportEmptyState';
import { ReportDrillDownModal } from '@/components/reports/ReportDrillDownModal';
import { common } from '@/styles/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PayeeSummaryReportScreen() {
  const navigation = useNavigation();
  const { title = 'Transactions By Payee', reportType = 'summaryByPayee' } = useLocalSearchParams<{
    title: string;
    reportType: string;
  }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

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
        showTypeToggle={true}
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

      <ReportSummary
        isSummary={false}
        summaryMetrics={null}
        totalAmount={report.totalAmount}
        totalDiff={report.totalDiff}
        prevTotal={report.prevTotal}
        showTrends={report.showTrends}
        type={report.type}
        data={report.data}
        searchQuery={report.searchQuery}
        sortedDataLength={report.sortedData.length}
        colors={colors}
      />

      {report.loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {report.sortedData.length === 0 ? (
            <ReportEmptyState
              searchQuery={report.searchQuery}
              reportType={reportType}
              colors={colors}
              onClearFilters={() => report.setSearchQuery('')}
              onOpenConfig={() => {}}
            />
          ) : (
            report.sortedData.map((item, idx) => (
              <ReportListItem
                key={idx}
                item={item}
                type={report.type}
                totalAmount={report.totalAmount}
                isDark={isDark}
                colors={colors}
                onPress={() => report.handleDrillDown(item)}
                showTrends={report.showTrends}
              />
            ))
          )}
        </ScrollView>
      )}

      <ReportDrillDownModal
        visible={report.showDrillDown}
        onClose={() => report.setShowDrillDown(false)}
        title={report.drillDownTitle}
        data={report.drillDownData}
        colors={colors}
        bottomInset={insets.bottom}
      />
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
