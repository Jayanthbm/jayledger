/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import '@testing-library/jest-native/extend-expect';

// Mock react-native
jest.mock('react-native', () => {
  const React = require('react');
  const View = (props: any) => React.createElement('View', props);
  const Text = (props: any) => React.createElement('Text', props);
  const TouchableOpacity = (props: any) => React.createElement('TouchableOpacity', props);
  const StyleSheet = {
    create: (styles: any) => styles,
    hairlineWidth: 0.5,
    flatten: (style: any) => (Array.isArray(style) ? Object.assign({}, ...style) : style),
    setStyleAttributePreprocessor: jest.fn(),
  };
  const Platform = { OS: 'ios', select: (obj: any) => obj.ios };
  const Appearance = { getColorScheme: jest.fn(), addChangeListener: jest.fn() };
  const DeviceEventEmitter = { addListener: jest.fn(), emit: jest.fn() };
  const NativeModules = {
    SettingsManager: { settings: { AppleLocale: 'en_US', AppleLanguages: ['en'] } },
    I18nManager: { localeIdentifier: 'en_US', isRTL: false },
  };

  return {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Appearance,
    DeviceEventEmitter,
    NativeModules,
    Animated: {
      View: (props: any) => React.createElement('View', props),
      createAnimatedComponent: (comp: any) => comp,
      timing: jest.fn().mockReturnValue({ start: jest.fn() }),
      spring: jest.fn().mockReturnValue({ start: jest.fn() }),
      Value: jest.fn().mockImplementation(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(),
      })),
    },
    Alert: { alert: jest.fn() },
    ActivityIndicator: (props: any) => React.createElement('ActivityIndicator', props),
  };
});

// Mock AsyncStorage (inline CJS mock — v3 only ships an ESM jest build)
const asyncStorageStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(asyncStorageStore[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      asyncStorageStore[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete asyncStorageStore[key];
      return Promise.resolve();
    }),
    multiRemove: jest.fn((keys: string[]) => {
      keys.forEach((k) => delete asyncStorageStore[k]);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(asyncStorageStore).forEach((k) => delete asyncStorageStore[k]);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(asyncStorageStore))),
    multiGet: jest.fn((keys: string[]) =>
      Promise.resolve(keys.map((k) => [k, asyncStorageStore[k] ?? null])),
    ),
    multiSet: jest.fn((pairs: [string, string][]) => {
      pairs.forEach(([k, v]) => (asyncStorageStore[k] = v));
      return Promise.resolve();
    }),
  },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'Icon',
  Ionicons: 'Icon',
}));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'Icon');
jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Supabase
jest.mock('./src/services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      csv: jest.fn().mockReturnThis(),
    })),
  },
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(),
}));

// Mock expo-keep-awake
jest.mock('expo-keep-awake', () => ({
  useKeepAwake: jest.fn(),
  activateKeepAwakeAsync: jest.fn(() => Promise.resolve()),
  deactivateKeepAwake: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    setParams: jest.fn(),
  }),
  useLocalSearchParams: jest.fn(() => ({})),
  Stack: ({ children }: any) => children,
  Tabs: ({ children }: any) => children,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Silence unnecessary warnings
console.warn = jest.fn();
console.error = jest.fn();
