import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/navigationTypes';
import { useReportData } from '@/hooks/useReportData';
import { ReportSelectors } from '@/components/reports/ReportSelectors';
import { ReportEmptyState } from '@/components/reports/ReportEmptyState';
import { ReportDrillDownModal } from '@/components/reports/ReportDrillDownModal';
import { ProgressBar } from '@/components/ProgressBar';
import { common } from '@/styles/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/store/AuthContext';
import { FinancialListItem } from '@/components/common/FinancialListItem';
import { formatCurrency } from '@/utils/formatters';
import { getCategoriesSummaryByGroup, getTransactionsByGroupAndCategory } from '@/db/queries';
import { ReportItem, Transaction, MaterialIconName } from '@/models/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { logger } from '@/utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'reports/group-summary'>;

export default function GroupSummaryReportScreen({ route, navigation }: Props) {
  const { title = 'Transactions By Group', reportType = 'groups' } = route.params || {};
  const { colors } = useTheme();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const insets = useSafeAreaInsets();

  const report = useReportData({ reportType });

  const [selectedGroup, setSelectedGroup] = useState<ReportItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ReportItem | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDrillDownVisible, setDrillDownVisible] = useState(false);

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

  const handleCategoryPress = async (cat: ReportItem, grp: ReportItem) => {
    if (!userId || !grp.group_id || !cat.category_id) return;
    setSelectedGroup(grp);
    setSelectedCategory(cat);
    setDrillDownVisible(true);
    try {
      const data = await getTransactionsByGroupAndCategory(
        userId,
        grp.group_id,
        cat.category_id,
        report.type,
      );
      setTransactions(data);
    } catch (err) {
      logger.error('Error loading group category transactions:', err);
    }
  };

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
              <GroupListItem
                key={idx}
                item={item}
                type={report.type}
                colors={colors}
                userId={userId}
                onCategoryPress={handleCategoryPress}
              />
            ))
          )}
        </ScrollView>
      )}

      <ReportDrillDownModal
        visible={isDrillDownVisible}
        onClose={() => {
          setDrillDownVisible(false);
          setTransactions([]);
          setSelectedCategory(null);
          setSelectedGroup(null);
        }}
        title={
          selectedGroup && selectedCategory
            ? `${selectedGroup.group_name} > ${selectedCategory.category_name}`
            : 'Transactions'
        }
        data={transactions}
        colors={colors}
        bottomInset={insets.bottom}
      />
    </View>
  );
}

// Sub-component: Expandable Accordion Group Item
interface GroupListItemProps {
  item: ReportItem;
  type: 'Expense' | 'Income';
  colors: Record<string, string>;
  userId: string | undefined;
  onCategoryPress: (category: ReportItem, group: ReportItem) => void;
}

const GroupListItem: React.FC<GroupListItemProps> = ({
  item,
  type,
  colors,
  userId,
  onCategoryPress,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [categories, setCategories] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { isDark } = useTheme();

  const handlePress = async () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    if (nextState && userId && item.group_id) {
      setLoading(true);
      try {
        const data = await getCategoriesSummaryByGroup(userId, item.group_id, type);
        setCategories(data as ReportItem[]);
      } catch (err) {
        logger.error('Error fetching categories for group:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const amount = item.amount || item.totalAmount || 0;

  return (
    <View style={styles.groupItemContainer}>
      <FinancialListItem
        title={item.group_name || 'Unknown'}
        amountText={formatCurrency(amount)}
        amountColor={type === 'Income' ? colors.success : colors.danger}
        icon="folder"
        iconColor={colors.primary}
        onPress={handlePress}
        rightBottomNode={
          <View style={styles.chevronRow}>
            <MaterialIcons
              name={isExpanded ? 'expand-less' : 'expand-more'}
              size={16}
              color={colors.textSecondary}
            />
            <Text style={[styles.chevronText, { color: colors.textSecondary }]}>
              {isExpanded ? 'Collapse' : 'Tap to expand'}
            </Text>
          </View>
        }
      />

      {isExpanded && (
        <View style={[styles.categoriesContainer, { borderLeftColor: colors.border }]}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.categoryLoader} />
          ) : categories.length === 0 ? (
            <Text style={[styles.emptyCategoryText, { color: colors.textSecondary }]}>
              No categories found in this group
            </Text>
          ) : (
            categories.map((cat) => {
              const percent = amount > 0 ? ((cat.amount || 0) / amount) * 100 : 0;
              return (
                <View key={cat.category_id} style={styles.categoryRowWrapper}>
                  <FinancialListItem
                    title={cat.category_name || ''}
                    amountText={formatCurrency(cat.amount || 0)}
                    amountColor={type === 'Income' ? colors.success : colors.danger}
                    icon={cat.category_app_icon as MaterialIconName}
                    iconColor={colors.primary}
                    onPress={() => onCategoryPress(cat, item)}
                    containerStyle={{
                      ...styles.categoryListItem,
                      backgroundColor: colors.background,
                    }}
                    compact
                  >
                    <View style={styles.progressContainer}>
                      <ProgressBar
                        progress={percent}
                        color={type === 'Income' ? colors.success : colors.danger}
                        backgroundColor={isDark ? '#333' : '#eee'}
                        height={6}
                        style={common.flex1}
                      />
                      <Text style={[styles.progressPercent, { color: colors.textSecondary }]}>
                        {percent.toFixed(0)}%
                      </Text>
                    </View>
                  </FinancialListItem>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 16 },
  loader: { marginTop: 40 },
  groupItemContainer: {
    marginBottom: 8,
  },
  categoriesContainer: {
    marginLeft: 24,
    paddingLeft: 8,
    borderLeftWidth: 1,
    marginTop: 2,
    marginBottom: 8,
  },
  categoryRowWrapper: {
    marginVertical: 2,
  },
  categoryListItem: {
    elevation: 0,
    shadowOpacity: 0,
    marginVertical: 0,
  },
  categoryLoader: {
    paddingVertical: 12,
  },
  emptyCategoryText: {
    fontSize: 12,
    paddingVertical: 8,
    fontStyle: 'italic',
  },
  chevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  chevronText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    width: 35,
  },
});
