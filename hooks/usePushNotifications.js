import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { isFeatureEnabled, getFeatureConfig } from '../lib/featureFlags';

export default function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Early return if feature is disabled
    if (!isFeatureEnabled('PUSH_NOTIFICATIONS_ENABLED')) {
      console.log('Push notifications are disabled via feature flag');
      return;
    }

    // Configure notification behavior based on feature flags
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: isFeatureEnabled('PUSH_NOTIFICATIONS_SOUND_ENABLED'),
        shouldSetBadge: isFeatureEnabled('PUSH_NOTIFICATIONS_BADGE_ENABLED'),
      }),
    });

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        // TODO: Send token to your backend
        console.log('Push token:', token);
      }
    });

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // This listener is fired whenever a user taps on or interacts with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // TODO: Handle notification tap - navigate to specific screen, etc.
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const scheduleLocalNotification = async (title, body, data = {}) => {
    if (!isFeatureEnabled('PUSH_NOTIFICATIONS_ENABLED')) {
      console.log('Local notifications are disabled via feature flag');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Show immediately
    });
  };

  return {
    expoPushToken,
    notification,
    scheduleLocalNotification,
    isEnabled: isFeatureEnabled('PUSH_NOTIFICATIONS_ENABLED'),
  };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found');
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      
      console.log('Expo push token:', token);
    } catch (e) {
      console.error('Error getting push token:', e);
      token = `${e}`;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
