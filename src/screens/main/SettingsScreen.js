import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { resetInitDb } from '../../database/db';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

const SettingsItem = ({ icon, title, subtitle, onPress, rightElement, danger }) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.itemContainer}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: danger ? colors.errorContainer : colors.secondaryContainer },
        ]}
      >
        <MaterialDesignIcons
          name={icon}
          size={24}
          color={danger ? colors.onErrorContainer : colors.onSecondaryContainer}
        />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: danger ? colors.error : colors.onSurface }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]}>{subtitle}</Text>
        )}
      </View>
      {rightElement}
    </TouchableOpacity>
  );
};

const SettingsScreen = () => {
  const { theme, toggleTheme, themeMode } = useTheme();
  const { logout } = useAuth();
  const colors = theme.colors;
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('biometricsEnabled').then((val) => setBiometricsEnabled(val === 'true'));
  }, []);

  const toggleBiometrics = async (value) => {
    setBiometricsEnabled(value);
    await AsyncStorage.setItem('biometricsEnabled', String(value));
  };

  const handleResetDb = () => {
    Alert.alert(
      'Reset Database',
      'Are you sure? This will delete all local data and re-sync from server.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetInitDb();
            Alert.alert('Success', 'Database reset complete. Please restart app if needed.');
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.header, { color: colors.onBackground }]}>Settings</Text>

      <Text style={[styles.sectionHeader, { color: colors.primary }]}>Appearance</Text>
      <SettingsItem
        icon="palette-outline"
        title="Dark Mode"
        subtitle={themeMode === 'system' ? 'System Default' : themeMode === 'dark' ? 'On' : 'Off'}
        rightElement={
          <Switch
            value={themeMode === 'dark'}
            onValueChange={() => toggleTheme()}
            thumbColor={colors.primary}
            trackColor={{ false: colors.surfaceVariant, true: colors.primaryContainer }}
          />
        }
      />

      <Text style={[styles.sectionHeader, { color: colors.primary }]}>Security</Text>
      <SettingsItem
        icon="fingerprint"
        title="Biometric Lock"
        subtitle="Require FaceID/TouchID to open"
        rightElement={
          <Switch
            value={biometricsEnabled}
            onValueChange={toggleBiometrics}
            thumbColor={colors.primary}
            trackColor={{ false: colors.surfaceVariant, true: colors.primaryContainer }}
          />
        }
      />

      <Text style={[styles.sectionHeader, { color: colors.primary }]}>Data</Text>
      <SettingsItem
        icon="sync"
        title="Reset Local Database"
        subtitle="Clear local cache and re-sync"
        onPress={handleResetDb}
      />

      <Text style={[styles.sectionHeader, { color: colors.primary }]}>Account</Text>
      <SettingsItem icon="logout" title="Logout" danger onPress={handleLogout} />

      <View style={styles.footer}>
        <Text style={[styles.version, { color: colors.onSurfaceVariant }]}>JayLedger v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
  },
});

export default SettingsScreen;
