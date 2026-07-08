import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleReminder } from '../services/notificationService';
import { runFullSync } from '../services/syncService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/navigationTypes';
import { resetAppData } from '../db/queries';
import { Session } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

export const useAppSettings = (
  session: Session | null,
  navigation: NativeStackNavigationProp<RootStackParamList>,
) => {
  const [notificationPref, setNotificationPref] = useState('None');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [lastSynced, setLastSynced] = useState<number | string | null>(null);

  const loadSettingsData = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const pref = await AsyncStorage.getItem('notification_pref');
      if (pref) setNotificationPref(pref);

      const last = await AsyncStorage.getItem(`@last_sync_master_${session.user.id}`);
      if (last) setLastSynced(last);
    } catch (e) {
      logger.warn('Error loading settings data', e);
    }
  }, [session]);

  const handleNotificationChange = useCallback(async (val: string, onComplete?: () => void) => {
    setNotificationPref(val);
    await AsyncStorage.setItem('notification_pref', val);
    await scheduleReminder(val);
    if (onComplete) onComplete();
  }, []);

  const handleManualSync = useCallback(async () => {
    if (!session?.user?.id) return;
    setIsSyncing(true);
    try {
      await runFullSync(session.user.id);
      const last = await AsyncStorage.getItem(`@last_sync_master_${session.user.id}`);
      if (last) setLastSynced(last);
    } catch (e) {
      logger.warn('Manual sync error', e);
    } finally {
      setIsSyncing(false);
    }
  }, [session]);

  const handleResetData = useCallback(
    async (onComplete?: () => void) => {
      if (!session?.user?.id) return;
      setIsResetting(true);
      try {
        await resetAppData(session.user.id);
        const keysToClear = [
          'notification_pref',
          `@last_sync_master_${session.user.id}`,
          `@last_sync_transactions_${session.user.id}`,
          `@last_sync_budgets_${session.user.id}`,
          `@last_sync_goals_${session.user.id}`,
          `@last_sync_categories_${session.user.id}`,
          `@last_sync_payees_${session.user.id}`,
          `@initial_budget_sync_checked_${session.user.id}`,
          `@initial_goals_sync_checked_${session.user.id}`,
          `@initial_categories_sync_checked_${session.user.id}`,
          `@initial_payees_sync_checked_${session.user.id}`,
          'reports_view_mode',
        ];
        await AsyncStorage.removeMany(keysToClear);
        if (onComplete) onComplete();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } catch (e) {
        logger.error('Reset error', e);
      } finally {
        setIsResetting(false);
      }
    },
    [session, navigation],
  );

  return {
    notificationPref,
    isSyncing,
    isResetting,
    lastSynced,
    loadSettingsData,
    handleNotificationChange,
    handleManualSync,
    handleResetData,
  };
};
