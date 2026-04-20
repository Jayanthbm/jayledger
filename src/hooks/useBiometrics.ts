import { useState, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../store/ToastContext';

export const useBiometrics = () => {
  const [useBiometrics, setUseBiometrics] = useState(false);
  const { showToast } = useToast();

  const loadBiometricsPref = useCallback(async () => {
    try {
      const biometrics = await AsyncStorage.getItem('use_biometrics');
      setUseBiometrics(biometrics === 'true');
    } catch (e) {
      console.warn('Error loading biometrics pref', e);
    }
  }, []);

  const handleBiometricToggle = useCallback(
    async (value: boolean) => {
      if (value) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          showToast(
            'Biometrics Unavailable: Your device does not support biometrics or no fingerprints/faces enrolled.',
            'error',
          );
          return;
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify biometrics to enable app lock',
        });

        if (result.success) {
          setUseBiometrics(true);
          await AsyncStorage.setItem('use_biometrics', 'true');
        }
      } else {
        setUseBiometrics(false);
        await AsyncStorage.setItem('use_biometrics', 'false');
      }
    },
    [showToast],
  );

  return {
    useBiometrics,
    loadBiometricsPref,
    handleBiometricToggle,
  };
};
