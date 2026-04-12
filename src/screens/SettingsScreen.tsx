import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Switch, Platform } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { scheduleReminder } from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runFullSync } from '../services/syncService';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { session, signOut } = useAuth();
  const user = session?.user;
  const navigation = useNavigation<any>();
  
  const [notificationPref, setNotificationPref] = useState('None');
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<number | null>(null);

  const getRelativeTime = (timestamp: number) => {
    const mins = Math.round((Date.now() - timestamp) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  };

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

  const setAppTheme = (mode: 'Light' | 'Dark') => {
    if (mode === 'Light' && isDark) toggleTheme();
    if (mode === 'Dark' && !isDark) toggleTheme();
  };

  const handleManualSync = async () => {
    if (!user?.id) return;
    setIsSyncing(true);
    try {
      await runFullSync(user.id, true);
      const last = await AsyncStorage.getItem(`@last_sync_master_${user.id}`);
      if (last) setLastSynced(parseInt(last, 10));
    } catch (e) {
      console.warn("Manual sync error", e);
    } finally {
      setIsSyncing(false);
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
              value="Manage icons & limits"
              onPress={() => navigation.navigate('Categories')}
            />
            <View style={styles.divider} />
            <SettingRow 
              icon="storefront" 
              title="Payees" 
              value="Manage shops & vendors"
              onPress={() => navigation.navigate('Payees')}
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

          <Text style={[styles.versionText, { color: colors.textSecondary }]}>JayLedger v1.2.0 • Build 2026.04</Text>
        </View>
      </ScrollView>

      {/* Reminder Selection Bottom Sheet */}
      <Modal visible={reminderModalVisible} transparent animationType="slide" onRequestClose={() => setReminderModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setReminderModalVisible(false)} />
          <View style={[styles.bottomSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Choose Reminder</Text>
            
            <View style={{ marginTop: 20 }}>
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
            
            <TouchableOpacity style={[styles.sheetButton, { backgroundColor: 'transparent', marginTop: 12 }]} onPress={() => setReminderModalVisible(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation */}
      <Modal visible={logoutModalVisible} transparent animationType="fade" onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setLogoutModalVisible(false)} />
          <View style={[styles.bottomSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Sign Out</Text>
            <Text style={[styles.sheetMessage, { color: colors.textSecondary }]}>Are you sure you want to securely log out? Local data remains safe.</Text>
            
            <TouchableOpacity style={[styles.sheetButton, { backgroundColor: '#ef4444' }]} onPress={signOut}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Yes, Sign Out</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.sheetButton, { backgroundColor: 'transparent' }]} onPress={() => setLogoutModalVisible(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  bottomSheet: { padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, borderTopWidth: 1 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 24, opacity: 0.3 },
  sheetTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  sheetMessage: { fontSize: 16, marginBottom: 32, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  sheetButton: { padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 12 }
});
