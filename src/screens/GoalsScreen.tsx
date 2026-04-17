import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { insertGoal, deleteGoalAsync } from '../db/queries';
import { Goal } from '../models/types';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getRelativeTime } from '../utils/dateUtils';
import { useToast } from '../store/ToastContext';
import { generateUUID } from '../utils/commonUtils';

import { fetchGoals, handleGoalSync, sortGoals } from '../services/goalService';

// Modular Components
import { GoalCard } from '../components/goals/GoalCard';
import { GoalSortModal } from '../components/goals/GoalSortModal';
import { GoalDeleteModal } from '../components/goals/GoalDeleteModal';
import { GoalAddEditModal } from '../components/goals/GoalAddEditModal';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { common } from '../styles/common';

export default function GoalsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const user = session?.user;
  const navigation = useNavigation<any>();
  const { showToast } = useToast();

  const [data, setData] = useState<Goal[]>([]);
  const [_loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const listRef = useRef<FlatList>(null);

  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'amount'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchGoals(user.id);
      setData(rows);

      const last = await AsyncStorage.getItem(`@last_sync_goals_${user.id}`);
      if (last) setLastSyncTime(getRelativeTime(parseInt(last)));

      if (rows.length === 0) {
        const alreadyChecked = await AsyncStorage.getItem(`@initial_goals_sync_checked_${user.id}`);
        if (!alreadyChecked) {
          setIsSyncing(true);
          await handleGoalSync(user.id);
          const lastUpdated = await AsyncStorage.getItem(`@last_sync_goals_${user.id}`);
          if (lastUpdated) setLastSyncTime(getRelativeTime(parseInt(lastUpdated)));
          const updated = await fetchGoals(user.id);
          setData(updated);
          setIsSyncing(false);
        }
      }
    } catch (e) {
      console.error('Load Goals Error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('module_refreshed', (event) => {
      if (event.module === 'Goals') {
        setTimeout(() => {
          loadData();
        }, 0);
      }
    });
    return () => sub.remove();
  }, [loadData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleManualSync = useCallback(async () => {
    if (!user?.id || isSyncing) return;
    setIsSyncing(true);
    try {
      await handleGoalSync(user.id);
      const last = await AsyncStorage.getItem(`@last_sync_goals_${user.id}`);
      if (last) setLastSyncTime(getRelativeTime(parseInt(last)));
      await loadData();
      showToast('Goals synced successfully', 'success');
    } catch (e) {
      console.error('Manual sync error:', e);
      showToast('Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [user, loadData, isSyncing, showToast]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={scrollToTop}
          style={styles.headerTitleContainer}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>Goals</Text>
          {lastSyncTime ? (
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Synced: {lastSyncTime}
            </Text>
          ) : null}
        </TouchableOpacity>
      ),
      headerTitleAlign: 'left',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleManualSync}
          style={styles.headerRightBtn}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialIcons name="refresh" size={24} color={colors.text} />
          )}
        </TouchableOpacity>
      ),
    });
  }, [
    navigation,
    handleManualSync,
    isSyncing,
    colors.text,
    colors.textSecondary,
    colors.primary,
    lastSyncTime,
    scrollToTop,
  ]);

  const sortedData = useMemo(() => {
    return sortGoals(data, sortBy, sortAsc);
  }, [data, sortAsc, sortBy]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerControls}>
          <View style={styles.titleWrapper}>
            <Text style={[styles.title, { color: colors.text }]}>Savings Goals</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.sortButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setIsSortModalOpen(true)}
          >
            <View style={common.flexRowCenterGap4}>
              <MaterialIcons name="sort" size={18} color={colors.primary} />
              <MaterialIcons
                name={sortAsc ? 'arrow-upward' : 'arrow-downward'}
                size={14}
                color={colors.primary}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.captionRow}>
          <Text style={[styles.sortCaption, { color: colors.textSecondary }]}>
            Sorted by {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
          </Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={sortedData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GoalCard
            item={item}
            onPress={(g) => {
              setEditingGoal(g);
              setIsModalOpen(true);
            }}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="flag" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No Goals Found</Text>
          </View>
        }
      />

      <FloatingActionButton
        onPress={() => {
          setEditingGoal(null);
          setIsModalOpen(true);
        }}
        iconName="add"
        backgroundColor={colors.primary}
      />

      <GoalAddEditModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingGoal={editingGoal}
        onDeleteRequest={(id) => {
          setTargetDeleteId(id);
          setIsDeleteModalOpen(true);
        }}
        onSave={async (goalData) => {
          if (!user?.id) return;
          const newGoal: Goal = {
            id: editingGoal?.id || generateUUID(),
            name: goalData.name!,
            logo: goalData.logo!,
            goal_amount: goalData.goal_amount!,
            current_amount: goalData.current_amount!,
            user_id: user.id,
          };
          await insertGoal(newGoal);
          setIsModalOpen(false);
          loadData();
          showToast(`Goal ${editingGoal ? 'updated' : 'added'} successfully`, 'success');
        }}
      />

      <GoalSortModal
        visible={isSortModalOpen}
        onClose={() => setIsSortModalOpen(false)}
        sortBy={sortBy}
        sortAsc={sortAsc}
        onSortChange={(mode, asc) => {
          setSortBy(mode);
          setSortAsc(asc);
        }}
      />

      <GoalDeleteModal
        visible={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (!user?.id || !targetDeleteId) return;
          await deleteGoalAsync(targetDeleteId, user.id);
          setIsDeleteModalOpen(false);
          setIsModalOpen(false);
          loadData();
          showToast('Goal deleted', 'success');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrapper: { flex: 1 },
  sortButton: {
    width: 64,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionRow: {
    marginTop: 2,
    alignItems: 'flex-end',
  },
  sortCaption: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: { fontSize: 16, fontWeight: 'bold' },
  headerTitleContainer: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 10,
  },
  headerRightBtn: {
    paddingRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 16,
  },
});
