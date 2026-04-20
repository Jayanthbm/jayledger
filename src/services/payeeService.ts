import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPayees, insertPayee } from '../db/queries';
import { syncPayees } from '../services/syncService';
import { Payee } from '../models/types';
import { generateUUID } from '../utils/commonUtils';
import { logger } from '../utils/logger';

const VIEW_MODE_KEY = (userId: string) => `@payee_view_mode_${userId}`;
const LAST_SYNC_KEY = (userId: string) => `@last_sync_payees_${userId}`;

export const fetchPayeesData = async (
  userId: string,
): Promise<{ payees: Payee[]; viewMode: 'list' | 'grid'; lastSynced: string | null }> => {
  const payees = await getPayees(userId);
  const viewMode = await AsyncStorage.getItem(VIEW_MODE_KEY(userId));
  const lastSynced = await AsyncStorage.getItem(LAST_SYNC_KEY(userId));
  return {
    payees,
    viewMode: viewMode === 'list' || viewMode === 'grid' ? viewMode : 'grid',
    lastSynced,
  };
};

export const savePayeeViewMode = async (userId: string, mode: 'list' | 'grid') => {
  await AsyncStorage.setItem(VIEW_MODE_KEY(userId), mode);
};

export const addPayee = async (userId: string, name: string, logo: string) => {
  const newPayee: Payee = {
    id: generateUUID(),
    name: name.trim(),
    logo: logo.trim() || '',
    user_id: userId,
  };

  await insertPayee(newPayee);

  // Background sync
  syncPayees(userId)
    .then(() => AsyncStorage.setItem(LAST_SYNC_KEY(userId), new Date().toISOString()))
    .catch((err) => logger.error('Payee sync failed', err));

  return newPayee;
};

export const performPayeeSync = async (userId: string) => {
  await syncPayees(userId);
  const now = new Date().toISOString();
  await AsyncStorage.setItem(LAST_SYNC_KEY(userId), now);
  const updated = await getPayees(userId);
  return { payees: updated, lastSynced: now };
};
