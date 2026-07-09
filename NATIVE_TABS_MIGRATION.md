# NativeTabs Migration Plan

## Overview

Migrate from `expo-router`'s JS-based `<Tabs>` (wrapping React Navigation bottom tabs) to **`NativeTabs`** from `expo-router/unstable-native-tabs` for truly native tab bar rendering.

**Why**: Native tabs use `UITabBarController` (iOS) and Material `BottomNavigationView` (Android), giving us native blur effects, platform animations, iOS 26 liquid glass support, and Material You theming — all with zero JS overhead.

---

## Tab Restructure

### Current (6 tabs)

Dashboard • Transactions • Budgets • **Goals** • Reports • Settings

### New (5 tabs) — Android allows max 5

Dashboard • Transactions • Budgets • Reports • Settings

> **Goals** moves into **Settings → Manage Data** section as a navigation row (alongside Categories, Payees, Groups, Quick Transactions).

---

## Key Architecture Change: Nested Stacks

NativeTabs does **not** provide a React Navigation header. Each tab screen currently uses `navigation.setOptions()` to configure headers (`headerTitle`, `headerRight`, etc.).

**Solution**: Convert each tab from a single file into a **directory with a `_layout.tsx` Stack** and an `index.tsx` screen.

### Current file structure

```
app/(tabs)/
  _layout.tsx          ← Tabs layout
  dashboard.tsx        ← flat file
  transactions.tsx     ← flat file
  budgets.tsx          ← flat file
  goals.tsx            ← flat file (will be removed from tabs)
  reports.tsx           ← flat file
  settings.tsx         ← flat file
```

### New file structure

```
app/(tabs)/
  _layout.tsx                  ← NativeTabs layout (new)
  dashboard/
    _layout.tsx                ← Stack layout with header config
    index.tsx                  ← current dashboard.tsx (moved)
  transactions/
    _layout.tsx                ← Stack layout with header config
    index.tsx                  ← current transactions.tsx (moved)
  budgets/
    _layout.tsx                ← Stack layout with header config
    index.tsx                  ← current budgets.tsx (moved)
  reports/
    _layout.tsx                ← Stack layout with header config
    index.tsx                  ← current reports.tsx (moved)
  settings/
    _layout.tsx                ← Stack layout with header config
    index.tsx                  ← current settings.tsx (moved)

app/goals.tsx                  ← moved to root stack (navigated from Settings)
```

---

## Detailed File Changes

### Phase 1: Move Goals out of tabs

#### 1.1 Move `app/(tabs)/goals.tsx` → `app/goals.tsx`

- Move the file to the root `app/` directory so it becomes a Stack screen
- No changes to the component code itself

#### 1.2 Update `app/_layout.tsx` (Root Stack)

- Add a `Stack.Screen` entry for `goals`:

```tsx
<Stack.Screen
  name="goals"
  options={{
    headerShown: true,
    title: 'Goals',
    headerBackTitle: ' ',
    headerLeft: () => standardHeaderLeft(),
  }}
/>
```

#### 1.3 Update `app/(tabs)/settings.tsx`

- Add a new **Goals** row in the "Manage Data" section:

```tsx
<SettingRow
  icon="flag"
  title="Goals"
  value="Manage Savings Goals"
  onPress={() => navigation.navigate('goals')}
/>
<View style={styles.divider} />
```

- Place it as the first item in the Manage Data section (before Categories)

#### 1.4 Update `src/navigation/navigationTypes.ts`

- Remove `goals` from `MainTabParamList`
- Add `goals: undefined` to `RootStackParamList`

---

### Phase 2: Convert tab files to directories with Stacks

Each tab needs a directory with `_layout.tsx` (Stack) + `index.tsx` (screen).

#### 2.1 Template Stack layout for each tab

Each `_layout.tsx` inside a tab directory follows this pattern:

```tsx
import { Stack } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';

export default function DashboardLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    />
  );
}
```

#### 2.2 Files to convert

| Current File       | New Directory   | New `_layout.tsx` | New `index.tsx`                 |
| ------------------ | --------------- | ----------------- | ------------------------------- |
| `dashboard.tsx`    | `dashboard/`    | Stack layout      | Move `dashboard.tsx` content    |
| `transactions.tsx` | `transactions/` | Stack layout      | Move `transactions.tsx` content |
| `budgets.tsx`      | `budgets/`      | Stack layout      | Move `budgets.tsx` content      |
| `reports.tsx`      | `reports/`      | Stack layout      | Move `reports.tsx` content      |
| `settings.tsx`     | `settings/`     | Stack layout      | Move `settings.tsx` content     |

> **Note**: The existing `app/reports/` directory (with report sub-screens) is separate from `app/(tabs)/reports.tsx`. The tab's report listing screen becomes `app/(tabs)/reports/index.tsx`. The detailed report screens remain in `app/reports/*.tsx` at the root Stack level.

---

### Phase 3: New NativeTabs layout

#### 3.1 Replace `app/(tabs)/_layout.tsx`

```tsx
import React from 'react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTheme } from '@/store/ThemeContext';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <NativeTabs
      backBehavior="history"
      backgroundColor={colors.card}
      tintColor={colors.primary}
      iconColor={{
        default: colors.textSecondary,
        selected: colors.primary,
      }}
      labelStyle={{
        color: colors.textSecondary,
      }}
    >
      <NativeTabs.Trigger name="dashboard">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="transactions">
        <NativeTabs.Trigger.Icon sf="arrow.up.arrow.down" md="swap_vert" />
        <NativeTabs.Trigger.Label>Transactions</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="budgets">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'wallet.bifold', selected: 'wallet.bifold.fill' }}
          md="wallet"
        />
        <NativeTabs.Trigger.Label>Budgets</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="reports">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
          md="bar_chart"
        />
        <NativeTabs.Trigger.Label>Reports</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          md="tune"
        />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

---

## Icon Mapping

| Tab          | SF Symbol (iOS)                        | Material Symbol (Android) |
| ------------ | -------------------------------------- | ------------------------- |
| Dashboard    | `house` / `house.fill`                 | `home`                    |
| Transactions | `arrow.up.arrow.down`                  | `swap_vert`               |
| Budgets      | `wallet.bifold` / `wallet.bifold.fill` | `wallet`                  |
| Reports      | `chart.bar` / `chart.bar.fill`         | `bar_chart`               |
| Settings     | `gearshape` / `gearshape.fill`         | `tune`                    |

---

## Files Modified Summary

| Action      | File                                                                |
| ----------- | ------------------------------------------------------------------- |
| **REPLACE** | `app/(tabs)/_layout.tsx` → NativeTabs layout                        |
| **MOVE**    | `app/(tabs)/dashboard.tsx` → `app/(tabs)/dashboard/index.tsx`       |
| **NEW**     | `app/(tabs)/dashboard/_layout.tsx` (Stack)                          |
| **MOVE**    | `app/(tabs)/transactions.tsx` → `app/(tabs)/transactions/index.tsx` |
| **NEW**     | `app/(tabs)/transactions/_layout.tsx` (Stack)                       |
| **MOVE**    | `app/(tabs)/budgets.tsx` → `app/(tabs)/budgets/index.tsx`           |
| **NEW**     | `app/(tabs)/budgets/_layout.tsx` (Stack)                            |
| **MOVE**    | `app/(tabs)/reports.tsx` → `app/(tabs)/reports/index.tsx`           |
| **NEW**     | `app/(tabs)/reports/_layout.tsx` (Stack)                            |
| **MOVE**    | `app/(tabs)/settings.tsx` → `app/(tabs)/settings/index.tsx`         |
| **NEW**     | `app/(tabs)/settings/_layout.tsx` (Stack)                           |
| **MOVE**    | `app/(tabs)/goals.tsx` → `app/goals.tsx`                            |
| **MODIFY**  | `app/_layout.tsx` — add Goals Stack.Screen                          |
| **MODIFY**  | Settings screen — add Goals row to Manage Data                      |
| **MODIFY**  | `src/navigation/navigationTypes.ts` — move goals type               |

---

## Important Considerations

### Android 5-tab limit

Android's Material BottomNavigationView only supports max 5 tabs. With Goals removed, we're at exactly 5. ✅

### react-native-screens version

Currently on `4.25.2` which supports NativeTabs features for SDK 57. ✅

### Known limitations

- **FlatList**: Limited support for scroll-to-top and minimize-on-scroll. Transactions screen uses `FlashList` — may need `disableTransparentOnScrollEdge` on that trigger
- **No nested native tabs**: Not an issue for this app
- **Lazy loading**: All tab screens render eagerly. Consider `useIsFocused` for heavy tabs
- **White flash on tab switch**: Wrap NativeTabs in Expo Router's `ThemeProvider` if dark mode flashes

### Dependencies

- No new packages needed — `expo-router` already includes NativeTabs
- Can remove `@expo/vector-icons/MaterialCommunityIcons` import from tabs layout (icons are now native)
- `react-native-safe-area-context` import no longer needed in tabs layout (native tabs handle safe areas)

---

## Rollback Plan

If NativeTabs causes issues:

1. Revert all file moves (directories back to flat files)
2. Restore original `_layout.tsx` with JS `<Tabs>`
3. Move `goals.tsx` back into `(tabs)/`

Git branch recommended: `feature/native-tabs-migration`
