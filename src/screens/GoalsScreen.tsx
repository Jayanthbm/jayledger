import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, Keyboard, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getDb } from '../db/database';
import { syncGoals } from '../services/syncService';
import { insertGoal, deleteGoalAsync } from '../db/queries';
import { Goal } from '../models/types';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getRelativeTime } from '../utils/dateUtils';
import { BottomSheet } from '../components/BottomSheet';

const generateUUID = () => {
  let dt = new Date().getTime();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (dt + Math.random()*16)%16 | 0;
    dt = Math.floor(dt/16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

import { DeviceEventEmitter } from 'react-native';

export default function GoalsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const user = session?.user;
  const navigation = useNavigation<any>();

  const [data, setData] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const listRef = useRef<FlatList>(null);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [sortAsc, setSortAsc] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'amount'>('name');
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const db = getDb();
    let rows = await db.getAllAsync<Goal>(
      `SELECT * FROM goals WHERE user_id = '${user.id}' ORDER BY name ASC`
    );
    setData(rows);
    try {
      const last = await AsyncStorage.getItem(`@last_sync_goals_${user.id}`);
      if (last) {
        setLastSyncTime(getRelativeTime(parseInt(last)));
      }

      if (rows.length === 0) {
        const alreadyChecked = await AsyncStorage.getItem(`@initial_goals_sync_checked_${user.id}`);
        if (!alreadyChecked) {
          setIsSyncing(true);
          await syncGoals(user.id);
          await AsyncStorage.setItem(`@initial_goals_sync_checked_${user.id}`, 'true');
          const lastUpdated = await AsyncStorage.getItem(`@last_sync_goals_${user.id}`);
          if (lastUpdated) {
            setLastSyncTime(getRelativeTime(parseInt(lastUpdated)));
          }
          const updatedRows = await db.getAllAsync<Goal>(
            `SELECT * FROM goals WHERE user_id = '${user.id}' ORDER BY name ASC`
          );
          setData(updatedRows);
          setIsSyncing(false);
        }
      }
    } catch (e) {}
  }, [user?.id]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('module_refreshed', (data) => {
      if (data.module === 'Goals') loadData();
    });
    return () => sub.remove();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const resetForm = () => {
    setEditingGoal(null);
    setName('');
    setLogo('');
    setGoalAmount('');
    setCurrentAmount('');
    setIsModalOpen(false);
  };

  const handleOpenGoal = (g?: Goal) => {
    if (g) {
      setEditingGoal(g);
      setName(g.name);
      setLogo(g.logo || '');
      setGoalAmount(g.goal_amount.toString());
      setCurrentAmount(g.current_amount.toString());
      setIsModalOpen(true);
    } else {
      resetForm();
      setIsModalOpen(true);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !user?.id) return;
    Keyboard.dismiss();
    setIsSaving(true);

    const targetAmt = parseFloat(goalAmount) || 0;
    const currAmt = parseFloat(currentAmount) || 0;

    const newGoal: Goal = {
      id: editingGoal?.id || generateUUID(),
      name: name.trim(),
      logo: logo.trim(),
      goal_amount: targetAmt,
      current_amount: currAmt,
      user_id: user.id
    };

    // Optimistic local update
    await insertGoal(newGoal);
    setData(prev => {
      if (editingGoal) return prev.map(p => p.id === newGoal.id ? newGoal : p);
      return [...prev, newGoal];
    });

    resetForm();
    setIsSaving(false);

    // Trigger background sync (non-blocking) - Use syncGoals instead of full sync
    syncGoals(user.id).catch(err => console.error("Goal sync failed", err));
  };

  const handleDelete = async () => {
    if (!user?.id || !targetDeleteId) return;
    const id = targetDeleteId;
    // Optimistic Delete
    setData(prev => prev.filter(g => g.id !== id));
    setIsDeleteModalOpen(false);
    setTargetDeleteId(null);
    resetForm();

    await deleteGoalAsync(id, user.id);
    syncGoals(user.id).catch(err => console.error("Goal sync failed", err));
  };

  const confirmDelete = (id: string) => {
    setTargetDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const sortedData = useMemo(() => {
    let result = [...data];
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortBy === 'progress') {
        const progA = a.goal_amount ? (a.current_amount / a.goal_amount) : 0;
        const progB = b.goal_amount ? (b.current_amount / b.goal_amount) : 0;
        cmp = progA - progB;
      } else if (sortBy === 'amount') {
        cmp = a.goal_amount - b.goal_amount;
      }
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [data, sortAsc, sortBy]);

  const renderItem = ({ item }: { item: Goal }) => {
    const rawProgress = item.goal_amount ? (item.current_amount / item.goal_amount) * 100 : 0;
    const progress = Math.min(rawProgress, 100);
    const progressDisplay = Math.round(progress);
    const remaining = Math.max(item.goal_amount - item.current_amount, 0);

    return (
      <TouchableOpacity
         style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
         activeOpacity={0.7}
         onPress={() => handleOpenGoal(item)}
      >
        <View style={styles.topRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {item.logo && item.logo.startsWith('http') ? (
              <Image source={{ uri: item.logo }} style={styles.goalLogo} />
            ) : (
              <View style={[styles.goalLogoFallback, { backgroundColor: colors.border }]}>
                 <Text style={{ fontSize: 16 }}>🎯</Text>
              </View>
            )}
            <Text style={[styles.title, { color: colors.text, flex: 1 }]} numberOfLines={1}>{item.name}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Saved</Text>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Target</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={[styles.amountValue, { color: colors.success }]}>₹{item.current_amount.toLocaleString()}</Text>
          <Text style={[styles.amountValue, { color: colors.text }]}>₹{item.goal_amount.toLocaleString()}</Text>
        </View>

        <View style={[styles.progressWrapper, { backgroundColor: colors.border, marginTop: 12, marginBottom: 8 }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: progress >= 100 ? colors.success : colors.primary }]} />
        </View>

        <View style={styles.statsRow}>
          <Text style={[styles.percentLabel, { color: colors.primary }]}>{progressDisplay}% Complete</Text>
          <Text style={[styles.remainingLabel, { color: colors.textSecondary }]}>₹{remaining.toLocaleString()} left</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleManualSync = useCallback(async () => {
    if (!user?.id) return;
    setIsSyncing(true);
    await syncGoals(user.id);
    const last = await AsyncStorage.getItem(`@last_sync_goals_${user.id}`);
    if (last) {
      setLastSyncTime(getRelativeTime(parseInt(last)));
    }
    await loadData();
    setIsSyncing(false);
  }, [user?.id, loadData]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={scrollToTop}
          style={{ alignItems: 'flex-start' }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Goals</Text>
          {lastSyncTime ? (
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>Synced: {lastSyncTime}</Text>
          ) : null}
        </TouchableOpacity>
      ),
      headerTitleAlign: 'left',
      headerRight: () => (
        <TouchableOpacity
          style={{ paddingRight: 16, justifyContent: 'center', alignItems: 'center' }}
          onPress={handleManualSync}
          disabled={isSyncing}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
           {isSyncing ? (
             <ActivityIndicator size="small" color={colors.primary} />
           ) : (
             <MaterialIcons name="refresh" size={24} color={colors.text} />
           )}
        </TouchableOpacity>
      )
    });
  }, [navigation, handleManualSync, isSyncing, colors.text, colors.textSecondary, colors.primary, lastSyncTime]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <View style={styles.header}>
        <View style={styles.headerControls}>
          <View style={styles.titleWrapper}>
            <Text style={[styles.title, { color: colors.text }]}>Savings Goals</Text>
          </View>
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setIsSortModalOpen(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MaterialIcons name="sort" size={18} color={colors.primary} />
              <MaterialIcons 
                name={sortAsc ? "arrow-upward" : "arrow-downward"} 
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
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
             <MaterialIcons name="flag" size={48} color={colors.border} />
             <Text style={{ textAlign: 'center', marginTop: 12, fontSize: 16, color: colors.textSecondary }}>No Goals Assigned Offline</Text>
             <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: colors.textSecondary }}>Add your explicit goal constraints remotely.</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => handleOpenGoal()}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <BottomSheet
        visible={isModalOpen}
        onClose={resetForm}
        title={editingGoal ? 'Edit Goal' : 'Add New Goal'}
        headerRight={editingGoal ? (
          <TouchableOpacity onPress={() => confirmDelete(editingGoal.id)} style={{ padding: 8 }}>
            <MaterialIcons name="delete-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        ) : undefined}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.formRow}>
               <View style={{ flex: 1 }}>
                 <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Image URL (Logo)</Text>
                 <TextInput style={[styles.inputField, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="https://..." placeholderTextColor={colors.textSecondary} value={logo} onChangeText={setLogo} autoCapitalize="none" />
               </View>
            </View>

            <View style={styles.formRow}>
               <View style={{ flex: 1 }}>
                 <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Goal Name</Text>
                 <TextInput style={[styles.inputField, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="e.g. Vacation" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} />
               </View>
            </View>

            <View style={styles.formRow}>
               <View style={{ flex: 0.5, marginRight: 12 }}>
                 <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Target Goal Amount</Text>
                 <TextInput style={[styles.inputField, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="₹0" placeholderTextColor={colors.textSecondary} value={goalAmount} onChangeText={setGoalAmount} keyboardType="numeric" />
               </View>
               <View style={{ flex: 0.5 }}>
                 <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Currently Saved</Text>
                 <TextInput style={[styles.inputField, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="₹0" placeholderTextColor={colors.textSecondary} value={currentAmount} onChangeText={setCurrentAmount} keyboardType="numeric" />
               </View>
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary, opacity: (!name.trim() || isSaving) ? 0.5 : 1 }]} onPress={handleSave} disabled={!name.trim() || isSaving}>
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{editingGoal ? 'Save Changes' : 'Create Goal'}</Text>}
            </TouchableOpacity>
        </KeyboardAvoidingView>
      </BottomSheet>

      <BottomSheet
        visible={isSortModalOpen}
        onClose={() => setIsSortModalOpen(false)}
        title="Sort Goals"
      >
        <View style={{ marginTop: 10 }}>
          {[
            { label: 'Name', value: 'name' },
            { label: 'Progress', value: 'progress' },
            { label: 'Target Amount', value: 'amount' }
          ].map((item: any) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.sortOption, { borderBottomColor: colors.border }]}
              onPress={() => {
                if (sortBy === item.value) {
                  setSortAsc(!sortAsc);
                } else {
                  setSortBy(item.value as any);
                  setSortAsc(true);
                }
                setIsSortModalOpen(false);
              }}
            >
              <Text style={[styles.sortOptionText, { color: sortBy === item.value ? colors.primary : colors.text }]}>
                {item.label}
              </Text>
              {sortBy === item.value && (
                <MaterialIcons
                  name={sortAsc ? 'arrow-upward' : 'arrow-downward'}
                  size={20}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet
        visible={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Goal"
      >
        <View>
          <Text style={[styles.sheetMessage, { color: colors.textSecondary, textAlign: 'center', marginBottom: 32, fontSize: 15, lineHeight: 22 }]}>Are you perfectly sure you want to delete this Goal? This action cannot be undone.</Text>

          <TouchableOpacity style={[styles.sheetButton, { backgroundColor: colors.danger, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 }]} onPress={handleDelete}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Yes, Delete</Text>
          </TouchableOpacity>

        </View>
      </BottomSheet>

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
  titleWrapper: {
    flex: 1,
  },
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
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sortOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 'bold' },
  amount: { fontSize: 16, fontWeight: 'bold' },

  goalLogo: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  goalLogoFallback: { width: 32, height: 32, borderRadius: 16, marginRight: 10, justifyContent: 'center', alignItems: 'center' },

  progressWrapper: { width: '100%', height: 10, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  amountValue: { fontSize: 15, fontWeight: 'bold' },
  percentLabel: { fontSize: 13, fontWeight: '800' },
  remainingLabel: { fontSize: 12, fontWeight: '600' },

  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 16, // M3 style (more square, rounded corners)
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },


  sheetMessage: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  sheetButton: { padding: 18, borderRadius: 12, alignItems: 'center' },

  formRow: { flexDirection: 'row', marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 4 },
  inputField: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },

  saveButton: { height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySub: { fontSize: 14, textAlign: 'center', marginTop: 8 },
});
