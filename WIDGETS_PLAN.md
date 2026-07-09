# Jmoney – Home Screen Widgets Plan

> A comprehensive plan for implementing home screen widgets on both **Android** and **iOS** using `react-native-android-widget` and `expo-widgets` respectively.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack & Dependencies](#tech-stack--dependencies)
3. [Widget Catalog](#widget-catalog)
4. [Widget Sizes & Layouts](#widget-sizes--layouts)
5. [Data Architecture](#data-architecture)
6. [Unauthenticated (Logged Out) Behavior](#unauthenticated-logged-out-behavior)
7. [Implementation Phases](#implementation-phases)
8. [Verification Plan](#verification-plan)

---

## Overview

Jmoney currently stores all financial data in a local **SQLite** database (`expo-sqlite`) and provides dashboard metrics via `src/services/dashboardService.ts`. Home screen widgets will act as lightweight **read-only views** of this local data, providing users with glanceable financial information without opening the app.

**Key Constraints:**

- Widgets run outside the React Native runtime — they cannot use hooks, contexts, or navigation directly.
- Data is shared via the **same SQLite database file** on disk.
- Widgets **do not require network access** — they read from local SQLite only.
- Deep links (using the existing `jmoney://` URI scheme) will be used for tap-to-open actions.
- All widgets must degrade gracefully when the user is not logged in.

---

## Tech Stack & Dependencies

| Platform    | Library                       | Purpose                                                                           |
| ----------- | ----------------------------- | --------------------------------------------------------------------------------- |
| **Android** | `react-native-android-widget` | Native Android widget rendering via React components, config plugin, task handler |
| **iOS**     | `expo-widgets`                | iOS Home Screen & Lock Screen widgets via Expo UI / SwiftUI under CNG             |
| **Both**    | `expo-sqlite`                 | Shared SQLite database access from both app and widget contexts                   |

### Installation Commands

```bash
# Android widgets
npx expo install react-native-android-widget

# iOS widgets
npx expo install expo-widgets
```

> [!IMPORTANT]
> Widgets **do not work in Expo Go**. You must use development builds (`npx expo run:android` / `npx expo run:ios`) to test widgets.

---

## Widget Catalog

Based on the data available in the app's SQLite database and the metrics computed in [dashboardService.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/services/dashboardService.ts), here are the proposed widgets:

### Widget 1: Quick Add

| Property        | Value                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| **Purpose**     | One-tap shortcut to open the Add Transaction or Quick Transaction screens |
| **Data Source** | None (action-only widget)                                                 |
| **Tap Action**  | Deep links: `jmoney://add-transaction` or `jmoney://quick-transactions`   |
| **Sizes**       | Small (icon + label), Medium (icon + label + quick transaction shortcuts) |

**Small (2×2):**

- App icon + "Add Transaction" label
- Single tap opens `app/add-transaction.tsx`

**Medium (4×2):**

- Left side: "New Transaction" button → deep links to `add-transaction`
- Right side: Top 2–3 quick transaction presets (fetched from `quick_transactions` table, ordered by priority) → each deep links to `add-transaction` with preset data
- Bottom: "Quick Transactions" link → opens `app/quick-transactions.tsx`

---

### Widget 2: Daily Limit

| Property        | Value                                                                   |
| --------------- | ----------------------------------------------------------------------- |
| **Purpose**     | Show today's spending limit, amount spent, and remaining budget         |
| **Data Source** | `getIncomeExpenseSummary()`, `getSpentToday()`, `calculateDailyLimit()` |
| **Tap Action**  | `jmoney://daily-limit-detail`                                           |
| **Sizes**       | Small, Medium, Large                                                    |

**Small (2×2):**

- Circular progress ring showing remaining percentage
- Center: remaining amount (e.g., "₹1,240")
- Label: "Daily Limit"

**Medium (4×2):**

- Left: Circular progress ring with remaining percentage
- Right column:
  - "Limit: ₹2,500"
  - "Spent: ₹1,260"
  - "Remaining: ₹1,240"
- Tap opens `app/daily-limit-detail.tsx`

**Large (4×4):**

- Top section: Daily limit progress ring + amounts (same as medium)
- Bottom section: Last 3 transactions from today (description + amount)
- Footer: "View Details →"

---

### Widget 3: Pay Day Countdown

| Property        | Value                                               |
| --------------- | --------------------------------------------------- |
| **Purpose**     | Display remaining days until end-of-month (pay day) |
| **Data Source** | `calculatePayDayInfo()` from `dashboardService.ts`  |
| **Tap Action**  | `jmoney://` (opens dashboard)                       |
| **Sizes**       | Small, Medium                                       |

**Small (2×2):**

- Large number: remaining days (e.g., "12")
- Label: "days to pay day"
- Subtitle: target date (e.g., "Aug 01")

**Medium (4×2):**

- Left: Large countdown number with "days remaining"
- Right: Horizontal progress bar showing day-of-month / days-in-month
- Labels: "Day 19 of 31" and "Next: Aug 01"

---

### Widget 4: Net Worth

| Property        | Value                                                     |
| --------------- | --------------------------------------------------------- |
| **Purpose**     | Display the user's all-time net worth (income − expenses) |
| **Data Source** | `getNetWorth(userId)` from `transactionQueries.ts`        |
| **Tap Action**  | `jmoney://` (opens dashboard)                             |
| **Sizes**       | Small, Medium                                             |

**Small (2×2):**

- Label: "Net Worth"
- Large formatted amount: "₹1,24,500"
- Color: green if positive, red if negative

**Medium (4×2):**

- Left: Net worth amount (large)
- Right column:
  - "This Month Income: ₹45,000"
  - "This Month Expense: ₹32,000"
- Subtle divider between sections

---

### Widget 5: Monthly Summary

| Property        | Value                                                         |
| --------------- | ------------------------------------------------------------- |
| **Purpose**     | Glanceable income vs. expense breakdown for the current month |
| **Data Source** | `getIncomeExpenseSummary()`                                   |
| **Tap Action**  | `jmoney://` (opens dashboard)                                 |
| **Sizes**       | Medium, Large                                                 |

**Medium (4×2):**

- Two columns side by side:
  - Income: ₹45,000 (green accent)
  - Expense: ₹32,000 (red accent)
- Bottom: "Balance: ₹13,000"

**Large (4×4):**

- Top: Income vs Expense with amounts
- Middle: Top 3 expense categories with amounts (from `getTransactionsByCategoryForExpense`)
- Bottom: Month-over-month comparison arrows (↑ or ↓ vs previous month)

---

### Widget 6: Budget Tracker

| Property        | Value                                     |
| --------------- | ----------------------------------------- |
| **Purpose**     | Show progress of top budgets              |
| **Data Source** | `budgets` table + transaction aggregation |
| **Tap Action**  | `jmoney://budgets`                        |
| **Sizes**       | Medium, Large                             |

**Medium (4×2):**

- Show top 2 budgets with name + horizontal progress bar + "₹spent / ₹total"

**Large (4×4):**

- Show top 4 budgets, each with name, progress bar, and amount spent/remaining

---

### Widget 7: Goals Progress

| Property        | Value                                            |
| --------------- | ------------------------------------------------ |
| **Purpose**     | Show progress toward savings goals               |
| **Data Source** | `goals` table (`current_amount` / `goal_amount`) |
| **Tap Action**  | `jmoney://goals`                                 |
| **Sizes**       | Small, Medium                                    |

**Small (2×2):**

- Top goal name
- Circular progress ring with percentage

**Medium (4×2):**

- Top 2 goals side by side, each with name + progress ring + amount

---

## Widget Sizes & Layouts

### Android Sizes (dp-based grid)

| Widget Size | Grid Cells | Min Width | Min Height |
| ----------- | ---------- | --------- | ---------- |
| Small       | 2 × 2      | 110dp     | 110dp      |
| Medium      | 4 × 2      | 250dp     | 110dp      |
| Large       | 4 × 4      | 250dp     | 250dp      |

### iOS Widget Families

| Family                 | Description           | Equivalent  |
| ---------------------- | --------------------- | ----------- |
| `systemSmall`          | 2×2 square            | Small       |
| `systemMedium`         | 4×2 wide rectangle    | Medium      |
| `systemLarge`          | 4×4 tall rectangle    | Large       |
| `accessoryCircular`    | Lock screen circular  | Lock Screen |
| `accessoryRectangular` | Lock screen rectangle | Lock Screen |

### Lock Screen Widgets (iOS only)

| Widget      | `accessoryCircular` | `accessoryRectangular`    |
| ----------- | ------------------- | ------------------------- |
| Daily Limit | Progress ring only  | Limit + spent + remaining |
| Pay Day     | Countdown number    | "12 days to pay day"      |
| Net Worth   | Amount only         | "Net Worth ₹1.2L"         |

---

## Data Architecture

### How Widgets Read Data

```
┌─────────────────────┐        ┌──────────────────────────┐
│   Jmoney App        │        │   Widget Process          │
│                     │        │                          │
│  src/db/database.ts │──────▶│  Same SQLite DB file      │
│  (expo-sqlite)      │  disk  │  (expo-sqlite read-only)  │
│                     │        │                          │
│  On data change:    │        │  widgetTaskHandler:       │
│  requestWidgetUpdate│───────▶│  WIDGET_UPDATE → re-query │
└─────────────────────┘        └──────────────────────────┘
```

### Key Queries for Widget Data

All queries already exist in the codebase. The widget task handler will call these directly:

| Widget          | Query Function                                                       | Source File                                                                                                                                                                                                    |
| --------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Daily Limit     | `getIncomeExpenseSummary()`, `getSpentToday()`                       | [reportQueries.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/db/reportQueries.ts), [transactionQueries.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/db/transactionQueries.ts) |
| Net Worth       | `getNetWorth()`                                                      | [transactionQueries.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/db/transactionQueries.ts)                                                                                                    |
| Pay Day         | `calculatePayDayInfo()`                                              | [dashboardService.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/services/dashboardService.ts)                                                                                                  |
| Monthly Summary | `getIncomeExpenseSummary()`, `getTransactionsByCategoryForExpense()` | [reportQueries.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/db/reportQueries.ts)                                                                                                              |
| Quick Add       | `getQuickTransactions()`                                             | [quickTransactionQueries.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/db/quickTransactionQueries.ts)                                                                                          |
| Budget Tracker  | Budget queries + transaction aggregation                             | [budgetQueries.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/db/budgetQueries.ts)                                                                                                              |
| Goals           | Direct table read                                                    | [metaQueries.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/db/metaQueries.ts)                                                                                                                  |

### Triggering Widget Updates

After any data-mutating operation in the app, call `requestWidgetUpdate()`:

- After saving a transaction (`app/add-transaction.tsx`)
- After quick transaction execution
- After sync completion (`useDashboardSync.ts`)
- After budget/goal CRUD operations
- After database reset (`resetAppData`)

### User ID Storage

Widgets need the current `userId` to query user-scoped data. Since widgets cannot access React contexts:

- Store `userId` in **AsyncStorage** (key: `widget_user_id`) on successful login
- Clear it on sign-out
- Widget task handler reads `userId` from AsyncStorage before querying

---

## Unauthenticated (Logged Out) Behavior

> [!IMPORTANT]
> When the user is not logged in (no `userId` in AsyncStorage), **all widgets must show a friendly placeholder state** instead of empty/broken data.

### Behavior Matrix

| Widget          | Logged-Out Display                        | Tap Action             |
| --------------- | ----------------------------------------- | ---------------------- |
| Quick Add       | "Sign in to add transactions" + lock icon | Opens app login screen |
| Daily Limit     | "Sign in to view" + empty progress ring   | Opens app login screen |
| Pay Day         | Static calendar icon + "Sign in"          | Opens app login screen |
| Net Worth       | "– – –" placeholder + "Sign in"           | Opens app login screen |
| Monthly Summary | "Sign in to view your summary"            | Opens app login screen |
| Budget Tracker  | "Sign in to track budgets"                | Opens app login screen |
| Goals Progress  | "Sign in to view goals"                   | Opens app login screen |

### Design Guidelines for Logged-Out State

- Use a **muted/greyed-out** color palette
- Show the Jmoney app icon prominently
- Display a single-line message: "Sign in to Jmoney"
- Entire widget area is tappable → deep links to `jmoney://` which opens the auth screen
- No sensitive data is ever shown or cached in the widget when logged out

---

## Implementation Phases

### Phase 1: Foundation & Quick Add Widget

**Estimated effort: 2–3 days**

1. Install `react-native-android-widget`
2. Configure `app.json` with widget plugin config
3. Create `src/widgets/` directory structure:
   - `src/widgets/taskHandler.ts` — Android widget task handler
   - `src/widgets/utils/widgetData.ts` — Shared data fetching utilities
   - `src/widgets/components/` — Widget UI components
4. Implement **Quick Add** widget (small + medium)
5. Wire deep link handling for `jmoney://add-transaction`
6. Add `requestWidgetUpdate()` calls after transaction saves
7. Implement logged-out placeholder state

### Phase 2: Daily Limit + Pay Day + Net Worth

**Estimated effort: 3–4 days**

1. Implement **Daily Limit** widget (small + medium + large)
2. Implement **Pay Day Countdown** widget (small + medium)
3. Implement **Net Worth** widget (small + medium)
4. Add periodic widget refresh (Android `updatePeriodMillis`)
5. Add `requestWidgetUpdate()` calls after sync completion

### Phase 3: Monthly Summary + Budget + Goals

**Estimated effort: 3–4 days**

1. Implement **Monthly Summary** widget (medium + large)
2. Implement **Budget Tracker** widget (medium + large)
3. Implement **Goals Progress** widget (small + medium)
4. Polish all widget layouts for dark/light theme support

### Phase 4: iOS Widgets

**Estimated effort: 4–5 days**

1. Install `expo-widgets`
2. Configure `app.json` with iOS widget families
3. Port all 7 widgets to iOS using Expo UI components
4. Implement Lock Screen widgets (Daily Limit, Pay Day, Net Worth)
5. Configure App Groups for shared data access (handled by CNG)

### Phase 5: Polish & Testing

**Estimated effort: 2–3 days**

1. Test across multiple device sizes and Android versions (12+)
2. Handle edge cases (no data, first-time user, database not yet initialized)
3. Test logged-out → logged-in state transitions
4. Add widget preview images for Android widget picker
5. Update AI_CONTEXT.md and ai_context.json

---

## Verification Plan

### Development Builds

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

### Manual Testing Checklist

- [ ] Each widget appears in the device widget picker with correct preview
- [ ] Small, medium, and large sizes render correctly
- [ ] Data displays correctly after login
- [ ] Tapping a widget navigates to the correct screen via deep link
- [ ] Adding a transaction updates all relevant widgets
- [ ] Sync completion updates all widgets
- [ ] Logging out transitions all widgets to placeholder state
- [ ] Logging back in restores widget data
- [ ] Widgets survive device restart
- [ ] Dark mode / light mode are handled correctly
- [ ] Lock screen widgets (iOS) display correctly

---

## File Structure

```
src/widgets/
├── taskHandler.ts              # Android widget task handler (registerWidgetTaskHandler)
├── utils/
│   ├── widgetData.ts           # Shared data fetching for all widgets
│   └── widgetAuth.ts           # userId read/write helpers for widget context
├── components/
│   ├── QuickAddWidget.tsx      # Quick Add widget layouts
│   ├── DailyLimitWidget.tsx    # Daily Limit widget layouts
│   ├── PayDayWidget.tsx        # Pay Day Countdown widget layouts
│   ├── NetWorthWidget.tsx      # Net Worth widget layouts
│   ├── MonthlySummaryWidget.tsx# Monthly Summary widget layouts
│   ├── BudgetTrackerWidget.tsx # Budget Tracker widget layouts
│   ├── GoalsWidget.tsx         # Goals Progress widget layouts
│   └── LoggedOutWidget.tsx     # Shared logged-out placeholder component
└── styles/
    └── widgetStyles.ts         # Shared widget styling constants
```
