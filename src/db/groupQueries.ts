import { getDb } from './database';
import { TransactionGroup } from '../models/types';

export const getTransactionGroups = async (userId: string) => {
  const db = getDb();
  return db.getAllAsync<TransactionGroup>(
    `SELECT * FROM transaction_groups WHERE user_id = ? ORDER BY priority ASC, name ASC`,
    [userId],
  );
};

export const insertTransactionGroup = async (group: TransactionGroup, syncStatus: number = 1) => {
  const db = getDb();
  const name = (group.name || '').replace(/'/g, "''");
  const desc = (group.description || '').replace(/'/g, "''");

  let priority = group.priority ?? 0;
  if (priority === 0) {
    const result = await db.getFirstAsync<{ maxP: number }>(
      `SELECT MAX(priority) as maxP FROM transaction_groups WHERE user_id = ?`,
      [group.user_id],
    );
    priority = (result?.maxP || 0) + 1;
  }

  await db.execAsync(
    `INSERT OR REPLACE INTO transaction_groups (id, name, description, user_id, priority, sync_status)
     VALUES ('${group.id}', '${name}', '${desc}', '${group.user_id}', ${priority}, ${syncStatus})`,
  );
};

export const deleteTransactionGroupAsync = async (id: string, userId: string) => {
  const db = getDb();
  await db.execAsync(`DELETE FROM transaction_groups WHERE id = '${id}' AND user_id = '${userId}'`);
};

export const updateTransactionGroupPriorities = async (
  updates: { id: string; priority: number }[],
  userId: string,
) => {
  const db = getDb();
  for (const update of updates) {
    await db.runAsync(
      `UPDATE transaction_groups SET priority = ?, sync_status = 1 WHERE id = ? AND user_id = ?`,
      [update.priority, update.id, userId],
    );
  }
};
