import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

let hapticsEnabledCache: boolean | null = null;

/**
 * Loads the haptic settings preference from AsyncStorage and caches it.
 * Default is enabled (true).
 */
export const loadHapticsSetting = async (): Promise<boolean> => {
  try {
    const setting = await AsyncStorage.getItem('use_haptics');
    const enabled = setting !== 'false';
    hapticsEnabledCache = enabled;
    return enabled;
  } catch (error) {
    logger.warn('[Haptics] Error loading haptics setting', error);
    hapticsEnabledCache = true;
    return true;
  }
};

/**
 * Saves and updates the haptic settings preference.
 */
export const setHapticsEnabled = async (enabled: boolean): Promise<void> => {
  try {
    hapticsEnabledCache = enabled;
    await AsyncStorage.setItem('use_haptics', enabled ? 'true' : 'false');
  } catch (error) {
    logger.warn('[Haptics] Error saving haptics setting', error);
  }
};

const shouldTrigger = async (): Promise<boolean> => {
  if (hapticsEnabledCache !== null) {
    return hapticsEnabledCache;
  }
  return await loadHapticsSetting();
};

/**
 * Trigger success notification haptic.
 */
export const triggerSuccess = async () => {
  if (await shouldTrigger()) {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignored: expected to catch when running on non-supported platforms or simulators
    }
  }
};

/**
 * Trigger warning notification haptic.
 */
export const triggerWarning = async () => {
  if (await shouldTrigger()) {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Ignored
    }
  }
};

/**
 * Trigger error notification haptic.
 */
export const triggerError = async () => {
  if (await shouldTrigger()) {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Ignored
    }
  }
};

/**
 * Trigger subtle selection tick.
 */
export const triggerSelection = async () => {
  if (await shouldTrigger()) {
    try {
      await Haptics.selectionAsync();
    } catch {
      // Ignored
    }
  }
};

/**
 * Trigger physical impact ticks (light, medium, heavy).
 */
export const triggerImpact = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  if (await shouldTrigger()) {
    try {
      const feedbackStyle =
        style === 'light'
          ? Haptics.ImpactFeedbackStyle.Light
          : style === 'heavy'
            ? Haptics.ImpactFeedbackStyle.Heavy
            : Haptics.ImpactFeedbackStyle.Medium;
      await Haptics.impactAsync(feedbackStyle);
    } catch {
      // Ignored
    }
  }
};
