import { useCallback, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { PayeeModel } from '../database/payees/payeeModal';
import {
  syncPayees,
  pushUnsyncedPayees,
  deletePayeeFromSupabase,
} from '../database/payees/payeeSync';

export function usePayees(userId) {
  const [payees, setPayees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSyncedOnce, setHasSyncedOnce] = useState(false);

  /** Load payees */
  const getAllPayees = useCallback(async () => {
    try {
      const data = await PayeeModel.getAll(userId);
      setPayees(data);
      return data;
    } catch (e) {
      console.log('getAllPayees error:', e);
      return [];
    }
  }, [userId]);

  /** Sync payees */
  const reSync = useCallback(async () => {
    try {
      setLoading(true);
      await pushUnsyncedPayees(userId);
      await syncPayees(userId);
      await getAllPayees();
    } catch (e) {
      console.log('reSync payees error:', e);
    } finally {
      setLoading(false);
    }
  }, [userId, getAllPayees]);

  /** Delete payee */
  const deletePayee = useCallback(
    async (id) => {
      try {
        const isOnline = (await NetInfo.fetch()).isConnected;

        // delete locally first
        PayeeModel.delete(id);

        if (isOnline) {
          await deletePayeeFromSupabase(id, userId);
        }

        await getAllPayees();
      } catch (e) {
        console.log('deletePayee error:', e);
      }
    },
    [userId, getAllPayees],
  );

  /** Insert payee */
  const insertPayee = useCallback(
    async (name, logo) => {
      try {
        PayeeModel.insert(userId, name, logo, false);

        const isOnline = (await NetInfo.fetch()).isConnected;
        if (isOnline) await pushUnsyncedPayees(userId);

        await getAllPayees();
      } catch (e) {
        console.log('insertPayee error:', e);
      }
    },
    [userId, getAllPayees],
  );

  /** Update payee */
  const updatePayee = useCallback(
    async (payee, name, logo) => {
      try {
        PayeeModel.update(payee.id, name, logo, false);

        const isOnline = (await NetInfo.fetch()).isConnected;
        if (isOnline) await pushUnsyncedPayees(userId);

        await getAllPayees();
      } catch (e) {
        console.log('updatePayee error:', e);
      }
    },
    [userId, getAllPayees],
  );

  /** Initial load and auto sync if empty */
  useEffect(() => {
    (async () => {
      const data = await getAllPayees();

      // sync once if empty
      if (!data.length && !hasSyncedOnce) {
        await reSync();
        setHasSyncedOnce(true);
      }

      setLoading(false);
    })();
  }, [getAllPayees, reSync, hasSyncedOnce]);

  return {
    payees,
    loading,
    reSync,
    insertPayee,
    updatePayee,
    deletePayee,
    refresh: getAllPayees,
  };
}
