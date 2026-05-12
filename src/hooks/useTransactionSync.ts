import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { syncTransactions, needsTransactionSync } from '../services/syncService';
import { getRelativeTime } from '../utils/dateUtils';
import { logger } from '../utils/logger';
import { useToast } from '../store/ToastContext';

export const useTransactionSync = (session: Session | null, onSyncComplete: () => void) => {
  const { showToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  const performSync = useCallback(
    async (manual: boolean) => {
      if (!session?.user?.id || isSyncing || (isAutoSyncing && !manual)) return;

      if (manual) setIsSyncing(true);
      else setIsAutoSyncing(true);

      try {
        await syncTransactions(session.user.id, manual);
        const lastTxSync = await AsyncStorage.getItem(`@last_sync_transactions_${session.user.id}`);
        if (lastTxSync) setLastSyncTime(getRelativeTime(lastTxSync));

        if (manual) {
          onSyncComplete(); // Only reload the list aggressively on manual sync
          showToast('Transactions synced successfully', 'success');
        }
      } catch (e) {
        logger.error(`${manual ? 'Manual' : 'Auto'} sync error:`, e);
        if (manual) showToast('Sync failed', 'error');
      } finally {
        if (manual) setIsSyncing(false);
        else setIsAutoSyncing(false);
      }
    },
    [session, isSyncing, isAutoSyncing, onSyncComplete, showToast],
  );

  const handleManualSync = useCallback(() => performSync(true), [performSync]);

  // Auto Sync Check on Focus
  useFocusEffect(
    useCallback(() => {
      const autoSync = async () => {
        if (session?.user?.id) {
          let lastTxSync = await AsyncStorage.getItem(`@last_sync_transactions_${session.user.id}`);
          const needsSync =
            (await needsTransactionSync(session.user.id)) ||
            !lastTxSync ||
            !lastTxSync.includes('T');
          if (needsSync) {
            performSync(false);
          }

          lastTxSync = await AsyncStorage.getItem(`@last_sync_transactions_${session.user.id}`);
          if (lastTxSync) {
            setLastSyncTime(getRelativeTime(lastTxSync));
          }
        }
      };

      const timer = setTimeout(autoSync, 500);
      return () => clearTimeout(timer);
    }, [session, performSync]),
  );

  return {
    isSyncing,
    lastSyncTime,
    handleManualSync,
  };
};
