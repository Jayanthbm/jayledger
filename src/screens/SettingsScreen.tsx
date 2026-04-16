import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { scheduleReminder } from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runFullSync } from '../services/syncService';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { resetAppData } from '../db/queries';
import { getRelativeTime } from '../utils/dateUtils';
import { BottomSheet } from '../components/BottomSheet';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { session, signOut } = useAuth();
  const user = session?.user;
  const navigation = useNavigation<any>();

  const [notificationPref, setNotificationPref] = useState('None');
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [lastSynced, setLastSynced] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      const pref = await AsyncStorage.getItem('notification_pref');
      if (pref) setNotificationPref(pref);

      const last = await AsyncStorage.getItem(`@last_sync_master_${user.id}`);
      if (last) setLastSynced(parseInt(last, 10));
    };
    loadData();
  }, [user?.id]);

  const handleNotificationChange = async (val: string) => {
    setNotificationPref(val);
    await AsyncStorage.setItem('notification_pref', val);
    await scheduleReminder(val);
    setReminderModalVisible(false);
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'left'
    });
  }, [navigation]);

  const setAppTheme = (mode: 'Light' | 'Dark') => {
    if (mode === 'Light' && isDark) toggleTheme();
    if (mode === 'Dark' && !isDark) toggleTheme();
  };

  const handleManualSync = async () => {
    if (!user?.id) return;
    setIsSyncing(true);
    try {
      await runFullSync(user.id);
      const last = await AsyncStorage.getItem(`@last_sync_master_${user.id}`);
      if (last) setLastSynced(parseInt(last, 10));
    } catch (e) {
      console.warn("Manual sync error", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetData = async () => {
    if (!user?.id) return;
    setIsResetting(true);
    try {
      await resetAppData(user.id);

      // We don't run runFullSync here anymore.
      // Instead, we clear the sync keys so the Dashboard triggers the Initial Sync modal.

      // Clear relevant AsyncStorage keys
      const keysToClear = [
        'notification_pref',
        `@last_sync_master_${user.id}`,
        `@last_sync_transactions_${user.id}`,
        `@last_sync_budgets_${user.id}`,
        `@last_sync_goals_${user.id}`,
        `@last_sync_categories_${user.id}`,
        `@last_sync_payees_${user.id}`,
        `@initial_budget_sync_checked_${user.id}`,
        `@initial_goals_sync_checked_${user.id}`,
        `@initial_categories_sync_checked_${user.id}`,
        `@initial_payees_sync_checked_${user.id}`,
        'reports_view_mode'
      ];
      await AsyncStorage.multiRemove(keysToClear);

      setResetModalVisible(false);
      // Reload app state or navigate home
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (e) {
      console.error("Reset error", e);
    } finally {
      setIsResetting(false);
    }
  };

  const SettingRow = ({ icon, title, value, onPress, showArrow = true, color, isLoading }: any) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={0.6}
      disabled={!onPress || isLoading}
    >
      <View style={[styles.iconBox, { backgroundColor: (color || colors.primary) + '15' }]}>
        <Icon name={icon} size={22} color={color || colors.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {value && <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{value}</Text>}
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 4 }} />
      ) : (
        showArrow && <Icon name="chevron-right" size={24} color={colors.textSecondary + '60'} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Section: Appearance */}
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Appearance</Text>
          <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.themeSelector}>
              <TouchableOpacity
                style={[styles.themeOption, !isDark && { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
                onPress={() => setAppTheme('Light')}
              >
                <Icon name="light-mode" size={20} color={!isDark ? colors.primary : colors.textSecondary} />
                <Text style={[styles.themeOptionText, { color: !isDark ? colors.text : colors.textSecondary }]}>Light</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeOption, isDark && { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
                onPress={() => setAppTheme('Dark')}
              >
                <Icon name="dark-mode" size={20} color={isDark ? colors.primary : colors.textSecondary} />
                <Text style={[styles.themeOptionText, { color: isDark ? colors.text : colors.textSecondary }]}>Dark</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Preferences */}
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Preferences</Text>
          <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingRow
              icon="notifications-active"
              title="Daily Reminders"
              value={
                notificationPref === 'None' ? 'Off' :
                  notificationPref === 'Morning' ? 'Morning (9:00 AM)' :
                    notificationPref === 'Evening' ? 'Evening (6:00 PM)' :
                notificationPref === 'Night' ? 'Night (9:00 PM)' : notificationPref
              }
              onPress={() => setReminderModalVisible(true)}
            />
          </View>

          {/* Section: Manage Data */}
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Manage Data</Text>
          <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingRow
              icon="category"
              title="Categories"
              value="Manage Categories"
              onPress={() => navigation.navigate('Categories')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="storefront"
              title="Payees"
              value="Manage Payees"
              activeOpacity={0.6}
              onPress={() => navigation.navigate('Payees')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="bolt"
              title="Quick Transactions"
              value="Manage Templates"
              onPress={() => navigation.navigate('QuickTransactions')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="delete-forever"
              title="Reset Data"
              value="Wipe all local records"
              color="#ef4444"
              onPress={() => setResetModalVisible(true)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="sync"
              title="Cloud Sync"
              value={isSyncing ? 'Syncing...' : (lastSynced ? `Last synced ${getRelativeTime(lastSynced)}` : 'Never synced')}
              onPress={handleManualSync}
              isLoading={isSyncing}
              showArrow={true}
            />
          </View>

          {/* Section: Account */}
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Account</Text>
          <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingRow
              icon="person"
              title="User Email"
              value={user?.email || 'Guest'}
              showArrow={false}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="logout"
              title="Sign Out"
              color="#ef4444"
              onPress={() => setLogoutModalVisible(true)}
              showArrow={true}
            />
          </View>

        </View>
      </ScrollView>
      {/* Reminder Selection Bottom Sheet */}
      <BottomSheet
        visible={reminderModalVisible}
        onClose={() => setReminderModalVisible(false)}
        title="Choose Reminder"
      >
        <View style={{ marginTop: 10 }}>
          {[
            { label: 'None', time: null, icon: 'notifications-off' },
            { label: 'Morning', time: '9:00 AM', icon: 'access-time' },
            { label: 'Evening', time: '6:00 PM', icon: 'access-time' },
            { label: 'Night', time: '9:00 PM', icon: 'access-time' }
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.radioRow, { borderBottomColor: colors.border }]}
              onPress={() => handleNotificationChange(item.label)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon
                  name={item.icon as any}
                  size={20}
                  color={notificationPref === item.label ? colors.primary : colors.textSecondary}
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text style={[styles.label, { color: notificationPref === item.label ? colors.text : colors.textSecondary }]}>
                    {item.label}
                  </Text>
                  {item.time && (
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{item.time}</Text>
                  )}
                </View>
              </View>
              <View style={[styles.radioOuter, { borderColor: notificationPref === item.label ? colors.primary : colors.textSecondary + '40' }]}>
                {notificationPref === item.label && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>
      {/* Logout Confirmation Bottom Sheet */}
      <BottomSheet
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        title="Sign Out"
      >
        <View>
          <Text style={[styles.sheetMessage, { color: colors.textSecondary }]}>Are you sure you want to securely log out? Local data remains safe.</Text>

          <TouchableOpacity style={[styles.sheetButton, { backgroundColor: '#ef4444' }]} onPress={signOut}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Yes, Sign Out</Text>
          </TouchableOpacity>

        </View>
      </BottomSheet>
      {/* Reset Confirmation Bottom Sheet */}
      <BottomSheet
        visible={resetModalVisible}
        onClose={() => setResetModalVisible(false)}
        title="Reset Data"
      >
        <View>
          <Text style={[styles.sheetMessage, { color: colors.textSecondary }]}>
            This will permanently delete all your Transactions, Budgets, Goals, and Categories.
            This action cannot be undone. Account info remains safe.
          </Text>

          <TouchableOpacity
            style={[styles.sheetButton, { backgroundColor: '#ef4444' }]}
            onPress={handleResetData}
            disabled={isResetting}
          >
            {isResetting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Yes, Reset Everything</Text>
            )}
          </TouchableOpacity>

        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 60 },

  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '600' },
  settingValue: { fontSize: 13, marginTop: 2 },
  divider: { height: 1, marginLeft: 72 },

  themeSelector: {
    flexDirection: 'row',
    padding: 8,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  themeOptionText: { fontSize: 14, fontWeight: 'bold', marginLeft: 8 },

  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 16, fontWeight: '500' },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },

  versionText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.6,
  },

  sheetMessage: { fontSize: 16, marginBottom: 32, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  sheetButton: { padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 12 }
});
