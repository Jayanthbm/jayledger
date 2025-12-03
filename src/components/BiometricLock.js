import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import Button from './Button';
import { useTheme } from '../context/ThemeContext';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

const rnBiometrics = new ReactNativeBiometrics();

const BiometricLock = ({ isEnabled, onUnlock }) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [isLocked, setIsLocked] = useState(isEnabled);

  useEffect(() => {
    if (isEnabled) {
      authenticate();
    }
  }, [isEnabled]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && isEnabled) {
        setIsLocked(true);
        authenticate();
      }
    });

    return () => subscription.remove();
  }, [isEnabled]);

  const authenticate = async () => {
    try {
      const { available } = await rnBiometrics.isSensorAvailable();
      if (available) {
        const { success } = await rnBiometrics.simplePrompt({ promptMessage: 'Confirm fingerprint' });
        if (success) {
          setIsLocked(false);
          onUnlock && onUnlock();
        }
      } else {
        // Fallback if no sensor (shouldn't happen if enabled checked properly)
        setIsLocked(false);
      }
    } catch (error) {
      console.log('Biometric failed', error);
    }
  };

  if (!isEnabled || !isLocked) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MaterialDesignIcons name="lock" size={64} color={colors.primary} />
      <Text style={[styles.title, { color: colors.onBackground }]}>JayLedger Locked</Text>
      <Button mode="filled" onPress={authenticate} style={styles.button}>
        Unlock
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 32,
  },
  button: {
    minWidth: 120,
  },
});

export default BiometricLock;
