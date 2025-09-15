'use strict'

import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import PushNotificationService from '../services/PushNotificationService'
import AuthService from '../services/AuthService'
import api from './api'

export const deleteAccount = async (authToken) => {
  try {
    const response = await api('DELETE', '/users/me', null, authToken)

    if (response.error) {
      return { success: false, error: response.error }
    }

    if (response.data && response.data.success) {
      // Clear all local data after successful deletion
      await AsyncStorage.removeItem('authToken')
      await PushNotificationService.clearStoredToken()
      await PushNotificationService.clearNotificationBadge()
      return { success: true }
    } else {
      return { success: false, error: 'Failed to delete account' }
    }
  } catch (error) {
    console.error('Error deleting account:', error)
    return { success: false, error: error.message || 'Failed to delete account' }
  }
}

export const signOut = async () => {
  try {
    await AsyncStorage.removeItem('authToken')
    // Clear push notification token on sign out
    await PushNotificationService.clearStoredToken()
    await PushNotificationService.clearNotificationBadge()
    return { success: true }
  } catch (error) {
    // Silently handle error
    return { success: false, error }
  }
}

export const authCheck = () => {
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authToken, setAuthToken] = useState(null)

  useEffect(() => {
    const validateAuthToken = async () => {
      try {
        // Use AuthService for consistent validation
        const authStatus = await AuthService.checkAuthStatus()

        setIsAuthenticated(authStatus.isAuthenticated)
        setAuthToken(authStatus.authToken)
      } catch (error) {
        console.error('Auth validation error:', error)
        setIsAuthenticated(false)
        setAuthToken(null)
      } finally {
        setCheckingAuth(false)
      }
    }

    validateAuthToken()
  }, [])

  return { isAuthenticated, authToken, checkingAuth }
}
