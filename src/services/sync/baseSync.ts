import NetInfo from '@react-native-community/netinfo';

/**
 * Checks if the device is currently online.
 */
export const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return !!state.isConnected && !!state.isInternetReachable;
};

/**
 * Common sync metadata types.
 */
export interface SyncResult {
  success: boolean;
  count?: number;
  error?: unknown;
  timestamp: number;
}

/**
 * Shared sync logging utility.
 */
export const syncLog = (entity: string, message: string) => {
  console.log(`[Sync:${entity}] [${new Date().toISOString()}] ${message}`);
};
