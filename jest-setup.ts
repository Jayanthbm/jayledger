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

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

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

// Silence unnecessary warnings
console.warn = jest.fn();
console.error = jest.fn();
