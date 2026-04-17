import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BottomSheet } from '../BottomSheet';

interface DashboardSyncModalProps {
  visible: boolean;
  onClose: () => void;
  syncError: string | null;
  syncStatus: string;
  isSyncing: boolean;
  onRetry: () => void;
  colors: any;
}

export const DashboardSyncModal = React.memo(({
  visible,
  onClose,
  syncError,
  syncStatus,
  isSyncing,
  onRetry,
  colors
}: DashboardSyncModalProps) => {
  const steps = [
    'Pushing local changes...',
    'Syncing Transactions',
    'Syncing Budgets',
    'Syncing Goals',
    'Calculating reports',
    'Finalizing'
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Initializing JayLedger"
      subtitle={syncError ? 'Action Required' : 'Setting up your personal finance workspace...'}
      showCloseButton={!!syncError}
    >
      <View style={{ paddingBottom: 20 }}>
        <View style={styles.syncProgressContainer}>
          {syncError ? (
            <View style={styles.errorContainer}>
              <View style={styles.syncIconContainer}>
                <MaterialIcons name="error-outline" size={60} color={colors.danger} />
              </View>
              <Text style={[styles.errorText, { color: colors.danger }]}>{syncError}</Text>
              <TouchableOpacity
                style={[styles.retryBtn, { backgroundColor: colors.primary }]}
                onPress={onRetry}
              >
                <Text style={styles.retryBtnText}>Connect & Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.stepsContainer}>
              <View style={[styles.syncIconContainer, { alignSelf: 'center' }]}>
                <MaterialIcons name="cloud-sync" size={60} color={colors.primary} />
              </View>
              {steps.map((step) => {
                const isDone = steps.indexOf(step) < steps.indexOf(syncStatus);
                const isActive = syncStatus === step;

                return (
                  <View key={step} style={styles.stepRow}>
                    <View style={[
                      styles.stepIndicator,
                      { backgroundColor: isDone ? colors.success : isActive ? colors.primary : colors.border }
                    ]}>
                      {isDone ? (
                        <MaterialIcons name="check" size={12} color="#fff" />
                      ) : isActive ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : null}
                    </View>
                    <Text style={[
                      styles.stepText,
                      { color: isDone ? colors.text : isActive ? colors.primary : colors.textSecondary }
                    ]}>
                      {step}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {!syncError && (
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.syncSubMessage, { color: colors.textSecondary }]}>This may take a minute...</Text>
          </View>
        )}
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  syncIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  syncProgressContainer: {
    width: '100%',
    marginBottom: 32,
  },
  stepsContainer: {
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
  },
  spinnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncSubMessage: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
