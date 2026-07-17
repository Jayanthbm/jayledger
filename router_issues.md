# Router Issues Analysis: Quick Actions Navigation Loop

## Problem Summary

After migrating from React Navigation to Expo Router, when a quick action (from the home screen shortcuts or the in-app quick transaction FAB) is triggered:

1. The quick action screen/page opens
2. When any item inside is clicked, the app **keeps navigating to the same page repeatedly**
3. The only way to escape is to force-close and reopen the app

This indicates a **navigation stack corruption** or **repeated navigation call** caused by the Expo Router migration.

---

## Root Cause Analysis

### Issue #1: QuickActionHandler uses `router.push()` for tab route duplication

**File:** `src/components/QuickActionHandler.tsx` (lines 39-49)

```typescript
if (action.id === 'quick_transaction') {
  router.push('/(tabs)/transactions'); // ← PROBLEM: pushes same tab route
  setTimeout(() => {
    DeviceEventEmitter.emit('show_quick_transaction_modal');
  }, 200);
}
```

**Problem:** When the user is already on the `/(tabs)/transactions` route, `router.push('/(tabs)/transactions')` pushes a **duplicate** entry for the same tab onto the root navigation stack. With `backBehavior="history"` on NativeTabs, this creates a new history entry instead of reusing the existing one.

**Effect:** After the user:

1. Selects a quick transaction template → navigates to `/add-transaction` (transparent modal)
2. Saves → `navigation.goBack()` returns to the _duplicate_ transactions entry
3. The duplicate entry creates an inconsistent stack state — the app appears stuck because there's an extra tab entry pushing things out of sync

---

### Issue #2: `navigation.goBack()` vs `router.back()` API mismatch

**Files:**

- `app/add-transaction.tsx` (line ~231): `navigation.goBack()`
- `app/add-quick-transaction.tsx` (line ~119): `navigation.goBack()`

**Problem:** The code uses `navigation` from `useNavigation()` (React Navigation compat API) instead of `router` from `useRouter()` (Expo Router native API). While `navigation.goBack()` often works, Expo Router's `router.back()` is the canonical way to navigate back. Mixing APIs creates subtle issues with modal dismissal — particularly with `presentation: 'transparentModal'` screens where the transparent overlay can cause the goBack to target the wrong stack level.

**Recommended fix:** Replace `navigation.goBack()` with `router.back()` in these screens.

---

### Issue #3: No guard against duplicate route pushes

In `app/quick-transactions.tsx` (lines 108-113):

```typescript
const handleEdit = (item: QuickTransaction) => {
  if (isReordering) return;
  router.push({
    pathname: '/add-quick-transaction',
    params: { quickTransaction: JSON.stringify(item) },
  });
};
```

And in `app/(tabs)/transactions/index.tsx` (lines ~300-305):

```typescript
onSelect={(item) => {
    setShowQuickModal(false);
    router.push({
        pathname: '/add-transaction',
        params: { quickTransaction: JSON.stringify(item) },
    });
}}
```

**Problem:** There is no check to see if the target screen (`/add-quick-transaction` or `/add-transaction`) is already on the navigation stack. Rapid taps or re-firing events can push **multiple instances** of the same modal screen on top of each other.

Each tap creates a new transparentModal entry on the stack, and each `goBack()` only dismisses one layer. If 3 pushes happened, the user needs 3 back navigations to escape — and the stacked modals aren't visually distinguishable (transparent), so it _feels_ like a loop.

---

### Issue #4: `useQuickActionCallback` may re-fire on focus returns

**File:** `src/components/QuickActionHandler.tsx` (lines 66-68)

```typescript
useQuickActionCallback((action: Action) => {
  logger.info('[QuickActions] Received quick action:', action.id);
  handleQuickAction(action);
});
```

**Problem:** The `expo-quick-actions` library's `useQuickActionCallback` hook may fire the action callback **multiple times** in certain scenarios:

- On cold start: The pending action fires once the handler mounts
- On app resume from background (if the shortcut was activated from the home screen)
- If the component re-renders or remounts (e.g., during auth state transitions)

This means after the user completes their flow and returns to the transactions tab, the callback can fire again, triggering another `show_quick_transaction_modal` event and causing the modal to reappear.

**Related:** The `show_quick_transaction_modal` event listener in `app/(tabs)/transactions/index.tsx` is set up once and **never removed** (it's in a `useEffect` with the component's lifecycle). If the callback fires again, the modal reopens automatically.

---

### Issue #5: Cold start race condition with auth redirects

**Flow:**

1. App cold-started from home screen quick action
2. `app/_layout.tsx` → `RootLayoutNav` renders with `QuickActionHandler`
3. `useQuickActionCallback` fires the pending action
4. But `RootLayoutNav` is also running its `useEffect` to check auth state and potentially redirect
5. The navigation to `/add-transaction` or `/(tabs)/transactions` can race against the auth redirect to `/(auth)/login` or `/(tabs)/dashboard`

**Result:** After the auth redirect completes, the user ends up at the dashboard, but with a corrupted navigation stack from the racing quick action navigation.

---

### Issue #6: Duplicate `setTimeout` in QuickActionHandler

**File:** `src/components/QuickActionHandler.tsx` (lines 36-53)

There are **nested** `setTimeout` calls:

```typescript
const handleQuickAction = useCallback(
  (action: Action) => {
    // ...
    setTimeout(() => {
      // ← outer setTimeout (100ms)
      if (action.id === 'add_transaction') {
        router.push('/add-transaction');
      } else if (action.id === 'quick_transaction') {
        router.push('/(tabs)/transactions');
        setTimeout(() => {
          // ← inner setTimeout (200ms)
          DeviceEventEmitter.emit('show_quick_transaction_modal');
        }, 200);
      }
    }, 100);
  },
  [session],
);
```

The outer `setTimeout(..., 100ms)` is intended to let navigation stabilize. But if multiple quick actions fire in succession (or the callback fires multiple times), these timers accumulate — potentially causing the `show_quick_transaction_modal` event to fire **after** the user has already completed their flow and returned.

---

## How to Reproduce

### Hot start (app in background)

1. App is running in background
2. 3D Touch / long press app icon → tap "Quick Transaction"
3. App resumes → navigates to Transactions tab → Quick Transaction modal opens
4. Select a quick transaction template → navigates to Add Transaction screen
5. Save → `goBack()` returns to Transactions
6. ⚠️ Quick Transaction modal may reappear → stuck in loop

### From in-app quick FAB (bolt icon)

1. Open Transactions tab
2. Tap the bolt icon (quick FAB) → Quick Transaction modal opens
3. Select a template → navigates to Add Transaction screen
4. Save → `goBack()` returns to Transactions
5. ⚠️ Same issue can occur if the `useQuickActionCallback` re-fires

---

## Recommended Fixes

### Fix 1: Use `router.replace` instead of `router.push` for tab navigation

```typescript
// In QuickActionHandler.tsx — for tab navigation
router.replace('/(tabs)/transactions');
```

This ensures no duplicate tab entry is created.

### Fix 2: Use `router.back()` instead of `navigation.goBack()`

```typescript
// In add-transaction.tsx and add-quick-transaction.tsx
import { useRouter } from 'expo-router';
const router = useRouter();
// ...
router.back();
```

### Fix 3: Add duplicate navigation guard

```typescript
// Pattern to prevent duplicate pushes
const [isNavigating, setIsNavigating] = useState(false);

const handleEdit = (item: QuickTransaction) => {
  if (isReordering || isNavigating) return;
  setIsNavigating(true);
  router.push({
    pathname: '/add-quick-transaction',
    params: { quickTransaction: JSON.stringify(item) },
  });
  // Reset after a short delay
  setTimeout(() => setIsNavigating(false), 500);
};
```

### Fix 4: Debounce or deduplicate quick action handler

```typescript
// In QuickActionHandler.tsx — add a processing lock
const processingRef = useRef(false);

const handleQuickAction = useCallback(
  (action: Action) => {
    if (processingRef.current) return;
    processingRef.current = true;

    setTimeout(() => {
      // ... navigation logic ...
      setTimeout(() => {
        processingRef.current = false;
      }, 1000);
    }, 100);
  },
  [session],
);
```

### Fix 5: Consolidate event system to avoid re-triggers

Use a more reliable mechanism than `DeviceEventEmitter` + `setTimeout` to show the quick transaction modal. Consider a shared state/context approach or a ref-based trigger.

---

## Related Files

| File                                                    | Role                                                   |
| ------------------------------------------------------- | ------------------------------------------------------ |
| `src/components/QuickActionHandler.tsx`                 | Handles home screen quick actions, navigates to routes |
| `app/(tabs)/transactions/index.tsx`                     | Shows TransactionQuickModal, listens for events        |
| `app/add-transaction.tsx`                               | Add Transaction modal screen                           |
| `app/quick-transactions.tsx`                            | Quick transaction template management screen           |
| `app/add-quick-transaction.tsx`                         | Add/Edit quick transaction template screen             |
| `app/_layout.tsx`                                       | Root stack layout with modal route definitions         |
| `app/(tabs)/_layout.tsx`                                | NativeTabs layout with backBehavior                    |
| `src/components/transactions/TransactionQuickModal.tsx` | Quick transaction selection modal                      |
| `src/components/BottomSheet.tsx`                        | Shared bottom sheet component (used as modal wrapper)  |

---

## Summary

The core issue is a combination of:

1. **`router.push` to an already-active tab route** creating stack corruption
2. **`navigation.goBack()` vs `router.back()`** API mismatch causing inconsistent modal dismissal
3. **No guards against duplicate navigations** allowing stacked modals
4. **Potential re-firing of quick action callbacks** trapping users in a loop

The "only way out is close and reopen the app" symptom is consistent with the navigation stack having multiple transparentModal entries that can't be distinguished visually, making it feel like the same screen keeps reappearing.
