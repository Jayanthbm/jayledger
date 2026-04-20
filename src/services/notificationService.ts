import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const scheduleReminder = async (timeOfDay: string) => {
  if (Platform.OS === 'web') return; // Not supported on web usually easily

  try {
    // Request permissions first
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    // Cancel any existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (timeOfDay === 'None') {
      await AsyncStorage.removeItem('notification_pref');
      return;
    }

    await AsyncStorage.setItem('notification_pref', timeOfDay);

    let hour = 9; // Morning default
    let minute = 0;

    if (timeOfDay === 'Evening') {
      hour = 18; // 6 PM
    } else if (timeOfDay === 'Night') {
      hour = 21; // 9 PM
    } else if (timeOfDay.includes(':')) {
      const [h, m] = timeOfDay.split(':').map((s) => parseInt(s, 10));
      hour = h;
      minute = m;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Reminder 💰',
        body: "Don't forget to add your expenses for today!",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch (error) {
    logger.warn("Notifications aren't fully supported in Expo Go SDK 54+:", error);
    // Suppress crash to allow other settings changes in Expo Go
  }
};
