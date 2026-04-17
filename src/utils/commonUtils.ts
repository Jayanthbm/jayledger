import * as Crypto from 'expo-crypto';

/**
 * Generates a unique UUID v4.
 * Uses expo-crypto's randomUUID if available, otherwise falls back to a JS-based generator.
 */
export const generateUUID = (): string => {
  try {
    return Crypto.randomUUID();
  } catch {
    // Fallback for environments where Crypto might not be fully initialized or supported
    let dt = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = ((dt + Math.random() * 16) % 16) | 0;
      dt = Math.floor(dt / 16);
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
};
