jest.mock('../../src/db/database', () => ({
  getDb: jest.fn(() => ({
    getFirstAsync: jest.fn(),
  })),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

jest.mock('../../src/services/sync/baseSync', () => ({
  isOnline: jest.fn(),
  syncLog: jest.fn(),
}));

jest.mock('../../src/services/sync/transactionSync', () => ({
  syncTransactions: jest.fn(),
  pushLocalTransactions: jest.fn(),
}));

jest.mock('../../src/services/sync/goalSync', () => ({
  syncGoals: jest.fn(),
  pushLocalGoals: jest.fn(),
}));

jest.mock('../../src/services/sync/budgetSync', () => ({
  syncBudgets: jest.fn(),
  pushLocalBudgets: jest.fn(),
}));

jest.mock('../../src/services/sync/categorySync', () => ({
  syncCategories: jest.fn(),
  pushLocalCategories: jest.fn(),
}));

jest.mock('../../src/services/sync/payeeSync', () => ({
  syncPayees: jest.fn(),
  pushLocalPayees: jest.fn(),
}));

jest.mock('../../src/services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { runFullSync } from '../../src/services/syncService';
import { isOnline } from '../../src/services/sync/baseSync';
import { syncTransactions } from '../../src/services/sync/transactionSync';
import { syncGoals } from '../../src/services/sync/goalSync';
import { syncBudgets } from '../../src/services/sync/budgetSync';
import { syncCategories } from '../../src/services/sync/categorySync';
import { syncPayees } from '../../src/services/sync/payeeSync';

jest.mock('../../src/services/sync/transactionSync', () => ({
  syncTransactions: jest.fn(),
  pushLocalTransactions: jest.fn(),
}));

jest.mock('../../src/services/sync/goalSync', () => ({
  syncGoals: jest.fn(),
  pushLocalGoals: jest.fn(),
}));

jest.mock('../../src/services/sync/budgetSync', () => ({
  syncBudgets: jest.fn(),
  pushLocalBudgets: jest.fn(),
}));

jest.mock('../../src/services/sync/categorySync', () => ({
  syncCategories: jest.fn(),
  pushLocalCategories: jest.fn(),
}));

jest.mock('../../src/services/sync/payeeSync', () => ({
  syncPayees: jest.fn(),
  pushLocalPayees: jest.fn(),
}));

describe('syncService Coordination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('runFullSync', () => {
    it('should call all sync modules when online', async () => {
      (isOnline as jest.Mock).mockResolvedValue(true);
      const onProgress = jest.fn();

      await runFullSync('user123', onProgress);

      expect(syncTransactions).toHaveBeenCalledWith('user123', false);
      expect(syncGoals).toHaveBeenCalledWith('user123');
      expect(syncBudgets).toHaveBeenCalledWith('user123');
      expect(syncCategories).toHaveBeenCalledWith('user123');
      expect(syncPayees).toHaveBeenCalledWith('user123');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('@last_sync_master_user123'),
        expect.any(String),
      );
      expect(onProgress).toHaveBeenCalledWith('Finalizing');
    });

    it('should not sync when offline', async () => {
      (isOnline as jest.Mock).mockResolvedValue(false);
      const onProgress = jest.fn();

      await runFullSync('user123', onProgress);

      expect(syncTransactions).not.toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith('Offline');
    });

    it('should handle errors gracefully', async () => {
      (isOnline as jest.Mock).mockResolvedValue(true);
      (syncTransactions as jest.Mock).mockRejectedValue(new Error('Network error'));
      const onProgress = jest.fn();

      await runFullSync('user123', onProgress);

      expect(onProgress).toHaveBeenCalledWith('Error');
    });
  });
});
