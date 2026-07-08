# Transaction Grouping Implementation Plan (React Native / Expo App)

This plan outlines how to introduce transaction grouping in the Jmoney mobile application (using React Native, Expo, SQLite, and Supabase). Each transaction will optionally belong to exactly one group (e.g. for tracking trips, special projects, or user-defined tags).

---

## 1. Supabase (Database Layer) Changes

We need to create the table and relationships in Supabase first:

### Migration SQL Script

```sql
-- Create transaction_groups table
CREATE TABLE IF NOT EXISTS public.transaction_groups (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4 (),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text NULL,
  priority integer DEFAULT 0,
  created_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT transaction_groups_pkey PRIMARY KEY (id),
  CONSTRAINT transaction_groups_user_name_unique UNIQUE (user_id, name),
  CONSTRAINT transaction_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT transaction_groups_name_not_empty CHECK ((char_length(name) > 0))
) TABLESPACE pg_default;

-- Enable Row Level Security (RLS)
ALTER TABLE public.transaction_groups ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY "Users can insert their own transaction groups" ON public.transaction_groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own transaction groups" ON public.transaction_groups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own transaction groups" ON public.transaction_groups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transaction groups" ON public.transaction_groups
  FOR DELETE USING (auth.uid() = user_id);

-- Alter transactions table to reference transaction_groups
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS group_id uuid NULL;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES public.transaction_groups(id) ON DELETE SET NULL;
```

---

## 2. Models & Constants

### [MODIFY] [src/models/types.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/models/types.ts)

- Add `TransactionGroup` interface:

```typescript
export interface TransactionGroup {
  id: string;
  name: string;
  description?: string | null;
  user_id: string;
  priority?: number;
  sync_status?: number;
}
```

- Update `Transaction` interface to support optional `group_id` and `group_name`:

```typescript
export interface Transaction {
  // ... existing fields
  group_id?: string | null;
  group_name?: string | null;
}
```

### [MODIFY] [src/constants/tables.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/constants/tables.ts)

- Add `TRANSACTION_GROUPS` to the `TABLES` dictionary:

```typescript
export const TABLES = {
  // ...
  TRANSACTION_GROUPS: 'transaction_groups',
} as const;
```

### [MODIFY] [src/constants/sync.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/constants/sync.ts)

- Add sync storage key to `STORAGE_KEYS`:

```typescript
export const STORAGE_KEYS = {
  // ...
  LAST_SYNC_TRANSACTION_GROUPS: '@last_sync_transaction_groups_',
} as const;
```

---

## 3. SQLite Database Layer

### [MODIFY] [src/db/database.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/db/database.ts)

- Create the `transaction_groups` table in `initDB()`:

```typescript
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS transaction_groups (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    user_id TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    sync_status INTEGER DEFAULT 0
  );
`);
```

- Add transaction table column migrations inside `migrations` list:

```typescript
const migrations = [
  // ...
  'ALTER TABLE transactions ADD COLUMN group_id TEXT;',
  'ALTER TABLE transactions ADD COLUMN group_name TEXT;',
];
```

- Create index:

```typescript
await db.execAsync(`
  CREATE INDEX IF NOT EXISTS idx_transactions_group ON transactions(group_id);
`);
```

---

## 4. SQLite Queries

### [MODIFY] [src/db/queries.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/db/queries.ts)

- Re-export from `groupQueries`:

```typescript
export * from './groupQueries';
```

- Clear groups on resetting app data:

```typescript
export const resetAppData = async (userId: string) => {
  // ...
  await db.execAsync(`DELETE FROM transaction_groups WHERE user_id = '${userId}'`);
  // ...
};
```

### [NEW] [src/db/groupQueries.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/db/groupQueries.ts)

Create query hooks for CRUD operations on transaction groups:

```typescript
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
```

### [MODIFY] [src/db/transactionQueries.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/db/transactionQueries.ts)

Update `insertOrUpdateTransaction` to write `group_id` and `group_name`:

```typescript
export const insertOrUpdateTransaction = async (tx: Transaction, syncStatus: number = 0) => {
  // ...
  await db.runAsync(
    `INSERT OR REPLACE INTO transactions (
      id, amount, description, transaction_timestamp, date,
      category_id, category_name, category_icon, category_app_icon,
      payee_id, payee_name, payee_logo, type, user_id,
      product_link, tid, latitude, longitude, sync_status, created_at, updated_at, deleted,
      group_id, group_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      // ... existing values
      tx.group_id || null,
      tx.group_name || null,
    ],
  );
};
```

### [MODIFY] [src/db/reportQueries.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/db/reportQueries.ts)

Add SQL helpers to generate reports grouped by group:

```typescript
export const getReportSummaryByGroup = async (
  userId: string,
  type: string,
  month: string,
  year: string,
) => {
  const db = getDb();
  return db.getAllAsync<{
    group_id: string;
    group_name: string;
    amount: number;
  }>(
    `SELECT group_id, group_name, SUM(amount) as amount
     FROM transactions
     WHERE user_id = ? AND deleted = 0 AND type = ?
       AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
       AND group_id IS NOT NULL AND group_id != 'null'
     GROUP BY group_name
     ORDER BY amount DESC`,
    [userId, type, month, year],
  );
};

export const getReportYearlySummaryByGroup = async (userId: string, type: string, year: string) => {
  const db = getDb();
  return db.getAllAsync<{
    group_id: string;
    group_name: string;
    amount: number;
  }>(
    `SELECT group_id, group_name, SUM(amount) as amount
     FROM transactions
     WHERE user_id = ? AND deleted = 0 AND type = ?
       AND strftime('%Y', date) = ?
       AND group_id IS NOT NULL AND group_id != 'null'
     GROUP BY group_name
     ORDER BY amount DESC`,
    [userId, type, year],
  );
};
```

---

## 5. Sync Layer

### [NEW] [src/services/sync/groupSync.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/services/sync/groupSync.ts)

Manage pushing/pulling groups between local SQLite and remote Supabase:

```typescript
import { supabase } from '../supabase';
import { getDb } from '../../db/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOnline, syncLog } from './baseSync';
import { STORAGE_KEYS, TABLES } from '../../constants';

export const pushLocalGroups = async (userId: string) => {
  if (!(await isOnline())) return;
  const db = getDb();
  const unsynced = await db.getAllAsync<{
    id: string;
    name: string;
    description: string;
    user_id: string;
    priority: number;
  }>(`SELECT * FROM transaction_groups WHERE user_id = '${userId}' AND sync_status = 1`);

  if (unsynced.length === 0) return;
  syncLog('Groups', `Pushing ${unsynced.length} groups...`);

  for (const group of unsynced) {
    const { id, name, description, user_id, priority } = group;
    const { error } = await supabase
      .from(TABLES.TRANSACTION_GROUPS)
      .upsert([{ id, name, description, user_id, priority }], { onConflict: 'id' });
    if (!error) {
      await db.execAsync(`UPDATE transaction_groups SET sync_status = 0 WHERE id = '${id}'`);
    }
  }
};

export const syncGroups = async (userId: string) => {
  if (!userId || !(await isOnline())) return;
  syncLog('Groups', 'Syncing...');
  await pushLocalGroups(userId);

  const db = getDb();
  const { data: groups, error } = await supabase
    .from(TABLES.TRANSACTION_GROUPS)
    .select('*')
    .eq('user_id', userId);

  if (!error && groups) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`DELETE FROM transaction_groups WHERE user_id = '${userId}'`);
      for (const item of groups) {
        const name = (item.name || '').replace(/'/g, "''");
        const desc = (item.description || '').replace(/'/g, "''");
        await db.execAsync(`
          INSERT INTO transaction_groups (id, name, description, user_id, priority, sync_status) 
          VALUES ('${item.id}', '${name}', '${desc}', '${item.user_id}', ${item.priority ?? 0}, 0)
        `);
      }
    });
    syncLog('Groups', `Pulled ${groups.length} groups.`);
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.LAST_SYNC_TRANSACTION_GROUPS}${userId}`,
      new Date().toISOString(),
    );
  }
};
```

### [MODIFY] [src/services/syncService.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/services/syncService.ts)

Integrate the new group sync functions inside the synchronization coordinator:

- Import `pushLocalGroups` and `syncGroups`.
- Add `await pushLocalGroups(userId)` inside `pushLocalChanges`.
- Add `await syncGroups(userId)` inside `runFullSync`.
- Export `syncGroups` for use on screens.

### [MODIFY] [src/services/sync/transactionSync.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/services/sync/transactionSync.ts)

- Update `pushLocalTransactions`:
  Include `group_id: tx.group_id === 'null' ? null : tx.group_id || null` in the payload sent to Supabase.
- Update `syncTransactions`:
  - Join the `transaction_groups` table in the Supabase select call:
    ```typescript
    const { data: rawData, error } = await supabase.from(TABLES.TRANSACTIONS).select(`
        *,
        categories:category_id (name, icon, app_icon),
        payees:payee_id (name, logo),
        transaction_groups:group_id (name)
      `);
    ```
  - Map `group_name: item.transaction_groups?.name`.
  - Update SQL `INSERT OR REPLACE` query to write `group_id` and `group_name`.

---

## 6. Service & Helper Layer

### [NEW] [src/services/groupService.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/services/groupService.ts)

Create utility functions for UI interaction (similar to `categoryService.ts`):

- `fetchGroupsData(userId)`: Reads from SQLite, checks sync history, triggers initial sync.
- `saveGroupViewMode(userId, mode)`: Persists view mode in `AsyncStorage`.
- `addGroup(userId, name, description)`: Inserts a group locally and runs a background remote sync.
- `performGroupSync(userId)`: Forces local-remote sync and returns updated dataset.
- `backgroundPushGroups(userId)`: Pushes priority reordering changes in background.
- `filterAndSortGroups(groups, searchQuery, sortBy, sortAsc, isReordering)`: Handles client-side filtering and sorting.

### [MODIFY] [src/services/reportService.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/services/reportService.ts)

Add group overview & group summary report queries inside `fetchBaseReportData` and `handleReportDrillDown`:

- Map `summaryByGroup` to `getReportSummaryByGroup` and `yearlyGroup` to `getReportYearlySummaryByGroup`.
- In `handleReportDrillDown`, add a drill-down parser for group reports:
  ```typescript
  if (['summaryByGroup', 'yearlyGroup'].includes(reportType)) {
    const all = await getTransactionsByDateRange(userId, fetchStartDate, fetchEndDate);
    return all.filter((t) => t.group_name === (item.group_name || item.name));
  }
  ```

---

## 7. UI Components & Modals

### [MODIFY] [src/components/transactions/ItemSelectorModal.tsx](file:///Users/jayanthbharadwajm/development/jayledger/src/components/transactions/ItemSelectorModal.tsx)

- Support `type: 'Category' | 'Payee' | 'Group'`.
- Display a fallback tag or folder icon for items when `type === 'Group'`.
- Display group lists and return selected group back to listener.

### [MODIFY] [src/components/transactions/TransactionSelectorRow.tsx](file:///Users/jayanthbharadwajm/development/jayledger/src/components/transactions/TransactionSelectorRow.tsx)

Modify the layout to fit Category, Payee, and Group options.
Since it currently displays 2 side-by-side buttons, we can:

- Wrap the row vertically or display Category & Payee side-by-side, and Group as a full-width row below it.
- Display Group with a generic `collections` or `label` icon.

---

## 8. App Screens

### [NEW] [src/screens/GroupsScreen.tsx](file:///Users/jayanthbharadwajm/development/jayledger/src/screens/GroupsScreen.tsx)

Create a new screen to list, search, add, edit, reorder, delete, and manually synchronize groups:

- Follow the exact design layout of `CategoriesScreen.tsx` (refresh icon on top right, search bar, list/grid toggle, reorder mode with arrows, FAB button to open add modal).
- Add a `GroupAddModal` popup to input group Name and Description.

### [MODIFY] [src/screens/AddTransactionScreen.tsx](file:///Users/jayanthbharadwajm/development/jayledger/src/screens/AddTransactionScreen.tsx)

- Fetch transaction groups in `useEffect` loader.
- Track `selectedGroup` state.
- If editing, set initial value from `editTx.group_id`.
- Render Group selection row and link it to an `ItemSelectorModal` showing Groups.
- Bind `group_id` and `group_name` fields into transaction payload when clicking Save.

### [MODIFY] [src/screens/SettingsScreen.tsx](file:///Users/jayanthbharadwajm/development/jayledger/src/screens/SettingsScreen.tsx)

- Add a new link item under "Manage Data" group card:

```typescript
<SettingRow
  icon="folder-special"
  title="Transaction Groups"
  value="Manage Groups"
  onPress={() => navigation.navigate('Groups')}
/>
```

### [MODIFY] [src/screens/ReportsScreen.tsx](file:///Users/jayanthbharadwajm/development/jayledger/src/screens/ReportsScreen.tsx)

- Register "Transactions By Group" in the reports list metadata card array:

```typescript
{
  title: 'Transactions By Group',
  description: 'History by group',
  icon: 'folder',
  view: 'summaryByGroup',
  color: '#8b5cf6',
}
```

- Register the report route mapping inside switch block:

```typescript
case 'summaryByGroup':
  screen = 'GroupSummaryReport';
  break;
```

### [NEW] [src/screens/reports/GroupSummaryReportScreen.tsx](file:///Users/jayanthbharadwajm/development/jayledger/src/screens/reports/GroupSummaryReportScreen.tsx)

- Create report viewer component displaying expense/income totals mapped to groups.
- Standard monthly/yearly selectors, trend calculation percentage comparisons, and clicking list items brings up the `ReportDrillDownModal` listing detailed itemized transaction history.

---

## 9. Navigation Setup

### [MODIFY] [src/navigation/navigationTypes.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/navigation/navigationTypes.ts)

Add routes to `RootStackParamList`:

```typescript
export type RootStackParamList = {
  // ...
  Groups: undefined;
  GroupSummaryReport: { title?: string; reportType: string };
};
```

### [MODIFY] [src/navigation/AppNavigator.tsx](file:///Users/jayanthbharadwajm/development/jayledger/src/navigation/AppNavigator.tsx)

Import and register stack screens:

```typescript
import GroupsScreen from '../screens/GroupsScreen';
import GroupSummaryReportScreen from '../screens/reports/GroupSummaryReportScreen';

// Inside AppNavigator component:
<Stack.Screen
  name="Groups"
  component={GroupsScreen}
  options={({ navigation }) => ({
    headerShown: true,
    title: 'Groups',
    headerBackTitle: ' ',
    headerLeft: () => standardHeaderLeft(navigation),
  })}
/>
<Stack.Screen
  name="GroupSummaryReport"
  component={GroupSummaryReportScreen}
  options={({ navigation }) => ({
    headerShown: true,
    headerBackTitle: ' ',
    headerLeft: () => standardHeaderLeft(navigation),
  })}
/>
```
