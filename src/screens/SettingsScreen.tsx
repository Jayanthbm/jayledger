import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
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
  const [remindersExpanded, setRemindersExpanded] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const pref = await AsyncStorage.getItem('notification_pref');
      if (pref) setNotificationPref(pref);
    };
    loadData();
  }, []);

  const handleNotificationChange = async (val: string) => {
    setNotificationPref(val);
    await scheduleReminder(val);
  };

  const setAppTheme = (mode: 'Light' | 'Dark') => {
    if (mode === 'Light' && isDark) toggleTheme();
    if (mode === 'Dark' && !isDark) toggleTheme();
  };

  const handleManualSync = async () => {
    if (!user?.id) return;
    setIsSyncing(true);
    try {
      await runFullSync(user.id);
    } catch (e) {
      console.warn("Manual sync error", e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentPadding}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Theme</Text>
        <View style={styles.themeRow}>
          <TouchableOpacity 
            style={[styles.themeBox, { backgroundColor: !isDark ? colors.primary : colors.card, borderColor: colors.border }]} 
            onPress={() => setAppTheme('Light')}
          >
            <Icon name="light-mode" size={24} color={!isDark ? '#fff' : colors.text} />
            <Text style={[styles.themeText, { color: !isDark ? '#fff' : colors.text }]}>Light</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.themeBox, { backgroundColor: isDark ? colors.primary : colors.card, borderColor: colors.border }]} 
            onPress={() => setAppTheme('Dark')}
          >
            <Icon name="dark-mode" size={24} color={isDark ? '#fff' : colors.text} />
            <Text style={[styles.themeText, { color: isDark ? '#fff' : colors.text }]}>Dark</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.expandableHeader, { backgroundColor: colors.card, borderColor: colors.border }]} 
          onPress={() => setRemindersExpanded(!remindersExpanded)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="notifications" size={22} color={colors.text} style={{ marginRight: 12 }} />
            <Text style={[styles.expandableTitle, { color: colors.text }]}>Reminders</Text>
          </View>
          <Icon name={remindersExpanded ? "expand-less" : "expand-more"} size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        
        {remindersExpanded && (
          <View style={[styles.card, styles.expandedCardContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {['None', 'Morning', 'Evening', 'Night'].map((item) => (
              <TouchableOpacity 
                key={item} 
                style={[styles.radioRow, { borderBottomColor: colors.border }]} 
                onPress={() => handleNotificationChange(item)}
              >
                <Text style={[styles.label, { color: colors.text }]}>{item}</Text>
                <View style={[styles.radioOuter, { borderColor: colors.textSecondary }]}>
                  {notificationPref === item && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: remindersExpanded ? 24 : 16 }]}>Master Data (Synced)</Text>
        
        <View style={styles.dataGrid}>
          <TouchableOpacity 
            style={[styles.dataBox, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Categories')}
          >
            <Icon name="category" size={28} color={colors.primary} />
            <Text style={[styles.dataBoxText, { color: colors.text }]}>Categories</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dataBox, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Payees')}
          >
            <Icon name="storefront" size={28} color={colors.primary} />
            <Text style={[styles.dataBoxText, { color: colors.text }]}>Payees</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.danger, marginTop: 16 }]}
          onPress={() => setLogoutModalVisible(true)}
        >
          <Text style={[styles.buttonText, { color: '#fff' }]}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Logout Action Sheet / Bottom Modal */}
      <Modal visible={logoutModalVisible} transparent animationType="slide" onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setLogoutModalVisible(false)} />
          <View style={[styles.bottomSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Sign Out</Text>
            <Text style={[styles.sheetMessage, { color: colors.textSecondary }]}>Are you sure you want to securely log out of your JayLedger account?</Text>
            
            <TouchableOpacity style={[styles.sheetButton, { backgroundColor: colors.danger }]} onPress={signOut}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Yes, Log Out</Text>
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
  container: { flex: 1 },
  contentPadding: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 24, marginBottom: 8, textTransform: 'uppercase' },
  themeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  themeBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginHorizontal: 4 },
  themeText: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  expandableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 12, borderWidth: 1, marginTop: 24 },
  expandableTitle: { fontSize: 18, fontWeight: '600' },
  expandedCardContent: { borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: -8, paddingTop: 8 },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  radioRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  label: { fontSize: 16 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  dataGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  dataBox: { flex: 1, alignItems: 'center', padding: 24, borderRadius: 12, borderWidth: 1, marginHorizontal: 4 },
  dataBoxText: { marginTop: 12, fontSize: 15, fontWeight: '600' },
  button: { marginTop: 32, padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  bottomSheet: { padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, borderTopWidth: 1 },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  sheetMessage: { fontSize: 15, marginBottom: 32, textAlign: 'center', lineHeight: 22 },
  sheetButton: { padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 12 }
});
