import { Platform } from 'react-native';

declare const __DEV__: boolean;

// Provide a safe fallback for Jest / testing environments
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
const IS_PRODUCTION = Platform.OS === 'android' || (Platform.OS === 'ios' && !isDev);

type LogLevel = 'log' | 'warn' | 'error';

const internalLog = (level: LogLevel, ...args: unknown[]) => {
  if (!IS_PRODUCTION || level === 'error') {
    console[level](...args);
  }
};

export const logger = {
  log: (...args: unknown[]) => internalLog('log', ...args),
  warn: (...args: unknown[]) => internalLog('warn', ...args),
  error: (...args: unknown[]) => internalLog('error', ...args),
};
