import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { useAuth } from '@/store/AuthContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useReportData } from '@/hooks/useReportData';
import { ReportSelectors } from '@/components/reports/ReportSelectors';
import { ReportSummary } from '@/components/reports/ReportSummary';
import { ReportListItem } from '@/components/reports/ReportListItem';
import { ReportEmptyState } from '@/components/reports/ReportEmptyState';
import { ReportDrillDownModal } from '@/components/reports/ReportDrillDownModal';
import { ReportConfigModal } from '@/components/reports/ReportConfigModal';
import { common } from '@/styles/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCategories, toggleCategoryLivingCost } from '@/db/queries';
import { Category } from '@/models/types';

const { width } = Dimensions.get('window');

export default function LivingCostsReportScreen() {
  const navigation = useNavigation();
  const { title = 'Living Costs', reportType } = useLocalSearchParams<{
    title: string;
    reportType: string;
  }>();
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();

  const report = useReportData({ reportType });
  const [showConfig, setShowConfig] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  const loadAllCategories = useCallback(async () => {
    if (!session?.user?.id) return;
    const cats = await getCategories(session.user.id);
    setAllCategories(cats.filter((c) => c.type === 'Expense'));
  }, [session]);

  const handleToggleLivingCost = async (catId: string, current: boolean) => {
    await toggleCategoryLivingCost(catId, !current);
    loadAllCategories();
    report.refresh();
  };

  const displayTitle = title;

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity activeOpacity={0.7} style={common.headerTitleContainer}>
          <Text style={[common.navHeaderTitle, { color: colors.text }]}>{displayTitle}</Text>
        </TouchableOpacity>
      ),
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeftContainer}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            loadAllCategories();
            setShowConfig(true);
          }}
          style={styles.headerRightContainer}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Icon name="settings" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, displayTitle, loadAllCategories]);

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

      <ReportSummary
        isSummary={false}
        summaryMetrics={null}
        totalAmount={report.totalAmount}
        totalDiff={report.totalDiff}
        prevTotal={report.prevTotal}
        showTrends={report.showTrends}
        type={report.type}
        data={report.data}
        searchQuery=""
        sortedDataLength={report.sortedData.length}
        colors={colors}
      />

      {report.loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {report.sortedData.length === 0 ? (
            <ReportEmptyState
              searchQuery=""
              reportType={reportType}
              colors={colors}
              onClearFilters={() => {}}
              onOpenConfig={() => {
                loadAllCategories();
                setShowConfig(true);
              }}
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

      <ReportConfigModal
        visible={showConfig}
        onClose={() => setShowConfig(false)}
        searchQuery={report.searchQuery}
        setSearchQuery={report.setSearchQuery}
        allCategories={allCategories}
        onToggleLivingCost={handleToggleLivingCost}
        colors={colors}
        bottomInset={insets.bottom}
        width={width}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 16 },
  headerLeftContainer: { paddingRight: 12, justifyContent: 'center', alignItems: 'center' },
  headerRightContainer: { paddingRight: 16 },
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
