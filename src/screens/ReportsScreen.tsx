import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../store/ThemeContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

const reportsList = [
  {
    title: "Monthly Living Costs",
    description: "Essential monthly expenses",
    icon: "home",
    view: "monthlyLivingCosts",
    color: "#6366f1"
  },
  {
    title: "Subscription and Bills",
    description: "Recurring payments",
    icon: "subscriptions",
    view: "subscriptionAndBills",
    color: "#ec4899"
  },
  {
    title: "Transactions By Payee",
    description: "History by payee",
    icon: "person",
    view: "summaryByPayee",
    color: "#f59e0b"
  },
  {
    title: "Transactions By Category",
    description: "History by category",
    icon: "category",
    view: "summaryByCategory",
    color: "#10b981"
  },
  {
    title: "Monthly Summary",
    description: "Monthly performance",
    icon: "calendar-today",
    view: "monthlySummary",
    color: "#3b82f6"
  },
  {
    title: "Yearly Summary",
    description: "Yearly performance",
    icon: "event-note",
    view: "yearlySummary",
    color: "#ef4444"
  },
  {
    title: "Payees",
    description: "Overall payee analysis",
    icon: "people",
    view: "payees",
    color: "#06b6d4"
  },
  {
    title: "Categories",
    description: "Overall category analysis",
    icon: "category",
    view: "categories",
    color: "#f43f5e"
  },
];

export default function ReportsScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadViewMode();
  }, []);

  const loadViewMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('reports_view_mode');
      if (savedMode === 'grid' || savedMode === 'list') {
        setViewMode(savedMode);
      }
    } catch (e) {
      console.error("Error loading view mode", e);
    }
  };

  const toggleViewMode = async () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    try {
      await AsyncStorage.setItem('reports_view_mode', newMode);
    } catch (e) {
      console.error("Error saving view mode", e);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: colors.textSecondary }]}>Choose a report to view</Text>
        <TouchableOpacity 
          style={[styles.toggleBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
          onPress={toggleViewMode}
          activeOpacity={0.7}
        >
          <Icon name={viewMode === 'grid' ? 'view-list' : 'view-module'} size={20} color={colors.primary} />
          <Text style={[styles.toggleText, { color: colors.primary }]}>
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={viewMode === 'grid' ? styles.grid : styles.list}>
          {reportsList.map((item, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={[
                viewMode === 'grid' ? styles.card : styles.listItem, 
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ReportDetail', { 
                reportType: item.view, 
                title: item.title 
              })}
            >
              <View style={[
                viewMode === 'grid' ? styles.iconBox : styles.listIconBox, 
                { backgroundColor: item.color + '20' }
              ]}>
                <Icon name={item.icon as any} size={viewMode === 'grid' ? 28 : 22} color={item.color} />
              </View>
              <View style={viewMode === 'grid' ? null : styles.listContent}>
                <Text style={[
                  viewMode === 'grid' ? styles.cardTitle : styles.listTitle, 
                  { color: colors.text }
                ]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[
                  viewMode === 'grid' ? styles.cardDesc : styles.listDesc, 
                  { color: colors.textSecondary }
                ]} numberOfLines={1}>
                  {item.description}
                </Text>
              </View>
              {viewMode === 'list' && (
                <Icon name="chevron-right" size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  list: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    width: cardWidth,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  listIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
    lineHeight: 20,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  listDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  }
});
