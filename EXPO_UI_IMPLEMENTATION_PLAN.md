# Exhaustive `@expo/ui` Architecture & Implementation Audit Plan

This document is an exhaustive screen-by-screen, section-by-section, and component-by-component architectural audit of the entire **JayLedger** codebase. It explicitly analyzes whether every visual element can be transformed into a native `@expo/ui` component (**SwiftUI** on iOS & **Jetpack Compose** on Android) or if it must remain a specialized **React Native / Native-Module** component, with full technical justifications.

---

## `@expo/ui` Universal Primitives Available (SDK 58)

The `@expo/ui` library provides the following cross-platform native primitives:

- **Containers & Layout**: `<Host />`, `<Column />`, `<Row />`, `<Spacer />`, `<ScrollView />`, `<Collapsible />`, `<FieldGroup />`, `<RNHostView />`
- **Lists**: `<List />`, `<ListItem />`
- **Controls & Inputs**: `<Button />` (`filled`, `outlined`, `text`), `<Switch />`, `<Slider />`, `<Checkbox />`, `<Picker />` (`menu`, `wheel`), `<TextInput />`
- **Display**: `<Text />`, `<Icon />`
- **Modals / Sheets**: `<BottomSheet />`
- **Theming & Color Systems**:
  - **Jetpack Compose (Android)**: Material 3 Color Schemes via `@expo/ui/jetpack-compose` (`primary`, `onPrimary`, `primaryContainer`, `surface`, `onSurface`, `surfaceVariant`, `background`, `outline`, `error`) with support for Android 12+ dynamic Material You wallpaper-extracted palettes ([Expo UI Compose Colors Docs](https://docs.expo.dev/versions/v58.0.0/sdk/ui/jetpack-compose/colors/)).
  - **SwiftUI (iOS)**: Semantic System Colors via `@expo/ui/swift-ui` (`systemBackground`, `secondarySystemBackground`, `label`, `secondaryLabel`, `tint`).

> **Key Architectural Rule of `@expo/ui`:**
>
> 1. Native SwiftUI/Compose containers (`<Host>`) must enclose native primitives.
> 2. Native leaf views (such as `<Button />` or `<List />`) **cannot** nest complex composite React Native trees (like `<LinearGradient>`, `<BlurView>`, reanimated swipe views, or third-party SVG modules) inside their native render slots without runtime layout/touch collisions.

---

## 1. Global Shell & Navigation

### 1.1 Bottom Navigation Bar (Tab Bar)

- **File**: [`app/(tabs)/_layout.tsx`](<file:///Users/jayanthbharadwajm/development/jayledger/app/(tabs)/_layout.tsx>)
- **UI Elements**: 5 Tabs (Dashboard, Transactions, Budgets, Reports, Settings).
- **Can `@expo/ui` be used?**: **Yes (via Expo Native Tabs)**.
  - **iOS (SwiftUI)**: `expo-router/native-tabs` renders native `UITabBarController` / SwiftUI `TabView`.
  - **Android (Compose)**: `expo-router/native-tabs` renders Material 3 `NavigationBar`.
  - **Current Status**: ✅ **Implemented and Active**.

### 1.2 Top Navigation Headers (All Screens)

- **Files**: `app/_layout.tsx`, `app/(tabs)/*/_layout.tsx`
- **UI Elements**: Screen title, dynamic sync subtitle, action icons.
- **Can `@expo/ui` be used?**: **No (Uses Expo Router Native Stack)**.
  - **Reason**: Navigation headers are managed at the platform controller level via `@react-navigation/native-stack` (`UINavigationBar` on iOS, `Toolbar` on Android). Wrapping them in `@expo/ui` `<Row>` breaks native stack transitions, back buttons, and title large-display collapsibility.
  - **Technology**: React Native Stack Navigation Header (`navigation.setOptions`).

### 1.3 Floating Action Buttons (FAB: Add & Quick Transaction)

- **File**: [`src/components/FloatingActionButton.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/FloatingActionButton.tsx)
- **UI Elements**: Floating action button with elevation shadow / glass style, vector icon, haptics.
- **Can `@expo/ui` be used?**: **Yes for Android via `@expo/ui/jetpack-compose` `<FloatingActionButton />`** ([Expo UI Jetpack Compose FloatingActionButton Docs](https://docs.expo.dev/versions/v58.0.0/sdk/ui/jetpack-compose/floatingactionbutton/)).
  - **Android (Compose)**: `@expo/ui/jetpack-compose` provides native Material 3 `<FloatingActionButton shape="circle" elevation={6} containerColor={colors.primary} onClick={onPress}>` with built-in Material ripple and elevation physics.
    - _Usage Structure_:
      ```tsx
      import { FloatingActionButton, Host } from '@expo/ui/jetpack-compose';

      <Host style={{ position: 'absolute', bottom: 24, right: 24, width: 56, height: 56 }}>
        <FloatingActionButton shape="circle" elevation={6} onClick={onPress}>
          <Icon name="add" size={24} color="#FFFFFF" />
        </FloatingActionButton>
      </Host>;
      ```
  - **iOS (SwiftUI) & Liquid Glass Fallback**: Custom `<BlurView>` + `<LinearGradient>` + `<TouchableOpacity>` (Liquid Glass style with specular highlights and haptics).
  - **Current Production Technology**: Custom `<BlurView>` + `<LinearGradient>` + `<TouchableOpacity>` (active fallback).

---

## 2. Dashboard Screen (`app/(tabs)/dashboard/index.tsx`)

### 2.1 Summary Balance & Net Worth Cards

- **Files**: [`DashboardSummaryCard.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/dashboard/DashboardSummaryCard.tsx), [`DashboardNetWorth.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/dashboard/DashboardNetWorth.tsx)
- **UI Elements**: Income, Expense, Total Balance cards with colored icons and formatted currency.
- **Can `@expo/ui` be used?**: **No**.
  - **Reason**: Relies on dynamic theme borders, nested pressable cards, and specific micro-animations. `@expo/ui` does not provide an `ElevatedCard` component with custom inner layout grids.
  - **Technology**: React Native `<View style={styles.card}>` + `<Text>` + `<TouchableOpacity>`.

### 2.2 Daily Limit Card & Circular Progress

- **File**: [`DashboardDailyLimit.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/dashboard/DashboardDailyLimit.tsx)
- **UI Elements**: Remaining amount, spent today, circular gauge showing remaining percentage.
- **Can `@expo/ui` be used?**: **Yes for iOS via `@expo/ui/swift-ui` `<Gauge />`**.
  - **iOS (SwiftUI)**: `@expo/ui/swift-ui` provides native `<Gauge value={remainingPercentage} min={0} max={100} />` (renders native Apple SwiftUI circular / speedometer gauge).
    - _Usage Structure_:
      ```tsx
      import { Gauge, Host, Text } from '@expo/ui/swift-ui';

      <Host style={{ width: 70, height: 70 }}>
        <Gauge
          value={remainingPercentage / 100}
          currentValueLabel={<Text>{`${Math.round(remainingPercentage)}%`}</Text>}
        >
          <Text>Daily Limit</Text>
        </Gauge>
      </Host>;
      ```
  - **Android (Compose) & Shared Fallback**: Custom `react-native-svg` `<CircularProgress />` with animated track and themed colors.
  - **Current Production Technology**: Shared `react-native-svg` `<CircularProgress />` (active fallback).

### 2.3 Remaining Budget & Pay Day Cards

- **Files**: [`DashboardRemainingCard.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/dashboard/DashboardRemainingCard.tsx), [`DashboardPayDay.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/dashboard/DashboardPayDay.tsx)
- **UI Elements**: Days left counter, total remaining budget, payday target date wrapped in an elevated/outlined card.
- **Can `@expo/ui` be used?**: **Yes for Android via `@expo/ui/jetpack-compose` `<Card />`** ([Expo UI Jetpack Compose Card Docs](https://docs.expo.dev/versions/v58.0.0/sdk/ui/jetpack-compose/card/)).
  - **Android (Compose)**: `@expo/ui/jetpack-compose` provides native Material 3 `<Card variant="elevated" | "filled" | "outlined" elevation={2} shape="medium">` for container elevation and Material You theming.
    - _Usage Structure_:
      ```tsx
      import { Card, Host } from '@expo/ui/jetpack-compose';

      <Host style={{ flex: 1 }}>
        <Card variant="elevated" elevation={3}>
          <RemainingBudgetCardContent />
        </Card>
      </Host>;
      ```
  - **iOS (SwiftUI)**: Native SwiftUI `.background(RoundedRectangle(...))` or `@expo/ui/swift-ui` `<Form>` grouped section.
  - **Fallback / Current Tech**: Custom styled React Native `<View>` with elevation / shadow props (active fallback).

### 2.4 Top Spending Categories Card

- **File**: [`DashboardTopCategories.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/dashboard/DashboardTopCategories.tsx)
- **UI Elements**: Category list with color-coded horizontal progress bars.
- **Can `@expo/ui` be used?**: **No**.
  - **Reason**: Horizontal category bars use custom styled `<View>` with dynamic percentage widths. `@expo/ui` `<Slider>` is interactive input only, not a display-only category bar.
  - **Technology**: React Native `<View>` progress bars + `<Text>`.

### 2.5 Cloud Sync Status Modal & Loading Spinners

- **Files**: [`DashboardSyncModal.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/dashboard/DashboardSyncModal.tsx), `app/(auth)/login.tsx`, global sync spinners.
- **UI Elements**: Sync progress list, native animated spinner indicator, error log retry button.
- **Can `@expo/ui` be used?**: **Yes for Android via `@expo/ui/jetpack-compose` `<LoadingIndicator />`** ([Expo UI Compose LoadingIndicator Docs](https://docs.expo.dev/versions/v58.0.0/sdk/ui/jetpack-compose/loadingindicator/)).
  - **Android (Compose)**: `@expo/ui/jetpack-compose` provides native Material 3 `<LoadingIndicator variant="circular" | "linear" color={colors.primary} />` (renders Compose `CircularProgressIndicator` / `LinearProgressIndicator`).
    - _Usage Structure_:
      ```tsx
      import { LoadingIndicator, Host } from '@expo/ui/jetpack-compose';

      <Host style={{ width: 24, height: 24 }}>
        <LoadingIndicator variant="circular" />
      </Host>;
      ```
  - **iOS (SwiftUI)**: `@expo/ui/swift-ui` provides native `ProgressView()`.
  - **Current Production Technology**: React Native `<ActivityIndicator />` (active fallback).

---

## 3. Transactions Screen (`app/(tabs)/transactions/index.tsx`)

### 3.1 Search Bar

- **File**: [`src/components/SearchBar.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/SearchBar.tsx)
- **UI Elements**: Input field, search leading icon, clear trailing icon (`X`), active state styling.
- **Can `@expo/ui` be used?**: **Yes for Android via `@expo/ui/jetpack-compose` `<SearchBar />`** ([Expo UI Compose SearchBar Docs](https://docs.expo.dev/versions/v58.0.0/sdk/ui/jetpack-compose/searchbar/)).
  - **Android (Compose)**: `@expo/ui/jetpack-compose` provides native Material 3 `<SearchBar query={search} onQueryChange={setSearch} placeholder="Search transactions, notes..." active={isActive} onActiveChange={setIsActive} leadingIcon={<Icon name="search" />} trailingIcon={<Icon name="close" onClick={() => setSearch('')} />} />` (renders native Android M3 docked/fullscreen SearchBar with elevation and shape transitions).
    - _Usage Structure_:
      ```tsx
      import { SearchBar, Host } from '@expo/ui/jetpack-compose';

      <Host style={{ width: '100%', height: 56 }}>
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          placeholder="Search transactions, categories..."
          active={false}
          onActiveChange={() => {}}
        />
      </Host>;
      ```
  - **iOS (SwiftUI)**: SwiftUI `.searchable()` modifier on native `NavigationStack` or React Native `<TextInput>`.
  - **Current Production Technology**: Custom [`SearchBar.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/SearchBar.tsx) with debounce and smooth clear icon animation (active fallback).

### 3.2 Filter Toolbar & Chips (Date, Category, Payee, Groups)

- **File**: `app/(tabs)/transactions/index.tsx` (`FilterIconButton`)
- **UI Elements**: 4 pill buttons with active badge counter and highlight background.
- **Can `@expo/ui` be used?**: **No**.
  - **Reason**: Each pill contains an icon + label + numeric count badge in an active state container. `@expo/ui` `<Button variant="outlined">` does not support badge overlays inside button borders without clipping.
  - **Technology**: React Native `<TouchableOpacity>` + `<MaterialIcons>` + `<View>` badge.

### 3.3 Transaction List (`FlashList`)

- **File**: `app/(tabs)/transactions/index.tsx`
- **UI Elements**: Virtualized list of hundreds/thousands of transactions with sticky section date headers.
- **Can `@expo/ui` be used?**: **No**.
  - **Reason**: `@expo/ui` `<List>` is designed for static small settings menus, not virtualized high-frequency infinite scroll lists. `@shopify/flash-list` recycles native views for 60fps scrolling performance on datasets over 5,000 items.
  - **Technology**: `@shopify/flash-list` (Native UICollectionView / RecyclerView recycling).

### 3.4 Transaction Card & Swipeable Actions

- **File**: [`src/components/TransactionCard.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/TransactionCard.tsx)
- **UI Elements**: Category icon, title, description, group tag, amount, link button, map button, and swipe-to-edit / swipe-to-delete actions.
- **Can `@expo/ui` be used?**: **Yes for iOS via `@expo/ui/swift-ui` `SwipeActions` (Platform-Specific)**.
  - **iOS (SwiftUI)**: `@expo/ui/swift-ui` provides native `<SwipeActions>` with `<SwipeActions.Actions edge="trailing" allowsFullSwipe>` (SwiftUI `.swipeActions()`).
    - _Usage Structure_:
      ```tsx
      import { SwipeActions } from '@expo/ui/swift-ui';
      import { Button } from '@expo/ui';

      <SwipeActions>
        <RowContent />
        <SwipeActions.Actions edge="trailing" allowsFullSwipe>
          <Button label="Delete" role="destructive" onPress={handleDelete} />
          <Button label="Edit" onPress={handleEdit} />
        </SwipeActions.Actions>
      </SwipeActions>;
      ```
    - _Requirement / Constraint_: `<SwipeActions>` is an iOS SwiftUI modifier and requires being placed inside a native SwiftUI List row.
  - **Android (Compose) & Shared Fallback**: Android uses `react-native-gesture-handler/ReanimatedSwipeable` or Compose `SwipeToDismissBox`.
  - **Current Production Technology**: `react-native-gesture-handler/ReanimatedSwipeable` + [`FinancialListItem.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/common/FinancialListItem.tsx) (active fallback).

---

## 4. Budgets & Goals Screen (`app/(tabs)/budgets/index.tsx`, `goals.tsx`)

### 4.1 Budget Category Cards

- **File**: [`src/components/BudgetCard.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/BudgetCard.tsx)
- **UI Elements**: Allocated amount, spent amount, remaining amount, color-coded progress bar.
- **Can `@expo/ui` be used?**: **No**.
  - **Reason**: The progress bar changes color dynamically based on budget threshold (<80% primary, 80-100% warning, >100% danger). Custom `<ProgressBar.tsx>` handles dynamic gradient coloring and overflow caps.
  - **Technology**: React Native `<View>` + [`ProgressBar.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/ProgressBar.tsx).

### 4.2 Goals Savings Cards

- **File**: `app/goals.tsx`
- **UI Elements**: Target date, target amount, current savings, percentage progress, add contribution button.
- **Can `@expo/ui` be used?**: **No**.
  - **Reason**: Multi-action card containing custom action buttons and financial metrics.
  - **Technology**: React Native `<TouchableOpacity>` + `<View>` + Theme tokens.

---

## 5. Reports Screen (`app/(tabs)/reports/index.tsx`)

### 5.1 Timeframe / Year-Month Selector

- **File**: [`src/components/YearMonthSelector.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/YearMonthSelector.tsx)
- **UI Elements**: Year dropdown, horizontal scrollable month pill buttons.
- **Can `@expo/ui` be used?**: **No**.
  - **Reason**: Horizontal scrolling pills with active indicator styling are built using React Native `<ScrollView horizontal>`.
  - **Technology**: React Native `<ScrollView>` + `<TouchableOpacity>`.

### 5.2 Category Breakdown & Spending Graphs

- **Files**: `src/components/reports/ReportCategoryList.tsx`, `ReportSummaryCards.tsx`
- **UI Elements**: Percentage progress, income vs expense comparison bars, category ranking list.
- **Can `@expo/ui` be used?**: **No**.
  - **Reason**: Requires custom mathematical proportion layout rendering not available in `@expo/ui`.
  - **Technology**: React Native custom layout views.

---

## 6. Settings Screen (`app/(tabs)/settings/index.tsx`)

### 6.1 Biometrics & Haptics Toggles

- **Files**: `app/(tabs)/settings/index.tsx`, [`src/components/common/NativeSwitch.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/common/NativeSwitch.tsx)
- **UI Elements**: "Use Biometrics" toggle, "Haptic Feedback" toggle.
- **Can `@expo/ui` be used?**: **YES (Implemented & Active)** ([Expo UI Jetpack Compose Switch Docs](https://docs.expo.dev/versions/v58.0.0/sdk/ui/jetpack-compose/switch/)).
  - **iOS (SwiftUI)**: `@expo/ui` `<Switch />` (renders native SwiftUI `Toggle` with native iOS physics).
  - **Android (Compose)**: `@expo/ui/jetpack-compose` `<Switch checked={value} onCheckedChange={onValueChange} thumbContent={<Icon ... />} />` (renders Material 3 Compose `Switch` with customizable thumb icon, M3 track sizing, and ripple effects).
  - **Current Status**: ✅ **Implemented and Active via `NativeSwitch.tsx`** (uses `<Host style={{ width: 51, height: 31 }}>` with automatic fallback to React Native `<Switch>` for web/unsupported targets).

### 6.2 Settings Row Navigation Items

- **File**: [`src/components/common/SettingRow.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/common/SettingRow.tsx)
- **UI Elements**: Category icon box (leading), headline title, supporting text subtitle, trailing right chevron arrow.
- **Can `@expo/ui` be used?**: **Yes for Android via `@expo/ui/jetpack-compose` `<ListItem />`** ([Expo UI Jetpack Compose ListItem Docs](https://docs.expo.dev/versions/v58.0.0/sdk/ui/jetpack-compose/listitem/)).
  - **Android (Compose)**: `@expo/ui/jetpack-compose` native Material 3 `<ListItem headlineContent={<Text>...</Text>} supportingContent={<Text>...</Text>} leadingContent={<Icon ... />} trailingContent={<Icon ... />} onClick={onPress} />`.
    - _Usage Structure_:
      ```tsx
      import { ListItem, Host } from '@expo/ui/jetpack-compose';

      <Host style={{ width: '100%' }}>
        <ListItem
          headlineContent={<Text style={{ fontWeight: '600' }}>Currency & Formatting</Text>}
          supportingContent={<Text style={{ color: '#888' }}>Set base currency and symbol</Text>}
          leadingContent={<Icon name="attach-money" size={24} color={colors.primary} />}
          trailingContent={<Icon name="chevron-right" size={20} color="#888" />}
          onClick={() => router.push('/settings/currency')}
        />
      </Host>;
      ```
  - **iOS (SwiftUI)**: Native SwiftUI `NavigationLink` / `<List>` row.
  - **Fallback / Current Tech**: Custom [`SettingRow.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/common/SettingRow.tsx) with custom styled icon boxes and theme borders (active fallback).

### 6.3 Theme Mode Selection (System / Light / Dark)

- **Files**: `app/(tabs)/settings/index.tsx`, [`src/store/ThemeContext.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/store/ThemeContext.tsx)
- **UI Elements**: 3-option Segmented Switch for Theme Mode (`System` | `Light` | `Dark`).
- **Can `@expo/ui` be used?**: **Yes for Android & iOS**.
  - **Android (Compose)**: `@expo/ui/jetpack-compose` `<SingleChoiceSegmentedButtonRow>` with `<SegmentedButton>`:
    ```tsx
    import {
      SingleChoiceSegmentedButtonRow,
      SegmentedButton,
      Host,
    } from '@expo/ui/jetpack-compose';

    <Host style={{ width: '100%', height: 48 }}>
      <SingleChoiceSegmentedButtonRow>
        <SegmentedButton
          selected={theme === 'system'}
          onClick={() => setTheme('system')}
          label={<Text>Auto</Text>}
        />
        <SegmentedButton
          selected={theme === 'light'}
          onClick={() => setTheme('light')}
          label={<Text>Light</Text>}
        />
        <SegmentedButton
          selected={theme === 'dark'}
          onClick={() => setTheme('dark')}
          label={<Text>Dark</Text>}
        />
      </SingleChoiceSegmentedButtonRow>
    </Host>;
    ```
  - **iOS (SwiftUI)**: `@expo/ui/swift-ui` `<Picker appearance="wheel" | "menu">` or native SwiftUI `.pickerStyle(.segmented)` / [SegmentedControl.tsx](file:///Users/jayanthbharadwajm/development/jayledger/src/components/SegmentedControl.tsx).
  - **Fallback / Current Tech**: Custom 3-segment pill control (active fallback).

### 6.4 App Lock PIN & Passcode Modal / Entry

- **Files**: `src/components/common/PinModal.tsx` (or App Lock setup screens in Settings)
- **UI Elements**: Masked text input for passcode / PIN entry.
- **Can `@expo/ui` be used?**: **Yes for iOS via `@expo/ui/swift-ui` `<SecureField />`** ([Expo UI SecureField Docs](https://docs.expo.dev/versions/v58.0.0/sdk/ui/swift-ui/securefield/)).
  - **iOS (SwiftUI)**: `@expo/ui/swift-ui` provides native `<SecureField placeholder="Enter PIN" text={pin} onTextChange={setPin} />` (renders Apple SwiftUI `SecureField` with native iOS keyboard auto-masking and credential autofill support).
    - _Usage Structure_:
      ```tsx
      import { SecureField, Host } from '@expo/ui/swift-ui';

      <Host style={{ height: 44, width: '100%' }}>
        <SecureField
          placeholder="Enter Passcode"
          text={passcode}
          onTextChange={(val) => setPasscode(val)}
        />
      </Host>;
      ```
  - **Android (Compose) & Shared Fallback**: React Native `<TextInput secureTextEntry={true} />`.
  - **Current Technology**: React Native `<TextInput secureTextEntry={true} />` (active fallback).

---

## 7. Add / Edit Transaction Screen (`app/add-transaction.tsx`)

### 7.1 Transaction Type Selector (Expense / Income / Transfer)

- **File**: [`src/components/SegmentedControl.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/SegmentedControl.tsx)
- **UI Elements**: 3-segment pill switch with active state selection (Expense / Income / Transfer).
- **Can `@expo/ui` be used?**: **Yes for Android via `@expo/ui/jetpack-compose` `<SegmentedButton />` / `<SingleChoiceSegmentedButtonRow />`** ([Expo UI Compose SegmentedButton Docs](https://docs.expo.dev/versions/v58.0.0/sdk/ui/jetpack-compose/segmentedbutton/)).
  - **Android (Compose)**: `@expo/ui/jetpack-compose` provides native Material 3 `<SingleChoiceSegmentedButtonRow>` with `<SegmentedButton selected={type === 'expense'} onClick={() => setType('expense')} label={<Text>Expense</Text>} icon={<Icon ... />} />`.
    - _Usage Structure_:
      ```tsx
      import {
        SingleChoiceSegmentedButtonRow,
        SegmentedButton,
        Host,
      } from '@expo/ui/jetpack-compose';

      <Host style={{ width: '100%', height: 48 }}>
        <SingleChoiceSegmentedButtonRow>
          <SegmentedButton
            selected={type === 'expense'}
            onClick={() => setType('expense')}
            label={<Text>Expense</Text>}
          />
          <SegmentedButton
            selected={type === 'income'}
            onClick={() => setType('income')}
            label={<Text>Income</Text>}
          />
          <SegmentedButton
            selected={type === 'transfer'}
            onClick={() => setType('transfer')}
            label={<Text>Transfer</Text>}
          />
        </SingleChoiceSegmentedButtonRow>
      </Host>;
      ```
  - **iOS (SwiftUI)**: Native SwiftUI `Picker` with `.pickerStyle(.segmented)` or custom SegmentedControl.
  - **Current Production Technology**: Custom [SegmentedControl.tsx](file:///Users/jayanthbharadwajm/development/jayledger/src/components/SegmentedControl.tsx) with custom per-tab colors (active fallback).

### 7.2 Amount Input & Notes Fields

- **File**: [`src/components/transactions/TransactionFormFields.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/src/components/transactions/TransactionFormFields.tsx)
- **UI Elements**: Large numeric currency keypad input, multiline description text area.
- **Can `@expo/ui` be used?**: **Yes for grouping via `@expo/ui/swift-ui` `<Form />` and `<Section />` (iOS)**.
  - **iOS (SwiftUI)**: `@expo/ui/swift-ui` provides native `<Form>` and `<Section header={<Text>...}>` to automatically style grouped inset rounded card sections.
    - _Usage Structure_:
      ```tsx
      import { Form, Section, Host } from '@expo/ui/swift-ui';

      <Form>
        <Section header={<Text>Amount & Notes</Text>}>
          <TransactionFormFields ... />
        </Section>
      </Form>
      ```
  - **Android (Compose) & Shared Fallback**: React Native `<ScrollView>` + `<View style={styles.card}>` + `<TextInput keyboardType="decimal-pad">`.
  - **Current Production Technology**: React Native `<ScrollView>` + custom field components (active fallback).

### 7.3 Date & Time Picker Row

- **Files**: [`app/add-transaction.tsx`](file:///Users/jayanthbharadwajm/development/jayledger/app/add-transaction.tsx), [`useTransactionDateTime.ts`](file:///Users/jayanthbharadwajm/development/jayledger/src/hooks/useTransactionDateTime.ts)
- **UI Elements**: Selected date/time display, inline native iOS wheel/compact/graphical date & time selector.
- **Can `@expo/ui` be used?**: **Yes for iOS via `@expo/ui/swift-ui` `<DatePicker />`** ([Expo UI DatePicker Docs](https://docs.expo.dev/versions/v58.0.0/sdk/ui/swift-ui/datepicker/)).
  - **iOS (SwiftUI)**: `@expo/ui/swift-ui` native `<DatePicker />` supports `selection`, `onDateChange`, `displayedComponents` (`'date' | 'hourAndMinute' | ['date', 'hourAndMinute']`), and `datePickerStyle` (`'compact' | 'wheel' | 'graphical' | 'automatic'`).
    - _Usage Structure_:
      ```tsx
      import { DatePicker, Host } from '@expo/ui/swift-ui';

      <Host style={{ height: 44, width: '100%' }}>
        <DatePicker
          title="Date & Time"
          selection={selectedDate}
          displayedComponents={['date', 'hourAndMinute']}
          datePickerStyle="compact"
          onDateChange={(newDate) => setSelectedDate(newDate)}
        />
      </Host>;
      ```
  - **Android (Compose) & Shared Fallback**: `@react-native-community/datetimepicker` Material dialog picker.
  - **Current Production Technology**: `@react-native-community/datetimepicker` (active fallback).

### 7.4 Category, Payee, Group Selector Bottom Sheets

- **Files**: `src/components/transactions/ItemSelectorModal.tsx`, `src/components/transactions/LocationEditSheet.tsx`
- **UI Elements**: Searchable modal list of categories/payees with create new item triggers.
- **Can `@expo/ui` be used?**: **No**.
  - **Reason**: Contains nested search input + virtualized list + creation button inside a draggable sheet.
  - **Technology**: React Native Modal / [BottomSheet.tsx](file:///Users/jayanthbharadwajm/development/jayledger/src/components/BottomSheet.tsx).

---

## 8. Authentication & Login Screen (`app/(auth)/login.tsx`)

### 8.1 Login Form & Credentials Entry

- **File**: [`app/(auth)/login.tsx`](<file:///Users/jayanthbharadwajm/development/jayledger/app/(auth)/login.tsx>)
- **UI Elements**: Email input with leading icon, Password secure input with toggle, Login action button.
- **Can `@expo/ui` be used?**: **Yes for iOS via `@expo/ui/swift-ui` `<Form />`, `<TextField />`, `<SecureField />`, and `<Button />`**.
  - **iOS (SwiftUI)**: Renders native Apple inset grouped login form with native Keychain/Autofill integration:
    - _Usage Structure_:
      ```tsx
      import { Form, Section, TextField, SecureField, Button, Host } from '@expo/ui/swift-ui';

      <Form>
        <Section header={<Text>Account Credentials</Text>}>
          <TextField
            placeholder="Email"
            text={email}
            onTextChange={setEmail}
            keyboardType="emailAddress"
            textContentType="username"
          />
          <SecureField
            placeholder="Password"
            text={password}
            onTextChange={setPassword}
            textContentType="password"
          />
        </Section>
        <Section>
          <Button
            title={loading ? 'Logging in...' : 'Login'}
            variant="borderedProminent"
            onPress={handleLogin}
            disabled={loading}
          />
        </Section>
      </Form>;
      ```
  - **Android (Compose) & Shared Fallback**: React Native `<ScrollView>` + custom styled `<View style={styles.inputBox}>` + `<TextInput>` + `<TouchableOpacity style={styles.loginBtn}>`.
  - **Current Production Technology**: React Native `<ScrollView>` + `<KeyboardAvoidingView>` + `<TextInput>` (active fallback).

---

## 9. Summary Checklist of Native `@expo/ui` Integrations

| Feature / Component                     | Technology Used                                                          | Platform Result                                                                 |
| :-------------------------------------- | :----------------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| **Tab Navigation**                      | `expo-router/native-tabs`                                                | Native SwiftUI `TabView` on iOS, Material 3 Compose `NavigationBar` on Android  |
| **Login Credentials**                   | `@expo/ui/swift-ui` `<Form>`, `<TextField>`, `<SecureField>`, `<Button>` | Native Apple SwiftUI inset grouped form with iOS autofill support               |
| **Android Search Bar**                  | `@expo/ui/jetpack-compose` `<SearchBar />`                               | Material 3 docked search bar with leading/trailing action slots & query binding |
| **Android Metric Cards**                | `@expo/ui/jetpack-compose` `<Card />`                                    | Material 3 elevated/outlined cards with Material You dynamic colors             |
| **Android Floating Action Button**      | `@expo/ui/jetpack-compose` `<FloatingActionButton />`                    | Material 3 circular elevated action button with native ripple physics           |
| **Transaction Type Selector**           | `@expo/ui/jetpack-compose` `<SingleChoiceSegmentedButtonRow />`          | Material 3 segmented button bar (Expense/Income/Transfer) on Android            |
| **Android Settings List Items**         | `@expo/ui/jetpack-compose` `<ListItem />`                                | Material 3 list item with headline, supporting text, leading & trailing slots   |
| **Settings Toggles**                    | `@expo/ui` `<Switch />` via `NativeSwitch.tsx`                           | True native SwiftUI `Toggle` (iOS) & Jetpack Compose `Switch` (Android)         |
| **App Lock Passcode**                   | `@expo/ui/swift-ui` `<SecureField />`                                    | Native masked password input with biometric integration                         |
| **Date & Time Selector**                | `@expo/ui/swift-ui` `<DatePicker />`                                     | Native SwiftUI modal popup / compact wheel date picker                          |
| **Global Shell**                        | `<GestureHandlerRootView>` + `<SafeAreaProvider>`                        | Non-blocking gesture root without touch interception                            |
| **List Performance**                    | `@shopify/flash-list`                                                    | Native memory recycling at 60fps across large transaction datasets              |
| **Swipe Interactions**                  | `ReanimatedSwipeable`                                                    | Hardware-accelerated native UI thread gesture tracking                          |
| **Liquid Glass Buttons (iOS/Fallback)** | `<BlurView>` + `<LinearGradient>`                                        | Custom iOS/Android glassmorphism with specular reflections                      |
