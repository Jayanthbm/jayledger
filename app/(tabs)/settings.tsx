import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { useAuth } from '@/store/AuthContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from 'expo-router/react-navigation';
import { getRelativeTime } from '@/utils/dateUtils';
import { BottomSheet } from '@/components/BottomSheet';
import { ConfirmationSheet } from '@/components/common/ConfirmationSheet';
import { AppNavigation } from '@/navigation/navigationTypes';
import { SettingRow } from '@/components/common/SettingRow';
import { useBiometrics } from '@/hooks/useBiometrics';
import { useAppSettings } from '@/hooks/useAppSettings';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { session, signOut } = useAuth();
  const user = session?.user;
  const navigation = useNavigation<AppNavigation>();

  const {
    useBiometrics: biometricsEnabled,
    loadBiometricsPref,
    handleBiometricToggle,
  } = useBiometrics();
  const {
    notificationPref,
    isSyncing,
    isResetting,
    lastSynced,
    loadSettingsData,
    handleNotificationChange,
    handleManualSync,
    handleResetData,
  } = useAppSettings(session, navigation);

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadSettingsData();
    loadBiometricsPref();
  }, [loadSettingsData, loadBiometricsPref]);

  useEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'left',
    });
  }, [navigation]);

  const setAppTheme = (mode: 'Light' | 'Dark') => {
    if (mode === 'Light' && isDark) toggleTheme();
    if (mode === 'Dark' && !isDark) toggleTheme();
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr.includes(':')) return timeStr;
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const onTimeSelect = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const h = selectedDate.getHours().toString().padStart(2, '0');
      const m = selectedDate.getMinutes().toString().padStart(2, '0');
      handleNotificationChange(`${h}:${m}`);
      setReminderModalVisible(false);
    }
  };

  const isCustom = notificationPref.includes(':');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Section: Appearance */}
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Appearance</Text>
          <View
            style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.themeSelector}>
              <TouchableOpacity
                style={[styles.themeOption, !isDark && { backgroundColor: colors.primary + '15' }]}
                onPress={() => setAppTheme('Light')}
              >
                <Icon
                  name="light-mode"
                  size={20}
                  color={!isDark ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    { color: !isDark ? colors.text : colors.textSecondary },
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeOption, isDark && { backgroundColor: colors.primary + '15' }]}
                onPress={() => setAppTheme('Dark')}
              >
                <Icon
                  name="dark-mode"
                  size={20}
                  color={isDark ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    { color: isDark ? colors.text : colors.textSecondary },
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Preferences */}
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Preferences</Text>
          <View
            style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <SettingRow
              icon="notifications-active"
              title="Daily Reminders"
              value={
                notificationPref === 'None'
                  ? 'Off'
                  : notificationPref === 'Morning'
                    ? 'Morning (9:00 AM)'
                    : notificationPref === 'Evening'
                      ? 'Evening (6:00 PM)'
                      : notificationPref === 'Night'
                        ? 'Night (9:00 PM)'
                        : `Custom (${formatTime(notificationPref)})`
              }
              onPress={() => setReminderModalVisible(true)}
            />
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                <Icon name="fingerprint" size={22} color={colors.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Use Biometrics</Text>
                <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                  Protect app with Fingerprint/FaceID
                </Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={biometricsEnabled ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Section: Manage Data */}
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Manage Data</Text>
          <View
            style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <SettingRow
              icon="category"
              title="Categories"
              value="Manage Categories"
              onPress={() => navigation.navigate('categories')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="storefront"
              title="Payees"
              value="Manage Payees"
              onPress={() => navigation.navigate('payees')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="folder"
              title="Transaction Groups"
              value="Manage Groups"
              onPress={() => navigation.navigate('groups')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="bolt"
              title="Quick Transactions"
              value="Manage Templates"
              onPress={() => navigation.navigate('quick-transactions')}
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
              value={
                isSyncing
                  ? 'Syncing...'
                  : lastSynced
                    ? `Last synced ${getRelativeTime(lastSynced)}`
                    : 'Never synced'
              }
              onPress={handleManualSync}
              isLoading={isSyncing}
              showArrow={true}
            />
          </View>

          {/* Section: Account */}
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Account</Text>
          <View
            style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
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
        <View style={styles.reminderSheetContent}>
          {[
            { label: 'None', time: null, icon: 'notifications-off' },
            { label: 'Morning', time: '9:00 AM', icon: 'access-time' },
            { label: 'Evening', time: '6:00 PM', icon: 'access-time' },
            { label: 'Night', time: '9:00 PM', icon: 'access-time' },
            {
              label: 'Custom',
              time: isCustom ? formatTime(notificationPref) : 'Select Time',
              icon: 'edit',
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.radioRow, { borderBottomColor: colors.border }]}
              onPress={() => {
                if (item.label === 'Custom') {
                  setShowTimePicker(true);
                } else {
                  handleNotificationChange(item.label, () => setReminderModalVisible(false));
                }
              }}
            >
              <View style={styles.radioContent}>
                <Icon
                  name={item.icon as keyof typeof Icon.glyphMap}
                  size={20}
                  color={
                    notificationPref === item.label || (item.label === 'Custom' && isCustom)
                      ? colors.primary
                      : colors.textSecondary
                  }
                  style={styles.radioIcon}
                />
                <View>
                  <Text
                    style={[
                      styles.label,
                      {
                        color:
                          notificationPref === item.label || (item.label === 'Custom' && isCustom)
                            ? colors.text
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.time && (
                    <Text style={[styles.reminderTime, { color: colors.textSecondary }]}>
                      {item.time}
                    </Text>
                  )}
                </View>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor:
                      notificationPref === item.label || (item.label === 'Custom' && isCustom)
                        ? colors.primary
                        : colors.textSecondary + '40',
                  },
                ]}
              >
                {(notificationPref === item.label || (item.label === 'Custom' && isCustom)) && (
                  <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>

      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeSelect}
        />
      )}

      {/* Logout Confirmation Bottom Sheet */}
      <BottomSheet
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        title="Sign Out"
      >
        <ConfirmationSheet
          message="Are you sure you want to securely log out? Local data remains safe."
          confirmLabel="Yes, Sign Out"
          onConfirm={signOut}
          isDanger={true}
        />
      </BottomSheet>

      {/* Reset Confirmation Bottom Sheet */}
      <BottomSheet
        visible={resetModalVisible}
        onClose={() => setResetModalVisible(false)}
        title="Reset Data"
      >
        <ConfirmationSheet
          message="This will permanently delete all your Transactions, Budgets, Goals, and Categories. This action cannot be undone. Account info remains safe."
          confirmLabel="Yes, Reset Everything"
          onConfirm={() => handleResetData(() => setResetModalVisible(false))}
          isLoading={isResetting}
          isDanger={true}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  reminderSheetContent: {
    marginTop: 10,
  },
  radioContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioIcon: {
    marginRight: 12,
  },
  reminderTime: {
    fontSize: 12,
    marginTop: 2,
  },
});
