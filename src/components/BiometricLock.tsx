import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '../store/ThemeContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { common } from '../styles/common';
import { logger } from '../utils/logger';

interface BiometricLockProps {
  onUnlock: () => void;
}

export const BiometricLock: React.FC<BiometricLockProps> = ({ onUnlock }) => {
  const { colors } = useTheme();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticate = React.useCallback(async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Jmoney',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        onUnlock();
      } else {
        setError('Authentication failed');
      }
    } catch (e) {
      setError('An error occurred during authentication');
      logger.error(e);
    } finally {
      setIsAuthenticating(false);
    }
  }, [onUnlock]);

  useEffect(() => {
    const timer = setTimeout(() => {
      authenticate();
    }, 0);
    return () => clearTimeout(timer);
  }, [authenticate]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary + '20', 'transparent']} style={styles.gradient} />

      <View style={styles.content}>
        <View
          style={[
            styles.logoContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Icon name="fingerprint" size={64} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Jmoney Locked</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Please authenticate to access your financial data
        </Text>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.danger + '10' }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={authenticate}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="lock-open" size={20} color="#fff" style={common.mr8} />
              <Text style={styles.buttonText}>Unlock App</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '50%',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  button: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
