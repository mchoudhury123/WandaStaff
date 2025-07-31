import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class NotificationService {
  static async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  static async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      
      // Store token locally
      await AsyncStorage.setItem('fcm_token', token);
      
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  static async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  }

  static async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
    }
  }

  static setupNotificationListeners() {
    // Handle notification when app is in background or quit
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });

    // Handle notification when app is in foreground
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived!', remoteMessage);
      
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'Notification',
          remoteMessage.notification.body || 'You have a new notification'
        );
      }
    });

    return unsubscribe;
  }

  static async handleInitialNotification() {
    // Handle notification that opened the app
    const remoteMessage = await messaging().getInitialNotification();
    
    if (remoteMessage) {
      console.log(
        'Notification caused app to open from quit state:',
        remoteMessage
      );
      // Handle the notification data here
    }
  }

  static onNotificationOpenedApp() {
    // Handle notification that opened the app from background
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage
      );
      // Handle the notification data here
    });
  }

  static async initializeNotifications(staffId: string, businessId: string): Promise<void> {
    try {
      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Notification permission not granted');
        return;
      }

      // Get FCM token
      const token = await this.getFCMToken();
      if (!token) {
        console.log('Failed to get FCM token');
        return;
      }

      // Subscribe to relevant topics
      await this.subscribeToTopic(`staff_${staffId}`);
      await this.subscribeToTopic(`business_${businessId}`);
      await this.subscribeToTopic('all_staff');

      // Set up listeners
      this.setupNotificationListeners();
      this.handleInitialNotification();
      this.onNotificationOpenedApp();

      console.log('Notifications initialized successfully');
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  static async cleanupNotifications(staffId: string, businessId: string): Promise<void> {
    try {
      // Unsubscribe from topics
      await this.unsubscribeFromTopic(`staff_${staffId}`);
      await this.unsubscribeFromTopic(`business_${businessId}`);
      await this.unsubscribeFromTopic('all_staff');

      // Remove stored token
      await AsyncStorage.removeItem('fcm_token');

      console.log('Notifications cleaned up');
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  }
}