import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../lib/api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
})

class PushNotificationService {
  constructor() {
    this.notificationListener = null
    this.responseListener = null
  }

  async registerForPushNotifications() {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices')
        return null
      }

      // Check if we're in a dev build without push notification support
      if (!Notifications.getExpoPushTokenAsync) {
        console.log('Push notifications not available in this build. Use EAS development build for testing.')
        return null
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification')
        return null
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId
      
      if (!projectId) {
        console.warn('Project ID not found. Push notifications may not work correctly.')
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      })

      console.log('Expo push token obtained:', token.data)

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C'
        })
      }

      await AsyncStorage.setItem('expoPushToken', token.data)
      return token.data
    } catch (error) {
      console.error('Error registering for push notifications:', error)
      return null
    }
  }

  async updatePushTokenOnServer(authToken, pushToken) {
    try {
      if (!authToken || !pushToken) {
        console.log('Missing auth token or push token')
        return false
      }

      // Pass authToken as the 4th parameter to api function
      const response = await api(
        'PUT', 
        '/users/me/push-token', 
        { 
          expoPushToken: pushToken,
          platform: Platform.OS // Send the correct platform
        },
        authToken
      )

      if (response.error) {
        console.error('Failed to update push token on server:', response.error)
        return false
      }

      console.log('Push token successfully updated on server')
      return true
    } catch (error) {
      console.error('Error updating push token on server:', error)
      return false
    }
  }

  async checkAndRefreshToken(authToken) {
    try {
      const storedToken = await AsyncStorage.getItem('expoPushToken')
      const currentToken = await this.registerForPushNotifications()

      if (!currentToken) {
        console.log('Could not get push token')
        return null
      }

      if (storedToken !== currentToken || !storedToken) {
        console.log('Push token changed or new token obtained, updating server...')
        await this.updatePushTokenOnServer(authToken, currentToken)
      }

      return currentToken
    } catch (error) {
      console.error('Error checking/refreshing push token:', error)
      return null
    }
  }

  setupNotificationListeners(navigation) {
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification)
    })

    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response)
      
      const data = response.notification.request.content.data
      
      if (data?.navigationScreen) {
        if (data.navigationScreen === 'ConnectionMessages' && data.connectionId) {
          navigation.navigate('ConnectionMessages', {
            connectionId: data.connectionId
          })
        } else if (data.navigationScreen === 'Connections') {
          navigation.navigate('Connections')
        }
      }
    })
  }

  removeNotificationListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener)
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener)
    }
  }

  async clearNotificationBadge() {
    await Notifications.setBadgeCountAsync(0)
  }

  async clearStoredToken() {
    await AsyncStorage.removeItem('expoPushToken')
  }

  async getStoredToken() {
    try {
      return await AsyncStorage.getItem('expoPushToken')
    } catch (error) {
      console.error('Error getting stored push token:', error)
      return null
    }
  }
}

export default new PushNotificationService()