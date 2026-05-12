export * from './tables';
export * from './sync';

/**
 * Global application constants.
 */
export const APP_CONFIG = {
  NAME: 'Jmoney',
  VERSION: '1.2.0',
  CURRENCY_SYMBOL: '₹',
  DEFAULT_LOCALE: 'en-IN',
} as const;
