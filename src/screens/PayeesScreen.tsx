import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { Payee } from '../models/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { SearchBar } from '../components/SearchBar';
import { useToast } from '../store/ToastContext';

import {
  fetchPayeesData,
  savePayeeViewMode,
  addPayee,
  performPayeeSync,
} from '../services/payeeService';

// Modular Components
import { PayeeCard } from '../components/payees/PayeeCard';
import { PayeeAddModal } from '../components/payees/PayeeAddModal';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { common } from '../styles/common';
import { AppNavigation } from '../navigation/navigationTypes';

export default function PayeesScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const user = session?.user;
  const { showToast } = useToast();
  const navigation = useNavigation<AppNavigation>();

  const [payees, setPayees] = useState<Payee[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  const [isAddModalVisible, setAddModalVisible] = useState(false);

  const listRef = useRef<FlatList>(null);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { payees: fetchedPayees, viewMode: savedMode } = await fetchPayeesData(user.id);
      setPayees(fetchedPayees);
      setViewMode(savedMode);
    } catch (err) {
      console.error('[Payees] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const toggleViewMode = async () => {
    const newMode = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(newMode);
    if (user?.id) {
      await savePayeeViewMode(user.id, newMode);
    }
  };

  const handleManualSync = useCallback(async () => {
    if (!user?.id) return;
    setSyncing(true);
    try {
      const updatedPayees = await performPayeeSync(user.id);
      setPayees(updatedPayees);
      showToast('Payees synced successfully', 'success');
    } catch (e) {
      console.error('Sync error:', e);
    } finally {
      setSyncing(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.setOptions({
        headerTitle: () => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={scrollToTop}
            style={common.headerTitleContainer}
          >
            <Text style={[common.navHeaderTitle, { color: colors.text }]}>Payees</Text>
          </TouchableOpacity>
        ),
        headerTitleAlign: 'left',
        headerRight: () => (
          <TouchableOpacity
            style={common.headerRightBtn}
            onPress={handleManualSync}
            disabled={syncing}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            {syncing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialIcons name="refresh" size={24} color={colors.text} />
            )}
          </TouchableOpacity>
        ),
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [navigation, handleManualSync, syncing, colors.text, colors.primary, scrollToTop]);

  const handleAddPayeeSubmit = async (name: string, logo: string) => {
    if (!user?.id) return;
    const newPayee = await addPayee(user.id, name, logo);
    setPayees((prev) => [...prev, newPayee]);
    showToast('Payee added successfully', 'success');
  };

  const filteredPayees = useMemo(() => {
    let result = [...payees];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [payees, searchQuery, sortAsc]);

  if (loading) {
    return (
      <View style={[common.flexCenter, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[common.flex1, { backgroundColor: colors.background }]}>
      <View style={common.headerTools}>
        <View style={common.headerControls}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search payees..."
            size="medium"
            containerStyle={common.flex1}
          />
          <View style={common.actionRow}>
            <TouchableOpacity
              style={[
                common.sortButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setSortAsc(!sortAsc)}
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
            <TouchableOpacity
              style={[
                common.iconButton44,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={toggleViewMode}
            >
              <MaterialIcons
                name={viewMode === 'list' ? 'grid-view' : 'view-list'}
                size={22}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={common.captionRow}>
          <Text style={[common.sortCaption, { color: colors.textSecondary }]}>Sorted by Name</Text>
        </View>
      </View>

      {filteredPayees.length === 0 ? (
        <View style={common.emptyCenterPadded}>
          <MaterialIcons name="storefront" size={64} color={colors.border} />
          <Text style={[common.emptyTitle20Bold, { color: colors.textSecondary }]}>
            {searchQuery ? 'No Payees Found' : 'No Payees Yet'}
          </Text>
          <Text style={[common.emptySub14Centered, { color: colors.textSecondary }]}>
            {searchQuery
              ? `We couldn't find anything matching "${searchQuery}".`
              : 'Add your first payee to see it here.'}
          </Text>
          {searchQuery && (
            <TouchableOpacity
              style={[common.clearOutlineButton, { borderColor: colors.border }]}
              onPress={() => setSearchQuery('')}
            >
              <Text style={[common.textBold600, { color: colors.primary }]}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          ref={listRef}
          key={viewMode}
          data={filteredPayees}
          numColumns={viewMode === 'grid' ? 3 : 1}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PayeeCard
              item={item}
              viewMode={viewMode}
              colors={colors}
              onPress={(p) =>
                navigation.navigate('Main', {
                  screen: 'Transactions',
                  params: { initialSelectedPayees: [p.id] },
                })
              }
            />
          )}
          contentContainerStyle={common.listContent16T4B120}
          columnWrapperStyle={viewMode === 'grid' ? common.justifyStart : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FloatingActionButton
        onPress={() => setAddModalVisible(true)}
        iconName="add"
        backgroundColor={colors.primary}
      />

      <PayeeAddModal
        visible={isAddModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddPayeeSubmit}
        colors={colors}
      />
    </View>
  );
}
