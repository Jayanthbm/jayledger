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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/navigationTypes';
import { useReportData } from '@/hooks/useReportData';
import { ReportSelectors } from '@/components/reports/ReportSelectors';
import { ReportSummary } from '@/components/reports/ReportSummary';
import { ReportListItem } from '@/components/reports/ReportListItem';
import { ReportEmptyState } from '@/components/reports/ReportEmptyState';
import { ReportSortPicker } from '@/components/reports/ReportSortPicker';
import { ReportDrillDownModal } from '@/components/reports/ReportDrillDownModal';
import { SearchBar } from '@/components/SearchBar';
import { common } from '@/styles/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'reports/category-overview'>;

export default function CategoryOverviewReportScreen({ route, navigation }: Props) {
  const { title = 'categories', reportType = 'categories' } = route.params || {};
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const report = useReportData({ reportType });

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity activeOpacity={0.7} style={common.headerTitleContainer}>
          <Text style={[common.navHeaderTitle, { color: colors.text }]}>{title}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, title]);

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
        showYearSelector={false}
        showMonthSelector={false}
        colors={colors}
      />

      <View style={styles.searchContainer}>
        <View style={common.headerControls}>
          <SearchBar
            value={report.searchQuery}
            onChangeText={report.setSearchQuery}
            placeholder="Search categories..."
            size="medium"
            containerStyle={common.flex1}
          />
          <TouchableOpacity
            style={[
              common.sortButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => report.setShowSortPicker(true)}
          >
            <View style={common.flexRowCenterGap4}>
              <Icon name="sort" size={18} color={colors.primary} />
              <Icon
                name={report.sortAsc ? 'arrow-upward' : 'arrow-downward'}
                size={14}
                color={colors.primary}
              />
            </View>
          </TouchableOpacity>
        </View>
        <View style={common.captionRowT2}>
          <Text style={[styles.sortCaption, { color: colors.textSecondary }]}>
            Sorted by {report.sortBy.charAt(0).toUpperCase() + report.sortBy.slice(1)}
          </Text>
        </View>
      </View>

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

      <ReportSortPicker
        visible={report.showSortPicker}
        onClose={() => report.setShowSortPicker(false)}
        sortBy={report.sortBy}
        sortAsc={report.sortAsc}
        onSortChange={(b, a) => {
          report.setSortBy(b);
          report.setSortAsc(a);
        }}
      />

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
  searchContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  sortCaption: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loader: { marginTop: 40 },
});
