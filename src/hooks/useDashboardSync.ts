import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  runFullSync,
  isOnline,
  needsTransactionSync,
  syncTransactions,
} from '../services/syncService';
import { STORAGE_KEYS } from '../constants';
import { getRelativeTime } from '../utils/dateUtils';
import { logger } from '../utils/logger';
import { useToast } from '../store/ToastContext';
import { triggerImpact } from '../utils/haptics';

export const useDashboardSync = (userId: string | undefined, onRefresh: () => void) => {
  const { showToast } = useToast();
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('Pushing local changes...');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const handleInitialSync = useCallback(async () => {
    if (!userId || isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const online = await isOnline();
      if (!online) {
        setSyncError('Please connect to the internet to sync your data.');
        setIsSyncing(false);
        return;
      }

      await runFullSync(userId, (msg) => {
        if (msg === 'Offline') {
          setSyncError('Internet connection lost.');
        } else if (msg === 'Error') {
          setSyncError('An error occurred during sync. Please try again.');
        } else {
          setSyncStatus(msg);
        }
      });

      // Close modal on success if no error was set during sync
      setSyncError((currentError) => {
        if (!currentError) {
          setShowSyncModal(false);
          onRefresh();
        }
        return currentError;
      });
    } catch (error) {
      logger.error('Dashboard Initial Sync Error:', error);
      setSyncError('Sync failed. Please check your connection.');
    } finally {
      setIsSyncing(false);
    }
  }, [userId, onRefresh, isSyncing]);

  const checkSyncStatus = useCallback(async () => {
    if (!userId) return;
    const lastTxSync = await AsyncStorage.getItem(
      `${STORAGE_KEYS.LAST_SYNC_TRANSACTIONS}${userId}`,
    );
    if (lastTxSync) {
      setLastSyncTime(getRelativeTime(lastTxSync));
    }

    const lastMasterSync = await AsyncStorage.getItem(`${STORAGE_KEYS.LAST_SYNC_MASTER}${userId}`);
    const needsSync = !lastMasterSync || !lastMasterSync.includes('T');

    if (needsSync) {
      if (!isSyncing) {
        setShowSyncModal(true);
        await handleInitialSync();
      }
    } else {
      const needsPartial = await needsTransactionSync(userId);
      if (needsPartial) {
        setIsSyncing(true);
        await syncTransactions(userId, true);
        setIsSyncing(false);
        onRefresh();
      }
    }
  }, [userId, onRefresh, handleInitialSync, isSyncing]);

  const handleManualSync = useCallback(async () => {
    if (!userId || isSyncing) return;
    triggerImpact('medium');
    setIsSyncing(true);
    try {
      await syncTransactions(userId, true);
      const lastTxSync = await AsyncStorage.getItem(`@last_sync_transactions_${userId}`);
      if (lastTxSync) {
        setLastSyncTime(getRelativeTime(lastTxSync));
      }
      onRefresh();
      showToast('Dashboard synced successfully', 'success');
    } catch (e) {
      logger.error('Manual sync error:', e);
      showToast('Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [userId, isSyncing, onRefresh, showToast]);

  useEffect(() => {
    if (userId) {
      const timer = setTimeout(() => {
        checkSyncStatus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [userId, checkSyncStatus]); // Standard dependencies restored

  return {
    showSyncModal,
    setShowSyncModal,
    syncStatus,
    isSyncing,
    syncError,
    lastSyncTime,
    handleInitialSync,
    handleManualSync,
    checkSyncStatus,
  };
};
