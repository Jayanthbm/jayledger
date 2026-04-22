import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../store/ThemeContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { syncTransactions } from '../services/syncService';
import { ActivityIndicator } from 'react-native';
import { common } from '../styles/common';
import { AppNavigation } from '../navigation/navigationTypes';
import { logger } from '../utils/logger';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

const reportsList = [
  {
    title: 'Monthly Living Costs',
    description: 'Essential monthly expenses',
    icon: 'home',
    view: 'monthlyLivingCosts',
    color: '#6366f1',
  },
  {
    title: 'Subscription and Bills',
    description: 'Recurring payments',
    icon: 'subscriptions',
    view: 'subscriptionAndBills',
    color: '#ec4899',
  },
  {
    title: 'Transactions By Payee',
    description: 'History by payee',
    icon: 'person',
    view: 'summaryByPayee',
    color: '#f59e0b',
  },
  {
    title: 'Transactions By Category',
    description: 'History by category',
    icon: 'category',
    view: 'summaryByCategory',
    color: '#10b981',
  },
  {
    title: 'Monthly Summary',
    description: 'Monthly performance',
    icon: 'calendar-today',
    view: 'monthlySummary',
    color: '#3b82f6',
  },
  {
    title: 'Yearly Summary',
    description: 'Yearly performance',
    icon: 'event-note',
    view: 'yearlySummary',
    color: '#ef4444',
  },
  {
    title: 'Transactions By Year',
    description: 'Yearly history by category',
    icon: 'bar-chart',
    view: 'transactionsByYear',
    color: '#8b5cf6',
  },
  {
    title: 'Yearly Payees',
    description: 'Yearly history by payee',
    icon: 'people',
    view: 'yearlyPayees',
    color: '#3b82f6',
  },
  {
    title: 'Payees',
    description: 'Overall payee analysis',
    icon: 'people',
    view: 'payees',
    color: '#06b6d4',
  },
  {
    title: 'Categories',
    description: 'Overall category analysis',
    icon: 'category',
    view: 'categories',
    color: '#f43f5e',
  },
];

export default function ReportsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation<AppNavigation>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isSyncing, setIsSyncing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const loadViewMode = useCallback(async () => {
    try {
      const savedMode = await AsyncStorage.getItem('reports_view_mode');
      if (savedMode === 'grid' || savedMode === 'list') {
        setViewMode(savedMode);
      }
    } catch (e) {
      logger.error('Error loading view mode', e);
    }
  }, []);

  const handleManualSync = useCallback(async () => {
    if (!session?.user?.id || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncTransactions(session.user.id, true);
    } catch (e) {
      logger.error('Manual sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [session, isSyncing]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={scrollToTop}
          style={common.headerTitleContainer}
        >
          <Text style={[common.navHeaderTitle, { color: colors.text }]}>Reports</Text>
        </TouchableOpacity>
      ),
      headerTitleAlign: 'left',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleManualSync}
          style={common.headerRightBtn}
          disabled={isSyncing}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Icon name="refresh" size={24} color={colors.text} />
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, isSyncing, colors.text, colors.primary, handleManualSync, scrollToTop]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadViewMode();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadViewMode]);

  const toggleViewMode = async () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    try {
      await AsyncStorage.setItem('reports_view_mode', newMode);
    } catch (e) {
      logger.error('Error saving view mode', e);
    }
  };

  return (
    <View style={[common.flex1, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: colors.textSecondary }]}>
          Choose a report to view
        </Text>
        <TouchableOpacity
          style={[styles.toggleBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={toggleViewMode}
          activeOpacity={0.7}
        >
          <Icon
            name={viewMode === 'grid' ? 'view-list' : 'view-module'}
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.toggleText, { color: colors.primary }]}>
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        ref={scrollRef}
        style={common.flex1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={viewMode === 'grid' ? styles.grid : styles.list}>
          {reportsList.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                viewMode === 'grid' ? styles.card : styles.listItem,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('ReportDetail', {
                  reportType: item.view,
                  title: item.title,
                })
              }
            >
              <View
                style={[
                  viewMode === 'grid' ? styles.iconBox : styles.listIconBox,
                  { backgroundColor: item.color + '20' },
                ]}
              >
                <Icon
                  name={item.icon as keyof typeof Icon.glyphMap}
                  size={viewMode === 'grid' ? 28 : 22}
                  color={item.color}
                />
              </View>
              <View style={viewMode === 'grid' ? null : styles.listContent}>
                <Text
                  style={[
                    viewMode === 'grid' ? styles.cardTitle : styles.listTitle,
                    { color: colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    viewMode === 'grid' ? styles.cardDesc : styles.listDesc,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
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
  content: {
    padding: 16,
    paddingBottom: 20,
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
  },
});
