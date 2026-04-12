import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getDb } from '../db/database';
import { runFullSync } from '../services/syncService';
import { Budget } from '../models/types';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DeviceEventEmitter } from 'react-native';

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  
  const [data, setData] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const db = getDb();
    try {
      const rows = await db.getAllAsync<Budget>(
        `SELECT * FROM budgets WHERE user_id = '${session.user.id}' ORDER BY name ASC`
      );
      setData(rows);
      const last = await AsyncStorage.getItem(`@last_sync_master_${session.user.id}`);
      if (last) setLastSynced(parseInt(last, 10));
    } catch (e) {
      console.error("Load Budgets Error:", e);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const handleManualSync = useCallback(async () => {
    if (!session?.user?.id) return;
    setSyncing(true);
    await runFullSync(session.user.id, true);
    await loadData();
    setSyncing(false);
  }, [session?.user?.id, loadData]);

  const getRelativeTime = (timestamp: number) => {
    const mins = Math.round((Date.now() - timestamp) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  };

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('module_refreshed', (data) => {
      if (data.module === 'Budgets') loadData();
    });
    return () => sub.remove();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderItem = ({ item }: { item: Budget }) => {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.topRow}>
          <View style={styles.titleGroup}>
            <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
               <Text style={{ fontSize: 18 }}>{item.logo || '📊'}</Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{item.name}</Text>
          </View>
          <Text style={[styles.amount, { color: colors.primary }]}>₹{item.amount.toLocaleString()}</Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialIcons name="event-repeat" size={14} color={colors.textSecondary} />
          <Text style={[styles.sub, { color: colors.textSecondary }]}>{item.interval}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header Tools */}
      <View style={styles.headerTools}>
        <View style={[styles.syncBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
           <MaterialIcons name="history" size={14} color={colors.textSecondary} style={{marginRight: 6}}/>
           <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>
             {syncing ? 'Syncing...' : (lastSynced ? `Synced ${getRelativeTime(lastSynced)}` : 'Not synced yet')}
           </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, marginLeft: 'auto' }]} 
          onPress={handleManualSync}
          disabled={syncing}
        >
           {syncing ? <ActivityIndicator size="small" color={colors.primary} /> : <MaterialIcons name="refresh" size={20} color={colors.text} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
               <MaterialIcons name="account-balance-wallet" size={48} color={colors.border} />
               <Text style={{ textAlign: 'center', marginTop: 12, fontSize: 16, color: colors.textSecondary }}>No Budgets Defined</Text>
            </View>
          }
        />
      )}
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
  titleGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  title: { fontSize: 16, fontWeight: 'bold' },
  amount: { fontSize: 16, fontWeight: 'bold' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  sub: { fontSize: 13, marginLeft: 6, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
});
