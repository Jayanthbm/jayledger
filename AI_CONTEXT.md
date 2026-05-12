# AI Context

## Project Overview

- Jmoney is a personal finance mobile app for tracking income, expenses, budgets, goals, payees, categories, quick transactions, dashboards, calendars, and reports.
- It is an offline-capable Expo React Native app using local SQLite storage with Supabase authentication and synchronization.

## Tech Stack

- TypeScript, React 19, React Native 0.81, Expo 54
- React Navigation native stack, bottom tabs, and material top tabs
- Expo SQLite for local persistence
- Supabase JS for authentication and remote sync
- AsyncStorage, Expo Local Authentication, Expo Location, Expo Notifications
- Jest, ts-jest, React Native Testing Library, ESLint, Prettier, Husky

## Architecture Overview

- `src/screens`: Top-level app screens for dashboard, transactions, budgets, goals, reports, settings, auth, and setup flows.
- `src/components`: Reusable UI components grouped by feature area plus common shared UI.
- `src/navigation`: Stack/tab navigation definitions and typed route params.
- `src/store`: React contexts for auth, theme, and toast state.
- `src/db`: SQLite database initialization plus query modules for entities and reports.
- `src/services`: Business/data services and Supabase sync orchestration.
- `src/hooks`: Screen-level and feature-level data/loading/sync hooks.
- `src/models`: Shared TypeScript interfaces and app data shapes.
- `src/utils`: Formatting, validation, date, mapping, timestamp, and logging helpers.
- `src/styles`: Shared style primitives for layout, spacing, typography, cards, and common UI.
- `src/constants`: Shared table names, sync values, and constants.
- `__tests__`: Jest tests for queries, services, components, and utilities.
- `__mocks__`: Test mocks, including Expo SQLite.
- `assets`: Expo app icons and splash/favicon assets.
- `android`: Generated/native Android project used by Expo prebuild and native builds.

## Key Entry Points

- `index.ts`: Registers the root Expo component.
- `App.tsx`: Initializes SQLite, handles biometric lock, and mounts providers plus navigation.
- `src/navigation/AppNavigator.tsx`: Auth-aware root stack navigator and modal/report routes.
- `src/navigation/MainTabs.tsx`: Main authenticated bottom-tab navigation.
- `src/db/database.ts`: Opens SQLite database, creates tables, runs migrations, and creates indexes.
- `src/services/supabase.ts`: Creates the Supabase client and configures persisted auth sessions.
- `src/services/syncService.ts`: Coordinates full sync and entity-level push/pull operations.

## Important Files

- `package.json`: Scripts, dependencies, Jest config, and lint-staged setup.
- `app.json`: Expo app metadata, native package IDs, plugins, EAS project, and updates config.
- `tsconfig.json`: Strict TypeScript configuration based on Expo defaults.
- `eslint.config.js`: ESLint flat config for TypeScript, React, React Native, hooks, and unused imports.
- `babel.config.js`: Expo Babel configuration.
- `jest-setup.ts`: Jest environment setup.
- `src/models/types.ts`: Core entity interfaces for transactions, budgets, goals, categories, payees, reports, and themes.
- `src/store/AuthContext.tsx`: Supabase session state and sign-in/sign-out behavior.
- `src/store/ThemeContext.tsx`: Light/dark theme colors persisted in AsyncStorage.
- `src/store/ToastContext.tsx`: Global toast state.
- `src/db/queries.ts`: Shared SQLite query helpers for categories, payees, stats, and related data.
- `src/db/transactionQueries.ts`: Transaction CRUD, date lookups, net worth, and sync-status helpers.
- `src/db/reportQueries.ts`: Report data aggregation queries.
- `src/db/budgetQueries.ts`: Budget-specific SQLite queries.
- `src/services/transactionService.ts`: Transaction list fetching, filtering, stats, and list mapping.
- `src/services/dashboardService.ts`: Dashboard metrics and calculations.
- `src/services/reportService.ts`: Report data service layer.
- `src/services/sync/baseSync.ts`: Shared sync/network helpers.
- `src/services/sync/transactionSync.ts`: Transaction Supabase push/pull sync.
- `src/hooks/useDashboardData.ts`: Loads dashboard metrics for the current user.
- `src/hooks/useDashboardSync.ts`: Dashboard sync state and initial/manual sync behavior.
- `src/navigation/navigationTypes.ts`: Typed route names and params.

## Agent Working Rules

- AI agents MUST follow these rules:
  - Do NOT scan entire codebase unless required
  - Prefer using listed important files
  - Make minimal, targeted changes
  - Follow existing patterns and conventions
  - Preserve offline-first SQLite behavior when changing data flows
  - Keep Supabase sync status and soft-delete fields consistent
  - Use existing hooks/services before adding new screen-level data logic
  - Use shared styles from `src/styles` and theme colors from `ThemeContext`
  - Update navigation types when adding or changing routes
  - Add or update focused Jest tests for query, service, or utility changes

## Common Tasks Guide

- Add or modify a screen: edit `src/screens`, wire routes in `src/navigation/AppNavigator.tsx` or `src/navigation/MainTabs.tsx`, and update `src/navigation/navigationTypes.ts`.
- Add reusable UI: place feature components under `src/components/<feature>` or shared primitives under `src/components/common`.
- Change transaction behavior: start with `src/services/transactionService.ts`, `src/db/transactionQueries.ts`, `src/hooks/useTransactions.ts`, and transaction screens/components.
- Change dashboard behavior: use `src/services/dashboardService.ts`, `src/hooks/useDashboardData.ts`, `src/hooks/useDashboardSync.ts`, and dashboard components.
- Change reports: use `src/db/reportQueries.ts`, `src/services/reportService.ts`, `src/hooks/useReports.ts`, and `src/screens/reports`.
- Change local schema: update `src/db/database.ts`, related query modules, `src/models/types.ts`, and SQLite tests.
- Change sync behavior: update `src/services/syncService.ts` and the relevant file in `src/services/sync`.
- Change authentication: update `src/store/AuthContext.tsx`, `src/services/supabase.ts`, and `src/screens/LoginScreen.tsx`.
- Change app theme/styles: use `src/store/ThemeContext.tsx` and shared files in `src/styles`.
- Run validation: use `npm test` for Jest tests and `npm run lint` for linting.

## Ignore These Paths

- `node_modules`
- `.git`
- `.expo`
- `android`
- `ios`
- `build`
- `dist`
- `coverage`
- `logs`
- `*.log`
- `assets`
- `package-lock.json`

## Notes

- Local SQLite is the source of offline app data; Supabase is used for auth and remote synchronization.
- `transactions`, `budgets`, and `goals` use soft-delete columns; sync code depends on `sync_status`.
- App boot waits for `initDB()` before rendering navigation.
- The root navigator shows `LoginScreen` when no Supabase session exists and authenticated stacks otherwise.
- Query code mixes parameterized SQL and constructed SQL; preserve existing behavior but prefer parameterized queries for new code.
