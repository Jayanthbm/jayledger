# Jmoney – Improvements & New Functionalities

> A roadmap of UI/UX improvements, performance optimizations, and new features to enhance the Jmoney personal finance app.

---

## Table of Contents

1. [UI/UX Improvements](#uiux-improvements)
2. [Performance & Architecture Improvements](#performance--architecture-improvements)
3. [New Functionalities](#new-functionalities)
4. [Planned Items (In Progress)](#planned-items-in-progress)

---

## UI/UX Improvements

### 1. Native Tabs Migration

**📄 Plan:** [NATIVE_TABS_MIGRATION.md](./NATIVE_TABS_MIGRATION.md)

Replace the current JavaScript-based bottom tabs (`@react-navigation/bottom-tabs`) with Expo Router's `NativeTabs` (`expo-router/unstable-native-tabs`).

**What improves:**

- **iOS**: Native `UITabBarController` with blur effects, iOS 26 liquid glass styling, and smooth native transitions between tabs — no more JS-rendered tab bar
- **Android**: Material You `BottomNavigationView` with ripple effects, active indicators, and Material 3 theming that automatically adapts to the device's dynamic color palette
- **Performance**: Tab bar rendering moves from the JS thread to the native UI thread, eliminating jank during tab switches
- **Platform icons**: SF Symbols on iOS and Material Symbols on Android instead of bundled icon fonts — smaller bundle size and pixel-perfect platform-native icons

---

### 2. Home Screen & Lock Screen Widgets

**📄 Plan:** [WIDGETS_PLAN.md](./WIDGETS_PLAN.md)

Add 7 glanceable widgets: Quick Add, Daily Limit, Pay Day Countdown, Net Worth, Monthly Summary, Budget Tracker, and Goals Progress.

**What improves:**

- **Glanceable data**: Users see their daily spending limit, net worth, and budget status without opening the app
- **Quick actions**: One-tap "Add Transaction" from the home screen reduces friction for the most common action
- **Engagement**: Lock screen widgets (iOS) keep financial awareness always visible
- **Quick Transaction shortcuts**: Medium Quick Add widget shows top presets for instant one-tap expense logging

---

### 3. Onboarding Flow

Currently, new users land directly on the dashboard after login with no guidance.

**What improves:**

- **First-time setup wizard**: Walk users through setting up their first categories, payees, monthly income, and daily limit — reducing the "empty state" confusion
- **Feature discovery**: Highlight key features (quick transactions, budgets, calendar view) through an interactive tour
- **Data import**: Option to import existing transaction data from CSV or other finance apps during onboarding
- **Reduced drop-off**: Users who set up at least one budget or category in onboarding are more likely to continue using the app

---

### 4. Improved Transaction Entry UX

The current add-transaction modal is functional but could be more efficient.

**What improves:**

- **Smart suggestions**: Auto-suggest category and payee based on description text (e.g., typing "Swiggy" auto-selects "Food" category and "Swiggy" payee)
- **Recent/frequent payees**: Show most-used payees and categories at the top of selection lists instead of alphabetical order
- **Amount calculator**: Built-in mini calculator for quick math (e.g., splitting a bill: "1200/3")
- **Voice input**: Use device speech-to-text to dictate transaction details hands-free
- **Receipt scanning**: OCR-based receipt capture to auto-fill amount, date, and merchant

---

### 5. Enhanced Dashboard Cards

The dashboard currently shows static summary cards.

**What improves:**

- **Animated number transitions**: Smooth count-up animations when values change, giving a premium feel
- **Spending trend mini-charts**: Inline sparkline charts on the monthly and yearly summary cards showing the trend over time
- **Color-coded spending alerts**: Cards turn amber/red when spending approaches or exceeds budgets, providing instant visual feedback
- **Swipeable cards**: Allow users to swipe cards to reveal quick actions (e.g., swipe the budget card to jump to budget details)

---

### 6. Dark/Light Theme Transitions

Currently, the theme switches instantly without any transition.

**What improves:**

- **Smooth crossfade animation**: A 300ms fade or circular reveal animation when toggling between light and dark mode
- **System theme auto-follow**: Option to automatically match the device's system appearance setting
- **Scheduled themes**: Auto-switch to dark mode at sunset and light mode at sunrise based on device location

---

### 7. Empty State Illustrations

Screens like Goals, Budgets, and Transactions show plain text when empty.

**What improves:**

- **Custom illustrations**: Friendly, on-brand illustrations for empty states (e.g., a piggy bank for empty Goals, a receipt for empty Transactions)
- **Actionable CTAs**: "Create your first budget" button directly in the empty state instead of relying on the FAB
- **Motivation**: Empty states feel encouraging rather than barren, improving the onboarding experience

---

## Performance & Architecture Improvements

### 8. Offline Sync Queue with Conflict Resolution

Current sync is basic push/pull on manual trigger or app focus.

**What improves:**

- **Background sync**: Queue changes while offline and sync automatically when connectivity returns, using `expo-background-task`
- **Conflict resolution UI**: When the same transaction is edited on two devices, show a visual diff and let the user choose which version to keep
- **Sync status indicators**: Per-item sync badges (✓ synced, ↑ pending upload, ⚠ conflict) on transaction cards
- **Retry with exponential backoff**: Failed syncs retry automatically instead of silently failing

---

### 9. Database Performance Optimization

SQLite queries run synchronously on the JS thread in some cases.

**What improves:**

- **Indexed queries**: Add composite indexes for the most frequent query patterns (e.g., `user_id + date` for transaction lookups)
- **Pagination**: Implement cursor-based pagination for the transactions list instead of loading all records
- **Query batching**: Combine multiple sequential queries into single transactions for dashboard metrics
- **WAL mode**: Enable SQLite WAL (Write-Ahead Logging) for better concurrent read/write performance

---

### 10. Error Boundary & Crash Recovery

Currently, an unhandled error in one screen can crash the entire app.

**What improves:**

- **Screen-level error boundaries**: Each tab catches its own errors and shows a "Something went wrong" fallback with a retry button — other tabs remain functional
- **Crash analytics**: Integration with a service like Sentry or Expo's built-in error reporting for production crash visibility
- **Data recovery**: Automatic database integrity checks on app start, with the ability to repair or rebuild corrupted tables

---

### 11. App Size Optimization

The app bundles multiple icon font families and unused assets.

**What improves:**

- **Tree-shaken icons**: With NativeTabs using platform-native SF Symbols and Material Symbols, `@expo/vector-icons/MaterialCommunityIcons` can be removed from the tabs — reducing bundle size
- **Image optimization**: Compress and resize any bundled assets using `expo-asset` optimization
- **Code splitting**: Lazy-load report sub-screens that most users rarely visit

---

## New Functionalities

### 12. Recurring Transactions

Users manually add the same transactions (rent, subscriptions, salary) every month.

**What it adds:**

- **Auto-creation**: Define recurring rules (daily, weekly, monthly, yearly) that automatically create transactions on schedule
- **Notification**: Get notified before a recurring transaction is due, with the option to skip or modify
- **Management screen**: View, pause, or delete recurring rules from a dedicated section in Settings
- **Smart detection**: Suggest making a transaction recurring when the app detects a repeating pattern (same payee + similar amount + monthly interval)

---

### 13. Multi-Currency Support

The app currently assumes a single currency (₹).

**What it adds:**

- **Per-transaction currency**: Assign a currency to each transaction (USD, EUR, GBP, INR, etc.)
- **Exchange rate conversion**: Auto-fetch exchange rates and show all totals in the user's base currency
- **Travel mode**: Quick-switch default currency when traveling abroad
- **Currency breakdown**: Dashboard and reports show spending broken down by currency

---

### 14. Export & Data Sharing

Users have no way to export their financial data.

**What it adds:**

- **CSV export**: Export all transactions, budgets, and categories as CSV for use in spreadsheets
- **PDF reports**: Generate printable PDF summaries of monthly/yearly reports with charts
- **Share reports**: Share a report summary as an image or PDF directly from the reports screen
- **Data backup/restore**: Manual JSON backup to device storage or cloud (Google Drive/iCloud) as an alternative to Supabase sync

---

### 15. Budget Alerts & Notifications

Budgets currently show progress but don't proactively alert the user.

**What it adds:**

- **Threshold alerts**: Push notification when spending reaches 75%, 90%, or 100% of a budget
- **Weekly budget digest**: Optional weekly summary notification showing budget status across all active budgets
- **Overspend warning**: Real-time warning when adding a transaction that would exceed a budget, with the option to proceed or cancel
- **Custom thresholds**: Users configure their own alert percentages per budget

---

### 16. Transaction Tags & Notes

Transactions have a single description field with no structured metadata.

**What it adds:**

- **Tags**: Add multiple hashtags to a transaction (e.g., #trip #food #work) for flexible cross-cutting categorization
- **Notes**: A longer free-text notes field separate from the description, for receipts, context, or reminders
- **Tag-based filtering**: Filter the transaction list by tag, complementing existing category and payee filters
- **Tag analytics**: Reports showing spending by tag (e.g., "How much did my Goa trip cost across all categories?")

---

### 17. Financial Insights & Trends

The app shows raw data but doesn't provide actionable insights.

**What it adds:**

- **Spending anomaly detection**: "You spent 40% more on Food this month compared to your average" — highlighted on the dashboard
- **Savings rate tracking**: Monthly savings rate (income - expenses) / income as a percentage, with trend over time
- **Predictive forecasting**: "At your current pace, you'll spend ₹45,000 by month end" based on daily spending patterns
- **Category comparison**: Month-over-month comparison charts for each category showing whether spending is trending up or down

---

### 18. Location-Based Transaction Tagging

The app already captures `latitude` and `longitude` fields on transactions but doesn't use them visually.

**What it adds:**

- **Map view**: Visualize all transactions on an interactive map, clustered by location
- **Auto-payee detection**: Suggest a payee based on the user's current GPS location (e.g., at a Starbucks → suggest "Starbucks" payee)
- **Location-based reports**: "Spending near Home" vs. "Spending near Work" breakdowns
- **Geofenced reminders**: "You're near [Payee] — want to add a transaction?"

---

### 19. Shared Expenses / Split Bills

No support for tracking shared expenses with others.

**What it adds:**

- **Split transaction**: Split a transaction amount between multiple people (equal or custom splits)
- **Debt tracking**: Track who owes you and whom you owe, with a simple settlements dashboard
- **Share via link**: Send a split request to contacts via WhatsApp/SMS with a deep link to the transaction
- **Settle up**: Mark debts as settled and auto-create a corresponding income/expense transaction

---

### 20. Attachments & Receipt Storage

Transactions have no way to store supporting documents.

**What it adds:**

- **Photo attachments**: Attach receipt photos or screenshots to any transaction
- **Document storage**: Store warranty cards, invoices, or contracts linked to specific transactions
- **Cloud backup**: Attachments sync to Supabase storage alongside transaction data
- **Quick capture**: Camera shortcut in the add-transaction screen to snap a receipt instantly

---

### 21. Custom Dashboard Layout

All users see the same fixed dashboard card arrangement.

**What it adds:**

- **Drag-and-drop reordering**: Users can rearrange dashboard cards to prioritize what matters most to them
- **Show/hide cards**: Toggle visibility of individual cards (e.g., hide Net Worth if not relevant)
- **Card size options**: Choose between compact and expanded views for each card
- **Persist layout**: Dashboard layout preferences saved per user and synced across devices

---

### 22. Apple Watch / WearOS Companion

No wearable support currently.

**What it adds:**

- **Glanceable summary**: Quick view of daily limit remaining and today's spending on the watch face
- **Quick add from wrist**: Pre-defined quick transaction buttons on the watch for common expenses
- **Complication support**: Watch face complications showing net worth or daily spending
- **Haptic alerts**: Vibrate the watch when a budget threshold is crossed

---

## Planned Items (In Progress)

| #   | Item                  | Plan Document                                          | Status     |
| --- | --------------------- | ------------------------------------------------------ | ---------- |
| 1   | Native Tabs Migration | [NATIVE_TABS_MIGRATION.md](./NATIVE_TABS_MIGRATION.md) | 📋 Planned |
| 2   | Home Screen Widgets   | [WIDGETS_PLAN.md](./WIDGETS_PLAN.md)                   | 📋 Planned |

---

## Priority Recommendation

### Quick Wins (1–2 days each)

- Empty State Illustrations (#7)
- Dark/Light Theme Transitions (#6)
- Enhanced Dashboard Cards (#5)

### Medium Effort, High Impact (3–7 days each)

- **Native Tabs Migration (#1)** — already planned
- **Home Screen Widgets (#2)** — already planned
- Budget Alerts & Notifications (#15)
- Recurring Transactions (#12)
- Export & Data Sharing (#14)

### Larger Features (1–3 weeks each)

- Transaction Tags & Notes (#16)
- Financial Insights & Trends (#17)
- Improved Transaction Entry UX (#4)
- Onboarding Flow (#3)

### Long-Term / Ambitious

- Multi-Currency Support (#13)
- Location-Based Transaction Tagging (#18)
- Shared Expenses / Split Bills (#19)
- Apple Watch / WearOS Companion (#22)
