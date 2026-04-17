import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPayees, insertPayee } from '../db/queries';
import { syncPayees } from '../services/syncService';
import { Payee } from '../models/types';
import { generateUUID } from '../utils/commonUtils';

const VIEW_MODE_KEY = (userId: string) => `@payee_view_mode_${userId}`;

export const fetchPayeesData = async (userId: string): Promise<{ payees: Payee[], viewMode: 'list' | 'grid' }> => {
  const payees = await getPayees(userId);
  const viewMode = await AsyncStorage.getItem(VIEW_MODE_KEY(userId));
  return {
    payees,
    viewMode: (viewMode === 'list' || viewMode === 'grid') ? viewMode : 'grid'
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
    user_id: userId
  };

  await insertPayee(newPayee);
  
  // Background sync
  syncPayees(userId).catch(err => console.error("Payee sync failed", err));
  
  return newPayee;
};

export const performPayeeSync = async (userId: string) => {
  await syncPayees(userId);
  return await getPayees(userId);
};
