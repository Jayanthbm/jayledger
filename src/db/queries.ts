import { getDb } from './database';

export * from './transactionQueries';
export * from './budgetQueries';
export * from './reportQueries';
export * from './quickTransactionQueries';
export { updateQuickTransactionPriorities } from './quickTransactionQueries';
export * from './metaQueries';
export { updateCategoryPriorities, updatePayeePriorities } from './metaQueries';
export * from './groupQueries';

/**
 * Global application maintenance queries.
 */

export const resetAppData = async (userId: string) => {
  const db = getDb();
  await db.execAsync(`BEGIN TRANSACTION;`);
  try {
    await db.execAsync(`DELETE FROM transactions WHERE user_id = '${userId}'`);
    await db.execAsync(`DELETE FROM budgets WHERE user_id = '${userId}'`);
    await db.execAsync(`DELETE FROM goals WHERE user_id = '${userId}'`);
    await db.execAsync(`DELETE FROM categories WHERE user_id = '${userId}'`);
    await db.execAsync(`DELETE FROM payees WHERE user_id = '${userId}'`);
    await db.execAsync(`DELETE FROM transaction_groups WHERE user_id = '${userId}'`);
    await db.execAsync(`COMMIT;`);
  } catch (e) {
    await db.execAsync(`ROLLBACK;`);
    throw e;
  }
};
