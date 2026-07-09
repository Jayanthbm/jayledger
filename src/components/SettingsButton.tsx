import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from 'expo-router/react-navigation';
import { useTheme } from '../store/ThemeContext';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { AppNavigation } from '../navigation/navigationTypes';

export const SettingsButton = () => {
  const navigation = useNavigation<AppNavigation>();
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('settings')}
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
        { borderColor: colors.border },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary + '30' }]}>
        <Icon name="account" size={20} color={colors.primary} />
      </View>
      <View style={[styles.notificationDot, { backgroundColor: colors.danger }]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
  },
  containerDark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  containerLight: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'white', // Header background usually white or clean
  },
});
