import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, TextInput, Keyboard, ActivityIndicator, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getDb } from '../db/database';
import { runFullSync } from '../services/syncService';
import { insertGoal, deleteGoalAsync } from '../db/queries';
import { Goal } from '../models/types';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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
  const [lastSynced, setLastSynced] = useState<number | null>(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [sortAsc, setSortAsc] = useState(true);
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
      const last = await AsyncStorage.getItem(`@last_sync_master_${user.id}`);
      if (last) setLastSynced(parseInt(last, 10));
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

  const getRelativeTime = (timestamp: number) => {
    const mins = Math.round((Date.now() - timestamp) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  };

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

    // Trigger background sync (non-blocking)
    runFullSync(user.id).catch(err => console.error("Goal sync failed", err));
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
    runFullSync(user.id).catch(err => console.error("Goal sync failed", err));
  };

  const confirmDelete = (id: string) => {
    setTargetDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const sortedData = useMemo(() => {
    let result = [...data];
    result.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [data, sortAsc]);

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
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
            {item.logo && item.logo.startsWith('http') ? (
              <Image source={{ uri: item.logo }} style={styles.goalLogo} />
            ) : (
              <View style={[styles.goalLogoFallback, { backgroundColor: colors.border }]}>
                 <Text style={{ fontSize: 16 }}>🎯</Text>
              </View>
            )}
            <Text style={[styles.title, { color: colors.text, flexShrink: 1 }]} numberOfLines={2}>{item.name}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleOpenGoal(item); }} style={{ padding: 4, marginRight: 8 }}>
              <MaterialIcons name="edit" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); confirmDelete(item.id); }} style={{ padding: 4 }}>
              <MaterialIcons name="delete-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
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
    await runFullSync(user.id, true);
    await loadData();
    setIsSyncing(false);
  }, [user?.id, loadData]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Header Actions */}
      <View style={styles.headerTools}>
        <View style={[styles.syncBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
           <MaterialIcons name="history" size={14} color={colors.textSecondary} style={{marginRight: 6}}/>
           <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>
             {isSyncing ? 'Syncing...' : (lastSynced ? `Synced ${getRelativeTime(lastSynced)}` : 'Not synced yet')}
           </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, marginLeft: 'auto' }]} 
          onPress={handleManualSync}
          disabled={isSyncing}
        >
           {isSyncing ? <ActivityIndicator size="small" color={colors.primary} /> : <MaterialIcons name="refresh" size={20} color={colors.text} />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, marginLeft: 8 }]} 
          onPress={() => setSortAsc(!sortAsc)}
        >
           <MaterialIcons name={sortAsc ? "sort-by-alpha" : "sort"} size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedData}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 100 }}
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

      <Modal visible={isModalOpen} transparent animationType="slide" onRequestClose={resetForm}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={resetForm} />
          <View style={[styles.bottomSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
               <Text style={[styles.sheetTitle, { color: colors.text, marginBottom: 0 }]}>
                 {editingGoal ? 'Edit Goal' : 'Add New Goal'}
               </Text>
               <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                 {editingGoal && (
                   <TouchableOpacity onPress={() => confirmDelete(editingGoal.id)} style={{ padding: 8 }}>
                     <MaterialIcons name="delete-outline" size={24} color="#ef4444" />
                   </TouchableOpacity>
                 )}
                 <TouchableOpacity onPress={resetForm} style={{ padding: 8, marginLeft: 4 }}>
                   <MaterialIcons name="close" size={24} color={colors.text} />
                 </TouchableOpacity>
               </View>
            </View>

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
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={isDeleteModalOpen} transparent animationType="slide" onRequestClose={() => setIsDeleteModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setIsDeleteModalOpen(false)} />
          <View style={[styles.bottomSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text, textAlign: 'center', marginBottom: 12 }]}>Delete Goal</Text>
            <Text style={[styles.sheetMessage, { color: colors.textSecondary, textAlign: 'center', marginBottom: 32, fontSize: 15, lineHeight: 22 }]}>Are you perfectly sure you want to delete this Goal? This action cannot be undone.</Text>
            
            <TouchableOpacity style={[styles.sheetButton, { backgroundColor: colors.danger, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 }]} onPress={handleDelete}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Yes, Delete</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.sheetButton, { backgroundColor: 'transparent', padding: 16, borderRadius: 12, alignItems: 'center' }]} onPress={() => setIsDeleteModalOpen(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: 'bold' }}>Keep Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTools: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 12 },
  
  syncBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },

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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  bottomSheet: { padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, borderTopWidth: 1 },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: 'bold' },
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
