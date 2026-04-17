import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getQuickTransactions, deleteQuickTransaction } from '../db/queries';
import { QuickTransaction } from '../models/types';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { common } from '../styles/common';
import { AppNavigation } from '../navigation/navigationTypes';

export default function QuickTransactionsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation<AppNavigation>();

  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const dynamicStyles = React.useMemo(
    () => ({
      listContent: { paddingBottom: insets.bottom + 80 },
      fab: { bottom: insets.bottom + 16 },
    }),
    [insets.bottom],
  );

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={scrollToTop}
          style={common.headerTitleContainer}
        >
          <Text style={[common.navHeaderTitle, { color: colors.text }]}>Quick Transactions</Text>
        </TouchableOpacity>
      ),
      headerTitleAlign: 'left',
    });
  }, [navigation, colors.text, scrollToTop]);

  const [data, setData] = useState<QuickTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const qts = await getQuickTransactions(session.user.id);
      setData(qts);
    } catch (error) {
      console.error('Load Quick Transactions Error:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        loadData();
      }, 0);
      return () => clearTimeout(timer);
    }, [loadData]),
  );

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!session?.user?.id || !deletingId) return;
    await deleteQuickTransaction(deletingId, session.user.id);
    setDeletingId(null);
    loadData();
  };

  const renderItem = ({ item }: { item: QuickTransaction }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigation.navigate('AddQuickTransaction', { quickTransaction: item })}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: item.type === 'Income' ? colors.success + '20' : colors.danger + '20',
          },
        ]}
      >
        <Icon
          name={item.type === 'Income' ? 'add-circle' : 'remove-circle'}
          size={24}
          color={item.type === 'Income' ? colors.success : colors.danger}
        />
      </View>
      <View style={styles.details}>
        <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {item.amount ? `₹${item.amount.toLocaleString()} • ` : ''}
          {item.type}
        </Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
        <Icon name="delete-outline" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[common.flexCenter, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[common.flex1, { backgroundColor: colors.background }]}>
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[common.listContent16, dynamicStyles.listContent]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="bolt" size={64} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              No Templates Yet
            </Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Create templates for transactions you do frequently to add them in one tap.
            </Text>
          </View>
        }
      />
      <FloatingActionButton
        onPress={() => navigation.navigate('AddQuickTransaction')}
        iconName="add"
        backgroundColor={colors.primary}
        style={dynamicStyles.fab}
        iconSize={30}
      />

      <BottomSheet
        visible={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Delete Template?"
      >
        <View style={styles.sheetInner}>
          <View style={styles.sheetHeader}>
            <View style={[styles.deleteIconBox, { backgroundColor: colors.danger + '15' }]}>
              <Icon name="delete-outline" size={32} color={colors.danger} />
            </View>
            <Text style={[styles.sheetText, { color: colors.textSecondary }]}>
              Are you sure you want to delete this template? This action cannot be undone.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.confirmDeleteBtn, { backgroundColor: colors.danger }]}
            onPress={confirmDelete}
          >
            <Text style={styles.confirmDeleteText}>Delete Template</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  details: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  meta: { fontSize: 13, fontWeight: '600' },
  deleteBtn: { padding: 8 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 16 },
  emptySub: { fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  sheetInner: {
    paddingBottom: 10,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
  confirmDeleteBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmDeleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
