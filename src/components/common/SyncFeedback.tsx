import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../../store/ThemeContext';

interface SyncFeedbackProps {
  isSyncing: boolean;
  lastSyncTime?: string;
  onRetry?: () => void;
  error?: string | null;
}

/**
 * A reusable component to show sync status, errors, and retry actions.
 */
export const SyncFeedback: React.FC<SyncFeedbackProps> = ({
  isSyncing,
  lastSyncTime,
  onRetry,
  error,
}) => {
  const { colors } = useTheme();

  if (isSyncing) {
    return (
      <View style={[styles.container, styles.syncing, { backgroundColor: colors.primary + '10' }]}>
        <ActivityIndicator size="small" color={colors.primary} style={styles.icon} />
        <Text style={[styles.text, { color: colors.primary }]}>Syncing your data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.error, { backgroundColor: colors.danger + '10' }]}>
        <Icon name="sync-problem" size={20} color={colors.danger} style={styles.icon} />
        <Text style={[styles.text, styles.errorText, { color: colors.danger }]}>{error}</Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <Text style={[styles.retryText, { color: colors.danger }]}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (lastSyncTime) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Icon name="sync" size={16} color={colors.textSecondary} style={styles.icon} />
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          Last synced: {lastSyncTime}
        </Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  syncing: {
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  error: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  icon: {
    marginRight: 10,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    flex: 1,
  },
});
