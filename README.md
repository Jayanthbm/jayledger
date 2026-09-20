# JMoney (JayLedger)

A modern, high-performance personal finance and expense tracker built with **React Native**, **Expo (SDK 58)**, **TypeScript**, **Expo SQLite**, and **Supabase**. Designed with native iOS (SwiftUI) and Android (Jetpack Compose / Material 3) integrations, offline-first architecture, and biometric security.

---

## Key Features

### 1. Dashboard & Financial Overview

- **Real-Time Net Worth**: Aggregates total balance, income vs. expense, and current monthly trajectory.
- **Pay Day & Runway Countdown**: Displays days remaining to next payday and daily spending limit to stay within budget.
- **Top Categories Breakdown**: Visual breakdown of your highest spending categories with custom icons and color highlights.
- **Inline Card Loading**: Zero layout shift and instant screen mount with card-level loading indicators.
- **Quick Action Trigger**: Direct FAB for instant transaction entries.

### 2. Transactions & Smart Management

- **High-Performance List**: Built using `@shopify/flash-list` with sticky date headers for 60fps scrolling across thousands of records.
- **Advanced Multi-Filter Toolbar**:
  - **Date Picker Filter**: Native iOS compact popup and Android Material calendar dialog with quick presets (Today, This Week, This Month, This Year).
  - **Category, Payee & Group Multi-Selection**: Filter by multiple categories, vendors/payees, or custom transaction groups.
  - **Live Filter Summary**: Filter badge indicators, total filtered sum chip with detailed statistical breakdown modal, and quick clear.
- **Quick Transactions**: Template-based one-tap transaction logging for recurring daily expenses.
- **Location Tagging**: Optional GPS coordinate capture with reverse geocoding on transaction entry.

### 3. Budgets & Spending Limits

- **Category & Group Budgets**: Set spending thresholds per category or group.
- **Visual Budget Progress**: Dynamic progress indicators showing remaining budget and overspending alerts.
- **Daily Spending Limit Tracker**: Automated calculation based on target runway and days until next payday.

### 4. Financial Reports & Analytics

- **Visual Trends & Charts**: Monthly/weekly cash flow comparison, category distribution, and payee breakdowns.
- **Calendar View**: Day-by-day financial calendar showing daily spend totals and clickable date transaction details.
- **Export & Backup**: Export transaction history to CSV/JSON format.

### 5. Management Modules

- **Categories**: Custom income and expense categories with color pickers and icon selection.
- **Payees / Merchants**: Track spending per payee with custom logos and merchant history.
- **Transaction Groups**: Organize expenses into trips, projects, events, or shared splits.
- **Savings Goals**: Target tracking with progress percentages and timeline milestones.

### 6. Architecture & Platform Integrations

- **Offline-First Storage**: Local database powered by `expo-sqlite` with composite indexes for lightning-fast queries without network latency.
- **Biometric App Lock**: Secure app authentication via Face ID, Touch ID, or Android Biometric Prompt (`expo-local-authentication`).
- **Cloud Sync**: Two-way synchronization with Supabase backend (`@supabase/supabase-js`), conflict resolution, and offline queueing.
- **Native OS Elements**:
  - Native iOS SwiftUI `ProgressView` and Android Compose `LoadingIndicator` via `@expo/ui`.
  - Native iOS keyboard accessory toolbar with SwiftUI blur glass effect.
  - Native iOS and Android Material date/time pickers.
- **Dark & Light Mode**: Complete theme customization matching system preferences or manual user selection.

---

## Tech Stack

| Technology               | Purpose                                                    |
| ------------------------ | ---------------------------------------------------------- |
| **React Native (0.83+)** | Core mobile application framework                          |
| **Expo (SDK 58)**        | Managed workflow, native modules & prebuild capabilities   |
| **Expo Router**          | File-based typed routing (`app/` directory)                |
| **TypeScript**           | Strict end-to-end type safety                              |
| **Expo SQLite**          | Local relational offline-first storage                     |
| **Supabase**             | Cloud authentication, remote database, and real-time sync  |
| **@shopify/flash-list**  | High-performance virtualized list rendering                |
| **@expo/ui**             | Native SwiftUI (iOS) and Jetpack Compose (Android) bridges |
| **date-fns**             | Modular date arithmetic and formatting                     |

---

## Project Structure

```
├── app/                           # Expo Router file-based screens
│   ├── (auth)/                    # Authentication routes (Login, Signup, Forgot Password)
│   ├── (tabs)/                    # Main bottom-tab navigation
│   │   ├── dashboard/             # Dashboard screen & summary widgets
│   │   ├── transactions/          # Transaction history, search & filter sheets
│   │   ├── budgets/               # Budget overview & limits
│   │   ├── reports/               # Graphs, charts & calendar analytics
│   │   └── settings/              # App settings, theme, biometrics, sync
│   ├── add-transaction.tsx        # Add / Edit transaction modal form
│   ├── add-quick-transaction.tsx  # Quick transaction creation
│   ├── calendar-view.tsx          # Day-by-day calendar view
│   ├── categories.tsx             # Category management
│   ├── payees.tsx                 # Payee & merchant management
│   ├── groups.tsx                 # Transaction groups
│   ├── goals.tsx                  # Savings goals tracker
│   └── _layout.tsx                # Root layout & providers
├── src/
│   ├── components/                # Reusable UI & platform-specific components
│   │   ├── common/                # Native loaders, buttons, bottom sheets, pickers
│   │   ├── dashboard/             # Dashboard card widgets
│   │   ├── transactions/          # Transaction cards, filter modals, section headers
│   │   └── reports/               # Chart components & report filters
│   ├── db/                        # SQLite schemas, migrations & query helpers
│   ├── hooks/                     # Custom React hooks (sync, filters, theme)
│   ├── models/                    # TypeScript interfaces & types
│   ├── services/                  # Supabase sync, geolocation, auth services
│   ├── store/                     # Context providers (Auth, Theme, Toast)
│   └── styles/                    # Common themes, colors, and layout utilities
├── assets/                        # App icons, splash screens, and images
├── app.json                       # Expo application configuration
└── package.json                   # Dependencies and npm scripts
```

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Xcode (for iOS simulator/device testing on macOS)
- Android Studio with Android SDK / Emulator

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Jayanthbm/jayledger.git
   cd jayledger
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Running Locally

- **Start Metro bundler**:

  ```bash
  npm start
  ```

- **Run on iOS Simulator**:

  ```bash
  npm run ios
  ```

- **Run on Android Device / Emulator**:
  ```bash
  npm run android
  ```

### Code Quality & Tests

- **Typecheck**:

  ```bash
  npx tsc --noEmit
  ```

- **Lint & Format**:

  ```bash
  npm run lint
  npm run format
  ```

- **Run Tests**:
  ```bash
  npm test
  ```

---

## License

This project is licensed under the MIT License.
