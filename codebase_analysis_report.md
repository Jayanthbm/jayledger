# JayLedger Codebase Analysis & Improvement Plan

This report provides a thorough analysis of the JayLedger React Native project, identifying areas for architectural improvement, code quality enhancements, and a roadmap for testing.

---

## 1. Modularization Opportunities

### Repeated UI Patterns

- **Financial List Items**: `src/components/transactions/TransactionCard.tsx` and [src/components/reports/ReportListItem.tsx](file:///Users/jayanthbharadwajm/development/jayledger/src/components/reports/ReportListItem.tsx) share similar layouts (Icon + Name + Amount + Category/Trend).
  - **Module Type**: Component (`FinancialListItem`)
- **Action Modals**: Common patterns in [GoalDeleteModal.tsx](file:///Users/jayanthbharadwajm/development/jayledger/src/components/goals/GoalDeleteModal.tsx), `TransactionDeleteModal.tsx`, and `ReportSortPicker.tsx`.
  - **Module Type**: Component (`ActionModal`) / Hook (`useModal`)

### Reusable Logic (Hooks)

- **Data Filtering & Sorting**: Logic in [ReportView.tsx](file:///Users/jayanthbharadwajm/development/jayledger/src/screens/ReportView.tsx) and [TransactionsScreen.tsx](file:///Users/jayanthbharadwajm/development/jayledger/src/screens/TransactionsScreen.tsx) for searching, sorting, and filtering data.
  - **Module Type**: Hook (`useDataFilters`)
- **Entity Data Fetching**: Data loading logic repeated across screens.
  - **Module Type**: Hook (`useTransactions`, `useBudgets`, `useGoals`)
- **Sync State Tracking**: Managing sync progress and statuses.
  - **Module Type**: Hook (`useSyncStatus`)

### Style Centralization

- **Common Layout Tokens**: [src/styles/common.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/styles/common.ts) is currently very large and contains a mix of layout, typography, and specific component styles.
  - **Module Type**: Theme (Split into `typography.ts`, `spacing.ts`, `layout.ts`)
- **Color Palette**: Hardcoded RGBA values (e.g., in [syncService.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/services/syncService.ts)) should be moved to theme constants.
  - **Module Type**: Theme (`colors.ts`)

### Large Component Splitting

- **ReportView.tsx**: Handles selectors, summary, list, and multiple modals.
  - **Action**: Extract sub-components for specific report sections (already partially started with `ReportSelectors`, etc.).
- **TransactionCard.tsx**: Contains complex conditional rendering for various transaction types.
  - **Action**: Split into `TransactionItemHeader`, `TransactionItemFooter`, etc.

### Business Logic Decoupling

- **Sync Architecture**: [syncService.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/services/syncService.ts) handles logic for all entities (Transactions, Goals, Budgets, etc.).
  - **Module Type**: Service (Split into `TransactionSyncService.ts`, `GoalSyncService.ts`, etc.)
- **Query Aggregations**: [queries.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/db/queries.ts) contains raw SQL for reports mixed with simple CRUD.
  - **Module Type**: Service (Move complex aggregations to specific entity services)

---

## 2. Code Quality Analysis

### Readability & Naming (Medium Severity)

- **Issue**: Large files like [syncService.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/services/syncService.ts) (15KB+) and [queries.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/db/queries.ts) (16KB+) hinder readability.
- **Issue**: Inconsistent primary key naming in sync logic (`tid` vs `id`).

### File & Folder Structure (Low Severity)

- **Issue**: Complete absence of a `hooks/` directory despite many opportunities for custom hooks.
- **Issue**: Flat structure in some component folders while others are nested.

### Separation of Concerns (High Severity)

- **Issue**: Services like [syncService.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/services/syncService.ts) handle network state, local DB operations, and Supabase interaction in single functions.
- **Issue**: UI components in [ReportView.tsx](file:///Users/jayanthbharadwajm/development/jayledger/src/screens/ReportView.tsx) handle complex date manipulation and string formatting.

### Reusability (Medium Severity)

- **Issue**: `toLocaleString()` for currency formatting and `date-fns` formatting are applied ad-hoc in many files.
- **Issue**: Progress bar logic was repeated 8+ times (now fixed, but serves as a pattern warning).

### Performance (Medium Severity)

- **Issue**: Frequent use of `withTransactionAsync` with simple loops might cause lock contention on large data sets.
- **Issue**: Potential for unnecessary re-renders in large lists if `keyExtractor` or dependencies aren't optimized.

### Error Handling (High Severity)

- **Issue**: SQL queries in [queries.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/db/queries.ts) often lack error boundaries or robust fallback mechanisms.
- **Issue**: Sync failures don't seem to have a retry mechanism or clear user feedback beyond simple console logs.

---

## 3. Improvement Plan

### Phase 1: High Impact / Low Effort (Structural Foundation)

1. **Utility Centralization**: Create `src/utils/formatters.ts` to centralize currency and date formatting.
2. **Style Decomposition**: Break down [src/styles/common.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/styles/common.ts) into specific design tokens (Spacing, Typography, Shadow).
3. **Constants Extraction**: Move hardcoded strings (URLs, Table names, Sync keys) to `src/constants/`.

### Phase 2: High Impact / Medium Effort (Service Refactor)

1. **Sync Modularization**: Split [syncService.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/services/syncService.ts) into entity-specific sync modules.
2. **Data Hooks**: Implement `useReportData` and `useTransactionData` to pull logic out of screen components.
3. **Error Boundary Implementation**: Add robust error handling to [queries.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/db/queries.ts) and a global error handling strategy for services.

### Phase 3: UI Consistency & Performance

1. **Generic List Components**: Create a unified list item pattern for financial data.
2. **Modal Abstraction**: Standardize modal interactions and state management.
3. **List Optimization**: Evaluate performance of large lists and implement `FlashList` if necessary.

---

## 4. Testing Plan

### Strategy Overview

JayLedger requires a multi-layered testing strategy, prioritizing business-critical logic (Sync & Database) before moving to UI verification.

### Testing Layers

1. **Unit Tests (High Priority)**:
   - **Services**: Sync logic, interest/limit calculations.
   - **Utils**: Formatting, date arithmetic.
   - **Tooling**: Jest.
2. **Integration Tests (Medium Priority)**:
   - **Database**: Verify SQL queries in [queries.ts](file:///Users/jayanthbharadwajm/development/jayledger/src/db/queries.ts) behave correctly with edge cases (nulls, empty sets).
   - **Sync**: Verify the push/pull cycle between SQLite and Supabase mock.
3. **UI/End-to-End Tests (Low Priority)**:
   - **Critical Flows**: Login, Add Transaction, Full Sync.
   - **Tooling**: Detox or React Native Testing Library.

### Initial Testing Roadmap

- **Step 1**: Setup Jest and mock the SQLite/Supabase layers.
- **Step 2**: 100% coverage for `src/utils/` and `src/services/dashboardService.ts`.
- **Step 3**: Integration tests for the 5 most critical queries in `queries.ts`.
- **Step 4**: Snapshot tests for the new `ProgressBar` and `CircularProgress` components.

### Edge Cases to Consider

- **Offline States**: Mid-sync network loss.
- **Date Boundaries**: Year-end/Month-end transitions in reports.
- **Large Data Sets**: Performance and memory usage with 10k+ transactions.
- **Database Corruption**: Recovery logic if the local SQLite state is invalid.
